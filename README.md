# VANTÉ — Luxury Brand Website

A dark, elegant, single-page luxury marque site inspired by high-end automotive
brands (Porsche-style). Built with **modern CSS and vanilla JavaScript** — no
frameworks, no build step.

## Features

- **Full-screen hero** with looping background video (`<video>`) and a graceful
  SVG poster fallback.
- **Bold sans-serif typography** — Archivo (display) + Inter (body).
- **Smooth scroll animations** — `IntersectionObserver` reveals with staggering,
  animated stat counters, hero parallax, and 3D card tilt on hover.
- **Dark / elegant palette** — near-black base with a champagne-gold accent.
- **Product showcase grid** — responsive auto-fit model cards.
- **Fully responsive** — mobile slide-in menu, fluid `clamp()` type, and a
  `prefers-reduced-motion` path that disables animation.

## Run it

It's a static site — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Add your own hero video

Drop an MP4 at `assets/hero.mp4` (1080p, muted, looping works best). Until then
the SVG poster (`assets/hero-poster.svg`) is shown. For best performance keep the
video short (8–15s) and compressed.

## Structure

```
index.html          # markup
css/style.css       # theme, layout, responsive, animations
js/main.js          # nav, scroll progress, reveals, counters, tilt, form
assets/             # hero poster (add hero.mp4 here)
```

## Customizing

- **Colors / fonts** — CSS custom properties at the top of `css/style.css`
  (`:root`).
- **Brand name** — replace `VANTÉ` throughout `index.html`.
- **Models** — edit the `.card` articles in the `#models` section.
