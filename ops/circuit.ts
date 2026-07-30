import type { Store } from '../lib/store.ts';
import { log } from '../lib/logger.ts';

/**
 * Two consecutive failures disable an automation and alert. It never retries
 * silently forever — the third run refuses to start until a human clears it.
 */
export const FAILURE_THRESHOLD = 2;

export class AutomationDisabledError extends Error {
  constructor(key: string, lastError: string | null) {
    super(`Automation "${key}" is disabled after repeated failures. Last error: ${lastError ?? 'unknown'}`);
    this.name = 'AutomationDisabledError';
  }
}

export async function assertEnabled(store: Store, key: string): Promise<void> {
  const health = await store.getHealth(key);
  if (health.disabled_at !== null) {
    throw new AutomationDisabledError(key, health.last_error);
  }
}

export async function recordSuccess(store: Store, key: string): Promise<void> {
  await store.setHealth({ key, consecutive_failures: 0, disabled_at: null, last_error: null });
}

/**
 * Records a failure and returns whether this one tripped the breaker, so the
 * caller can alert exactly once on the transition rather than every run.
 */
export async function recordFailure(
  store: Store,
  key: string,
  error: unknown,
): Promise<{ disabled: boolean; failures: number }> {
  const prev = await store.getHealth(key);
  const failures = prev.consecutive_failures + 1;
  const disabled = failures >= FAILURE_THRESHOLD;
  await store.setHealth({
    key,
    consecutive_failures: failures,
    disabled_at: disabled ? new Date().toISOString() : null,
    last_error: String(error instanceof Error ? error.message : error),
  });
  log(disabled ? 'error' : 'warn', 'automation.failure', { key, failures, disabled });
  return { disabled, failures };
}

/** The manual reset. Exposed as a script so recovery is one command. */
export async function reset(store: Store, key: string): Promise<void> {
  await recordSuccess(store, key);
  await store.appendEvent('automation.reset', { key });
}
