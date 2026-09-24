"use strict";
/* Vessels and food parts. Every function returns an SVG string. */
const { TAU, f, rot, smooth, smoothOpen, blobPts, blob, roundRect, chunkPts, softSquarePts, scatter, g, clip, spec } = require("./lib.cjs");

/* ============================================================
   Vessels
   ============================================================ */

/* Speckled stoneware bowl seen from above.
   Returns { under, over, clipId, ri } — draw food between under and over. */
function stonewareBowl(p, cx, cy, R, {
  glaze = ["#3a5688", "#1b2a4a", "#0e1628"],
  speck = [226, 234, 246],
  lip = 0.955,
  ri = 0.8,
} = {}) {
  const Ri = R * ri;
  const body = p.radial([[0, glaze[0]], [0.55, glaze[1]], [1, glaze[2]]], { cx: 0.38, cy: 0.34, r: 0.75 });
  const wallShade = p.radial([[0, "#000", 0], [0.78, "#000", 0], [0.9, "#000", 0.28], [1, "#000", 0.05]], { cx: 0.5, cy: 0.5, r: 0.5 });
  const speckF = p.noise({ freq: 0.42, oct: 1, rgb: speck, gain: 9, bias: -6.3, seed: p.ri(1, 99) });
  const speckF2 = p.noise({ freq: 0.9, oct: 1, rgb: [150, 175, 215], gain: 7, bias: -4.6, seed: p.ri(1, 99) });
  let under = "";
  under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${body})"/>`;
  under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" filter="url(#${speckF})"/>`;
  under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" opacity="0.7" filter="url(#${speckF2})"/>`;
  // bigger hand-placed speckles for character
  let dots = "";
  for (let i = 0; i < 150; i++) {
    const a = p.r(0, TAU), d = p.r(Ri * 0.98, R * 0.985);
    const rr = p.r(0.8, 2.8);
    dots += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(rr)}" fill="${p.pick(["#e8eef8", "#c9d6ea", "#ffffff", "#9fb4d6"])}" opacity="${f(p.r(0.45, 0.95) * 10) / 10}"/>`;
  }
  under += dots;
  // lip: glossy ring highlight top-left, shade bottom-right
  const lipHi = p.linear([[0, "#fff", 0.55], [0.35, "#fff", 0.08], [0.6, "#fff", 0], [1, "#000", 0.25]], { x1: 0.15, y1: 0.1, x2: 0.85, y2: 0.9 });
  under += `<circle cx="${cx}" cy="${cy}" r="${f(R * (lip + 1) / 2)}" fill="none" stroke="url(#${lipHi})" stroke-width="${f(R * (1 - lip))}"/>`;
  // inner wall: top-left in shadow, bottom-right catching light
  const wall = p.linear([[0, "#000", 0.45], [0.5, "#000", 0.1], [1, "#fff", 0.12]], { x1: 0.2, y1: 0.15, x2: 0.8, y2: 0.85 });
  under += `<circle cx="${cx}" cy="${cy}" r="${f((R * lip + Ri) / 2)}" fill="none" stroke="url(#${wall})" stroke-width="${f(R * lip - Ri)}"/>`;
  under += `<circle cx="${cx}" cy="${cy}" r="${f(R * lip)}" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="2"/>`;
  const clipId = clip(p, `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}"/>`);
  // over: inner shadow cast by the rim onto the food
  const innerSh = p.radial([[0, "#000", 0], [0.82, "#000", 0], [0.95, "#1a0d05", 0.3], [1, "#1a0d05", 0.55]], { cx: 0.47, cy: 0.46, r: 0.53 });
  let over = `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="url(#${innerSh})"/>`;
  over += `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="none" stroke="#0a0f1c" stroke-opacity="0.35" stroke-width="3"/>`;
  return { under, over, clipId, ri: Ri };
}

/* Flat plate. kind: "matte" (charcoal), "white", "wood" (wood rim + charcoal well) */
function plate(p, cx, cy, R, { kind = "white", well = 0.74, tint } = {}) {
  const Rw = R * well;
  let under = "";
  if (kind === "wood") {
    const wood = p.radial([[0, "#c98b4f"], [0.7, "#b0733a"], [0.93, "#8e5626"], [1, "#6d3e18"]], { cx: 0.42, cy: 0.4, r: 0.62 });
    under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${wood})"/>`;
    const grain = p.noise({ freq: "0.004 0.09", oct: 3, rgb: [70, 36, 12], gain: 2.4, bias: -0.95, seed: p.ri(1, 99) });
    under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" opacity="0.55" filter="url(#${grain})"/>`;
    const grain2 = p.noise({ freq: "0.003 0.03", oct: 2, rgb: [240, 190, 130], gain: 2, bias: -1.0, seed: p.ri(1, 99) });
    under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" opacity="0.35" filter="url(#${grain2})"/>`;
    const rimHi = p.linear([[0, "#fff", 0.35], [0.4, "#fff", 0], [1, "#000", 0.3]], { x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9 });
    under += `<circle cx="${cx}" cy="${cy}" r="${f(R - 5)}" fill="none" stroke="url(#${rimHi})" stroke-width="10"/>`;
    // charcoal inner plate
    const inner = p.radial([[0, "#34363a"], [0.8, "#1d1e21"], [1, "#101113"]], { cx: 0.42, cy: 0.4, r: 0.65 });
    under += `<circle cx="${cx}" cy="${cy}" r="${f(Rw + 3)}" fill="#000" opacity="0.35" filter="url(#${p.blur(6)})"/>`;
    under += `<circle cx="${cx}" cy="${cy}" r="${f(Rw)}" fill="url(#${inner})"/>`;
    const sp = p.noise({ freq: 0.7, oct: 1, rgb: [255, 255, 255], gain: 5, bias: -3.6, seed: p.ri(1, 99) });
    under += `<circle cx="${cx}" cy="${cy}" r="${f(Rw)}" fill="#000" opacity="0.25" filter="url(#${sp})"/>`;
  } else {
    const pal = kind === "matte"
      ? { rim: ["#3a3c40", "#26282b", "#141517"], well: ["#2c2e31", "#1b1c1f"], hi: 0.18, sh: 0.5 }
      : { rim: tint || ["#ffffff", "#f4f1ec", "#dcd6cc"], well: ["#fbfaf7", "#efebe4"], hi: 0.9, sh: 0.18 };
    const rim = p.radial([[0, pal.rim[0]], [0.6, pal.rim[1]], [1, pal.rim[2]]], { cx: 0.4, cy: 0.38, r: 0.7 });
    under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${rim})"/>`;
    if (kind === "matte") {
      const sp = p.noise({ freq: 0.75, oct: 1, rgb: [255, 255, 255], gain: 5, bias: -3.5, seed: p.ri(1, 99) });
      under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" opacity="0.28" filter="url(#${sp})"/>`;
    }
    const rimHi = p.linear([[0, "#fff", pal.hi], [0.45, "#fff", 0], [1, "#000", pal.sh * 0.6]], { x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9 });
    under += `<circle cx="${cx}" cy="${cy}" r="${f(R - 4)}" fill="none" stroke="url(#${rimHi})" stroke-width="8"/>`;
    // step down into the well: shadow top-left, highlight bottom-right
    const step = p.linear([[0, "#000", pal.sh], [0.5, "#000", 0.02], [1, "#fff", pal.hi * 0.7]], { x1: 0.15, y1: 0.15, x2: 0.85, y2: 0.85 });
    const well = p.radial([[0, pal.well[0]], [1, pal.well[1]]], { cx: 0.45, cy: 0.42, r: 0.65 });
    under += `<circle cx="${cx}" cy="${cy}" r="${f(Rw)}" fill="url(#${well})"/>`;
    under += `<circle cx="${cx}" cy="${cy}" r="${f(Rw + 5)}" fill="none" stroke="url(#${step})" stroke-width="12"/>`;
  }
  return { under, over: "", ri: Rw, clipId: clip(p, `<circle cx="${cx}" cy="${cy}" r="${f(R)}"/>`) };
}

/* Glass tumbler from above. Returns { under, over, clipId, ri } */
function glass(p, cx, cy, R, { liquid = ["#f7e27a", "#e9c64a"], fill = 0.9 } = {}) {
  const Ri = R * fill;
  let under = "";
  under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ffffff" opacity="0.35"/>`;
  const liq = p.radial([[0, liquid[0]], [0.75, liquid[1]], [1, liquid[2] || liquid[1]]], { cx: 0.44, cy: 0.42, r: 0.6 });
  under += `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="url(#${liq})"/>`;
  const clipId = clip(p, `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}"/>`);
  const edge = p.radial([[0, "#000", 0], [0.86, "#000", 0], [1, "#000", 0.22]], { cx: 0.5, cy: 0.5, r: 0.5 });
  let over = `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="url(#${edge})"/>`;
  // glass wall + rim
  const rim = p.linear([[0, "#fff", 0.95], [0.3, "#fff", 0.35], [0.55, "#fff", 0.15], [0.8, "#fff", 0.55], [1, "#fff", 0.9]], { x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9 });
  over += `<circle cx="${cx}" cy="${cy}" r="${f((R + Ri) / 2)}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="${f(R - Ri)}"/>`;
  over += `<circle cx="${cx}" cy="${cy}" r="${f(R - 3)}" fill="none" stroke="url(#${rim})" stroke-width="6"/>`;
  over += `<circle cx="${cx}" cy="${cy}" r="${f(Ri + 2)}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="2.5"/>`;
  over += `<path d="M${f(cx - R * 0.72)} ${f(cy - R * 0.5)} A${R * 0.88} ${R * 0.88} 0 0 1 ${f(cx - R * 0.2)} ${f(cy - R * 0.86)}" stroke="#fff" stroke-width="${f(R * 0.05)}" stroke-linecap="round" fill="none" opacity="0.75" filter="url(#${p.blur(3)})"/>`;
  return { under, over, clipId, ri: Ri };
}

/* ============================================================
   Leaves & herbs
   ============================================================ */

/* Leaf outline pointing up (-y) from origin. */
function leafD(L, W, { bend = 0, round = 0.72, base = 0.12, serr = 0, p } = {}) {
  if (!serr) {
    return `M0 0C${f(W * 1.05)} ${f(-L * base)} ${f(W * 0.98 + bend * 0.5)} ${f(-L * round)} ${f(bend)} ${f(-L)}` +
      `C${f(-W * 0.98 + bend * 0.5)} ${f(-L * round)} ${f(-W * 1.05)} ${f(-L * base)} 0 0Z`;
  }
  // serrated: sample the smooth outline and add teeth
  const pts = [];
  const N = 26;
  const width = (t) => W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.9) * 1.05;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const tooth = i % 2 ? serr : 0;
    pts.push([bend * t * t + width(t) + tooth * (i > 1 && i < N - 1 ? 1 : 0), -L * t]);
  }
  for (let i = N - 1; i >= 1; i--) {
    const t = i / N;
    const tooth = i % 2 ? serr : 0;
    pts.push([bend * t * t - width(t) - tooth * (i > 1 && i < N - 1 ? 1 : 0), -L * t]);
  }
  return smoothOpen([[0, 0], ...pts, [0, 0]], 0.9) + "Z";
}

function leaf(p, x, y, { L = 80, W = 30, a = 0, bend = 0, col = ["#5fae47", "#2e7a2b"], vein = "#b5e09a", veins = 5, sh = [3, 5, 4, 0.3], stem = 0, serr = 0, gloss = 0.35, fold = 0.14, round, base } = {}) {
  const d = leafD(L, W, { bend, serr, round, base });
  const grad = p.linear([[0, col[0]], [1, col[1]]], { x1: 0.2, y1: 0.9, x2: 0.8, y2: 0.1 });
  let s = "";
  if (stem) s += `<path d="M0 0L${f(-bend * 0.05)} ${f(stem)}" stroke="${col[1]}" stroke-width="${f(Math.max(2, W * 0.13))}" stroke-linecap="round"/>`;
  s += `<path d="${d}" fill="url(#${grad})"/>`;
  // fold: one half a touch darker
  if (fold) {
    const half = `M0 0C${f(W * 1.05)} ${f(-L * 0.12)} ${f(W * 0.98 + bend * 0.5)} ${f(-L * 0.72)} ${f(bend)} ${f(-L)}Q${f(bend * 0.5)} ${f(-L * 0.5)} 0 0Z`;
    s += `<path d="${half}" fill="#0b2a08" opacity="${fold}"/>`;
  }
  // veins
  const vw = Math.max(1.1, W * 0.055);
  s += `<path d="M0 ${f(-L * 0.02)}Q${f(bend * 0.45)} ${f(-L * 0.5)} ${f(bend * 0.96)} ${f(-L * 0.95)}" stroke="${vein}" stroke-width="${f(vw * 1.3)}" fill="none" opacity="0.75" stroke-linecap="round"/>`;
  for (let i = 1; i <= veins; i++) {
    const t = i / (veins + 1);
    const yy = -L * t * 0.93;
    const xx = bend * t * t * 0.9;
    const ww = W * Math.sin(Math.PI * Math.pow(t, 0.85)) * 0.78;
    s += `<path d="M${f(xx)} ${f(yy)}Q${f(xx + ww * 0.55)} ${f(yy - L * 0.05)} ${f(xx + ww)} ${f(yy - L * 0.13)}M${f(xx)} ${f(yy)}Q${f(xx - ww * 0.55)} ${f(yy - L * 0.05)} ${f(xx - ww)} ${f(yy - L * 0.13)}" stroke="${vein}" stroke-width="${f(vw)}" fill="none" opacity="0.5" stroke-linecap="round"/>`;
  }
  if (gloss) {
    const gl = p.linear([[0, "#fff", gloss], [0.5, "#fff", 0], [1, "#fff", 0]], { x1: 0, y1: 0, x2: 1, y2: 0.6 });
    s += `<path d="${d}" fill="url(#${gl})"/>`;
  }
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: sh ? p.ds(...sh) : undefined });
}

const basil = (p, x, y, s = 1, a = 0, o = {}) =>
  leaf(p, x, y, { L: 92 * s, W: 34 * s, a, bend: p.pm(10 * s), col: ["#67b84a", "#2f7d2a"], vein: "#bfe6a4", veins: 5, gloss: 0.45, ...o });
const spinach = (p, x, y, s = 1, a = 0, o = {}) =>
  leaf(p, x, y, { L: 120 * s, W: 58 * s, a, bend: p.pm(12 * s), col: ["#4f9a3c", "#1f5a22"], vein: "#8fc97a", veins: 6, stem: 28 * s, gloss: 0.3, round: 0.68, ...o });
const sage = (p, x, y, s = 1, a = 0, o = {}) =>
  leaf(p, x, y, { L: 110 * s, W: 26 * s, a, bend: p.pm(8 * s), col: ["#9db393", "#657f5f"], vein: "#c9d8c0", veins: 7, gloss: 0.18, fold: 0.1, ...o });
const mint = (p, x, y, s = 1, a = 0, o = {}) =>
  leaf(p, x, y, { L: 70 * s, W: 34 * s, a, bend: p.pm(6 * s), col: ["#6fcf5a", "#2f8a36"], vein: "#c8f0b4", veins: 4, serr: 2.6 * s, gloss: 0.4, round: 0.66, ...o });
const arugula = (p, x, y, s = 1, a = 0, o = {}) =>
  leaf(p, x, y, { L: 90 * s, W: 20 * s, a, bend: p.pm(10 * s), col: ["#5c9e3e", "#2f6b27"], vein: "#a9d58f", veins: 4, serr: 6 * s, gloss: 0.25, ...o });

/* Frilly lettuce / greens leaf: a wavy blob with a pale midrib */
function lettuce(p, x, y, r, a = 0, { col = ["#8bcf5c", "#3f8f2e"], rib = "#d9f2c0", sh = [3, 5, 5, 0.32] } = {}) {
  const pts = blobPts(p, 0, 0, r, { n: 22, jit: 0.12, sx: 1.25, sy: 0.8, fine: 1.2 });
  const grad = p.radial([[0, col[0]], [1, col[1]]], { cx: 0.35, cy: 0.5, r: 0.8 });
  let s = `<path d="${smooth(pts)}" fill="url(#${grad})"/>`;
  s += `<path d="M${f(-r * 1.1)} ${f(r * 0.1)}Q${f(0)} ${f(-r * 0.2)} ${f(r * 1.05)} ${f(-r * 0.05)}" stroke="${rib}" stroke-width="${f(r * 0.1)}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  for (let i = 0; i < 4; i++) {
    const t = -0.7 + i * 0.45;
    s += `<path d="M${f(t * r)} ${f(-r * 0.08)}q${f(r * 0.2)} ${f(-r * 0.3)} ${f(r * 0.3)} ${f(-r * 0.55)}M${f(t * r)} ${f(-r * 0.05)}q${f(r * 0.15)} ${f(r * 0.3)} ${f(r * 0.3)} ${f(r * 0.5)}" stroke="${rib}" stroke-width="${f(r * 0.04)}" fill="none" opacity="0.45"/>`;
  }
  s += spec(p, -r * 0.3, -r * 0.3, r * 0.45, r * 0.15, -20, 0.25);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(...sh) });
}

/* Curly kale piece: a cluster of small frilly lobes */
function kale(p, x, y, r, a = 0) {
  let s = "";
  const col = p.pick([["#3f7d3a", "#1d4a22"], ["#4a8a3f", "#23522a"], ["#356f39", "#173f1f"]]);
  const grad = p.radial([[0, col[0]], [1, col[1]]], { cx: 0.4, cy: 0.4, r: 0.7 });
  for (let i = 0; i < 7; i++) {
    const aa = (i / 7) * TAU + p.pm(0.3), d = r * p.r(0.25, 0.55);
    s += `<path d="${smooth(blobPts(p, Math.cos(aa) * d, Math.sin(aa) * d, r * p.r(0.35, 0.5), { n: 16, jit: 0.22, fine: 1.8 }))}" fill="url(#${grad})"/>`;
  }
  s += `<path d="M${f(-r * 0.7)} ${f(r * 0.5)}Q0 0 ${f(r * 0.6)} ${f(-r * 0.6)}" stroke="#9cc58c" stroke-width="${f(r * 0.08)}" fill="none" opacity="0.7" stroke-linecap="round"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(2, 4, 4, 0.35) });
}

/* Parsley / microgreen sprig cluster */
function parsley(p, x, y, s = 1, a = 0) {
  let out = "";
  const col = ["#5aa640", "#2d6e25"];
  const grad = p.radial([[0, col[0]], [1, col[1]]], { cx: 0.4, cy: 0.4, r: 0.7 });
  for (let i = 0; i < 6; i++) {
    const aa = -Math.PI / 2 + p.pm(1.2), d = p.r(20, 55) * s;
    const lx = Math.cos(aa) * d, ly = Math.sin(aa) * d;
    out += `<path d="M0 0Q${f(lx * 0.4)} ${f(ly * 0.6)} ${f(lx)} ${f(ly)}" stroke="#4b8a34" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round"/>`;
    for (let k = 0; k < 3; k++) {
      const bx = lx + p.pm(14 * s), by = ly + p.pm(14 * s);
      out += `<path d="${smooth(blobPts(p, bx, by, 13 * s, { n: 12, jit: 0.3, fine: 2 }))}" fill="url(#${grad})"/>`;
    }
  }
  return g(out, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(2, 4, 3, 0.35) });
}

/* Thyme sprig: a thin stem with tiny paired leaves */
function thyme(p, x, y, L = 110, a = 0) {
  let s = `<path d="M0 0Q${f(L * 0.08)} ${f(-L * 0.5)} 0 ${f(-L)}" stroke="#6b5a3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i < 9; i++) {
    const t = i / 9, yy = -L * t, xx = Math.sin(t * Math.PI) * L * 0.04;
    for (const side of [-1, 1]) {
      s += `<ellipse cx="${f(xx + side * 6)}" cy="${f(yy)}" rx="5.5" ry="2.6" transform="rotate(${side * 35} ${f(xx + side * 6)} ${f(yy)})" fill="${p.pick(["#5f7f4a", "#6f8f55", "#4f6f3f"])}"/>`;
    }
  }
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(1.5, 3, 2, 0.35) });
}

/* ============================================================
   Eggs, veg & fruit
   ============================================================ */

function friedEgg(p, x, y, s = 1, a = 0, { yolks = 1 } = {}) {
  const R = 150 * s;
  const white = p.radial([[0, "#ffffff"], [0.55, "#fbf8f1"], [0.9, "#f1e9d8"], [1, "#e6d7b8"]], { cx: 0.45, cy: 0.42, r: 0.6 });
  const pts = blobPts(p, 0, 0, R, { n: 18, jit: 0.13, sx: 1.08, sy: 0.92, fine: 0.5 });
  const d = smooth(pts);
  let out = "";
  // crispy lacy edge
  out += `<path d="${d}" fill="#c98b3c" opacity="0.55" transform="scale(1.03)" filter="url(#${p.blur(5 * s)})"/>`;
  out += `<path d="${d}" fill="url(#${white})"/>`;
  out += `<path d="${d}" fill="none" stroke="#d7a45a" stroke-opacity="0.45" stroke-width="${f(5 * s)}" filter="url(#${p.blur(2.5 * s)})"/>`;
  // gentle bubbles in the white
  for (let i = 0; i < 5; i++) {
    const bx = p.pm(R * 0.7), by = p.pm(R * 0.6), br = p.r(6, 16) * s;
    out += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="#fff" opacity="0.8"/><circle cx="${f(bx + br * 0.25)}" cy="${f(by + br * 0.25)}" r="${f(br)}" fill="none" stroke="#e6dcc6" stroke-width="${f(1.5 * s)}" opacity="0.6"/>`;
  }
  const yolkPos = yolks === 2 ? [[-R * 0.32, -R * 0.05], [R * 0.34, R * 0.08]] : [[p.pm(R * 0.12), p.pm(R * 0.1)]];
  for (const [yx, yy] of yolkPos) out += yolk(p, yx, yy, 58 * s);
  return g(out, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 6, 6, 0.28) });
}

function yolk(p, x, y, r) {
  const gr = p.radial([[0, "#ffd66a"], [0.45, "#ffb526"], [0.85, "#f39200"], [1, "#e07d00"]], { cx: 0.4, cy: 0.38, r: 0.62, fx: 0.36, fy: 0.33 });
  let s = "";
  s += `<circle cx="${f(x + r * 0.08)}" cy="${f(y + r * 0.12)}" r="${f(r * 1.12)}" fill="#e2c07a" opacity="0.55" filter="url(#${p.blur(r * 0.12)})"/>`;
  s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${gr})"/>`;
  s += spec(p, x - r * 0.35, y - r * 0.38, r * 0.3, r * 0.17, -35, 0.85);
  s += spec(p, x + r * 0.4, y + r * 0.45, r * 0.18, r * 0.08, -35, 0.25);
  return s;
}

/* Cracked pepper + chilli flakes */
function seasoning(p, cx, cy, r, n = 40, { cols = ["#2a1d14", "#3b2a1c", "#b8321c", "#8a2a12"] } = {}) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const c = p.pick(cols);
    const w = p.r(1.5, 4.2), h = p.r(1.2, 3);
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="1" fill="${c}" transform="rotate(${f(p.r(0, 180))} ${f(x)} ${f(y)})" opacity="${f(p.r(6, 10)) / 10}"/>`;
  }
  return s;
}

function tomatoSlice(p, x, y, r, a = 0) {
  let s = "";
  const skin = p.radial([[0, "#e8412f"], [0.8, "#d52b1f"], [1, "#b01d16"]], { cx: 0.45, cy: 0.42, r: 0.6 });
  s += `<circle r="${f(r)}" fill="url(#${skin})"/>`;
  s += `<circle r="${f(r * 0.9)}" fill="#e2412f"/>`;
  const n = 4 + (p.rand() > 0.6 ? 1 : 0);
  const gel = p.radial([[0, "#f89a74"], [0.7, "#f07152"], [1, "#e4513a"]], { cx: 0.5, cy: 0.5, r: 0.6 });
  const a0 = p.r(0, TAU);
  for (let i = 0; i < n; i++) {
    const s0 = a0 + (i / n) * TAU + 0.16, s1 = a0 + ((i + 1) / n) * TAU - 0.16;
    const pts = [];
    const steps = 7;
    for (let k = 0; k <= steps; k++) {
      const t = s0 + (s1 - s0) * (k / steps);
      pts.push([Math.cos(t) * r * 0.72, Math.sin(t) * r * 0.72]);
    }
    for (let k = steps; k >= 0; k--) {
      const t = s0 + (s1 - s0) * (k / steps);
      const rr = r * (0.32 + 0.06 * Math.sin((k / steps) * Math.PI));
      pts.push([Math.cos(t) * rr, Math.sin(t) * rr]);
    }
    s += `<path d="${smooth(pts, 0.8)}" fill="url(#${gel})"/>`;
    // seeds
    const mid = (s0 + s1) / 2;
    for (let k = 0; k < 5; k++) {
      const t = mid + p.pm((s1 - s0) * 0.3), rr = r * p.r(0.42, 0.62);
      const sx = Math.cos(t) * rr, sy = Math.sin(t) * rr;
      s += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="${f(r * 0.055)}" ry="${f(r * 0.035)}" transform="rotate(${f((t * 180) / Math.PI + 90)} ${f(sx)} ${f(sy)})" fill="#fbe7a6" opacity="0.9"/>`;
    }
  }
  s += `<circle r="${f(r * 0.2)}" fill="#f47a60" opacity="0.8"/>`;
  s += `<circle r="${f(r * 0.94)}" fill="none" stroke="#ff9a80" stroke-opacity="0.35" stroke-width="${f(r * 0.03)}"/>`;
  // glossy wet highlight
  const gl = p.linear([[0, "#fff", 0.5], [0.4, "#fff", 0.05], [1, "#fff", 0]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  s += `<circle r="${f(r)}" fill="url(#${gl})"/>`;
  s += spec(p, -r * 0.45, -r * 0.5, r * 0.28, r * 0.08, -40, 0.7);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 6, 5, 0.3) });
}

function cherryTomato(p, x, y, r, { half = false, a = 0 } = {}) {
  if (half) {
    let s = "";
    const skin = p.radial([[0, "#ef4a33"], [1, "#b81f16"]], { cx: 0.45, cy: 0.42, r: 0.6 });
    s += `<ellipse rx="${f(r)}" ry="${f(r * 0.92)}" fill="url(#${skin})"/>`;
    s += `<ellipse rx="${f(r * 0.86)}" ry="${f(r * 0.78)}" fill="#e8472f"/>`;
    s += `<path d="M${f(-r * 0.62)} 0Q${f(-r * 0.3)} ${f(-r * 0.55)} 0 ${f(-r * 0.08)}Q${f(r * 0.3)} ${f(-r * 0.55)} ${f(r * 0.62)} 0Q${f(r * 0.3)} ${f(r * 0.55)} 0 ${f(r * 0.08)}Q${f(-r * 0.3)} ${f(r * 0.55)} ${f(-r * 0.62)} 0Z" fill="#f59070"/>`;
    for (let k = 0; k < 6; k++) {
      const sx = p.pm(r * 0.45), sy = p.pm(r * 0.28);
      s += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="${f(r * 0.07)}" ry="${f(r * 0.045)}" fill="#fbe3a0"/>`;
    }
    s += spec(p, -r * 0.4, -r * 0.45, r * 0.3, r * 0.09, -30, 0.6);
    return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 5, 4, 0.32) });
  }
  const skin = p.radial([[0, "#ff6a4d"], [0.6, "#e0301f"], [1, "#a8170f"]], { cx: 0.38, cy: 0.35, r: 0.7 });
  let s = `<circle r="${f(r)}" fill="url(#${skin})"/>`;
  s += spec(p, -r * 0.35, -r * 0.4, r * 0.28, r * 0.16, -35, 0.75);
  // calyx
  let c = "";
  for (let i = 0; i < 5; i++) {
    const t = (i / 5) * TAU + a;
    c += `<path d="M0 0Q${f(Math.cos(t + 0.3) * r * 0.3)} ${f(Math.sin(t + 0.3) * r * 0.3)} ${f(Math.cos(t) * r * 0.42)} ${f(Math.sin(t) * r * 0.42)}" stroke="#3f7a2a" stroke-width="${f(r * 0.1)}" stroke-linecap="round" fill="none"/>`;
  }
  s += g(c, { t: `translate(${f(r * 0.05)} ${f(-r * 0.05)})` });
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(3, 6, 5, 0.35) });
}

function cucumberSlice(p, x, y, r, a = 0) {
  let s = "";
  s += `<circle r="${f(r)}" fill="#2c5a22"/>`;
  s += `<circle r="${f(r * 0.93)}" fill="#8cc152"/>`;
  const flesh = p.radial([[0, "#eef8d6"], [0.6, "#dcefb2"], [1, "#b9dc84"]], { cx: 0.5, cy: 0.5, r: 0.55 });
  s += `<circle r="${f(r * 0.88)}" fill="url(#${flesh})"/>`;
  // three seed lobes
  let lobes = "";
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * TAU + a * 0.01;
    const lx = Math.cos(t) * r * 0.26, ly = Math.sin(t) * r * 0.26;
    lobes += `<ellipse cx="${f(lx)}" cy="${f(ly)}" rx="${f(r * 0.3)}" ry="${f(r * 0.17)}" transform="rotate(${f((t * 180) / Math.PI)} ${f(lx)} ${f(ly)})" fill="#d3eba4" stroke="#bcd98a" stroke-width="${f(r * 0.02)}"/>`;
    for (let k = 0; k < 3; k++) {
      const sx = Math.cos(t) * r * (0.16 + k * 0.1), sy = Math.sin(t) * r * (0.16 + k * 0.1);
      lobes += `<ellipse cx="${f(sx + Math.cos(t + 1.57) * r * 0.06)}" cy="${f(sy + Math.sin(t + 1.57) * r * 0.06)}" rx="${f(r * 0.05)}" ry="${f(r * 0.03)}" fill="#f7fbe9" opacity="0.9"/>`;
      lobes += `<ellipse cx="${f(sx - Math.cos(t + 1.57) * r * 0.06)}" cy="${f(sy - Math.sin(t + 1.57) * r * 0.06)}" rx="${f(r * 0.05)}" ry="${f(r * 0.03)}" fill="#f7fbe9" opacity="0.9"/>`;
    }
  }
  s += lobes;
  const gl = p.linear([[0, "#fff", 0.45], [0.45, "#fff", 0], [1, "#000", 0.08]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  s += `<circle r="${f(r)}" fill="url(#${gl})"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 5, 4, 0.3) });
}

/* Red onion ring (partial arc) */
function onionRing(p, x, y, r, a = 0, arc = 1.6) {
  const a0 = a, a1 = a + arc * Math.PI;
  const pt = (t, rr) => `${f(x + Math.cos(t) * rr)} ${f(y + Math.sin(t) * rr)}`;
  const large = arc > 1 ? 1 : 0;
  let s = `<path d="M${pt(a0, r)}A${r} ${r} 0 ${large} 1 ${pt(a1, r)}" stroke="#8c2f6a" stroke-width="${f(r * 0.16)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${pt(a0, r - r * 0.1)}A${r - r * 0.1} ${r - r * 0.1} 0 ${large} 1 ${pt(a1, r - r * 0.1)}" stroke="#f2dcea" stroke-width="${f(r * 0.07)}" fill="none" stroke-linecap="round" opacity="0.9"/>`;
  return g(s, { filter: p.ds(2, 3, 2, 0.3) });
}

/* ============================================================
   Proteins
   ============================================================ */

function bacon(p, x, y, L = 220, w = 50, a = 0) {
  const n = 12;
  const top = [], bot = [];
  const amp = w * 0.35, ph = p.r(0, TAU);
  for (let i = 0; i <= n; i++) {
    const t = i / n, xx = -L / 2 + L * t;
    const yy = Math.sin(t * TAU * 1.3 + ph) * amp;
    const ww = w / 2 * (0.85 + 0.15 * Math.sin(t * 7 + ph));
    top.push([xx, yy - ww + p.pm(w * 0.04)]);
    bot.push([xx, yy + ww + p.pm(w * 0.04)]);
  }
  const d = smooth([...top, ...bot.reverse()], 0.9);
  const meat = p.linear([[0, "#a4492a"], [0.45, "#7c2f1b"], [1, "#94401f"]], { x1: 0, y1: 0, x2: 1, y2: 0.3 });
  let s = `<path d="${d}" fill="url(#${meat})"/>`;
  const cl = clip(p, `<path d="${d}"/>`);
  // one soft, irregular fat band plus a thinner one
  let fat = "";
  for (const [off, wd, op] of [[p.r(-0.12, 0.05), p.r(0.2, 0.28), 0.75], [p.r(0.22, 0.32), p.r(0.07, 0.1), 0.55]]) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([-L / 2 + L * t, Math.sin(t * TAU * 1.3 + ph) * amp + off * w + Math.sin(t * 9 + off * 20) * w * 0.07]);
    }
    fat += `<path d="${smoothOpen(pts)}" stroke="#e7b48f" stroke-width="${f(w * wd)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;
  }
  s += g(fat, { clip: cl, filter: p.blur(2.5) });
  const crisp = p.noise({ freq: 0.045, oct: 3, rgb: [52, 18, 6], gain: 3.2, bias: -1.3, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" filter="url(#${crisp})" opacity="0.9"/>`;
  const edge = p.noise({ freq: 0.09, oct: 2, rgb: [255, 196, 140], gain: 3, bias: -1.9, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" filter="url(#${edge})" opacity="0.5"/>`;
  const gl = p.linear([[0, "#fff", 0.3], [0.45, "#fff", 0], [1, "#000", 0.12]], { x1: 0, y1: 0, x2: 0.2, y2: 1 });
  s += `<path d="${d}" fill="url(#${gl})"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 6, 5, 0.35) });
}

function chickenBreast(p, x, y, L = 330, W = 150, a = 0) {
  const pts = [];
  const n = 20;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    // teardrop: fuller at one end
    const k = 1 + 0.18 * Math.cos(t) + p.pm(0.025);
    pts.push([Math.cos(t) * L / 2, Math.sin(t) * W / 2 * k * (1 - 0.25 * Math.max(0, -Math.cos(t)))]);
  }
  const d = smooth(pts);
  const meat = p.radial([[0, "#f8d493"], [0.5, "#eaa755"], [0.82, "#cf8034"], [1, "#9f5a20"]], { cx: 0.45, cy: 0.42, r: 0.6 });
  let s = `<path d="${d}" fill="url(#${meat})"/>`;
  const cl = clip(p, `<path d="${d}"/>`);
  // grill marks, softly charred and clipped to the meat
  let marks = "";
  for (let i = -5; i <= 5; i++) {
    const xx = i * L * 0.1;
    marks += `<path d="M${f(xx - W * 0.35)} ${f(-W * 0.7)}Q${f(xx + W * 0.05)} 0 ${f(xx + W * 0.35)} ${f(W * 0.7)}" stroke="#4a220a" stroke-width="${f(L * 0.03)}" stroke-linecap="round" fill="none" opacity="0.78"/>`;
  }
  s += g(g(marks, { filter: p.blur(2.4) }), { clip: cl });
  const tex = p.noise({ freq: 0.05, oct: 3, rgb: [120, 60, 20], gain: 2.2, bias: -1.1, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" opacity="0.5" filter="url(#${tex})"/>`;
  const rimSh = p.radial([[0, "#000", 0], [0.78, "#000", 0], [1, "#4a2008", 0.45]], { cx: 0.5, cy: 0.5, r: 0.5 });
  s += `<path d="${d}" fill="url(#${rimSh})"/>`;
  s += spec(p, -L * 0.15, -W * 0.22, L * 0.22, W * 0.06, -8, 0.45);
  return g(g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})` }), { filter: p.ds(4, 8, 7, 0.4) });
}

/* ============================================================
   Cutlery
   ============================================================ */

function fork(p, x, y, L = 420, a = 0) {
  const steel = p.linear([[0, "#6f757d"], [0.18, "#e9ecef"], [0.32, "#ffffff"], [0.5, "#aab1b9"], [0.75, "#7b828b"], [0.9, "#c9ced4"], [1, "#5d636b"]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  const w = L * 0.075;
  let s = "";
  // handle
  s += `<path d="M${f(-w * 0.45)} ${f(-L * 0.02)}C${f(-w * 0.35)} ${f(L * 0.3)} ${f(-w * 0.9)} ${f(L * 0.62)} ${f(-w * 0.95)} ${f(L * 0.9)}Q${f(-w * 0.95)} ${f(L)} 0 ${f(L)}Q${f(w * 0.95)} ${f(L)} ${f(w * 0.95)} ${f(L * 0.9)}C${f(w * 0.9)} ${f(L * 0.62)} ${f(w * 0.35)} ${f(L * 0.3)} ${f(w * 0.45)} ${f(-L * 0.02)}Z" fill="url(#${steel})"/>`;
  // head + tines
  const hw = w * 1.35;
  let head = `M${f(-w * 0.5)} ${f(-L * 0.02)}C${f(-hw)} ${f(-L * 0.08)} ${f(-hw)} ${f(-L * 0.14)} ${f(-hw)} ${f(-L * 0.18)}`;
  const tl = L * 0.2, tines = 4, tw = (hw * 2) / (tines * 2 - 1);
  let tinesD = "";
  for (let i = 0; i < tines; i++) {
    const x0 = -hw + i * tw * 2;
    tinesD += `M${f(x0)} ${f(-L * 0.17)}L${f(x0)} ${f(-L * 0.17 - tl)}Q${f(x0 + tw / 2)} ${f(-L * 0.17 - tl - tw * 0.8)} ${f(x0 + tw)} ${f(-L * 0.17 - tl)}L${f(x0 + tw)} ${f(-L * 0.17)}Z`;
  }
  head += `L${f(hw)} ${f(-L * 0.18)}C${f(hw)} ${f(-L * 0.14)} ${f(hw)} ${f(-L * 0.08)} ${f(w * 0.5)} ${f(-L * 0.02)}Z`;
  s += `<path d="${head}" fill="url(#${steel})"/><path d="${tinesD}" fill="url(#${steel})"/>`;
  s += `<path d="M0 ${f(L * 0.05)}L0 ${f(L * 0.85)}" stroke="#fff" stroke-width="${f(w * 0.18)}" opacity="0.6" stroke-linecap="round" filter="url(#${p.blur(2)})"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(8, 14, 9, 0.35) });
}

function spoon(p, x, y, L = 300, a = 0) {
  const steel = p.linear([[0, "#f4f6f8"], [0.35, "#c3c9d0"], [0.6, "#8e959e"], [0.8, "#d9dde2"], [1, "#9aa1a9"]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  const w = L * 0.06;
  let s = `<path d="M${f(-w * 0.4)} 0C${f(-w * 0.35)} ${f(L * 0.3)} ${f(-w * 0.8)} ${f(L * 0.6)} ${f(-w * 0.85)} ${f(L * 0.88)}Q${f(-w * 0.85)} ${f(L)} 0 ${f(L)}Q${f(w * 0.85)} ${f(L)} ${f(w * 0.85)} ${f(L * 0.88)}C${f(w * 0.8)} ${f(L * 0.6)} ${f(w * 0.35)} ${f(L * 0.3)} ${f(w * 0.4)} 0Z" fill="url(#${steel})"/>`;
  s += `<ellipse cx="0" cy="${f(-L * 0.14)}" rx="${f(L * 0.11)}" ry="${f(L * 0.16)}" fill="url(#${steel})"/>`;
  s += `<ellipse cx="${f(L * 0.02)}" cy="${f(-L * 0.12)}" rx="${f(L * 0.08)}" ry="${f(L * 0.12)}" fill="#7d858e" opacity="0.5"/>`;
  s += spec(p, -L * 0.03, -L * 0.2, L * 0.03, L * 0.06, 0, 0.8);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(5, 9, 6, 0.3) });
}

/* ============================================================
   Noodle bar
   ============================================================ */

function broth(p, cx, cy, r, { col = ["#e8b066", "#c47b33", "#9c5a22"] } = {}) {
  const gr = p.radial([[0, col[0]], [0.7, col[1]], [1, col[2]]], { cx: 0.45, cy: 0.45, r: 0.6 });
  let s = `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="url(#${gr})"/>`;
  const sw = p.noise({ freq: 0.012, oct: 3, rgb: [255, 220, 150], gain: 2.4, bias: -1.2, seed: p.ri(1, 99) });
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="#000" opacity="0.45" filter="url(#${sw})"/>`;
  for (let i = 0; i < 38; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r * 0.95, rr = p.r(3, 13);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="#f7c572" opacity="0.55"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="none" stroke="#fff3d0" stroke-width="1.3" opacity="0.7"/>`;
  }
  return s;
}

function noodles(p, cx, cy, r, { n = 26, col = "#f4d98c", edge = "#c9a255", w = 10 } = {}) {
  let under = "", top = "", hi = "";
  for (let i = 0; i < n; i++) {
    const a0 = p.r(0, TAU);
    const pts = [];
    const len = p.r(1.2, 2.2) * r, steps = 9;
    let x = cx + p.pm(r * 0.6), y = cy + p.pm(r * 0.6), ang = a0;
    for (let k = 0; k <= steps; k++) {
      pts.push([x, y]);
      ang += p.pm(0.9);
      x += Math.cos(ang) * (len / steps);
      y += Math.sin(ang) * (len / steps);
      // keep strands inside the pile
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d > r) { x = cx + (dx / d) * r; y = cy + (dy / d) * r; ang += Math.PI * 0.6; }
    }
    const d = smoothOpen(pts);
    under += `<path d="${d}" stroke="${edge}" stroke-width="${w + 3}" fill="none" stroke-linecap="round"/>`;
    top += `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    hi += `<path d="${d}" stroke="#fffbe8" stroke-width="${f(w * 0.25)}" fill="none" stroke-linecap="round" opacity="0.7" transform="translate(-1.5 -2)"/>`;
  }
  return g(under + top + hi, { filter: p.ds(2, 4, 4, 0.35) });
}

function softEgg(p, x, y, s = 1, a = 0) {
  const rx = 78 * s, ry = 56 * s;
  let o = "";
  const white = p.radial([[0, "#fffaf0"], [0.75, "#f7ecd6"], [1, "#d8a868"]], { cx: 0.45, cy: 0.42, r: 0.6 });
  o += `<ellipse rx="${f(rx)}" ry="${f(ry)}" fill="url(#${white})"/>`;
  const yk = p.radial([[0, "#ff8c10"], [0.45, "#ffa21e"], [0.75, "#ffc34a"], [1, "#f9d888"]], { cx: 0.5, cy: 0.5, r: 0.5 });
  o += `<ellipse cx="${f(rx * 0.06)}" rx="${f(rx * 0.52)}" ry="${f(ry * 0.6)}" fill="url(#${yk})"/>`;
  o += spec(p, -rx * 0.05, -ry * 0.2, rx * 0.18, ry * 0.12, -10, 0.6);
  o += spec(p, -rx * 0.55, -ry * 0.55, rx * 0.25, ry * 0.07, -20, 0.5);
  return g(o, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 6, 5, 0.35) });
}

function chashu(p, x, y, r = 80, a = 0) {
  let s = "";
  const sear = p.radial([[0, "#b56a3c"], [0.8, "#8a4522"], [1, "#5e2c12"]], { cx: 0.45, cy: 0.42, r: 0.6 });
  s += `<path d="${smooth(blobPts(p, 0, 0, r, { n: 14, jit: 0.05 }))}" fill="url(#${sear})"/>`;
  const meat = p.radial([[0, "#f2c7b0"], [0.7, "#e2a58a"], [1, "#c98266"]], { cx: 0.5, cy: 0.5, r: 0.55 });
  s += `<circle r="${f(r * 0.82)}" fill="url(#${meat})"/>`;
  // rolled belly: a spiral of fat
  const pts = [];
  for (let t = 0; t < 2.6 * TAU; t += 0.25) {
    const rr = (t / (2.6 * TAU)) * r * 0.74;
    pts.push([Math.cos(t) * rr, Math.sin(t) * rr]);
  }
  s += `<path d="${smoothOpen(pts)}" stroke="#fbeee4" stroke-width="${f(r * 0.1)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  s += spec(p, -r * 0.3, -r * 0.35, r * 0.3, r * 0.1, -30, 0.35);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 6, 5, 0.35) });
}

function nori(p, x, y, w = 150, h = 220, a = 0) {
  const d = `M${f(-w / 2)} ${f(-h / 2)}Q0 ${f(-h / 2 - 8)} ${f(w / 2)} ${f(-h / 2)}L${f(w / 2 + 4)} ${f(h / 2)}Q0 ${f(h / 2 + 6)} ${f(-w / 2 - 3)} ${f(h / 2)}Z`;
  const base = p.linear([[0, "#2a3b2c"], [0.5, "#16211a"], [1, "#223326"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  let s = `<path d="${d}" fill="url(#${base})"/>`;
  const tex = p.noise({ freq: 0.12, oct: 2, rgb: [90, 120, 90], gain: 3, bias: -1.5, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" opacity="0.7" filter="url(#${tex})"/>`;
  s += `<path d="${d}" fill="none" stroke="#3f5a44" stroke-width="2" opacity="0.6"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(4, 7, 6, 0.4) });
}

function scallions(p, cx, cy, r, n = 26) {
  let s = "";
  for (const [x, y] of scatter(p, cx, cy, r, n, 16)) {
    const rr = p.r(7, 11), sq = p.r(0.55, 1);
    const t = `translate(${f(x)} ${f(y)}) rotate(${f(p.r(0, 180))})`;
    s += `<g transform="${t}"><ellipse rx="${f(rr)}" ry="${f(rr * sq)}" fill="#d9f0b8" stroke="${p.pick(["#4f9a3a", "#5fae45", "#3f8a30"])}" stroke-width="${f(rr * 0.4)}"/></g>`;
  }
  return g(s, { filter: p.ds(1.5, 3, 2, 0.35) });
}

function corn(p, cx, cy, r, n = 26) {
  let s = "";
  for (const [x, y] of scatter(p, cx, cy, r, n, 15)) {
    const gr = p.radial([[0, "#fff09a"], [0.7, "#ffd23c"], [1, "#e9a91a"]], { cx: 0.4, cy: 0.35, r: 0.7 });
    s += `<path d="${roundRect(18, 15, 6)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(p.r(0, 90))})" fill="url(#${gr})"/>`;
  }
  return g(s, { filter: p.ds(1.5, 3, 2, 0.35) });
}

function sesame(p, cx, cy, r, n = 40, cols = ["#f6ecd2", "#efe0bb", "#2b2723"]) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="4.2" ry="2.5" transform="rotate(${f(p.r(0, 180))} ${f(x)} ${f(y)})" fill="${p.pick(cols)}"/>`;
  }
  return g(s, { filter: p.ds(0.8, 1.5, 0.8, 0.35) });
}

function chiliThreads(p, cx, cy, r, n = 12) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = cx + p.pm(r), y = cy + p.pm(r), a = p.r(0, TAU), L = p.r(25, 50);
    s += `<path d="M${f(x)} ${f(y)}q${f(Math.cos(a) * L * 0.5 + p.pm(8))} ${f(Math.sin(a) * L * 0.5 + p.pm(8))} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}" stroke="#d3311a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return g(s, { filter: p.ds(0.8, 1.5, 0.8, 0.3) });
}

/* ============================================================
   Poke & grain bowls
   ============================================================ */

function rice(p, cx, cy, r, n = 240) {
  const base = p.radial([[0, "#fbf8ef"], [1, "#e9e1cf"]], { cx: 0.45, cy: 0.45, r: 0.6 });
  let s = `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="url(#${base})"/>`;
  let grains = "";
  for (let i = 0; i < n; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    grains += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="4.2" transform="rotate(${f(p.r(0, 180))} ${f(x)} ${f(y)})" fill="#fffef9" stroke="#ded3bb" stroke-width="1"/>`;
  }
  return s + g(grains, { filter: p.ds(0.8, 1.6, 1, 0.25) });
}

function salmonCube(p, x, y, sz = 62, a = 0) {
  const d = smooth(softSquarePts(p, sz, sz * p.r(0.8, 1), { e: 3.8, jit: 0.04 }));
  const gr = p.linear([[0, "#ff9b72"], [0.6, "#f47a4e"], [1, "#e0603a"]], { x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9 });
  let s = `<path d="${d}" fill="url(#${gr})"/>`;
  const cl = clip(p, `<path d="${d}"/>`);
  let lines = "";
  for (let i = -3; i <= 3; i++) {
    const o = i * sz * 0.2 + p.pm(3);
    lines += `<path d="M${f(o - sz)} ${f(-sz)}Q${f(o)} ${f(0)} ${f(o + sz * 0.3)} ${f(sz)}" stroke="#ffe0cf" stroke-width="${f(p.r(2, 3.6))}" fill="none" opacity="0.9"/>`;
  }
  s += g(lines, { clip: cl });
  s += spec(p, -sz * 0.18, -sz * 0.2, sz * 0.2, sz * 0.08, -35, 0.6);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 5, 4, 0.35) });
}

function cube(p, x, y, sz, a, col, { char = 0, wob = 0.07 } = {}) {
  const d = smooth(softSquarePts(p, sz, sz * p.r(0.82, 1.05), { e: 4.4, jit: wob }));
  const gr = p.linear([[0, col[0]], [0.6, col[1]], [1, col[2] || col[1]]], { x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9 });
  let s = `<path d="${d}" fill="url(#${gr})"/>`;
  if (char) {
    const n = p.noise({ freq: 0.08, oct: 2, rgb: [70, 30, 10], gain: 3, bias: -1.5, seed: p.ri(1, 99) });
    s += `<path d="${d}" fill="#000" opacity="${char}" filter="url(#${n})"/>`;
  }
  s += spec(p, -sz * 0.2, -sz * 0.2, sz * 0.18, sz * 0.07, -35, 0.5);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(2.5, 4.5, 3.5, 0.35) });
}

/* Fan of avocado slices around a pivot */
function avocadoFan(p, x, y, s = 1, a = 0, n = 6) {
  let o = "";
  const L = 170 * s, W = 34 * s;
  const flesh = p.linear([[0, "#5f8a2a"], [0.12, "#9dbb44"], [0.45, "#d6e28a"], [1, "#eef0b4"]], { x1: 1, y1: 0, x2: 0, y2: 0 });
  for (let i = 0; i < n; i++) {
    const ang = -40 + (i * 80) / (n - 1);
    const d = `M0 0C${f(W * 0.2)} ${f(-L * 0.35)} ${f(W * 1.1)} ${f(-L * 0.75)} ${f(W * 0.2)} ${f(-L)}C${f(-W * 0.4)} ${f(-L * 0.8)} ${f(-W * 0.35)} ${f(-L * 0.3)} 0 0Z`;
    o += `<g transform="rotate(${f(ang)})"><path d="${d}" fill="url(#${flesh})"/><path d="M0 0C${f(W * 0.2)} ${f(-L * 0.35)} ${f(W * 1.1)} ${f(-L * 0.75)} ${f(W * 0.2)} ${f(-L)}" stroke="#2f4a14" stroke-width="${f(4 * s)}" fill="none" stroke-linecap="round"/></g>`;
  }
  return g(o, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 6, 5, 0.35) });
}

function beans(p, cx, cy, r, n = 18, { col = ["#b6e06a", "#6aa93a", "#4b8a2a"], rx = 15, ry = 11 } = {}) {
  let s = "";
  const gr = p.radial([[0, col[0]], [0.6, col[1]], [1, col[2]]], { cx: 0.38, cy: 0.35, r: 0.7 });
  for (const [x, y] of scatter(p, cx, cy, r, n, rx * 1.6)) {
    const t = `translate(${f(x)} ${f(y)}) rotate(${f(p.r(0, 180))})`;
    s += `<g transform="${t}"><ellipse rx="${rx}" ry="${ry}" fill="url(#${gr})"/><ellipse cx="${f(-rx * 0.3)}" cy="${f(-ry * 0.35)}" rx="${f(rx * 0.35)}" ry="${f(ry * 0.18)}" fill="#fff" opacity="0.45"/></g>`;
  }
  return g(s, { filter: p.ds(1.5, 3, 2.2, 0.35) });
}

function chickpeas(p, cx, cy, r, n = 16) {
  let s = "";
  const gr = p.radial([[0, "#f4d79a"], [0.6, "#dcae5e"], [1, "#b98636"]], { cx: 0.38, cy: 0.35, r: 0.7 });
  for (const [x, y] of scatter(p, cx, cy, r, n, 30)) {
    const rr = p.r(14, 17);
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(p.r(0, 360))})"><path d="${smooth(blobPts(p, 0, 0, rr, { n: 10, jit: 0.07 }))}" fill="url(#${gr})"/><path d="M${f(-rr * 0.2)} ${f(-rr * 0.9)}Q${f(rr * 0.1)} 0 ${f(-rr * 0.1)} ${f(rr * 0.8)}" stroke="#a87a34" stroke-width="1.6" fill="none" opacity="0.6"/><circle cx="${f(-rr * 0.35)}" cy="${f(-rr * 0.35)}" r="${f(rr * 0.25)}" fill="#fff" opacity="0.35"/></g>`;
  }
  return g(s, { filter: p.ds(1.5, 3, 2.2, 0.4) });
}

function quinoa(p, cx, cy, r) {
  const base = p.radial([[0, "#efdcb0"], [1, "#d2b47c"]], { cx: 0.45, cy: 0.45, r: 0.6 });
  let s = `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="url(#${base})"/>`;
  const dots = p.noise({ freq: 0.28, oct: 1, rgb: [255, 246, 222], gain: 7, bias: -4.1, seed: p.ri(1, 99) });
  const dots2 = p.noise({ freq: 0.3, oct: 1, rgb: [150, 110, 60], gain: 7, bias: -4.4, seed: p.ri(1, 99) });
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="#000" filter="url(#${dots})"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="#000" opacity="0.7" filter="url(#${dots2})"/>`;
  for (let i = 0; i < 40; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    s += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="3.4" fill="none" stroke="#fff4dc" stroke-width="1.4" opacity="0.8"/>`;
  }
  return s;
}

function shreds(p, cx, cy, r, n = 40, { col = ["#7d2a78", "#9b3a91", "#5e1d5a"], w = 5, vein = "#f3d9f0" } = {}) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = cx + p.pm(r), y = cy + p.pm(r * 0.7), a = p.r(-0.8, 0.8), L = p.r(40, 80);
    const d = `M${f(x)} ${f(y)}q${f(Math.cos(a) * L * 0.5)} ${f(Math.sin(a) * L * 0.5 + p.pm(14))} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`;
    s += `<path d="${d}" stroke="${p.pick(col)}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    if (vein && i % 2) s += `<path d="${d}" stroke="${vein}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  }
  return g(s, { filter: p.ds(1.5, 3, 2, 0.35) });
}

function drizzle(p, pts, { col = "#f1dcb2", w = 9, hi = "#fffaf0", sh = true } = {}) {
  const d = smoothOpen(pts);
  let s = `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${d}" stroke="${hi}" stroke-width="${f(w * 0.3)}" fill="none" stroke-linecap="round" opacity="0.8" transform="translate(-1.5 -1.5)"/>`;
  return g(s, { filter: sh ? p.ds(2, 3, 2, 0.3) : undefined });
}

function zigzag(p, x0, y0, x1, y1, amp = 40, n = 7) {
  const pts = [];
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = i % 2 ? 1 : -1;
    pts.push([x0 + dx * t + nx * amp * s + p.pm(6), y0 + dy * t + ny * amp * s + p.pm(6)]);
  }
  return pts;
}

/* ============================================================
   Burgers
   ============================================================ */

function bun(p, x, y, r = 230, { col = ["#f5bd68", "#d4832e", "#9c5518"], seeds = 46, gloss = 0.45 } = {}) {
  let s = "";
  const gr = p.radial([[0, col[0]], [0.62, col[1]], [1, col[2]]], { cx: 0.4, cy: 0.37, r: 0.66, fx: 0.36, fy: 0.33 });
  const d = smooth(blobPts(p, 0, 0, r, { n: 16, jit: 0.025 }));
  s += `<path d="${d}" fill="url(#${gr})"/>`;
  const tex = p.noise({ freq: 0.035, oct: 3, rgb: [110, 55, 15], gain: 2.4, bias: -1.2, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" opacity="0.45" filter="url(#${tex})"/>`;
  s += spec(p, -r * 0.3, -r * 0.34, r * 0.34, r * 0.18, -35, gloss, r * 0.1);
  let sd = "";
  for (const [sx, sy] of scatter(p, 0, 0, r * 0.82, seeds, r * 0.09)) {
    sd += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="${f(r * 0.03)}" ry="${f(r * 0.017)}" transform="rotate(${f(p.r(0, 180))} ${f(sx)} ${f(sy)})" fill="#fbf0d4"/>`;
  }
  if (seeds) s += g(sd, { filter: p.ds(1, 2, 1, 0.45, "#5a2a08") });
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(6, 12, 10, 0.4) });
}

/* Bits of lettuce, cheese and tomato peeking out from under a bun */
function burgerSkirt(p, x, y, r) {
  let s = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + p.pm(0.15), d = r * p.r(0.9, 1.0);
    s += P_lettuceBit(p, x + Math.cos(a) * d, y + Math.sin(a) * d, r * p.r(0.16, 0.22), (a * 180) / Math.PI);
  }
  const cheese = p.linear([[0, "#ffd75a"], [1, "#f5a623"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  for (const a of [p.r(0, TAU), p.r(0, TAU), p.r(0, TAU)]) {
    const cx = x + Math.cos(a) * r * 0.98, cy = y + Math.sin(a) * r * 0.98;
    s += `<path d="M${f(-r * 0.2)} 0L${f(r * 0.08)} ${f(-r * 0.05)}Q${f(r * 0.2)} ${f(r * 0.08)} ${f(r * 0.1)} ${f(r * 0.2)}Z" transform="translate(${f(cx)} ${f(cy)}) rotate(${f((a * 180) / Math.PI)})" fill="url(#${cheese})"/>`;
  }
  return g(s, { filter: p.ds(2, 4, 4, 0.3) });
}
function P_lettuceBit(p, x, y, r, deg) {
  const gr = p.radial([[0, "#b6e57a"], [1, "#5ea43a"]], { cx: 0.4, cy: 0.4, r: 0.7 });
  return `<path d="${smooth(blobPts(p, 0, 0, r, { n: 18, jit: 0.2, sx: 1.3, sy: 0.8, fine: 2 }))}" transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})" fill="url(#${gr})"/>`;
}

function fries(p, cx, cy, r, n = 22) {
  let s = "";
  const gr = p.linear([[0, "#ffe596"], [0.45, "#f8c750"], [1, "#dd9b28"]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  const tip = p.linear([[0, "#b8661a", 0.55], [0.12, "#c77a1c", 0], [0.88, "#c77a1c", 0], [1, "#a8601a", 0.8]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([cx + p.pm(r), cy + p.pm(r * 0.75)]);
  pts.sort((u, v) => u[1] - v[1]);
  for (const [x, y] of pts) {
    const a = p.r(-70, 70) + 90 * p.pick([0, 1]), L = p.r(110, 170), w = p.r(24, 30);
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})" filter="url(#${p.ds(2, 5, 4, 0.4)})"><rect x="${f(-w / 2)}" y="${f(-L / 2)}" width="${f(w)}" height="${f(L)}" rx="6" fill="url(#${gr})"/><rect x="${f(-w / 2)}" y="${f(-L / 2)}" width="${f(w)}" height="${f(L)}" rx="6" fill="url(#${tip})"/><rect x="${f(-w / 2 + 4)}" y="${f(-L / 2 + 8)}" width="4" height="${f(L - 20)}" rx="2" fill="#fff8dc" opacity="0.65"/></g>`;
  }
  for (let i = 0; i < 50; i++) s += `<circle cx="${f(cx + p.pm(r))}" cy="${f(cy + p.pm(r * 0.8))}" r="${f(p.r(1.2, 2.4))}" fill="${p.pick(["#ffffff", "#ffffff", "#4f8a34"])}" opacity="0.9"/>`;
  return s;
}

function ramekin(p, x, y, r = 72, { sauce = ["#d8321f", "#9e1a0e"] } = {}) {
  let s = "";
  const rim = p.radial([[0, "#ffffff"], [0.8, "#f1ede6"], [1, "#d7d0c4"]], { cx: 0.4, cy: 0.38, r: 0.7 });
  s += `<circle r="${f(r)}" fill="url(#${rim})"/>`;
  const sc = p.radial([[0, sauce[0]], [1, sauce[1]]], { cx: 0.42, cy: 0.4, r: 0.65 });
  s += `<circle r="${f(r * 0.8)}" fill="url(#${sc})"/>`;
  s += `<circle r="${f(r * 0.8)}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="4"/>`;
  s += spec(p, -r * 0.3, -r * 0.3, r * 0.26, r * 0.1, -35, 0.7);
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(5, 9, 7, 0.35) });
}

/* ============================================================
   Sweets
   ============================================================ */

function pancakes(p, x, y, r = 250) {
  let s = "";
  const edge = p.radial([[0, "#e0a45a"], [0.85, "#c98740"], [1, "#9a5e22"]], { cx: 0.5, cy: 0.5, r: 0.5 });
  for (let i = 2; i >= 1; i--) {
    s += `<path d="${smooth(blobPts(p, i * 8, i * 11, r, { n: 16, jit: 0.02 }))}" fill="url(#${edge})" filter="url(#${p.ds(2, 4, 4, 0.35)})"/>`;
  }
  const top = p.radial([[0, "#b9702c"], [0.45, "#cf8a3c"], [0.78, "#e2a95a"], [0.93, "#efc57c"], [1, "#d49a52"]], { cx: 0.47, cy: 0.46, r: 0.52 });
  const d = smooth(blobPts(p, 0, 0, r, { n: 16, jit: 0.02 }));
  s += `<path d="${d}" fill="url(#${top})"/>`;
  const spots = p.noise({ freq: 0.03, oct: 2, rgb: [110, 55, 16], gain: 2.4, bias: -1.25, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" opacity="0.32" filter="url(#${spots})"/>`;
  s += spec(p, -r * 0.35, -r * 0.4, r * 0.3, r * 0.1, -35, 0.25, r * 0.08);
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(5, 10, 9, 0.35) });
}

function syrup(p, x, y, r) {
  const gr = p.radial([[0, "#c9731f", 0.9], [0.7, "#a9571a", 0.93], [1, "#7e3a0c", 0.95]], { cx: 0.45, cy: 0.45, r: 0.6 });
  let shape = `<path d="${smooth(blobPts(p, 0, 0, r, { n: 16, jit: 0.07, fine: 0.3 }))}"/>`;
  // two short drips running toward the lower right edge
  for (let i = 0; i < 2; i++) {
    const a = 0.55 + i * 0.5 + p.pm(0.1), L = r * p.r(0.18, 0.3), w = r * p.r(0.12, 0.16);
    const x0 = Math.cos(a) * r * 0.7, y0 = Math.sin(a) * r * 0.7;
    const x1 = Math.cos(a) * (r + L), y1 = Math.sin(a) * (r + L);
    shape += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke-width="${f(w * 2)}" stroke-linecap="round" stroke="#000"/><circle cx="${f(x1)}" cy="${f(y1)}" r="${f(w * 1.25)}"/>`;
  }
  const mid = p.id("m");
  p.defs.push(`<mask id="${mid}"><g fill="#fff" stroke="#fff">${shape.replace(/stroke="#000"/g, "")}</g></mask>`);
  let s = `<rect x="${f(-r * 2)}" y="${f(-r * 2)}" width="${f(r * 4)}" height="${f(r * 4)}" fill="url(#${gr})" mask="url(#${mid})"/>`;
  s += spec(p, -r * 0.35, -r * 0.35, r * 0.4, r * 0.1, -35, 0.6);
  s += spec(p, r * 0.3, r * 0.2, r * 0.22, r * 0.05, -35, 0.35);
  return g(s, { t: `translate(${f(x)} ${f(y)})` });
}

function butter(p, x, y, sz = 70, a = 0) {
  let s = `<path d="${smooth(blobPts(p, 4, 6, sz * 0.85, { n: 12, jit: 0.15 }))}" fill="#f7d774" opacity="0.6" filter="url(#${p.blur(6)})"/>`;
  const gr = p.linear([[0, "#fff8cf"], [1, "#f5d766"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  s += `<path d="${roundRect(sz, sz * 0.9, sz * 0.2)}" fill="url(#${gr})"/>`;
  s += spec(p, -sz * 0.18, -sz * 0.2, sz * 0.2, sz * 0.08, -35, 0.8);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(3, 5, 4, 0.3) });
}

function blueberry(p, x, y, r = 17) {
  const gr = p.radial([[0, "#5a67b4"], [0.6, "#343d80"], [1, "#1c2150"]], { cx: 0.38, cy: 0.35, r: 0.7 });
  let s = `<circle r="${f(r)}" fill="url(#${gr})"/>`;
  s += `<circle r="${f(r)}" fill="#c9d0f0" opacity="0.18"/>`;
  let crown = "";
  for (let i = 0; i < 5; i++) {
    const t = (i / 5) * TAU;
    crown += `<path d="M0 0L${f(Math.cos(t) * r * 0.32)} ${f(Math.sin(t) * r * 0.32)}" stroke="#1a1d3a" stroke-width="${f(r * 0.12)}" stroke-linecap="round"/>`;
  }
  s += g(crown, { t: `translate(${f(r * 0.15)} ${f(-r * 0.1)})` });
  s += spec(p, -r * 0.38, -r * 0.4, r * 0.22, r * 0.13, -35, 0.55);
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(2, 4, 3, 0.4) });
}

function raspberry(p, x, y, r = 26) {
  let s = "";
  const gr = p.radial([[0, "#ff6a8a"], [0.6, "#d81f4a"], [1, "#96102f"]], { cx: 0.38, cy: 0.35, r: 0.7 });
  const drup = [];
  for (let ring = 0; ring < 3; ring++) {
    const cnt = [1, 6, 11][ring], rr = [0, r * 0.42, r * 0.8][ring];
    for (let i = 0; i < cnt; i++) {
      const t = (i / cnt) * TAU + ring * 0.3;
      drup.push([Math.cos(t) * rr, Math.sin(t) * rr, r * [0.3, 0.26, 0.22][ring]]);
    }
  }
  for (const [dx, dy, dr] of drup.reverse()) {
    s += `<circle cx="${f(dx)}" cy="${f(dy)}" r="${f(dr)}" fill="url(#${gr})"/><circle cx="${f(dx - dr * 0.3)}" cy="${f(dy - dr * 0.3)}" r="${f(dr * 0.3)}" fill="#fff" opacity="0.5"/>`;
  }
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(2, 4, 3, 0.4) });
}

function strawberryHalf(p, x, y, s = 1, a = 0) {
  const L = 70 * s, W = 30 * s;
  const d = `M0 ${f(L * 0.5)}C${f(W * 1.4)} ${f(L * 0.1)} ${f(W * 1.5)} ${f(-L * 0.5)} ${f(W * 0.5)} ${f(-L * 0.52)}Q0 ${f(-L * 0.54)} ${f(-W * 0.5)} ${f(-L * 0.52)}C${f(-W * 1.5)} ${f(-L * 0.5)} ${f(-W * 1.4)} ${f(L * 0.1)} 0 ${f(L * 0.5)}Z`;
  const gr = p.radial([[0, "#ff5a5f"], [0.8, "#e0202e"], [1, "#b8121f"]], { cx: 0.5, cy: 0.4, r: 0.6 });
  let o = `<path d="${d}" fill="url(#${gr})"/>`;
  o += `<path d="${d}" transform="scale(0.72) translate(0 ${f(-L * 0.06)})" fill="#ff8e93"/>`;
  o += `<path d="M0 ${f(-L * 0.4)}Q${f(W * 0.2)} 0 0 ${f(L * 0.3)}" stroke="#ffd6d8" stroke-width="${f(W * 0.35)}" fill="none" stroke-linecap="round" opacity="0.9"/>`;
  for (let i = 0; i < 10; i++) {
    const t = (i / 10) * TAU;
    o += `<ellipse cx="${f(Math.cos(t) * W * 0.95)}" cy="${f(Math.sin(t) * L * 0.4 - L * 0.05)}" rx="${f(2.2 * s)}" ry="${f(3.2 * s)}" fill="#ffe7a8"/>`;
  }
  o += `<path d="M${f(-W * 0.9)} ${f(-L * 0.5)}Q0 ${f(-L * 0.72)} ${f(W * 0.9)} ${f(-L * 0.5)}Q${f(W * 0.3)} ${f(-L * 0.6)} ${f(-W * 0.9)} ${f(-L * 0.5)}Z" fill="#3f8a2e"/>`;
  o += spec(p, -W * 0.6, -L * 0.2, W * 0.25, L * 0.08, -20, 0.5);
  return g(o, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(2.5, 5, 4, 0.35) });
}

/* Sliced strawberry cross-section, for the açaí bowl */
function strawberrySlice(p, x, y, s = 1, a = 0) {
  const L = 60 * s, W = 26 * s;
  const d = `M0 ${f(L * 0.5)}C${f(W * 1.4)} ${f(L * 0.1)} ${f(W * 1.5)} ${f(-L * 0.5)} 0 ${f(-L * 0.5)}C${f(-W * 1.5)} ${f(-L * 0.5)} ${f(-W * 1.4)} ${f(L * 0.1)} 0 ${f(L * 0.5)}Z`;
  let o = `<path d="${d}" fill="#e4263a"/>`;
  o += `<path d="${d}" transform="scale(0.8)" fill="#ff7b86"/>`;
  o += `<path d="${d}" transform="scale(0.45) translate(0 ${f(-L * 0.1)})" fill="#ffd0d4"/>`;
  o += spec(p, -W * 0.5, -L * 0.2, W * 0.25, L * 0.08, -20, 0.45);
  return g(o, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(2, 4, 3, 0.35) });
}

function bananaSlice(p, x, y, r = 34) {
  const gr = p.radial([[0, "#fffbe2"], [0.8, "#f8eab0"], [1, "#e9cf7a"]], { cx: 0.45, cy: 0.42, r: 0.6 });
  let s = `<circle r="${f(r)}" fill="url(#${gr})"/>`;
  s += `<circle r="${f(r * 0.45)}" fill="none" stroke="#e8d38c" stroke-width="${f(r * 0.06)}" opacity="0.7"/>`;
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * TAU;
    s += `<circle cx="${f(Math.cos(t) * r * 0.12)}" cy="${f(Math.sin(t) * r * 0.12)}" r="${f(r * 0.05)}" fill="#8a6a3a" opacity="0.7"/>`;
  }
  s += spec(p, -r * 0.35, -r * 0.35, r * 0.25, r * 0.1, -35, 0.6);
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(2, 4, 3, 0.35) });
}

function granola(p, cx, cy, r, n = 40) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const col = p.pick([["#d9a85a", "#a8702e"], ["#c68b43", "#8a5a22"], ["#e8c98a", "#b8934a"], ["#8a5a2a", "#5e3a16"]]);
    const gr = p.radial([[0, col[0]], [1, col[1]]], { cx: 0.4, cy: 0.35, r: 0.7 });
    s += `<path d="${smooth(blobPts(p, x, y, p.r(8, 17), { n: 7, jit: 0.3, fine: 1 }), 0.8)}" fill="url(#${gr})"/>`;
  }
  return g(s, { filter: p.ds(1.5, 3, 2, 0.45) });
}

function coconutFlakes(p, cx, cy, r, n = 12) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = cx + p.pm(r), y = cy + p.pm(r * 0.8), a = p.r(0, 180), L = p.r(44, 64), w = L * p.r(0.35, 0.5);
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="M${f(-L / 2)} 0Q${f(-L * 0.1)} ${f(-w)} ${f(L / 2)} ${f(-w * 0.2)}Q${f(L * 0.05)} ${f(-w * 0.35)} ${f(-L / 2)} 0Z" fill="#fffdf6"/><path d="M${f(-L / 2)} 0Q${f(-L * 0.1)} ${f(-w)} ${f(L / 2)} ${f(-w * 0.2)}" stroke="#d9cdb5" stroke-width="2" fill="none"/></g>`;
  }
  return g(s, { filter: p.ds(2, 4, 3, 0.4) });
}

function dots(p, cx, cy, r, n, cols, rad = [1.2, 2.2]) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    s += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(p.r(rad[0], rad[1]))}" fill="${p.pick(cols)}"/>`;
  }
  return s;
}

/* Icing-sugar dusting clipped to a circle */
function dusting(p, cx, cy, r, { density = 0.5, seed } = {}) {
  const n = p.noise({ freq: 0.55, oct: 1, rgb: [255, 255, 255], gain: 8, bias: -8 * (1 - density) + 0.2 - 3.3, seed: seed || p.ri(1, 99) });
  const soft = p.radial([[0, "#fff", 0.35], [0.7, "#fff", 0.15], [1, "#fff", 0]], { cx: 0.5, cy: 0.5, r: 0.5 });
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${soft})"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#000" filter="url(#${n})"/>`;
}

function scoop(p, x, y, r = 95, { col = ["#fffdf6", "#f3e7cf", "#dccaa6"], specks = true } = {}) {
  const d = smooth(blobPts(p, 0, 0, r, { n: 20, jit: 0.06, fine: 1.2 }));
  const gr = p.radial([[0, col[0]], [0.7, col[1]], [1, col[2]]], { cx: 0.4, cy: 0.37, r: 0.65 });
  let s = `<path d="${d}" fill="url(#${gr})"/>`;
  const tex = p.noise({ freq: 0.05, oct: 3, rgb: [200, 180, 140], gain: 2, bias: -1, seed: p.ri(1, 99) });
  s += `<path d="${d}" fill="#000" opacity="0.5" filter="url(#${tex})"/>`;
  if (specks) s += dots(p, 0, 0, r * 0.8, 30, ["#2a1c10", "#3a2818"], [0.8, 1.6]);
  s += spec(p, -r * 0.3, -r * 0.32, r * 0.3, r * 0.15, -35, 0.7);
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(5, 10, 8, 0.35) });
}

function lavaCake(p, x, y, r = 170, { spill = 35 } = {}) {
  const d = smooth(blobPts(p, 0, 0, r, { n: 18, jit: 0.02 }));
  let s = "";
  const sa = (spill * Math.PI) / 180;
  // molten chocolate flowing out onto the plate
  const lava = p.radial([[0, "#6a2c12"], [0.6, "#4a1a08"], [1, "#2e0e03"]], { cx: 0.35, cy: 0.35, r: 0.8 });
  const px = Math.cos(sa) * r * 1.05, py = Math.sin(sa) * r * 1.05;
  const pool = smooth(blobPts(p, px, py, r * 0.55, { n: 18, jit: 0.1, sx: 1.35, sy: 0.9, rot: sa + Math.PI / 2 }));
  s += `<path d="${pool}" fill="url(#${lava})"/>`;
  s += `<path d="${pool}" fill="none" stroke="#8a3a16" stroke-width="3" opacity="0.5"/>`;
  s += spec(p, px - r * 0.12, py - r * 0.14, r * 0.3, r * 0.07, spill + 70, 0.55);
  s += spec(p, px + r * 0.15, py + r * 0.05, r * 0.12, r * 0.04, spill + 70, 0.4);
  const gr = p.radial([[0, "#8a5234"], [0.45, "#62331c"], [0.85, "#40200e"], [1, "#2a1206"]], { cx: 0.4, cy: 0.38, r: 0.64 });
  s += `<path d="${d}" fill="url(#${gr})"/>`;
  const crack = p.noise({ freq: 0.025, oct: 4, rgb: [18, 6, 2], gain: 3.8, bias: -1.75, seed: p.ri(1, 99), type: "turbulence" });
  s += `<path d="${d}" fill="#000" opacity="0.55" filter="url(#${crack})"/>`;
  // the cut the lava runs out of
  const w0 = sa - 0.34, w1 = sa + 0.34;
  const cut = `M${f(Math.cos(sa) * r * 0.2)} ${f(Math.sin(sa) * r * 0.2)}L${f(Math.cos(w0) * r)} ${f(Math.sin(w0) * r)}A${r} ${r} 0 0 1 ${f(Math.cos(w1) * r)} ${f(Math.sin(w1) * r)}Z`;
  s += `<path d="${cut}" fill="url(#${lava})"/>`;
  s += spec(p, Math.cos(sa) * r * 0.6, Math.sin(sa) * r * 0.6, r * 0.14, r * 0.04, spill + 90, 0.45);
  // icing sugar, heaviest on the crown
  const soft = p.radial([[0, "#fff", 0.7], [0.55, "#fff", 0.35], [1, "#fff", 0]], { cx: 0.5, cy: 0.5, r: 0.5 });
  s += `<circle cx="${f(-r * 0.15)}" cy="${f(-r * 0.15)}" r="${f(r * 0.7)}" fill="url(#${soft})"/>`;
  const n = p.noise({ freq: 0.3, oct: 1, rgb: [255, 255, 255], gain: 6, bias: -2.9, seed: p.ri(1, 99) });
  s += `<circle cx="${f(-r * 0.12)}" cy="${f(-r * 0.12)}" r="${f(r * 0.82)}" fill="#000" filter="url(#${n})"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(6, 12, 10, 0.4) });
}

function sauceSwoosh(p, pts, { col = ["#4a2210", "#2a1206"], w = 38 } = {}) {
  const d = smoothOpen(pts);
  let s = `<path d="${d}" stroke="${col[0]}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="${d}" stroke="${col[1]}" stroke-width="${f(w * 0.5)}" fill="none" stroke-linecap="round" opacity="0.4" transform="translate(3 4)"/>`;
  s += `<path d="${d}" stroke="#fff" stroke-width="${f(w * 0.12)}" fill="none" stroke-linecap="round" opacity="0.35" transform="translate(-5 -6)"/>`;
  return g(s, { filter: p.ds(2, 3, 2, 0.25) });
}

/* Açaí base with a swirled, frozen texture */
function acai(p, cx, cy, r) {
  const gr = p.radial([[0, "#8b4c96"], [0.6, "#6a2f78"], [1, "#4a1d57"]], { cx: 0.42, cy: 0.4, r: 0.62 });
  let s = `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="url(#${gr})"/>`;
  const sw = p.noise({ freq: 0.018, oct: 3, rgb: [190, 130, 200], gain: 2.6, bias: -1.35, seed: p.ri(1, 99) });
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="#000" opacity="0.55" filter="url(#${sw})"/>`;
  return s;
}

/* Coconut-shell bowl */
function coconutBowl(p, cx, cy, R, ri = 0.86) {
  const Ri = R * ri;
  let under = "";
  const shell = p.radial([[0, "#8a5a36"], [0.8, "#6a4024"], [1, "#4a2a14"]], { cx: 0.4, cy: 0.38, r: 0.7 });
  under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${shell})"/>`;
  const fib = p.noise({ freq: "0.03 0.2", oct: 3, rgb: [40, 22, 10], gain: 2.5, bias: -1.2, seed: p.ri(1, 99) });
  under += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" opacity="0.7" filter="url(#${fib})"/>`;
  under += `<circle cx="${cx}" cy="${cy}" r="${f(Ri + 9)}" fill="#f6efe2"/>`;
  under += `<circle cx="${cx}" cy="${cy}" r="${f(Ri + 9)}" fill="none" stroke="#d8ccb4" stroke-width="3"/>`;
  const clipId = clip(p, `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}"/>`);
  const innerSh = p.radial([[0, "#000", 0], [0.85, "#000", 0], [1, "#1a0d05", 0.35]], { cx: 0.47, cy: 0.46, r: 0.53 });
  const over = `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="url(#${innerSh})"/>`;
  return { under, over, clipId, ri: Ri };
}

/* ============================================================
   Drinks
   ============================================================ */

function iceCube(p, x, y, sz = 80, a = 0, tint = "#ffffff") {
  const d = roundRect(sz, sz * p.r(0.85, 1), sz * 0.18);
  let s = `<path d="${d}" fill="${tint}" opacity="0.28"/>`;
  s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="3" opacity="0.8"/>`;
  s += `<path d="${roundRect(sz * 0.62, sz * 0.55, sz * 0.12)}" fill="#fff" opacity="0.18"/>`;
  s += `<path d="M${f(-sz * 0.34)} ${f(-sz * 0.18)}L${f(-sz * 0.34)} ${f(sz * 0.2)}M${f(-sz * 0.2)} ${f(-sz * 0.36)}L${f(sz * 0.22)} ${f(-sz * 0.36)}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`;
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})`, filter: p.ds(2, 4, 4, 0.18) });
}

function straw(p, x0, y0, x1, y1, { col = "#1f2a24", stripe } = {}) {
  const w = 26;
  let s = `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  if (stripe) s += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${stripe}" stroke-width="${w}" stroke-dasharray="14 14"/>`;
  s += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.35" transform="translate(-6 -3)"/>`;
  const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  s += `<ellipse cx="${f(x1)}" cy="${f(y1)}" rx="${f(w * 0.36)}" ry="${f(w * 0.5)}" transform="rotate(${f(ang)} ${f(x1)} ${f(y1)})" fill="#0b0f0c"/>`;
  return g(s, { filter: p.ds(8, 14, 8, 0.3) });
}

function lemonWheel(p, x, y, r = 95, { lime = false } = {}) {
  const rind = lime ? ["#7cc24a", "#4f8f2a"] : ["#ffe45a", "#f2c21e"];
  const flesh = lime ? ["#e4f5b0", "#bfe07a"] : ["#fff6c0", "#fbe07a"];
  let s = `<circle r="${f(r)}" fill="${rind[1]}"/><circle r="${f(r * 0.94)}" fill="${rind[0]}"/><circle r="${f(r * 0.86)}" fill="#fffbea"/>`;
  const gr = p.radial([[0, flesh[0]], [1, flesh[1]]], { cx: 0.5, cy: 0.5, r: 0.5 });
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU + 0.05, a1 = ((i + 1) / n) * TAU - 0.05;
    const pts = [[Math.cos((a0 + a1) / 2) * r * 0.1, Math.sin((a0 + a1) / 2) * r * 0.1]];
    for (let k = 0; k <= 4; k++) {
      const t = a0 + ((a1 - a0) * k) / 4;
      pts.push([Math.cos(t) * r * 0.8, Math.sin(t) * r * 0.8]);
    }
    s += `<path d="${smooth(pts, 0.6)}" fill="url(#${gr})"/>`;
  }
  s += spec(p, -r * 0.35, -r * 0.4, r * 0.3, r * 0.1, -40, 0.6);
  return g(s, { t: `translate(${f(x)} ${f(y)})`, filter: p.ds(3, 6, 5, 0.3) });
}

function bubbles(p, cx, cy, r, n = 30) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r, rr = p.r(2.5, 7);
    s += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(rr)}" fill="#fff" fill-opacity="0.18" stroke="#fff" stroke-opacity="0.8" stroke-width="1.3"/>`;
  }
  return s;
}

/* Cup + saucer seen from above. Returns { under, over, clipId, ri, handle } */
function cupSaucer(p, cx, cy, { saucer = 360, cup = 205, handleA = 35 } = {}) {
  const pl = plate(p, cx, cy, saucer, { kind: "white", well: 0.64 });
  let under = pl.under;
  // cup shadow on the saucer
  under += `<circle cx="${f(cx + 14)}" cy="${f(cy + 20)}" r="${f(cup)}" fill="#3a2a1a" opacity="0.3" filter="url(#${p.blur(14)})"/>`;
  // handle
  const ha = (handleA * Math.PI) / 180;
  const hx = cx + Math.cos(ha) * cup * 1.02, hy = cy + Math.sin(ha) * cup * 1.02;
  const white = p.linear([[0, "#ffffff"], [1, "#e4ded3"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  under += g(`<path d="${roundRect(120, 56, 28)}" fill="url(#${white})"/><path d="${roundRect(64, 20, 10)}" fill="#e6e0d6" transform="translate(12 0)"/>`,
    { t: `translate(${f(hx + Math.cos(ha) * 40)} ${f(hy + Math.sin(ha) * 40)}) rotate(${handleA})`, filter: p.ds(4, 7, 5, 0.25) });
  const body = p.radial([[0, "#ffffff"], [0.85, "#f5f1ea"], [1, "#dcd4c6"]], { cx: 0.4, cy: 0.38, r: 0.7 });
  under += `<circle cx="${cx}" cy="${cy}" r="${f(cup)}" fill="url(#${body})"/>`;
  const Ri = cup * 0.86;
  const clipId = clip(p, `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}"/>`);
  const innerSh = p.radial([[0, "#000", 0], [0.86, "#000", 0], [1, "#2a1206", 0.45]], { cx: 0.47, cy: 0.46, r: 0.53 });
  let over = `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="url(#${innerSh})"/>`;
  over += `<circle cx="${cx}" cy="${cy}" r="${f(Ri)}" fill="none" stroke="#c9bfae" stroke-width="2"/>`;
  const rimHi = p.linear([[0, "#fff", 0.9], [0.5, "#fff", 0], [1, "#000", 0.1]], { x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9 });
  over += `<circle cx="${cx}" cy="${cy}" r="${f(cup - 6)}" fill="none" stroke="url(#${rimHi})" stroke-width="8"/>`;
  return { under, over, clipId, ri: Ri };
}

/* Latte art: a layered heart (rosetta-style rings) with a pull-through */
function latteArt(p, cx, cy, r, a = 0) {
  const foam = "#f8efe0";
  const heart = (sc, dy = 0) => {
    const w = r * sc, h = r * sc;
    return `M0 ${f(dy + h * 0.72)}C${f(-w * 0.25)} ${f(dy + h * 0.45)} ${f(-w * 1.02)} ${f(dy + h * 0.1)} ${f(-w * 0.86)} ${f(dy - h * 0.34)}C${f(-w * 0.72)} ${f(dy - h * 0.72)} ${f(-w * 0.18)} ${f(dy - h * 0.7)} 0 ${f(dy - h * 0.3)}C${f(w * 0.18)} ${f(dy - h * 0.7)} ${f(w * 0.72)} ${f(dy - h * 0.72)} ${f(w * 0.86)} ${f(dy - h * 0.34)}C${f(w * 1.02)} ${f(dy + h * 0.1)} ${f(w * 0.25)} ${f(dy + h * 0.45)} 0 ${f(dy + h * 0.72)}Z`;
  };
  let s = `<path d="${heart(0.78, r * 0.02)}" fill="${foam}"/>`;
  s += `<path d="${heart(0.6, r * 0.04)}" fill="none" stroke="#c9905a" stroke-width="${f(r * 0.035)}" opacity="0.55"/>`;
  s += `<path d="${heart(0.42, r * 0.06)}" fill="none" stroke="#c9905a" stroke-width="${f(r * 0.03)}" opacity="0.5"/>`;
  s += `<path d="${heart(0.24, r * 0.08)}" fill="none" stroke="#c9905a" stroke-width="${f(r * 0.025)}" opacity="0.45"/>`;
  s += `<path d="M0 ${f(-r * 0.5)}Q${f(r * 0.02)} ${f(r * 0.2)} 0 ${f(r * 0.82)}" stroke="#c48a50" stroke-width="${f(r * 0.03)}" fill="none" opacity="0.8"/>`;
  return g(s, { t: `translate(${f(cx)} ${f(cy)}) rotate(${f(a)})`, filter: p.blur(1.4) });
}

module.exports = {
  stonewareBowl, plate, glass, coconutBowl, cupSaucer,
  leaf, leafD, basil, spinach, sage, mint, arugula, lettuce, kale, parsley, thyme,
  friedEgg, yolk, seasoning, tomatoSlice, cherryTomato, cucumberSlice, onionRing,
  bacon, chickenBreast, fork, spoon,
  broth, noodles, softEgg, chashu, nori, scallions, corn, sesame, chiliThreads,
  rice, salmonCube, cube, avocadoFan, beans, chickpeas, quinoa, shreds, drizzle, zigzag,
  bun, burgerSkirt, fries, ramekin,
  pancakes, syrup, butter, blueberry, raspberry, strawberryHalf, strawberrySlice, bananaSlice,
  granola, coconutFlakes, dots, dusting, scoop, lavaCake, sauceSwoosh, acai,
  iceCube, straw, lemonWheel, bubbles, latteArt,
};
