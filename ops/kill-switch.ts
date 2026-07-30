import type { Store } from '../lib/store.ts';
import { log } from '../lib/logger.ts';

/**
 * One switch that halts every outbound action. Phase 0 reads it from the
 * settings table; Phase 5 mirrors a Notion checkbox into that same row, so the
 * contract here does not change.
 */
export async function outboundAllowed(store: Store): Promise<boolean> {
  const enabled = await store.outboundEnabled();
  if (!enabled) log('warn', 'killswitch.engaged', {});
  return enabled;
}
