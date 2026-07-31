import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileStore } from '../lib/store.ts';
import type { ScoredOpportunity } from '../lib/types.ts';

function opportunity(fingerprint: string, total = 90): ScoredOpportunity {
  return {
    fingerprint,
    source: 'reddit/r/test',
    title: `Opportunity ${fingerprint}`,
    body: '',
    evidence_urls: ['https://example.com/e'],
    raw_signal: 1,
    collected_at: '2026-07-30T00:00:00.000Z',
    scores: {
      delivery_automatability: 9, demand_signal: 8, price_tolerance: 7,
      payment_friction: 9, operator_advantage: 6, competition_softness: 5, repeat_purchase: 4,
    },
    total,
    verdict: 'accepted',
    rejection_reason: null,
    riskiest_assumption: 'r',
    one_line_offer: 'o',
    scored_by: 'test',
  };
}

async function withTempStore(fn: (path: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), 'sleep-engine-'));
  try {
    await fn(join(dir, 'nested', 'state.json'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('state survives across separate store instances', async () => {
  await withTempStore(async (path) => {
    await new FileStore(path).saveOpportunities([opportunity('a'), opportunity('b')]);

    // A new instance is what the next weekly run actually gets.
    const known = await new FileStore(path).knownFingerprints(['a', 'b', 'c']);
    assert.deepEqual([...known].sort(), ['a', 'b']);
  });
});

test('saving the same fingerprint twice upserts rather than duplicating', async () => {
  await withTempStore(async (path) => {
    const store = new FileStore(path);
    await store.saveOpportunities([opportunity('a', 80)]);
    await store.saveOpportunities([opportunity('a', 95)]);

    const reloaded = new FileStore(path);
    assert.equal((await reloaded.knownFingerprints(['a'])).size, 1);
    const raw = JSON.parse(await (await import('node:fs/promises')).readFile(path, 'utf8'));
    assert.equal(raw.opportunities.length, 1);
    assert.equal(raw.opportunities[0].total, 95, 'the newer score wins');
  });
});

test('a missing file reads as an empty store rather than throwing', async () => {
  await withTempStore(async (path) => {
    const store = new FileStore(path);
    assert.equal((await store.knownFingerprints(['x'])).size, 0);
    assert.equal(await store.outboundEnabled(), true);
    assert.equal((await store.getHealth('market-scan')).consecutive_failures, 0);
  });
});

test('circuit breaker state persists to disk', async () => {
  await withTempStore(async (path) => {
    await new FileStore(path).setHealth({
      key: 'market-scan',
      consecutive_failures: 2,
      disabled_at: '2026-07-30T00:00:00.000Z',
      last_error: 'boom',
    });

    const health = await new FileStore(path).getHealth('market-scan');
    assert.equal(health.consecutive_failures, 2);
    assert.equal(health.last_error, 'boom');
  });
});

test('events append across instances', async () => {
  await withTempStore(async (path) => {
    await new FileStore(path).appendEvent('scan.completed', { accepted: 3 });
    const second = new FileStore(path);
    await second.appendEvent('opportunity.rejected', { reason: 'manual delivery' });

    const raw = JSON.parse(await (await import('node:fs/promises')).readFile(path, 'utf8'));
    assert.equal(raw.events.length, 2);
    assert.ok(raw.events.every((e: { at: string }) => typeof e.at === 'string'));
  });
});
