# Tabouret — restaurant ordering web app

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
- **Dish detail**: a large top-down photo of the dish that spins and shrinks
  into the header as you scroll the details, prep time, dietary tags,
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
  shot. The menu and favorites keep the dish or your order beside them, with
  the plate hanging over the panel's edge. Orders and profile use the full
  width until you open a dish, the cart or an order.
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
| `taxRate`, `promoCodes` | Tax line and discount codes (`percent` or free `delivery`). The cart suggests the first `percent` code to new guests |
| `categories`, `dishes` | The menu. Each dish has a price, description, prep minutes, kcal, tags, allergens and option groups |

Each dish's photo is read from `assets/dishes/<dish-id>.webp`. A 400px copy in
`assets/dishes/thumbs/` is used for the menu grid, cart and order history. Set
`image` (and optionally `thumb`) on a dish to use other files.

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

## Photos

The dish photos are free stock photos from [Pexels](https://www.pexels.com/),
used under the [Pexels License](https://www.pexels.com/license/). They are free to
use commercially and need no attribution. Each source page below names its
photographer. Each photo is cropped to its plate, bowl or cup and cut out as a
circle on a transparent background.

| Dish | Source photo |
| --- | --- |
| Bacon & Egg Skillet | [A frying pan with bacon and eggs](https://www.pexels.com/photo/a-frying-pan-with-bacon-and-eggs-13376483/) |
| Fig & Berry Pancakes | [Close-up photo of food on plate](https://www.pexels.com/photo/close-up-photo-of-food-on-plate-8366817/) |
| Yogurt & Granola Bowl | [Strawberries and blueberries on white ceramic plate](https://www.pexels.com/photo/strawberries-and-blueberries-on-white-ceramic-plate-8892364/) |
| Garden Buddha Bowl | [Flat lay photography of vegetable salad on plate](https://www.pexels.com/photo/flat-lay-photography-of-vegetable-salad-on-plate-1640777/) |
| Prawn Poke Bowl | [Overhead shot of a poke bowl with chopsticks](https://www.pexels.com/photo/overhead-shot-of-a-poke-bowl-with-chopsticks-4828145/) |
| Açaí Bowl | [Close-up of an açaí bowl](https://www.pexels.com/photo/close-up-of-an-acai-bowl-14167805/) |
| Tonkotsu Ramen | [Top view of a bowl of ramen](https://www.pexels.com/photo/top-view-of-a-bowl-of-ramen-20802552/) |
| Lamb Kofta Skewers | [Kebabs on top of green vegetables and sliced tomatoes](https://www.pexels.com/photo/kebabs-on-top-of-green-vegetables-and-sliced-tomatoes-6419704/) |
| Cheeseburger Duo | [Burgers on white ceramic plate](https://www.pexels.com/photo/burgers-on-white-ceramic-plate-4109136/) |
| Chocolate Truffle Cake | [Top view of a piece of chocolate cake on a plate](https://www.pexels.com/photo/top-view-of-a-piece-of-chocolate-cake-on-a-plate-24247232/) |
| Chocolate Sphere | [Overhead shot of dessert on a plate](https://www.pexels.com/photo/overhead-shot-of-dessert-on-a-plate-12622394/) |
| Matcha Latte | [A matcha latte and a fruit juice on a table](https://www.pexels.com/photo/a-matcha-latte-and-a-fruit-juice-on-a-table-12201275/) |
| Mint Lemonade | [Glass of fresh cocktail and pieces of lemon](https://www.pexels.com/photo/glass-of-fresh-cocktail-and-pieces-of-lemon-4021872/) |
| Flat White | [Coffee cup with latte art froth on white surface](https://www.pexels.com/photo/coffee-cup-with-latte-art-froth-on-white-surface-544113/) |

A real restaurant should swap these for photos of its own dishes, so guests get
what they see. To match the look, shoot each dish from directly above. Crop a
square around the plate, cut it out as a circle on a transparent background, and
save it as an 800×800 WebP. Save a 400×400 copy in `thumbs/`.

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
  assets/dishes/          dish photos, cut out as circles (800px WebP)
  assets/dishes/thumbs/   400px copies for the menu grid, cart and orders
```
