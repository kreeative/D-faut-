import { config } from '../lib/config.ts';
import { log } from '../lib/logger.ts';
import { createStore, type Store } from '../lib/store.ts';
import { collectAll } from '../lib/sources/index.ts';
import { scoreCandidates } from '../agents/market-scorer.ts';
import { pushToNotion } from '../lib/notion.ts';
import { sendEmail } from '../lib/email.ts';
import { renderDigestHtml } from '../emails/digest.ts';
import { assertEnabled, recordFailure, recordSuccess } from '../ops/circuit.ts';
import { outboundAllowed } from '../ops/kill-switch.ts';
import type { ScoredOpportunity } from '../lib/types.ts';

const AUTOMATION_KEY = 'market-scan';

export interface ScanResult {
  collected: number;
  novel: number;
  scored: number;
  accepted: number;
  rejected: number;
  notionWritten: number;
  digestSent: boolean;
  top: ScoredOpportunity[];
}

/**
 * The weekly scan. Order matters: nothing outbound happens until the data is
 * safely persisted, so a Notion or email failure never costs us the scoring
 * spend.
 */
export async function runMarketScan(injectedStore?: Store): Promise<ScanResult> {
  const store = injectedStore ?? (await createStore());
  const startedAt = Date.now();

  // Refuses to run at all if a previous run already tripped the breaker.
  await assertEnabled(store, AUTOMATION_KEY);

  try {
    const collected = await collectAll();

    // Dedupe against everything ever scored, so the operator sees new
    // opportunities each week rather than the same ones re-ranked.
    const known = await store.knownFingerprints(collected.map((c) => c.fingerprint));
    const novel = collected.filter((c) => !known.has(c.fingerprint));

    // Strongest community signal first, so the budget cap cuts the weakest tail.
    const budgeted = [...novel]
      .sort((a, b) => b.raw_signal - a.raw_signal)
      .slice(0, config.maxCandidates);

    log('info', 'scan.collected', {
      collected: collected.length,
      novel: novel.length,
      scoring: budgeted.length,
    });

    const scored = await scoreCandidates(budgeted);
    await store.saveOpportunities(scored);

    const accepted = scored
      .filter((s) => s.verdict === 'accepted')
      .sort((a, b) => b.total - a.total);
    const rejected = scored.filter((s) => s.verdict === 'rejected');

    // Every rejection is logged with its reason. Nothing is silently dropped.
    for (const r of rejected) {
      await store.appendEvent('opportunity.rejected', {
        fingerprint: r.fingerprint,
        title: r.title,
        reason: r.rejection_reason,
      });
    }

    const top = accepted.slice(0, config.notionTopN);
    let notionWritten = 0;
    let digestSent = false;

    if (await outboundAllowed(store)) {
      notionWritten = await pushToNotion(top);
      const digest = accepted.slice(0, config.digestTopN);
      if (digest.length > 0) {
        digestSent = await sendEmail(
          `Market scan: ${accepted.length} opportunities, top ${digest.length} inside`,
          renderDigestHtml(digest, new Date()),
        );
      }
    }

    const result: ScanResult = {
      collected: collected.length,
      novel: novel.length,
      scored: scored.length,
      accepted: accepted.length,
      rejected: rejected.length,
      notionWritten,
      digestSent,
      top,
    };

    await store.appendEvent('scan.completed', { ...result, top: undefined, ms: Date.now() - startedAt });
    await recordSuccess(store, AUTOMATION_KEY);
    log('info', 'scan.completed', { ...result, top: undefined, ms: Date.now() - startedAt });
    return result;
  } catch (err) {
    const { disabled, failures } = await recordFailure(store, AUTOMATION_KEY, err);
    await store.appendEvent('scan.failed', { error: String(err), failures, disabled });
    if (disabled) {
      // Alert exactly once, on the transition into disabled.
      const { alert } = await import('../ops/alert.ts');
      await alert(
        'market-scan disabled after 2 consecutive failures',
        `The weekly market scan failed twice in a row and has disabled itself.\n\nLast error:\n${String(err)}\n\nIt will not run again until reset:\n  npm run scan -- --reset`,
      );
    }
    throw err;
  }
}
