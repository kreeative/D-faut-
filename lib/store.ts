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


/**
 * Persists to a JSON file on disk. This is what makes a first real run cost one
 * API key instead of four accounts: live sources, real scoring, real dedupe
 * across runs, and nothing to provision. Swap to Supabase once the scan has
 * earned its place in the weekly routine.
 */
export class FileStore implements Store {
  private state: {
    opportunities: ScoredOpportunity[];
    events: { type: string; payload: Record<string, unknown>; at: string }[];
    health: Record<string, AutomationHealth>;
    outbound_enabled: boolean;
  } | null = null;

  constructor(private path: string) {}

  private async load() {
    if (this.state) return this.state;
    const { readFile } = await import('node:fs/promises');
    try {
      this.state = JSON.parse(await readFile(this.path, 'utf8'));
    } catch {
      // No file yet, or an unreadable one. Either way this is a fresh start.
      this.state = { opportunities: [], events: [], health: {}, outbound_enabled: true };
    }
    return this.state!;
  }

  private async flush() {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(this.state, null, 2), 'utf8');
  }

  async knownFingerprints(fingerprints: string[]): Promise<Set<string>> {
    const state = await this.load();
    const seen = new Set(state.opportunities.map((o) => o.fingerprint));
    return new Set(fingerprints.filter((f) => seen.has(f)));
  }

  async saveOpportunities(rows: ScoredOpportunity[]): Promise<void> {
    const state = await this.load();
    // Upsert on fingerprint, matching the Postgres unique constraint so a
    // re-run behaves the same here as it does in production.
    const byFingerprint = new Map(state.opportunities.map((o) => [o.fingerprint, o]));
    for (const row of rows) byFingerprint.set(row.fingerprint, row);
    state.opportunities = [...byFingerprint.values()];
    await this.flush();
  }

  async appendEvent(type: string, payload: Record<string, unknown>): Promise<void> {
    const state = await this.load();
    state.events.push({ type, payload, at: new Date().toISOString() });
    await this.flush();
  }

  async getHealth(key: string): Promise<AutomationHealth> {
    const state = await this.load();
    return (
      state.health[key] ?? { key, consecutive_failures: 0, disabled_at: null, last_error: null }
    );
  }

  async setHealth(health: AutomationHealth): Promise<void> {
    const state = await this.load();
    state.health[health.key] = health;
    await this.flush();
  }

  async outboundEnabled(): Promise<boolean> {
    return (await this.load()).outbound_enabled;
  }
}

export async function createStore(): Promise<Store> {
  if (config.dryRun) return new MemoryStore();
  if (config.localStore) return new FileStore(config.localStorePath);
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error(
      'No store configured. Either set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, ' +
        'or run with --local to persist to a JSON file on disk.',
    );
  }
  const { createClient } = await import('@supabase/supabase-js');
  return new SupabaseStore(
    createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false },
    }),
  );
}
