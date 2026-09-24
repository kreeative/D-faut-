# Caméléon — concept redesign by Kreeative

A one-page pitch redesign for SQP Enterprises Inc. (Ajax, ON; today
[Wearables.ca](https://wearables.ca)), shown under the working name **Caméléon**, prepared
by [Kreeative](https://kreeative.xyz).
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
site.js       brand studio, quote form -> prefilled mailto, Motion animations
favicon.svg   site icon
img/          product and lifestyle photos (WebP), og.jpg link preview
```

Palette: Printify's brand colours. Mint green `#AEFF6E` for buttons and accents,
camouflage `#2F2E0C` for text and dark sections, ecru white `#FBFBF3` for the
background, plus white. Green text uses a deeper `#4A7A12`, because mint on a light
background is unreadable. Fonts are Inter Tight (display) and Inter (body) from Google
Fonts. The tokens live in `:root` at the top of `style.css`.

Photos are neutral (black and white) so mint stays the only colour. The tee in the brand
studio is one photo recoloured into black, charcoal, heather grey, ecru and mint on a
grey brick wall, which keeps the print in the same place on every colour.

### Brand studio

The hero lets a visitor type their brand, pick a tee colour (black, charcoal, heather,
ecru, mint) and an ink (mint, white, camo). The name is printed live on the tee, the
tote, the eco USB drive, the laptop "autorun" screen and the quote preview card, and
it pre-fills the quote form's Company field and email. It all runs in the browser.
Nothing is sent or stored.

### Motion

Animations use [Motion](https://motion.dev) 13.4.3 (the framework-free build of
Framer Motion, MIT), loaded from jsDelivr: hero entrance, floating product cards,
pointer tilt, count-up stats, scroll reveals, the reading-progress bar, the eco
photo parallax, the process line and the use-case marquee.

It is progressive enhancement. With `prefers-reduced-motion`, or if the CDN fails,
the page shows everything statically and the brand studio still works. A 3-second
safety timeout in `<head>` reveals the page if scripts never run.

## Run it locally

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Check both 1440 px and 390 px wide before pushing. There should be no horizontal
scroll on a phone.

## Deploy

The Vercel project `wearables-concept` deploys every push to `main` to production.

## Photo credits

All photos are licensed for commercial use and none need attribution. The
photographers are credited here anyway. The images were cropped, converted to black
and white (the tees recoloured) and saved as WebP.

**[Burst by Shopify](https://burst.shopify.com)**: free for commercial use under the
Burst licence.

| File | Photo |
| --- | --- |
| `tee-black`, `tee-charcoal`, `tee-heather`, `tee-ecru`, `tee-mint` | [Grey t-shirt](https://burst.shopify.com/photos/grey-t-shirt), recoloured |
| `card-wearables` | [Rack of blank t-shirts](https://burst.shopify.com/photos/rack-of-blank-tshirts) |
| `card-accessories` | [Notebook and coffee](https://burst.shopify.com/photos/notebook-and-coffee) |
| `card-packaging` | [Gift package in hand](https://burst.shopify.com/photos/gift-package-in-hand) |
| `card-data` | [Laptop computer on wooden table](https://burst.shopify.com/photos/laptop-computer-on-wooden-table) |
| `eco` | [Greens on wood background](https://burst.shopify.com/photos/greens-on-wood-background) |
| `step-pick`, `step-artwork`, `step-proof`, `step-delivered` | [Blank coloured t-shirts](https://burst.shopify.com/photos/blank-colored-t-shirts), [laptop from above](https://burst.shopify.com/photos/laptop-from-above), [embroidery flatlay](https://burst.shopify.com/photos/flatlay-of-embroidery-coffee-and-dried-flowers), [preparing a package](https://burst.shopify.com/photos/young-man-preparing-a-package-for-fulfillment) |
| `use-*` chips | [Event crowd](https://burst.shopify.com/photos/crowd-participating-at-event), [construction crew](https://burst.shopify.com/photos/five-construction-workers-on-break), [starting school](https://burst.shopify.com/photos/starting-school), [stadium](https://burst.shopify.com/photos/sports-stadium-crowds), [team meeting](https://burst.shopify.com/photos/business-meeting-with-large-team), [team hands](https://burst.shopify.com/photos/team-hands-in) |

**Wikimedia Commons, CC0 (public domain)**

| File | Photo |
| --- | --- |
| `card-flash` | [Laptop with a USB stick](https://commons.wikimedia.org/wiki/File:Laptop_with_a_USB_stick_(Unsplash).jpg), Brina Blum |
| `usb` | [USB thumb drive](https://commons.wikimedia.org/wiki/File:USB-thumb-drive-16-GB.jpg), Kaldari |
| `tote` | [Jute bag](https://commons.wikimedia.org/wiki/File:Baghashtag-Jute-bag.jpg), Efkanakbiyik (the maker's tag was retouched out) |
| `use-streetwear` | [Baseball cap brim](https://commons.wikimedia.org/wiki/File:Baseball_cap_brim_(Unsplash).jpg), Jad Limcaco |

`og.jpg` is a screenshot of this page.
