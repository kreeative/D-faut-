import { config } from '../lib/config.ts';
import { log } from '../lib/logger.ts';
import { createJudge, type Judge } from '../lib/providers/index.ts';
import {
  AXES,
  AUTOMATABILITY_FLOOR,
  type Axis,
  type Candidate,
  type ScoredOpportunity,
  type Scores,
} from '../lib/types.ts';

/** What the model is asked to return, before we do any arithmetic ourselves. */
export interface RawJudgement {
  scores: Scores;
  riskiest_assumption: string;
  one_line_offer: string;
}

const AXIS_QUESTIONS: Record<Axis, string> = {
  delivery_automatability:
    'Can a machine produce the finished deliverable with zero human touch? Anything needing custom work, revisions, discovery calls or bespoke scoping scores 1-3.',
  demand_signal:
    'Are people actively searching, complaining, and paying right now? Evidence of money already changing hands beats enthusiasm.',
  price_tolerance:
    'Does this buyer already pay more than $40 for an adjacent solution?',
  payment_friction:
    'Can they buy in under 90 seconds with a card — no invoice, no procurement, no approval chain?',
  operator_advantage:
    'Does a solo operator who is a full-time student, works in English and French, and ships fast have an unfair edge here? Score low if winning needs an existing audience, licences, or capital.',
  competition_softness:
    'Are the incumbents slow, ugly, or overpriced?',
  repeat_purchase:
    'Does one buyer buy again or subscribe, or is it strictly one-and-done?',
};

function rubricText(): string {
  return (Object.keys(AXES) as Axis[])
    .map((axis) => `- ${axis} (weight x${AXES[axis]}): ${AXIS_QUESTIONS[axis]}`)
    .join('\n');
}

const SYSTEM_PROMPT = `You score business opportunities for a one-operator internet business.

The operator sleeps eight hours a night, studies full time, and has about ten focused hours a week. The only thing that matters is revenue per operator-hour. An opportunity that earns well but demands the operator's presence is worse than one that earns less and demands nothing.

Score each opportunity 1-10 on every axis below. 1 means "actively bad on this axis", 5 means "unremarkable", 10 means "exceptional".

${rubricText()}

Rules you must follow:
- Score delivery_automatability on the deliverable as it would actually have to be produced, not on an optimistic reimagining of it. Consulting, audits, interviews, bookkeeping cleanup, and anything sold as ongoing bespoke work are not automatable, regardless of how much demand exists.
- Base scores only on what the evidence supports. Absence of evidence is a low score, not a middling one.
- riskiest_assumption is the single assumption that, if false, kills this opportunity. State it plainly in one sentence, as a claim that could be checked. Do not hedge and do not list more than one.
- one_line_offer names the concrete thing a buyer would receive, in under fifteen words.

Return only the JSON object described by the schema.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: Object.fromEntries(
        (Object.keys(AXES) as Axis[]).map((a) => [
          a,
          { type: 'integer', description: AXIS_QUESTIONS[a] },
        ]),
      ),
      required: Object.keys(AXES),
      additionalProperties: false,
    },
    riskiest_assumption: { type: 'string' },
    one_line_offer: { type: 'string' },
  },
  required: ['scores', 'riskiest_assumption', 'one_line_offer'],
  additionalProperties: false,
} as const;

/** Clamps to the 1-10 the rubric defines, so a stray model value cannot skew a total. */
function clampScores(raw: Partial<Scores>): Scores {
  const out = {} as Scores;
  for (const axis of Object.keys(AXES) as Axis[]) {
    const v = Number(raw[axis]);
    out[axis] = Number.isFinite(v) ? Math.min(10, Math.max(1, Math.round(v))) : 1;
  }
  return out;
}

export function weightedTotal(scores: Scores): number {
  return (Object.keys(AXES) as Axis[]).reduce((sum, axis) => sum + scores[axis] * AXES[axis], 0);
}

/**
 * The gate and the arithmetic, as a pure function. The model proposes scores;
 * this decides. Keeping the accept/reject rule out of the prompt is what makes
 * the automatability floor non-negotiable.
 */
export function applyRubric(
  candidate: Candidate,
  judgement: RawJudgement,
  judgeName?: string,
): ScoredOpportunity {
  const scores = clampScores(judgement.scores);
  const total = weightedTotal(scores);
  const automatability = scores.delivery_automatability;
  const rejected = automatability < AUTOMATABILITY_FLOOR;

  return {
    ...candidate,
    scores,
    total,
    verdict: rejected ? 'rejected' : 'accepted',
    rejection_reason: rejected
      ? `delivery_automatability ${automatability} is below the floor of ${AUTOMATABILITY_FLOOR}; delivery would require human touch`
      : null,
    riskiest_assumption: String(judgement.riskiest_assumption ?? '').trim(),
    one_line_offer: String(judgement.one_line_offer ?? '').trim(),
    scored_by: judgeName ?? (config.dryRun ? 'heuristic-dry-run' : 'unknown'),
  };
}

/**
 * Offline scorer for dry runs and tests. Keyword-driven and deliberately
 * crude — it exists to exercise the pipeline, not to judge markets. Real runs
 * always use the model.
 */
export function scoreHeuristically(candidate: Candidate): RawJudgement {
  const text = `${candidate.title} ${candidate.body}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  const manual = has(
    'consultant', 'audit', 'interview', 'bookkeep', 'six weeks', 'weekly calls',
    'ongoing', 'evolve', 'untangle', 'talk to my accountant',
  );
  const artefact = has('template', 'spreadsheet', 'deck', 'flashcards', 'notes', 'kit', 'pack');

  let automatability = 5;
  if (manual) automatability = 2;
  else if (artefact) automatability = 9;
  else automatability = 7;

  const paying = has('would pay', 'paid', 'charging', 'quoted', '$', 'budget');
  const priced = /\$\s?(\d{2,5})/.exec(text);
  const priceValue = priced?.[1] ? Number(priced[1]) : 0;

  return {
    scores: {
      delivery_automatability: automatability,
      demand_signal: Math.min(10, 4 + (paying ? 3 : 0) + Math.min(3, Math.floor(candidate.raw_signal / 200))),
      price_tolerance: priceValue >= 200 ? 9 : priceValue >= 40 ? 7 : paying ? 6 : 4,
      payment_friction: manual ? 3 : 9,
      operator_advantage: artefact ? 7 : 5,
      competition_softness: has('everyone else', 'identical', 'generic', 'overpriced', 'expensive') ? 8 : 5,
      repeat_purchase: has('monthly', 'recurring', 'per episode', 'per video', 'subscri') ? 8 : 4,
    },
    riskiest_assumption: manual
      ? 'That the delivery could be automated at all, which the evidence contradicts.'
      : 'That buyers who say they would pay actually convert at the price this needs to work.',
    one_line_offer: candidate.title.slice(0, 80),
  };
}

function buildPrompt(candidate: Candidate): string {
  return `Source: ${candidate.source}
Title: ${candidate.title}
Evidence: ${candidate.evidence_urls.join(', ')}
Community signal: ${candidate.raw_signal}

Body:
${candidate.body || '(no body text)'}`;
}

/** The same schema goes to both providers unchanged. */
export function outputSchema(): Record<string, unknown> {
  return OUTPUT_SCHEMA as unknown as Record<string, unknown>;
}

async function scoreWithModel(judge: Judge, candidate: Candidate): Promise<RawJudgement> {
  const result = await judge.judge({
    system: SYSTEM_PROMPT,
    user: buildPrompt(candidate),
    schema: outputSchema(),
    // Thinking tokens count against this ceiling on both providers, so it has
    // room for reasoning plus the JSON. Too tight and the object truncates.
    maxTokens: 8000,
  });
  return result as RawJudgement;
}

/** Bounded-concurrency map. Keeps us inside rate limits without a dependency. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]!);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function scoreCandidates(candidates: Candidate[]): Promise<ScoredOpportunity[]> {
  if (config.dryRun) {
    return candidates.map((c) => applyRubric(c, scoreHeuristically(c), 'heuristic-dry-run'));
  }

  // Built once per run so a misconfigured provider fails immediately, before
  // any candidate is spent, rather than sixty times over.
  const judge = await createJudge();
  log('info', 'scorer.provider', { provider: judge.name, candidates: candidates.length });

  return mapLimit(candidates, config.scoreConcurrency, async (candidate) => {
    try {
      return applyRubric(candidate, await scoreWithModel(judge, candidate), judge.name);
    } catch (err) {
      // One unscorable candidate is not a scan failure. It is recorded as
      // rejected with the reason so it lands in the audit log rather than
      // vanishing.
      log('warn', 'scorer.candidate_failed', {
        fingerprint: candidate.fingerprint,
        error: String(err),
      });
      const fallback = applyRubric(candidate, scoreHeuristically(candidate), 'failed');
      return {
        ...fallback,
        verdict: 'rejected' as const,
        rejection_reason: `scoring failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  });
}
