/** Shared domain types for the Sleep Engine. */

/** The seven scoring axes, with their weights, from the build brief. */
export const AXES = {
  delivery_automatability: 3,
  demand_signal: 2,
  price_tolerance: 2,
  payment_friction: 2,
  operator_advantage: 2,
  competition_softness: 1,
  repeat_purchase: 1,
} as const;

export type Axis = keyof typeof AXES;

/** Sum of all axis weights. A perfect 10 on every axis scores TOTAL_WEIGHT * 10. */
export const TOTAL_WEIGHT = Object.values(AXES).reduce((a, b) => a + b, 0);
export const MAX_TOTAL = TOTAL_WEIGHT * 10;

/**
 * Hard gate from the brief: anything below this on delivery automatability is
 * rejected regardless of weighted total. Delivery is the thing that cannot be
 * manual, so it is a gate rather than just a heavy weight.
 */
export const AUTOMATABILITY_FLOOR = 6;

export type Scores = Record<Axis, number>;

export type Verdict = 'accepted' | 'rejected';

/** A raw signal pulled from one source before any scoring happens. */
export interface Candidate {
  /** Stable hash of source + canonical url, used for dedupe across weeks. */
  fingerprint: string;
  source: string;
  title: string;
  /** Free text the scorer reads: post body, job description, RSS summary. */
  body: string;
  evidence_urls: string[];
  /** Source-native popularity signal (upvotes, points). Used only as a tiebreak. */
  raw_signal: number;
  collected_at: string;
}

export interface ScoredOpportunity extends Candidate {
  scores: Scores;
  total: number;
  verdict: Verdict;
  /** Populated only when verdict is 'rejected'. Logged, never silently dropped. */
  rejection_reason: string | null;
  /** The single assumption that, if wrong, kills the opportunity. */
  riskiest_assumption: string;
  one_line_offer: string;
  scored_by: string;
}
