/**
 * Pre-flight. Answers "is my setup good enough to run this for real?" without
 * spending a scan, by making one deliberately tiny scored request.
 *
 *   npm run check
 */
import { config } from '../lib/config.ts';

const ok = (m: string) => console.log(`  ok      ${m}`);
const missing = (m: string) => console.log(`  missing ${m}`);

console.log('\nSleep Engine pre-flight\n');

console.log('Required for a real run:');
if (config.anthropicApiKey) ok(`ANTHROPIC_API_KEY (model ${config.model}, effort ${config.effort})`);
else missing('ANTHROPIC_API_KEY  <- without this only `npm run scan:dry` works');

console.log('\nStorage (one of these):');
if (config.supabaseUrl && config.supabaseServiceKey) ok('Supabase configured');
else missing(`Supabase not set; --local will persist to ${config.localStorePath}`);

console.log('\nOptional outputs:');
if (config.notionApiKey && config.notionOpportunityDbId) ok('Notion');
else missing('Notion  <- the ranked list will not be published anywhere');
if (config.resendApiKey && config.digestTo) ok('Resend');
else missing('Resend  <- no email digest will be sent');

if (!config.anthropicApiKey) {
  console.log('\nAdd ANTHROPIC_API_KEY to .env, then run this again.\n');
  process.exit(1);
}

console.log('\nTesting the scoring call against one sample candidate...');
const { scoreCandidates } = await import('../agents/market-scorer.ts');

const [scored] = await scoreCandidates([
  {
    fingerprint: 'preflight',
    source: 'preflight',
    title: 'Paid $600 for a freelance contract template I could have filled in myself',
    body: 'Needed a standard freelance agreement. Every option was either a lawyer at $600 or a free template that did not cover late payment. I would pay $99 for a good fill-in-the-blanks version.',
    evidence_urls: ['https://example.com/preflight'],
    raw_signal: 100,
    collected_at: new Date().toISOString(),
  },
]);

if (!scored || scored.scored_by === 'failed') {
  console.error(`\nThe scoring call failed: ${scored?.rejection_reason ?? 'unknown error'}\n`);
  process.exit(1);
}

console.log(`\n  scored by ${scored.scored_by}`);
console.log(`  total     ${scored.total}/130 (${scored.verdict})`);
console.log(`  offer     ${scored.one_line_offer}`);
console.log(`  risk      ${scored.riskiest_assumption}`);
console.log('\nThe scorer works. You are ready for: npm run scan:live\n');
