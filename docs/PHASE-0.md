# Phase 0 — Market Intelligence Engine

## What it does

Every Sunday the scan polls a fixed set of public sources, filters for signals
that look like paid pain, scores each one against the seven-axis rubric, and
writes the result to Postgres. The top ten accepted opportunities go to Notion;
the top three go to the operator's inbox with their riskiest assumption stated
plainly. Nothing else is sent.

## Getting a real run

Three steps, in this order. Only the first costs money, and it costs about a
dollar.

**1. Get a key from either provider.** The scorer runs on Anthropic or Gemini;
pick one.

| | Anthropic | Gemini |
|---|---|---|
| Where | `console.anthropic.com` → API keys | `aistudio.google.com/apikey` |
| Card required | yes | no |
| Cost per scan | ~$0.70 | likely $0 (free quota) |
| Env var | `ANTHROPIC_API_KEY` | `GEMINI_API_KEY` |

Gemini is the lower-friction start: a free key, instantly, with no billing
setup, and at roughly 60 candidates a week the scan should stay inside the free
quota. Anthropic is the better judge on the one call that matters most —
deciding whether a deliverable is genuinely automatable — but the rubric is
explicit enough and the automatability floor is enforced in code, so both
produce usable rankings.

```bash
cp .env.example .env
# set exactly one of:
#   ANTHROPIC_API_KEY=sk-ant-...
#   GEMINI_API_KEY=...
```

Leave `AI_PROVIDER` blank and whichever key you set is used. Set it explicitly
(`anthropic` or `gemini`) if you have both keys and want to force a choice.
Switching providers later is a one-line change in `.env` — no code edits.

**2. Confirm it works before spending a scan.**

```bash
npm run check
```

This scores one sample candidate and prints the result. It is the cheapest
possible proof that the key, the model and the schema all line up. If it fails,
nothing else will work either.

**3. Run the scan for real.**

```bash
npm run scan:live
```

Live Reddit and RSS collection, real scoring, results written to
`.data/scan-state.json`. **No Supabase, Notion or Resend needed.** Dedupe works
across runs because the file persists, so a second run the following week only
scores what is new. Expect a few minutes, and roughly $0.70 on Anthropic or
nothing on Gemini's free quota.

Supabase, Notion and email are how this becomes unattended. They are not
required to see whether the output is any good, which is the only question
worth answering first.

## All commands

```bash
npm install
npm run scan:dry          # fixtures, no network, no keys — proves the wiring
npm run check             # one sample candidate against the real API
npm run scan:live         # live sources + real scoring, JSON file on disk
npm run scan              # live sources + Supabase + Notion + email
npm run scan -- --reset   # clear the circuit breaker after a failure
npm test                  # 42 tests
npm run typecheck
```

## Full setup (only needed for unattended weekly runs)

1. **Supabase** — run `supabase/migrations/0001_init.sql`. It creates
   `opportunities`, `events`, `automation_health` and `settings`, and enables
   row level security with no permissive policy on any of them. The scan uses
   the service role key server-side, which bypasses RLS; a leaked anon key
   grants nothing.

2. **Notion** — create a database and share it with your integration. It needs
   these properties, spelled exactly:

   | Property | Type |
   |---|---|
   | Name | Title |
   | Score | Number |
   | Source | Text |
   | Offer | Text |
   | Riskiest assumption | Text |
   | Evidence | URL |
   | Verdict | Select (`accepted`, `rejected`) |
   | Scanned | Date |

3. **Vercel** — set every variable from `.env.example` in project settings. The
   cron schedule lives in `vercel.json`.

## The schedule

`vercel.json` runs the job at `0 7 * * 0` — 07:00 UTC on Sundays. Vercel Cron
is UTC-only with no timezone support, so that lands at 03:00 in
America/Toronto during EDT and 02:00 during EST. For a job whose only
requirement is "while the operator is asleep", the winter hour of drift does
not matter.

## The rubric

Seven axes, scored 1–10, weights summing to 13, so a perfect card is 130.

| Axis | Weight |
|---|---|
| delivery_automatability | ×3 |
| demand_signal | ×2 |
| price_tolerance | ×2 |
| payment_friction | ×2 |
| operator_advantage | ×2 |
| competition_softness | ×1 |
| repeat_purchase | ×1 |

**Delivery automatability below 6 is rejected outright, whatever the total.**
That gate is enforced in `applyRubric()`, not in the prompt — the model proposes
scores, the code decides. A candidate scoring 10 on every other axis and 5 on
automatability still totals 125 and is still rejected, with the reason recorded.
That case is covered by a test.

## Swapping the scoring provider

`lib/providers/` holds one small adapter per provider behind a single
interface: take a system prompt, a user prompt and a JSON schema, return parsed
JSON. Everything that makes the scan trustworthy — the rubric, the
automatability gate, score clamping, retries, the offline fallback — sits above
that line and is provider-agnostic.

Both providers accept the **same** JSON Schema object unchanged (Anthropic via
`output_config.format`, Gemini via `responseJsonSchema`), so there is no
translation layer to drift out of sync. Adding a third provider means writing
one file and one line in `createJudge()`.

The model that actually scored each row is recorded in `scored_by`, so a mixed
history stays traceable.

## Sources

**Polled:** Reddit public JSON endpoints (`top/week` across nine subreddits in
three verticals), and RSS from We Work Remotely and Indie Hackers. Both are
published read-only surfaces. Every request goes through `lib/http.ts`, which
sends a truthful User-Agent, fetches and honours `robots.txt`, and rate-limits
to one request per second per host. If `robots.txt` cannot be fetched, the host
is treated as disallowed for that run rather than guessed at.

**Not built, and why:**

- *Etsy, Gumroad, Creative Market, Amazon Best Sellers* — no public feed. Reading
  them means scraping rendered HTML, which their terms restrict and which breaks
  on every layout change.
- *App Store reviews* — same problem, and review scraping is explicitly
  restricted.
- *Google Trends* — the only npm route wraps a private endpoint. It fails by
  returning wrong data rather than erroring, which is the worst possible
  behaviour in a system nobody watches.

Reddit plus job boards clears the actual bar, which is ten scored opportunities
with evidence links. Revisit with a paid data source once revenue justifies one.

## Safety properties

- **Circuit breaker.** Two consecutive failures set `disabled_at` and send one
  alert. The third run refuses to start until `npm run scan -- --reset`. It never
  retries silently forever.
- **Kill switch.** `settings.outbound_enabled = false` halts Notion and email
  while still collecting, scoring and persisting. Phase 5 mirrors a Notion
  checkbox into that row; the contract here does not change.
- **Audit log.** Every rejection, completion and failure appends to `events`.
- **Idempotent.** Opportunities upsert on `fingerprint`, a hash of source plus
  canonicalised URL. Re-running the same week overwrites rather than duplicating,
  and a candidate already scored in a previous week is never rescored.
- **Honest reporting.** A skipped digest reports `digestSent: false`. A run that
  could not send must not look like one that did.
- **Bounded spend.** `SCAN_MAX_CANDIDATES` caps candidates scored per run.
  Nothing else drives the API bill.

## Recurring cost

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| Resend | Free (3k emails/mo) | $0 |
| Notion | existing | $0 |
| Scoring API | usage | ~$3/mo on Anthropic, or $0 on Gemini's free quota |

**Total: roughly $3/month, or $0 if you score on Gemini.** Well inside the $150 ceiling. Nothing here needs a
paid plan until Phase 1 puts real traffic on it.

## Operator time

Setup is a one-time 30–45 minutes (Supabase migration, Notion database,
environment variables). Steady state is the fifteen minutes on Monday spent
reading the list, which is the point of the phase rather than overhead.
