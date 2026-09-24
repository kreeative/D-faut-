"use strict";
/* Small floating garnish pieces for the dish detail screen (viewBox 240). */
const { TAU, f, Pic, smooth, blobPts, g, spec } = require("./lib.cjs");
const P = require("./parts.cjs");

const S = 240, C = 120;
const mk = (name, seed, draw) => () => { const p = new Pic("gn-" + name, { size: S, seed }); p.add(draw(p)); return p; };

module.exports = {
  spinach: mk("spinach", 3, (p) => P.spinach(p, C - 5, C + 95, 1.35, 12, { sh: [4, 8, 6, 0.3] })),
  basil: mk("basil", 5, (p) => P.basil(p, C, C + 88, 1.9, -8, { sh: [4, 8, 6, 0.3] })),
  mint: mk("mint", 7, (p) => P.mint(p, C, C + 80, 2.2, 10, { sh: [4, 8, 6, 0.3] })),
  sage: mk("sage", 9, (p) => P.sage(p, C, C + 95, 1.65, 18, { sh: [4, 8, 6, 0.3] })),
  blueberry: mk("blueberry", 11, (p) => P.blueberry(p, C, C, 70)),
  raspberry: mk("raspberry", 13, (p) => P.raspberry(p, C, C, 80)),
  tomato: mk("tomato", 15, (p) => P.cherryTomato(p, C, C, 78, { a: 0.4 })),
  lemon: mk("lemon", 17, (p) => P.lemonWheel(p, C, C, 100)),
  lime: mk("lime", 19, (p) => P.lemonWheel(p, C, C, 96, { lime: true })),
  strawberry: mk("strawberry", 21, (p) => P.strawberryHalf(p, C, C + 5, 2.6, 15)),
  banana: mk("banana", 23, (p) => P.bananaSlice(p, C, C, 80)),
  bean: mk("bean", 25, (p) => {
    const gr = p.radial([[0, "#8a5a36"], [0.6, "#5a3418"], [1, "#321a08"]], { cx: 0.38, cy: 0.35, r: 0.7 });
    let s = `<ellipse rx="62" ry="84" fill="url(#${gr})"/>`;
    s += `<path d="M-6 -74C22 -30 -24 30 6 74" stroke="#1e0e04" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    s += spec(p, -26, -34, 16, 30, 15, 0.35);
    return g(s, { t: `translate(${C} ${C}) rotate(28)`, filter: p.ds(4, 8, 6, 0.35) });
  }),
  chili: mk("chili", 27, (p) => {
    const gr = p.linear([[0, "#ff5a3a"], [0.5, "#d8261a"], [1, "#9a120c"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
    let s = `<path d="M-20 -70C30 -80 42 -30 30 20C20 60 -10 90 -40 98C-20 60 -30 20 -34 -20C-36 -45 -32 -62 -20 -70Z" fill="url(#${gr})"/>`;
    s += `<path d="M-24 -72C-30 -88 -18 -104 -2 -100C-8 -92 -10 -82 -8 -72Z" fill="#3f8a2e"/><path d="M-10 -96C-4 -112 8 -118 18 -116" stroke="#3f7a2a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M-18 -50C8 -52 16 -20 6 20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.45"/>`;
    return g(s, { t: `translate(${C} ${C}) rotate(-20)`, filter: p.ds(4, 8, 6, 0.35) });
  }),
  ice: mk("ice", 29, (p) => P.iceCube(p, C, C, 130, 18, "#e8f4ff")),
};
