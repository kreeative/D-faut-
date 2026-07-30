/**
 * Manual runner.
 *
 *   npm run scan:dry          full pipeline against fixtures, no network, no keys
 *   npm run scan              real run
 *   npm run scan -- --reset   clear the circuit breaker after a failure
 */
import { config } from '../lib/config.ts';
import { MAX_TOTAL } from '../lib/types.ts';

const args = new Set(process.argv.slice(2));
if (args.has('--dry-run')) process.env.SCAN_DRY_RUN = '1';

const { runMarketScan } = await import('../jobs/market-scan.ts');
const { createStore } = await import('../lib/store.ts');
const { reset } = await import('../ops/circuit.ts');

if (args.has('--reset')) {
  await reset(await createStore(), 'market-scan');
  console.log('circuit breaker cleared for market-scan');
  process.exit(0);
}

const result = await runMarketScan();

console.log('\n--- scan summary ---------------------------------------------');
console.log(`collected ${result.collected}  novel ${result.novel}  scored ${result.scored}`);
console.log(`accepted  ${result.accepted}  rejected ${result.rejected}`);
console.log(`notion    ${result.notionWritten} rows  digest ${result.digestSent ? 'sent' : 'not sent'}`);
console.log(`model     ${config.dryRun ? 'heuristic (dry run)' : config.model}`);

console.log('\n--- ranked opportunities -------------------------------------');
result.top.forEach((o, i) => {
  console.log(`\n${String(i + 1).padStart(2)}. [${String(o.total).padStart(3)}/${MAX_TOTAL}] ${o.one_line_offer || o.title}`);
  console.log(`    source   ${o.source}`);
  console.log(`    auto ${o.scores.delivery_automatability}  demand ${o.scores.demand_signal}  price ${o.scores.price_tolerance}  friction ${o.scores.payment_friction}  edge ${o.scores.operator_advantage}  soft ${o.scores.competition_softness}  repeat ${o.scores.repeat_purchase}`);
  console.log(`    risk     ${o.riskiest_assumption}`);
  console.log(`    evidence ${o.evidence_urls[0] ?? '-'}`);
});
console.log('');
