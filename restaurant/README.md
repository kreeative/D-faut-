# Basil & Bloom — restaurant ordering web app

A single-restaurant ordering app built from the frosted-glass food app concept:
soft pastel light, glass cards, plates that float out of their cards and black
pill buttons. Guests browse the menu, customise dishes, pick dine in, pickup or
delivery, check out and follow their order live.

Built with **vanilla HTML, CSS and JavaScript**. There are no frameworks and no
build step, like the rest of this repo.

## Run it

It's a static site. Serve the `restaurant/` folder with any web server:

```bash
cd restaurant
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` straight from disk works too.

## What's inside

- **Menu**: category chips, search, a "Chef's pick" feature card, favorites,
  "in your cart" badges and an open/closed status in the restaurant's time zone.
- **Dish detail**: large plate with floating garnish, prep time, dietary tags,
  option groups (single choice or "up to N" extras with prices), special
  instructions, quantity and a live total.
- **Cart**: quantity steppers, dine in / pickup / delivery, table number,
  delivery minimum and free-delivery threshold, promo codes, tax and total.
- **Checkout**: validated contact details, ASAP or scheduled time slots (only
  within opening hours), and card or cash paid on collection. No card details
  are collected.
- **Order tracking**: progress ring, step timeline, ETA, order history and
  one-tap reorder. You also get a notification when an order changes stage.
- **Layout**: on phones it's one column with full-screen sheets. On desktop
  (from 1024px) it shows two glass panels side by side, as in the reference
  shot, with the order panel always visible.
- Light and dark themes, keyboard and screen-reader support, and reduced-motion
  support. Browser back and forward work through hash routes such as
  `#/dish/flat-white`, `#/cart` and `#/orders`.

## Make it your restaurant

Everything a restaurant changes lives in **`js/config.js`**:

| Setting | What it controls |
| --- | --- |
| `name`, `headline`, `tagline`, `about` | Branding and copy |
| `address`, `phone`, `email` | Contact block and the info drawer |
| `timeZone`, `locale`, `currency` | Opening status, time slots and price formatting |
| `hours` | Opening hours per weekday (`0` = Sunday). Several ranges per day are allowed |
| `orderTypes` | Enable dine in, pickup and delivery. Prep times, delivery fee, free-delivery threshold, minimum order, number of tables |
| `taxRate`, `promoCodes` | Tax line and discount codes (`percent` or free `delivery`) |
| `categories`, `dishes` | The menu. Each dish has a price, description, prep minutes, kcal, tags, allergens and option groups |

Dish images are looked up at `assets/dishes/<dish-id>.webp`. Set `image` on a dish
to use another file. Photos work best as top-down shots cut out on a transparent
background, about 800×800px.

### Table QR codes

Link each table's QR code to `…/restaurant/?table=12`. The app switches to dine-in
and fills in the table number.

## Connecting a real kitchen

The app runs in **demo mode** (`demo: true` in the config). Orders are saved in
the guest's browser, and their status moves along by itself so you can see the
tracker work. To take real orders:

1. Send the order from `placeOrder()` in `js/store.js` to your backend or POS.
2. Read the order status from your backend in `orderProgress()`, which today
   derives it from timestamps.
3. Set `demo: false`.

Online payment (Stripe, Square, …) would go in the checkout step. The app
deliberately never asks for card details in the page itself.

## Illustrations

The dish and garnish artwork is generated from code in `tools/illustrations/`
(top-down plates, bowls and glasses drawn as SVG, then exported to transparent
WebP). To tweak a dish and re-export:

```bash
npm i -D playwright && npx playwright install chromium
node tools/illustrations/export.cjs          # or: … export.cjs smash-burger --svg
```

## Structure

```
restaurant/
  index.html              app shell
  css/app.css             tokens (light + dark), layout, components, motion
  js/config.js            restaurant settings + menu  ← edit this
  js/icons.js             line icon set
  js/store.js             cart, pricing (in cents), hours, slots, orders, storage
  js/views.js             HTML templates for every screen
  js/app.js               routing, events, panels, animations
  assets/dishes/          dish illustrations (WebP)
  assets/garnish/         floating garnish for the detail view
  tools/illustrations/    generator for the artwork
```
