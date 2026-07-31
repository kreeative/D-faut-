/**
 * The seam between the scoring logic and whichever model provider runs it.
 *
 * Everything that makes the scan trustworthy — the rubric, the automatability
 * gate, score clamping, the retry and fallback behaviour — sits above this
 * line and is provider-agnostic. A provider's only job is: take a system
 * prompt, a user prompt and a JSON schema, and return parsed JSON that
 * matches the schema. Nothing else.
 */

export interface JudgeRequest {
  system: string;
  user: string;
  /** Plain JSON Schema. Both providers accept this shape as-is. */
  schema: Record<string, unknown>;
  maxTokens: number;
}

export interface Judge {
  /** Recorded on every row as `scored_by`, so results stay traceable. */
  readonly name: string;
  judge(request: JudgeRequest): Promise<unknown>;
}

/** Truncated output would surface as a confusing JSON parse error otherwise. */
export class TruncatedOutputError extends Error {
  constructor(provider: string) {
    super(`${provider} hit its output limit before completing the JSON object`);
    this.name = 'TruncatedOutputError';
  }
}

export class RefusedError extends Error {
  constructor(provider: string) {
    super(`${provider} refused to score this candidate`);
    this.name = 'RefusedError';
  }
}
