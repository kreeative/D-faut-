import type { Candidate } from '../types.ts';
import { collectReddit } from './reddit.ts';
import { collectRss } from './rss.ts';
import { fixtureCandidates } from './fixtures.ts';
import { config } from '../config.ts';
import { log } from '../logger.ts';

/**
 * Sources deliberately not implemented in Phase 0, and why:
 *
 *   Etsy / Gumroad / Creative Market / Amazon Best Sellers — these have no
 *   public feed. Reading them means scraping rendered HTML, which their
 *   robots.txt and terms restrict, and which breaks on every layout change.
 *
 *   App Store reviews — same problem, plus review scraping is explicitly
 *   restricted.
 *
 *   Google Trends — the only npm route is an unofficial scraper wrapping a
 *   private endpoint. Adding it means a dependency that breaks silently and
 *   returns wrong data rather than erroring, which is the worst failure mode
 *   for a system the operator does not watch.
 *
 * Reddit plus job boards is enough signal to rank ten opportunities, which is
 * the actual bar. Revisit with a paid data source once revenue justifies it.
 */
export async function collectAll(): Promise<Candidate[]> {
  if (config.dryRun) {
    log('info', 'sources.dry_run', { note: 'using local fixtures, no network calls' });
    return fixtureCandidates();
  }

  const results = await Promise.allSettled([collectReddit(), collectRss()]);
  const candidates: Candidate[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') candidates.push(...r.value);
    else log('warn', 'sources.collector_failed', { error: String(r.reason) });
  }

  // Same story can surface twice; keep the first sighting.
  const byFingerprint = new Map<string, Candidate>();
  for (const c of candidates) {
    if (!byFingerprint.has(c.fingerprint)) byFingerprint.set(c.fingerprint, c);
  }
  return [...byFingerprint.values()];
}
