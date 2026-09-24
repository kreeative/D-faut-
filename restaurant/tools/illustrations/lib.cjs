"use strict";
/* Core SVG helpers for the dish illustrations. Light source: top-left. */

const TAU = Math.PI * 2;
const f = (n) => Math.round(n * 10) / 10;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Pic {
  constructor(name, { size = 1000, seed = 7 } = {}) {
    this.name = name;
    this.size = size;
    this.defs = [];
    this.body = [];
    this.k = 0;
    this.rand = mulberry32(seed);
    this.cache = new Map();
  }
  r(a = 0, b = 1) { return a + this.rand() * (b - a); }
  ri(a, b) { return Math.floor(this.r(a, b + 1)); }
  pm(v) { return this.r(-v, v); }
  pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; }
  id(p = "g") { return `${this.name}-${p}${(this.k++).toString(36)}`; }

  once(key, make) {
    if (!this.cache.has(key)) {
      const id = this.id("c");
      this.defs.push(make(id));
      this.cache.set(key, id);
    }
    return this.cache.get(key);
  }

  stops(list) {
    return list
      .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${a}"` : ""}/>`)
      .join("");
  }
  radial(list, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy, user = false } = {}) {
    const key = "R" + JSON.stringify([list, cx, cy, r, fx, fy, user]);
    return this.once(key, (id) =>
      `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ""}${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${this.stops(list)}</radialGradient>`);
  }
  linear(list, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false } = {}) {
    const key = "L" + JSON.stringify([list, x1, y1, x2, y2, user]);
    return this.once(key, (id) =>
      `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ""}>${this.stops(list)}</linearGradient>`);
  }
  /* Soft drop shadow, warm-tinted so it reads as food sitting on a surface. */
  ds(dx = 3, dy = 5, sd = 4, op = 0.32, color = "#2a1405") {
    return this.once(`ds${dx},${dy},${sd},${op},${color}`, (id) =>
      `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${sd}" flood-color="${color}" flood-opacity="${op}"/></filter>`);
  }
  blur(sd) {
    return this.once(`blur${sd}`, (id) =>
      `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
  }
  /* Noise clipped to the element's own shape. rgb = colour of the grain,
     gain/bias shape the alpha from the noise's red channel. */
  noise({ freq = 0.8, oct = 2, rgb = [0, 0, 0], gain = 1, bias = -0.4, seed = 3, type = "fractalNoise" } = {}) {
    const [r, g, b] = rgb.map((v) => +(v / 255).toFixed(3));
    return this.once(`nz${freq},${oct},${rgb},${gain},${bias},${seed},${type}`, (id) =>
      `<filter id="${id}" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">` +
      `<feTurbulence type="${type}" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="t"/>` +
      `<feColorMatrix in="t" type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${gain} 0 0 0 ${bias}" result="c"/>` +
      `<feComposite in="c" in2="SourceAlpha" operator="in"/></filter>`);
  }
  add(s) { this.body.push(s); return this; }
  toString() {
    const s = this.size;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">` +
      `<defs>${this.defs.join("")}</defs>${this.body.join("")}</svg>`;
  }
}

/* ---------- geometry ---------- */

function rot([x, y], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
}

/* Closed Catmull-Rom spline through points -> cubic Bezier path */
function smooth(pts, t = 1) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + ((p2[0] - p0[0]) / 6) * t)} ${f(p1[1] + ((p2[1] - p0[1]) / 6) * t)} ` +
      `${f(p2[0] - ((p3[0] - p1[0]) / 6) * t)} ${f(p2[1] - ((p3[1] - p1[1]) / 6) * t)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

/* Open Catmull-Rom spline */
function smoothOpen(pts, t = 1) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
    d += `C${f(p1[0] + ((p2[0] - p0[0]) / 6) * t)} ${f(p1[1] + ((p2[1] - p0[1]) / 6) * t)} ` +
      `${f(p2[0] - ((p3[0] - p1[0]) / 6) * t)} ${f(p2[1] - ((p3[1] - p1[1]) / 6) * t)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/* Organic round outline built from a few low harmonics plus a little jitter. */
function blobPts(p, cx, cy, r, { n = 14, jit = 0.08, sx = 1, sy = 1, rot: a0 = 0, fine = 0.2 } = {}) {
  const ph = [p.r(0, TAU), p.r(0, TAU), p.r(0, TAU), p.r(0, TAU)];
  const am = [p.pm(jit), p.pm(jit * 0.7), p.pm(jit * 0.45), p.pm(jit * 0.3)];
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + am[0] * Math.sin(2 * a + ph[0]) + am[1] * Math.sin(3 * a + ph[1]) +
      am[2] * Math.sin(5 * a + ph[2]) + am[3] * Math.sin(7 * a + ph[3]) + p.pm(jit * fine);
    const [x, y] = rot([Math.cos(a) * r * k * sx, Math.sin(a) * r * k * sy], a0);
    pts.push([cx + x, cy + y]);
  }
  return pts;
}
const blob = (p, cx, cy, r, o) => smooth(blobPts(p, cx, cy, r, o));

/* Rounded (superellipse-ish) square centred on 0,0 */
function roundRect(w, h, rad) {
  const x = -w / 2, y = -h / 2;
  rad = Math.min(rad, w / 2, h / 2);
  return `M${f(x + rad)} ${f(y)}H${f(x + w - rad)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + rad)}V${f(y + h - rad)}` +
    `Q${f(x + w)} ${f(y + h)} ${f(x + w - rad)} ${f(y + h)}H${f(x + rad)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - rad)}` +
    `V${f(y + rad)}Q${f(x)} ${f(y)} ${f(x + rad)} ${f(y)}Z`;
}

/* Wobbly rounded cube (for salmon, sweet potato, mango ...) */
function chunkPts(p, w, h, { wob = 0.08, n = 4 } = {}) {
  const pts = [];
  const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      pts.push([a[0] + (b[0] - a[0]) * t + p.pm(w * wob), a[1] + (b[1] - a[1]) * t + p.pm(h * wob)]);
    }
  }
  return pts;
}

/* Rounded-square outline (superellipse) with a little organic wobble. */
function softSquarePts(p, w, h, { n = 20, e = 4, jit = 0.05 } = {}) {
  const pts = [];
  const ph = p.r(0, TAU), am = p.pm(jit), am2 = p.pm(jit * 0.6);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const c = Math.cos(t), s = Math.sin(t);
    const r = 1 / Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(s), e), 1 / e);
    const k = 1 + am * Math.sin(3 * t + ph) + am2 * Math.sin(5 * t + ph * 2) + p.pm(jit * 0.3);
    pts.push([c * r * (w / 2) * k, s * r * (h / 2) * k]);
  }
  return pts;
}

/* Scatter points inside a circle with a minimum spacing (dart throwing). */
function scatter(p, cx, cy, r, count, minD, tries = 3000) {
  const out = [];
  for (let i = 0; i < tries && out.length < count; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * r;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (out.every(([u, v]) => (u - x) ** 2 + (v - y) ** 2 >= minD * minD)) out.push([x, y]);
  }
  return out;
}

const g = (inner, { t = "", filter, op, clip, blend } = {}) =>
  `<g${t ? ` transform="${t}"` : ""}${filter ? ` filter="url(#${filter})"` : ""}${op != null ? ` opacity="${op}"` : ""}` +
  `${clip ? ` clip-path="url(#${clip})"` : ""}${blend ? ` style="mix-blend-mode:${blend}"` : ""}>${inner}</g>`;

function clip(p, inner) {
  const id = p.id("cl");
  p.defs.push(`<clipPath id="${id}">${inner}</clipPath>`);
  return id;
}

/* A soft white highlight (specular). */
function spec(p, x, y, rx, ry, a = -35, op = 0.55, sd) {
  const b = p.blur(sd != null ? sd : Math.max(1, Math.min(rx, ry) * 0.35));
  return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${a} ${f(x)} ${f(y)})" fill="#fff" opacity="${op}" filter="url(#${b})"/>`;
}

module.exports = { TAU, f, Pic, rot, smooth, smoothOpen, blobPts, blob, roundRect, chunkPts, softSquarePts, scatter, g, clip, spec, mulberry32 };
