# Poulet Rouge — unofficial ordering concept

> **This is an unofficial design concept by [Kreeative](https://kreeative.xyz).
> It is not affiliated with, endorsed by or connected to Poulet Rouge.** No
> order is sent to a restaurant and nothing is charged. The name, menu and
> colours are used only to show the idea. The logo mark is drawn for this
> concept and is not Poulet Rouge's own logo.

What ordering online from Poulet Rouge, the Québec grilled-chicken bowl chain,
could feel like. You build your bowl and watch it fill up as you choose. It's
built from the same base as [Tabouret](../restaurant/), the ordering app in this
repo.

Built with **vanilla HTML, CSS and JavaScript**. There are no frameworks and no
build step, like the rest of this repo.

## Run it

It's a static site. Serve the `poulet-rouge/` folder with any web server:

```bash
cd poulet-rouge
python3 -m http.server 8000
# open http://localhost:8000
```

## What's inside

- **The live bowl**: a top-down red bowl with a black inside, as in the
  restaurants. Every ingredient is a real photo. The base fills the bowl, each
  topping drops into its own spot around the edge, and the grilled chicken sits
  in the middle, coloured by its flavour. Each sauce draws itself across the top
  as a drizzle. Remove something and it shrinks away.
- **The builder** follows the restaurant's rules:
  - one flavour is included and a second one is $2.20 more;
  - up to two bases, seven toppings and two sauces on the Rouge Bol;
  - one base, three toppings and one sauce on the Rouge Mini.

  The counters show what's left, and full groups are greyed out. If something
  required is missing, you're told what before the bowl is added.
- **Menu**: the Rouge Bol, the all-dressed Rouge Bol, the Rouge Mini and the
  Rouge Poutine, plus sides, desserts and drinks. It has category chips, search,
  favorites and an open/closed status in Montréal time.
- **French first, English on request**: the EN / FR button in the top bar
  switches every screen, including prices, dates and plurals (`fr-CA` and
  `en-CA` formats). The choice is remembered, and links can ask for a language
  with `?lang=en`.
- **Rouge Club**: 10 points per dollar, shown on the bowl, in the cart and
  after ordering. Completing your profile adds a 100-point welcome gift.
- **Québec taxes**: GST (5%) and QST (9.975%) as separate lines.
- **Pickup or delivery**: delivery has a minimum order, a fee and free delivery
  over $35. You can order as soon as possible or schedule a time within opening
  hours.
- **Order tracking**: a progress ring with the bowl you built, a step timeline,
  order history and one-tap reorder.
- **Layout**: on phones it's one column with full-screen sheets. While you
  scroll the toppings, the bowl docks in the header so you can still see it. On
  desktop (from 1024px) it shows two glass panels side by side.
- Light and dark themes, keyboard and screen-reader support, and reduced-motion
  support.

## How the bowl is drawn

`js/bowl.js` builds the bowl from layers of real photos (in `assets/textures/`):

- the base or bases (two bases sit half and half);
- up to seven topping heaps with organic outlines, each on a fixed spot;
- the chicken, tinted by its flavour through a `multiply` layer;
- the sauces, as SVG paths that draw themselves in.

`Bowl.update()` compares the new choices with what's on screen and animates
only the difference. The menu cards, the cart, the order history and the
tracker all use the same renderer.

## Files

| Path | What it holds |
| --- | --- |
| `js/config.js` | The restaurant: flavours, bases, toppings, sauces, dishes, prices, hours, taxes, Rouge Club |
| `js/strings.js` | Every interface string in French and English |
| `js/i18n.js` | Language choice, plural rules and number formats |
| `js/bowl.js` | The live bowl |
| `js/store.js` | Cart, pricing, points, orders (saved in the browser) |
| `js/views.js`, `js/app.js` | Screens, routing and interactions |
| `js/credits.js` | Photo credits shown in the info drawer |
| `vercel.json`, `robots.txt` | `noindex` headers |

## Keeping it clearly a concept

- An "Unofficial concept" badge on the menu and a note under it, notes at
  checkout and on the order tracker, and an "About this concept" section in
  the info drawer.
- Every page and file is sent with `noindex, nofollow` (a meta tag and an
  `X-Robots-Tag` header), so it stays out of search results.
- There are no phone numbers, promo codes or allergen claims, and no card
  details are asked for. For allergens, guests are told to ask at the counter.
- Products, prices and calories follow the public Montréal menu (2026), for
  reference only.

## Photo credits

Every photo was cropped and resized for this concept. The same list is in the
app's info drawer, under "About this concept".

- **Grilled chicken**: [“20241025-USDA-FNS-UNK-0017”](https://www.flickr.com/photos/41284017@N08/54093219273) by [USDAgov](https://www.flickr.com/photos/41284017@N08) on Flickr, [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)
- **Plant-based filet**: [“Fried Tofu Cubes”](https://www.flickr.com/photos/149704944@N08/52209914102) by [loumchen](https://www.flickr.com/photos/149704944@N08) on Flickr, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- **Brown rice**: [“Cooked brown rice white background”](https://www.rawpixel.com/image/8731984/photo-image-white-background-public-domain-food) by U.S. Department of Agriculture on rawpixel, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- **Bulgur wheat**: [“20211103-FNS-UNC-6079”](https://www.flickr.com/photos/41284017@N08/51667255692) by [USDAgov](https://www.flickr.com/photos/41284017@N08) on Flickr, [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)
- **Quinoa**: [“20210820-FNS-UNC-0055”](https://www.flickr.com/photos/41284017@N08/51392569306) by [USDAgov](https://www.flickr.com/photos/41284017@N08) on Flickr, [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)
- **Romaine lettuce**: [photo on Pexels](https://www.pexels.com/photo/green-and-white-lettuce-102123/), [Pexels License](https://www.pexels.com/license/)
- **Poutine (bowl and side)**: [“homemade poutine”](https://www.flickr.com/photos/91873384@N04/51891062673) by [dalecruse](https://www.flickr.com/photos/91873384@N04) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Tomatoes**: [“Chopped Tomatoes”](https://stocksnap.io/photo/chopped-tomatoes-03JNS3TYGF) by [Tim Sullivan](https://www.secretagencygroup.com) on StockSnap, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- **Cucumbers**: [photo on Pexels](https://www.pexels.com/photo/slices-of-cucumber-10432461/), [Pexels License](https://www.pexels.com/license/)
- **Red onions**: [photo on Pexels](https://www.pexels.com/photo/a-person-cutting-an-onion-8859780/), [Pexels License](https://www.pexels.com/license/)
- **Bell peppers**: [“20210902-FNS-UNC-0029”](https://www.flickr.com/photos/41284017@N08/51431444954) by [USDAgov](https://www.flickr.com/photos/41284017@N08) on Flickr, [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/)
- **Corn**: [photo on Pexels](https://www.pexels.com/photo/corn-kernels-on-strainer-1359315/), [Pexels License](https://www.pexels.com/license/)
- **Monterey Jack**: [photo on Pexels](https://www.pexels.com/photo/close-up-shot-of-a-person-holding-grated-cheese-6223125/), [Pexels License](https://www.pexels.com/license/)
- **Feta**: [“Tasty Mediterranean Salad”](https://www.flickr.com/photos/125008237@N07/52469736500) by [Musicaloris](https://www.flickr.com/photos/125008237@N07) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Jalapeños**: [“Making chilli and apple jelly”](https://www.flickr.com/photos/95142644@N00/51656700012) by [Ruth and Dave](https://www.flickr.com/photos/95142644@N00) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Black beans**: [photo on Pexels](https://www.pexels.com/photo/close-up-shot-of-black-beans-7772002/), [Pexels License](https://www.pexels.com/license/)
- **Olives**: [photo on Pexels](https://www.pexels.com/photo/a-close-up-shot-of-fresh-olives-4109908/), [Pexels License](https://www.pexels.com/license/)
- **Dried cranberries**: [“Dried cranberries”](https://www.flickr.com/photos/198613871@N06/53469575613) by [2508256625](https://www.flickr.com/photos/198613871@N06) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Avocado**: [“Avocado Slices”](https://www.rawpixel.com/image/6074447/avocado-slices) on rawpixel, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- **Spinach**: [photo on Pexels](https://www.pexels.com/photo/bowl-of-spinach-2325843/), [Pexels License](https://www.pexels.com/license/)
- **Beets**: [“roast beetroot cylindra”](https://www.flickr.com/photos/16176711@N02/53958875751) by [conall..](https://www.flickr.com/photos/16176711@N02) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Guacamole**: [photo on Pexels](https://www.pexels.com/photo/a-flatlay-of-chips-beside-a-bowl-of-guacamole-7227467/), [Pexels License](https://www.pexels.com/license/)
- **Fries**: [“French fries and rosé”](https://www.flickr.com/photos/7633518@N08/52327287679) by [sarahstierch](https://www.flickr.com/photos/7633518@N08) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Chocolate mousse**: [“ridiculously simple mousse”](https://www.flickr.com/photos/10953991@N00/493677329) by [Crystl](https://www.flickr.com/photos/10953991@N00) on Flickr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
- **Raspberry delight**: [photo on Pexels](https://www.pexels.com/photo/raspberries-on-top-of-a-cake-3850977/), [Pexels License](https://www.pexels.com/license/)
- **Tiramisu**: [photo on Pexels](https://www.pexels.com/photo/close-up-shot-of-tiramisu-cake-14766327/), [Pexels License](https://www.pexels.com/license/)
- **Soft drink**: [photo on Pexels](https://www.pexels.com/photo/a-glass-of-fizzy-drink-11477545/), [Pexels License](https://www.pexels.com/license/)
- **Iced tea**: [photo on Pexels](https://www.pexels.com/photo/macro-photography-of-clear-drinking-glass-with-lemon-fruit-and-black-straw-1194030/), [Pexels License](https://www.pexels.com/license/)
- **Sparkling water**: [photo on Pexels](https://www.pexels.com/photo/a-close-up-shot-of-a-glass-of-water-with-ice-12987480/), [Pexels License](https://www.pexels.com/license/)

## Fonts

[Bricolage Grotesque](https://github.com/ateliertriay/bricolage) and
[Figtree](https://github.com/erikdkennedy/figtree), both under the
[SIL Open Font License 1.1](https://openfontlicense.org), served from
`assets/fonts/`.
