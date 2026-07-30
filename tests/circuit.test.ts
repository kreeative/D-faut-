import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../lib/store.ts';
import {
  assertEnabled,
  recordFailure,
  recordSuccess,
  reset,
  AutomationDisabledError,
  FAILURE_THRESHOLD,
} from '../ops/circuit.ts';

const KEY = 'market-scan';

test('the breaker trips on the second consecutive failure, not the first', async () => {
  const store = new MemoryStore();

  const first = await recordFailure(store, KEY, new Error('network down'));
  assert.equal(first.failures, 1);
  assert.equal(first.disabled, false);
  await assert.doesNotReject(assertEnabled(store, KEY));

  const second = await recordFailure(store, KEY, new Error('network down again'));
  assert.equal(second.failures, FAILURE_THRESHOLD);
  assert.equal(second.disabled, true);
});

test('a disabled automation refuses to run', async () => {
  const store = new MemoryStore();
  await recordFailure(store, KEY, new Error('boom'));
  await recordFailure(store, KEY, new Error('boom'));

  await assert.rejects(assertEnabled(store, KEY), AutomationDisabledError);
});

test('the transition into disabled is reported exactly once', async () => {
  const store = new MemoryStore();
  await recordFailure(store, KEY, new Error('a'));
  const trip = await recordFailure(store, KEY, new Error('b'));
  const after = await recordFailure(store, KEY, new Error('c'));

  assert.equal(trip.disabled, true);
  assert.equal(after.disabled, true);
  // The count keeps climbing, so a caller can alert only on the 2 -> true edge.
  assert.equal(after.failures, 3);
});

test('a success clears the failure count', async () => {
  const store = new MemoryStore();
  await recordFailure(store, KEY, new Error('transient'));
  await recordSuccess(store, KEY);

  const health = await store.getHealth(KEY);
  assert.equal(health.consecutive_failures, 0);
  assert.equal(health.disabled_at, null);
  await assert.doesNotReject(assertEnabled(store, KEY));
});

test('reset re-enables a tripped breaker and logs the action', async () => {
  const store = new MemoryStore();
  await recordFailure(store, KEY, new Error('x'));
  await recordFailure(store, KEY, new Error('x'));
  await reset(store, KEY);

  await assert.doesNotReject(assertEnabled(store, KEY));
  assert.ok(store.events.some((e) => e.type === 'automation.reset'));
});
