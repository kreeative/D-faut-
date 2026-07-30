import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRubric, weightedTotal, scoreHeuristically } from '../agents/market-scorer.ts';
import { AUTOMATABILITY_FLOOR, MAX_TOTAL, TOTAL_WEIGHT, type Scores } from '../lib/types.ts';
import type { Candidate } from '../lib/types.ts';

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    fingerprint: 'fp-test',
    source: 'test',
    title: 'Test opportunity',
    body: 'body',
    evidence_urls: ['https://example.com/a'],
    raw_signal: 10,
    collected_at: new Date().toISOString(),
    ...overrides,
  };
}

function scores(v: number, overrides: Partial<Scores> = {}): Scores {
  return {
    delivery_automatability: v,
    demand_signal: v,
    price_tolerance: v,
    payment_friction: v,
    operator_advantage: v,
    competition_softness: v,
    repeat_purchase: v,
    ...overrides,
  };
}

test('weights match the brief and a perfect card scores the maximum', () => {
  assert.equal(TOTAL_WEIGHT, 13);
  assert.equal(MAX_TOTAL, 130);
  assert.equal(weightedTotal(scores(10)), 130);
  assert.equal(weightedTotal(scores(1)), 13);
});

test('delivery automatability is weighted x3', () => {
  const base = weightedTotal(scores(5));
  const bumped = weightedTotal(scores(5, { delivery_automatability: 6 }));
  assert.equal(bumped - base, 3);
});

test('a candidate below the automatability floor is rejected despite a high total', () => {
  // Perfect on every other axis: this is the case the gate exists for.
  const judgement = {
    scores: scores(10, { delivery_automatability: AUTOMATABILITY_FLOOR - 1 }),
    riskiest_assumption: 'x',
    one_line_offer: 'y',
  };
  const result = applyRubric(candidate(), judgement);

  assert.equal(result.verdict, 'rejected');
  assert.ok(result.total > 100, 'total should still be high, proving the gate is not a score threshold');
  assert.match(result.rejection_reason ?? '', /delivery_automatability 5 is below the floor of 6/);
});

test('a candidate exactly at the floor is accepted', () => {
  const result = applyRubric(candidate(), {
    scores: scores(5, { delivery_automatability: AUTOMATABILITY_FLOOR }),
    riskiest_assumption: 'x',
    one_line_offer: 'y',
  });
  assert.equal(result.verdict, 'accepted');
  assert.equal(result.rejection_reason, null);
});

test('every rejection carries a reason', () => {
  for (let v = 1; v < AUTOMATABILITY_FLOOR; v++) {
    const result = applyRubric(candidate(), {
      scores: scores(8, { delivery_automatability: v }),
      riskiest_assumption: 'x',
      one_line_offer: 'y',
    });
    assert.equal(result.verdict, 'rejected');
    assert.ok(result.rejection_reason && result.rejection_reason.length > 0);
  }
});

test('out-of-range model output is clamped rather than trusted', () => {
  const result = applyRubric(candidate(), {
    // A model that returns 99 must not be able to inflate a total.
    scores: scores(5, { delivery_automatability: 99, demand_signal: -4 }),
    riskiest_assumption: 'x',
    one_line_offer: 'y',
  });
  assert.equal(result.scores.delivery_automatability, 10);
  assert.equal(result.scores.demand_signal, 1);
  assert.ok(result.total <= MAX_TOTAL);
});

test('missing axes fall to the minimum instead of NaN', () => {
  const result = applyRubric(candidate(), {
    scores: { delivery_automatability: 8 } as unknown as Scores,
    riskiest_assumption: 'x',
    one_line_offer: 'y',
  });
  assert.ok(Number.isInteger(result.total));
  assert.equal(result.scores.repeat_purchase, 1);
});

test('the heuristic scorer rejects work that needs a human', () => {
  const consulting = scoreHeuristically(
    candidate({
      title: 'Looking for a consultant to redesign our onboarding',
      body: 'Audit, interview our customers, six weeks, weekly calls.',
    }),
  );
  assert.ok(consulting.scores.delivery_automatability < AUTOMATABILITY_FLOOR);

  const artefact = scoreHeuristically(
    candidate({ title: 'Would pay for a proposal template', body: 'template pack, $150' }),
  );
  assert.ok(artefact.scores.delivery_automatability >= AUTOMATABILITY_FLOOR);
});
