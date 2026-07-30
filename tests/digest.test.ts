import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDigestHtml, escapeHtml } from '../emails/digest.ts';
import type { ScoredOpportunity } from '../lib/types.ts';

function opportunity(overrides: Partial<ScoredOpportunity> = {}): ScoredOpportunity {
  return {
    fingerprint: 'fp',
    source: 'reddit/r/test',
    title: 'A title',
    body: '',
    evidence_urls: ['https://example.com/e'],
    raw_signal: 1,
    collected_at: '2026-07-26T00:00:00.000Z',
    scores: {
      delivery_automatability: 9, demand_signal: 8, price_tolerance: 7,
      payment_friction: 9, operator_advantage: 6, competition_softness: 5, repeat_purchase: 4,
    },
    total: 100,
    verdict: 'accepted',
    rejection_reason: null,
    riskiest_assumption: 'Buyers convert at $99.',
    one_line_offer: 'Fill-in-the-blanks subcontractor agreement',
    scored_by: 'test',
    ...overrides,
  };
}

test('the digest shows the offer, score and riskiest assumption for each item', () => {
  const html = renderDigestHtml([opportunity()], new Date('2026-07-26T00:00:00Z'));
  assert.ok(html.includes('Fill-in-the-blanks subcontractor agreement'));
  assert.ok(html.includes('100/130'));
  assert.ok(html.includes('Buyers convert at $99.'));
  assert.ok(html.includes('https://example.com/e'));
  assert.ok(html.includes('2026-07-26'));
});

test('titles from the internet cannot inject markup into the email', () => {
  const html = renderDigestHtml(
    [opportunity({ one_line_offer: '<script>alert(1)</script>', riskiest_assumption: 'a & b' })],
    new Date(),
  );
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('a &amp; b'));
});

test('escapeHtml covers every character that could break out of an attribute', () => {
  assert.equal(escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
});
