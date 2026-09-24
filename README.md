# Wearables.ca — concept redesign by Kreeative

A one-page pitch redesign of [Wearables.ca](https://wearables.ca) for SQP Enterprises Inc.
(Ajax, ON), prepared by [Kreeative](https://kreeative.xyz).
**This is a design proposal, not the client's official site.**

Live: https://wearables-concept.vercel.app

## Ground rules

- Keep the "Concept redesign by Kreeative" bar, the footer note and
  `<meta name="robots" content="noindex">` on every page.
- No real forms that collect data or payments. Until the client signs, the quote
  form only opens a prefilled email to info@wearables.ca.

## Stack

Plain static HTML, CSS and JS, with no build step.

```
index.html    markup and content
style.css     brand tokens, layout, responsive rules
site.js       mobile menu, scroll reveal, quote form -> prefilled mailto
favicon.svg   site icon
```

Brand: orange `#f28c28`, charcoal `#1f1f1f`, Inter Tight (display) and Inter (body)
from Google Fonts. Tokens live in `:root` at the top of `style.css`.

## Run it locally

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Check both 1440 px and 390 px wide before pushing. There should be no horizontal
scroll on a phone.

## Deploy

The Vercel project `wearables-concept` deploys every push to `main` to production.
