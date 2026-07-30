import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../lib/store.ts';
import { fixtureCandidates } from '../lib/sources/fixtures.ts';
import { AUTOMATABILITY_FLOOR } from '../lib/types.ts';

// The scan reads config at import time, so the mode is set before it loads.
process.env.SCAN_DRY_RUN = '1';
const { runMarketScan } = await import('../jobs/market-scan.ts');

test('a full scan scores every candidate and ranks the accepted ones', async () => {
  const store = new MemoryStore();
  const result = await runMarketScan(store);

  assert.equal(result.collected, fixtureCandidates().length);
  assert.equal(result.novel, result.collected);
  assert.equal(result.scored, result.accepted + result.rejected);
  assert.ok(result.accepted > 0, 'fixtures should yield at least one viable opportunity');
  assert.ok(result.rejected > 0, 'fixtures include manual-delivery work that must be rejected');

  // Ranked highest first.
  const totals = result.top.map((o) => o.total);
  assert.deepEqual(totals, [...totals].sort((a, b) => b - a));

  // The gate held: nothing below the floor made the list.
  for (const o of result.top) {
    assert.equal(o.verdict, 'accepted');
    assert.ok(o.scores.delivery_automatability >= AUTOMATABILITY_FLOOR);
    assert.ok(o.riskiest_assumption.length > 0, 'every listed opportunity states its riskiest assumption');
    assert.ok(o.evidence_urls.length > 0, 'every listed opportunity carries an evidence link');
  }
});

test('the consulting and bookkeeping fixtures are rejected for manual delivery', async () => {
  const store = new MemoryStore();
  await runMarketScan(store);

  const rejected = store.opportunities.filter((o) => o.verdict === 'rejected');
  const titles = rejected.map((o) => o.title).join(' | ');
  assert.match(titles, /consultant/i);
  assert.match(titles, /bookkeeper/i);
  for (const r of rejected) assert.ok(r.rejection_reason);
});

test('a second run scores nothing new', async () => {
  const store = new MemoryStore();
  await runMarketScan(store);
  const second = await runMarketScan(store);

  assert.ok(second.collected > 0);
  assert.equal(second.novel, 0, 'everything was already fingerprinted');
  assert.equal(second.scored, 0);
});

test('an unconfigured digest is reported as not sent, not as success', async () => {
  const store = new MemoryStore();
  // No RESEND_API_KEY in this environment, so the send is skipped.
  const result = await runMarketScan(store);
  assert.equal(result.digestSent, false);
});

test('the kill switch stops outbound work but still persists the scan', async () => {
  const store = new MemoryStore({ outboundEnabled: false });
  const result = await runMarketScan(store);

  assert.ok(result.scored > 0, 'scoring and persistence still happen');
  assert.equal(result.notionWritten, 0);
  assert.equal(result.digestSent, false);
  assert.ok(store.opportunities.length > 0);
});

test('every rejection is written to the audit log', async () => {
  const store = new MemoryStore();
  const result = await runMarketScan(store);

  const rejectionEvents = store.events.filter((e) => e.type === 'opportunity.rejected');
  assert.equal(rejectionEvents.length, result.rejected);
  assert.ok(store.events.some((e) => e.type === 'scan.completed'));
});

test('a scan that fails twice disables itself and refuses the third run', async () => {
  const store = new MemoryStore();
  const exploding = {
    ...store,
    knownFingerprints: async () => { throw new Error('supabase unreachable'); },
  } as unknown as MemoryStore;
  // Keep the health and event methods bound to the real store so state persists.
  exploding.getHealth = store.getHealth.bind(store);
  exploding.setHealth = store.setHealth.bind(store);
  exploding.appendEvent = store.appendEvent.bind(store);
  exploding.outboundEnabled = store.outboundEnabled.bind(store);

  await assert.rejects(runMarketScan(exploding), /supabase unreachable/);
  await assert.rejects(runMarketScan(exploding), /supabase unreachable/);
  // Third attempt never reaches the source layer; the breaker stops it first.
  await assert.rejects(runMarketScan(exploding), /is disabled after repeated failures/);
});
