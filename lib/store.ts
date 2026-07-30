import { config } from './config.ts';
import type { ScoredOpportunity } from './types.ts';

/**
 * Persistence boundary. The job never touches Supabase directly, which is what
 * lets the same pipeline run against an in-memory store for tests and dry runs.
 */

export interface AutomationHealth {
  key: string;
  consecutive_failures: number;
  disabled_at: string | null;
  last_error: string | null;
}

export interface Store {
  /** Fingerprints already seen, so a candidate is not rescored every week. */
  knownFingerprints(fingerprints: string[]): Promise<Set<string>>;
  saveOpportunities(rows: ScoredOpportunity[]): Promise<void>;
  appendEvent(type: string, payload: Record<string, unknown>): Promise<void>;
  getHealth(key: string): Promise<AutomationHealth>;
  setHealth(health: AutomationHealth): Promise<void>;
  /** The kill switch. False halts all outbound automation. */
  outboundEnabled(): Promise<boolean>;
}

export class MemoryStore implements Store {
  opportunities: ScoredOpportunity[] = [];
  events: { type: string; payload: Record<string, unknown> }[] = [];
  health = new Map<string, AutomationHealth>();
  private seen = new Set<string>();
  private enabled: boolean;

  constructor(opts: { outboundEnabled?: boolean; seen?: string[] } = {}) {
    this.enabled = opts.outboundEnabled ?? true;
    for (const f of opts.seen ?? []) this.seen.add(f);
  }

  async knownFingerprints(fingerprints: string[]): Promise<Set<string>> {
    return new Set(fingerprints.filter((f) => this.seen.has(f)));
  }

  async saveOpportunities(rows: ScoredOpportunity[]): Promise<void> {
    for (const row of rows) {
      this.seen.add(row.fingerprint);
      this.opportunities.push(row);
    }
  }

  async appendEvent(type: string, payload: Record<string, unknown>): Promise<void> {
    this.events.push({ type, payload });
  }

  async getHealth(key: string): Promise<AutomationHealth> {
    return (
      this.health.get(key) ?? { key, consecutive_failures: 0, disabled_at: null, last_error: null }
    );
  }

  async setHealth(health: AutomationHealth): Promise<void> {
    this.health.set(health.key, health);
  }

  async outboundEnabled(): Promise<boolean> {
    return this.enabled;
  }
}

class SupabaseStore implements Store {
  // Typed loosely on purpose: the client is imported lazily so that dry runs
  // and tests never need @supabase/supabase-js installed or configured.
  constructor(private client: any) {}

  async knownFingerprints(fingerprints: string[]): Promise<Set<string>> {
    if (fingerprints.length === 0) return new Set();
    const { data, error } = await this.client
      .from('opportunities')
      .select('fingerprint')
      .in('fingerprint', fingerprints);
    if (error) throw new Error(`knownFingerprints: ${error.message}`);
    return new Set((data ?? []).map((r: { fingerprint: string }) => r.fingerprint));
  }

  async saveOpportunities(rows: ScoredOpportunity[]): Promise<void> {
    if (rows.length === 0) return;
    const payload = rows.map((r) => ({
      fingerprint: r.fingerprint,
      source: r.source,
      title: r.title,
      evidence_urls: r.evidence_urls,
      scores: r.scores,
      total: r.total,
      verdict: r.verdict,
      rejection_reason: r.rejection_reason,
      riskiest_assumption: r.riskiest_assumption,
      one_line_offer: r.one_line_offer,
      scored_by: r.scored_by,
      scanned_at: r.collected_at,
    }));
    // Idempotent on fingerprint: a re-run of the same week overwrites rather
    // than duplicating.
    const { error } = await this.client
      .from('opportunities')
      .upsert(payload, { onConflict: 'fingerprint' });
    if (error) throw new Error(`saveOpportunities: ${error.message}`);
  }

  async appendEvent(type: string, payload: Record<string, unknown>): Promise<void> {
    const { error } = await this.client.from('events').insert({ type, payload });
    if (error) throw new Error(`appendEvent: ${error.message}`);
  }

  async getHealth(key: string): Promise<AutomationHealth> {
    const { data, error } = await this.client
      .from('automation_health')
      .select('*')
      .eq('key', key)
      .maybeSingle();
    if (error) throw new Error(`getHealth: ${error.message}`);
    return data ?? { key, consecutive_failures: 0, disabled_at: null, last_error: null };
  }

  async setHealth(health: AutomationHealth): Promise<void> {
    const { error } = await this.client
      .from('automation_health')
      .upsert(health, { onConflict: 'key' });
    if (error) throw new Error(`setHealth: ${error.message}`);
  }

  async outboundEnabled(): Promise<boolean> {
    const { data, error } = await this.client
      .from('settings')
      .select('value')
      .eq('key', 'outbound_enabled')
      .maybeSingle();
    if (error) throw new Error(`outboundEnabled: ${error.message}`);
    // Absent row means "not yet configured", which we treat as enabled.
    return data?.value !== false;
  }
}

export async function createStore(): Promise<Store> {
  if (config.dryRun) return new MemoryStore();
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required outside dry-run mode');
  }
  const { createClient } = await import('@supabase/supabase-js');
  return new SupabaseStore(
    createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false },
    }),
  );
}
