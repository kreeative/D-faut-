# Sleep Engine

A one-operator internet business where revenue events do not require the
operator to be awake, present, or responsive. Optimised for one metric:
**revenue per operator-hour.**

Built in the order that survives contact with scale — delivery first,
acquisition last:

| Phase | Goal | Status |
|---|---|---|
| 0 | Market intelligence — stop guessing what to sell | **Built** |
| 1 | Storefront — money can move at 3am | not started |
| 2 | Automated fulfilment — the deliverable produces itself | not started |
| 3 | Support that answers itself | not started |
| 4 | Acquisition engine | not started |
| 5 | The cockpit | not started |

Phase 0 is documented in [`docs/PHASE-0.md`](docs/PHASE-0.md). Start there.

```bash
npm install
npm run scan:dry     # whole pipeline, no keys and no network
npm run check        # confirm your Anthropic key works (one sample candidate)
npm run scan:live    # a real scan — needs only ANTHROPIC_API_KEY
```

## Layout

```
app/api/cron/         Vercel Cron entrypoints
jobs/                 job orchestration (market-scan)
agents/               model-backed agents (market-scorer)
lib/                  config, types, http, store, notion, email
lib/sources/          one collector per source, plus offline fixtures
ops/                  circuit breaker, kill switch, alerting
emails/               transactional templates
supabase/migrations/  schema, RLS
tests/                rubric, breaker, sources, scan, digest
```

## Standing constraints

- Costs stay under $150/month until revenue exceeds $2,000/month.
- Every automated action is logged and reversible.
- Nothing charges a card without a human-verified price in the database.
- If an automation fails twice in a row it disables itself and alerts.
- No auto-publishing to social platforms. Drafts land in Notion for approval.
- No scraping behind a login, and no ignoring `robots.txt`.

## What stays human, permanently

Taste, offer selection, pricing, trust, and the first twenty customers. The
system exists to remove everything else.
