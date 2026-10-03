# The Bakery — brand site and ordering app

> **The Bakery is a brand concept by [Kreeative](https://kreeative.xyz).** There
> is no shop yet. Orders on this site are a demo: they stay in your browser,
> nothing is baked or sent and nothing is charged. The address, phone number and
> opening hours are placeholders.

The website for The Bakery's brand identity: pink #EE7AAF and cream #FEFADC,
a wordmark whose B is a baguette and whose e is a cupcake, a cupcake-headed
mascot and a hand-drawn pattern of bakes. It has two parts:

- **The brand page** (`index.html`): the "Might be scrumptious!" poster as a
  hero, today's bakes, how the name is drawn, the packaging and the hours.
- **The ordering app** (`order/`): menu, item pages with options, a bag,
  pickup or delivery, checkout and order tracking. It is built from the same
  base as [Tabouret](../restaurant/), restyled in the brand.

Built with **vanilla HTML, CSS and JavaScript**: no frameworks and no build
step, like the rest of this repo.

## Run it

It's a static site. Serve the `the-bakery/` folder with any web server:

```bash
cd the-bakery
python3 -m http.server 8000
# open http://localhost:8000 (brand page) or http://localhost:8000/order/ (ordering)
```

## Change things

- **Menu, prices, hours, fees and promo codes** live in `order/js/config.js`.
  The brand page reads the same file, so its "Fresh out of the oven" grid and
  its hours table update with it. Pick which items the grid shows in
  `PICKS` at the top of `js/site.js`.
- **Photos**: each item uses `assets/menu/<id>-800.webp` and a 400px copy.
  Drop in new cut-outs with the same names (transparent WebP, square) or set
  `image` and `thumb` on the item in `config.js`.
- **Colours** are tokens at the top of `css/site.css` and `order/css/app.css`,
  for light and dark mode. The pink surfaces keep cream and raspberry text in
  both themes.
- **Brand marks** are SVGs in `assets/marks/`, recoloured with CSS masks, so
  one file serves every colour:

  | File | What it is |
  | --- | --- |
  | `wordmark.svg` | The full wordmark. `wordmark-letters.svg` and `wordmark-accents.svg` split it so the B and the e can take a second colour |
  | `monogram.svg` | The baguette B, also the favicon |
  | `cupcake-e.svg` | The cupcake e on its own |
  | `scrumptious.svg` | The "Might be scrumptious!" lettering from the croissant sleeve |
  | `mascot.svg` | The mascot. The sleeve photo cuts off its left hand, so that hand is the right one mirrored |
  | `wheat.svg` | The ear of wheat |
  | `pattern.svg` | A seamless tile of six doodles from the pattern (B, cookies, toast, wheat, croissant, pretzel) on a half-drop grid |

  They were traced from the identity images with potrace.

## Type

The lettering on the packaging is custom, so the logo and the "Might be
scrumptious!" line are the traced artwork itself. Headings use
**Big Shoulders Display** (800 and 900), the closest open typeface in
proportion, and text uses **Outfit**. Both are under the SIL Open Font License
and self-hosted in `assets/fonts/`. If The Bakery's lettering comes from a
typeface, swap it in with the `--display` token.

## Files

| Path | What it holds |
| --- | --- |
| `index.html`, `css/site.css`, `js/site.js` | The brand page |
| `order/js/config.js` | The bakery: menu, options, prices, hours, delivery, promo codes |
| `order/js/store.js` | State saved in the browser: bag, favorites, orders, profile, opening hours and totals |
| `order/js/views.js` | Every screen of the ordering app, as HTML strings |
| `order/js/app.js` | Routing, events, the side panel and sheets, toasts and the tracker clock |
| `order/js/icons.js` | Line icons, including the croissant, cookie, loaf, pretzel and cupcake categories |
| `order/css/app.css` | The ordering app's styles |
| `assets/menu/` | Cut-out photos of the 15 items |
| `assets/brand/` | The croissant sleeve (cut out), the bag row and the cookie photo from the identity |
| `assets/credits.js` | Photo credits shown in the brand page footer |
| `assets/og.jpg` | The link preview image |

## Photos

Every menu photo is a real photo with a free licence, cut out of its background
(with rembg) and cropped. The baguette is turned on the diagonal. The hot
chocolate's white handle did not survive the cut-out, so the right side of the
mug is its left side mirrored. Packaging and lettering are The Bakery's own
artwork.

| Item | Photo | Licence |
| --- | --- | --- |
| Butter Croissant | [Croissant Isolated On White Background](https://www.flickr.com/photos/198895458@N04/53097224506) by [personalgraphic.official](https://www.flickr.com/photos/198895458@N04), on Flickr | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Almond Croissant | [Almond Croissant](https://www.flickr.com/photos/25802865@N08/53378640779) by [chooyutshing](https://www.flickr.com/photos/25802865@N08), on Flickr | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| Pain au Chocolat | [Pain au chocolat](https://www.flickr.com/photos/7831824@N04/53967027820) by [Bex.Walton](https://www.flickr.com/photos/7831824@N04), on Flickr | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| Chocolate Chunk Cookie | [Photo 301972 on Pexels](https://www.pexels.com/photo/301972/) | [Pexels License](https://www.pexels.com/license/) |
| Country Sourdough | [Photo 7541727 on Pexels](https://www.pexels.com/photo/7541727/) | [Pexels License](https://www.pexels.com/license/) |
| Cinnamon Morning Bun | [Photo 9443534 on Pexels](https://www.pexels.com/photo/9443534/) | [Pexels License](https://www.pexels.com/license/) |
| Pink Vanilla Cupcake | [Photo 853005 on Pexels](https://www.pexels.com/photo/853005/) | [Pexels License](https://www.pexels.com/license/) |
| Iced Latte | [macro view cold latte glass](https://www.rawpixel.com/image/3283433/free-photo-image-coffee-iced-drink), on rawpixel | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Strawberry Shake | [Strawberry smoothie](https://www.rawpixel.com/image/6037176/photo-image-public-domain-fruit-summer), on rawpixel | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Double Chocolate Cookie | [Photo](https://www.rawpixel.com/image/6066369/free-public-domain-cc0-photo), on rawpixel | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Classic Baguette | [Photo 5588987 on Pexels](https://www.pexels.com/photo/5588987/) | [Pexels License](https://www.pexels.com/license/) |
| Honey Wholemeal Loaf | [Free close single toasted bun](https://www.rawpixel.com/image/5902268/photo-image-public-domain-food-free), on rawpixel | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Salted Butter Pretzel | [Auntie Anne's baked frozen pretzel](https://www.flickr.com/photos/7633518@N08/54332281263) by [sarahstierch](https://www.flickr.com/photos/7633518@N08), on Flickr | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| French Macarons | [Cookies Dessert](https://stocksnap.io/photo/cookies-dessert-SOYZBHL7J3) by [Foodie Girl](https://stocksnap.io/author/121423), on StockSnap | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Hot Chocolate | [Holiday Hot](https://stocksnap.io/photo/holiday-hot-EBHBEJ2ZHM) by [Travel Photographer](https://stocksnap.io), on StockSnap | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

The photos, fonts and traced marks were prepared by a GitHub Actions workflow,
because the development sandbox could not reach those hosts. The workflow and
its source files were removed once the assets were in place; they are in the
git history ("Prepare The Bakery fonts, marks and photos").
