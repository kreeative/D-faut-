# Guillemot · Maison de Mer

A luxury restaurant website for Guillemot, a fictional coastal fine-dining restaurant. The
layout follows the "Veloria Eve" restaurant concept the owner shared: a candlelit hero with
the name centred in the navigation, a signature plate breaking out of the hero, and a
two-column spread of cream and night panels below it.

It is a static site with no build step: `index.html`, `css/site.css`, `js/site.js` and
`assets/`. To preview it, serve the folder, for example `python3 -m http.server` inside
`guillemot/`, and open http://localhost:8000.

## What is on the page

- **Hero**: four photographs of the rooms crossfade every seven seconds, with a progress
  line under each dot. The slideshow stops when the hero is off screen or the tab is hidden,
  and does not advance at all under reduced motion. The plate turns slowly as the page
  scrolls.
- **About**: the chef's line and a three-photo mosaic.
- **Menu**: "From the Sea" and "Sweet Endings". On a phone the seafood row becomes a row you
  swipe, and the desserts stack.
- **Experience**: the seven-course Tide Menu, with the courses in a disclosure.
- **Reserve**: date, time, guests, name, email and requests. It offers dinner from 6:00 to
  9:30 PM from Wednesday to Saturday, and lunch from 12:00 to 2:30 PM on Sunday. It refuses
  Mondays, Tuesdays and dates more than thirty days ahead. Nothing is sent: the site says
  so under the button and in the confirmation.
- **Visit**: address, hours, contact and dress code. The address, the `555` number and the
  `.example` email are fictional.

Without JavaScript every section is still visible and the first photograph shows.

## Type

[Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) and
[Manrope](https://fonts.google.com/specimen/Manrope), both under the SIL Open Font
License, are self-hosted from `assets/fonts/`.

## Photos

All photographs are from [Pexels](https://www.pexels.com/), used under the
[Pexels License](https://www.pexels.com/license/), which allows free use without
attribution. They are credited here anyway. Each one is cropped for its place on the page.
The plate is cut out as a circle with a transparent surround.

| On the page | Source photo |
| --- | --- |
| Hero, the candlelit dining room | [A dining table with candles lit and a chandelier](https://www.pexels.com/photo/a-dining-table-with-candles-lit-and-a-chandelier-28059309/) |
| Hero, the salon at nightfall | [Wine glasses on table tops](https://www.pexels.com/photo/wine-glasses-on-table-tops-941861/) |
| Hero, the lantern room | [Restaurant interior](https://www.pexels.com/photo/restaurant-interior-776538/) |
| Hero, the cellar lounge | [Interior design of a bar and restaurant](https://www.pexels.com/photo/interior-design-of-a-bar-and-restaurant-5863513/) |
| Signature plate | [Risotto with seafood on plate](https://www.pexels.com/photo/risotto-with-seafood-on-plate-23627779/) |
| Mosaic, line-caught bass | [Close-up of a dish](https://www.pexels.com/photo/close-up-of-a-dish-12814607/) |
| Mosaic, the chef | [Chef in a kitchen in black and white](https://www.pexels.com/photo/chef-in-a-kitchen-in-black-and-white-19664661/) |
| Mosaic, the pass | [Person holding bowl](https://www.pexels.com/photo/person-holding-bowl-2403392/) |
| Hand-dived scallop | [Seafood dish with bivalves](https://www.pexels.com/photo/seafood-dish-with-bivalves-4871121/) |
| Crisp-skin turbot | [Photo of a fish dish](https://www.pexels.com/photo/photo-of-foie-gras-16064369/) (listed on Pexels as foie gras; it is a white fish fillet) |
| Blue lobster | [Hands holding a plate with lobster and vegetables](https://www.pexels.com/photo/hands-holding-a-plate-with-lobster-and-vegetables-24246107/) |
| Burnt-honey custard | [Gourmet dessert plate with rich chocolate sauce](https://www.pexels.com/photo/gourmet-dessert-plate-with-rich-chocolate-sauce-28561583/) |
| Smoked Old Fashioned | [Elegant Old Fashioned cocktail on bar counter](https://www.pexels.com/photo/elegant-old-fashioned-cocktail-on-bar-counter-29707925/) |
| The Tide Menu table | [A table setting with candles and place settings](https://www.pexels.com/photo/a-table-setting-with-candles-and-place-settings-28059316/) |

`assets/og.jpg`, the sharing image, is a rendering of the site's own hero.
