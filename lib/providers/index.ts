import { config } from '../config.ts';
import type { Judge } from './types.ts';

export type { Judge, JudgeRequest } from './types.ts';
export { RefusedError, TruncatedOutputError } from './types.ts';

/**
 * Picks the provider. An explicit AI_PROVIDER always wins; otherwise whichever
 * key is present is used, so pasting one key into .env is enough to get going.
 * `npm run check` prints the resolved choice, so the inference is never a
 * mystery.
 */
export function resolveProvider(): 'anthropic' | 'gemini' {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === 'anthropic' || explicit === 'gemini') return explicit;
  if (explicit) {
    throw new Error(`AI_PROVIDER must be "anthropic" or "gemini", got "${explicit}"`);
  }
  if (config.geminiApiKey && !config.anthropicApiKey) return 'gemini';
  return 'anthropic';
}

export async function createJudge(): Promise<Judge> {
  if (resolveProvider() === 'gemini') {
    return (await import('./gemini.ts')).createGeminiJudge();
  }
  return (await import('./anthropic.ts')).createAnthropicJudge();
}
