"use strict";
const { TAU, f, Pic, smooth, blobPts, g, clip, spec, scatter } = require("./lib.cjs");
const P = require("./parts.cjs");

const dishes = {};

/* Dark leafy base so gaps between toppings read as greens, not an empty bowl. */
function greensBed(p, cx, cy, ri, { n = 18, kinds = ["spinach", "spinach", "arugula"], inner = 0.5 } = {}) {
  const bed = p.radial([[0, "#4f6b2e"], [1, "#2c3f1a"]], { cx: 0.45, cy: 0.45, r: 0.6 });
  let s = `<circle cx="${cx}" cy="${cy}" r="${f(ri)}" fill="url(#${bed})"/>`;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + p.pm(0.1);
    const d = ri * p.r(inner, inner + 0.12);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const deg = (a * 180) / Math.PI + 90 + p.pm(22);
    const kind = kinds[i % kinds.length];
    s += kind === "arugula"
      ? P.arugula(p, x, y, p.r(1.5, 1.9), deg)
      : kind === "lettuce"
        ? P.lettuce(p, x + Math.cos(a) * ri * 0.2, y + Math.sin(a) * ri * 0.2, p.r(60, 80), deg + 90)
        : P.spinach(p, x, y, p.r(1.05, 1.3), deg, { stem: 0 });
  }
  // a few leaves across the middle too
  for (let i = 0; i < 5; i++) {
    const a = p.r(0, TAU), d = ri * p.r(0, 0.35);
    s += P.spinach(p, cx + Math.cos(a) * d, cy + Math.sin(a) * d, p.r(1, 1.2), p.r(0, 360), { stem: 0 });
  }
  return s;
}

/* Sunrise Egg Bowl — the hero, modelled on the reference shot */
dishes["sunrise-egg-bowl"] = () => {
  const p = new Pic("egg", { seed: 11 });
  const cx = 470, cy = 530, R = 420;
  const bowl = P.stonewareBowl(p, cx, cy, R);
  p.add(bowl.under);
  let food = "";
  // warm bed
  food += greensBed(p, cx, cy, bowl.ri);
  // bacon top-right
  food += P.bacon(p, cx + 150, cy - 170, 250, 62, 58);
  food += P.bacon(p, cx + 225, cy - 90, 240, 58, 74);
  food += P.bacon(p, cx + 80, cy - 235, 230, 56, 36);
  // sage along the top
  food += P.sage(p, cx - 40, cy - 170, 1.35, -25);
  food += P.sage(p, cx, cy - 190, 1.4, 12);
  food += P.sage(p, cx - 85, cy - 150, 1.2, -60);
  food += P.sage(p, cx + 45, cy - 205, 1.2, 45);
  food += P.sage(p, cx + 10, cy - 150, 1.1, -5);
  // eggs
  food += P.friedEgg(p, cx - 60, cy + 90, 1.35, 10, { yolks: 2 });
  // tomato slices top-left
  food += P.tomatoSlice(p, cx - 210, cy - 20, 78, 20);
  food += P.tomatoSlice(p, cx - 175, cy - 125, 80, 70);
  food += P.tomatoSlice(p, cx - 95, cy - 205, 76, 130);
  // cucumbers on the right
  food += P.cucumberSlice(p, cx + 250, cy + 60, 62, 10);
  food += P.cucumberSlice(p, cx + 225, cy + 150, 62, 40);
  food += P.cucumberSlice(p, cx + 170, cy + 225, 60, 80);
  // basil
  food += P.basil(p, cx + 200, cy - 10, 1.35, -110);
  food += P.basil(p, cx + 120, cy + 150, 1.05, 160);
  food += P.thyme(p, cx - 150, cy + 60, 130, -150);
  food += P.thyme(p, cx + 20, cy + 250, 110, -20);
  food += P.seasoning(p, cx - 60, cy + 90, 170, 90);
  p.add(g(food, { clip: bowl.clipId }));
  p.add(bowl.over);
  p.add(P.fork(p, cx + 60, cy + 10, 470, 238));
  return p;
};

/* ---------- local helpers ---------- */

function coaster(p, cx, cy, R) {
  const base = p.radial([[0, "#d7b184"], [0.8, "#c49a6a"], [1, "#a57a4c"]], { cx: 0.42, cy: 0.4, r: 0.65 });
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${base})"/>`;
  const dk = p.noise({ freq: 0.22, oct: 2, rgb: [110, 72, 38], gain: 6, bias: -3.3, seed: p.ri(1, 99) });
  const lt = p.noise({ freq: 0.25, oct: 1, rgb: [240, 214, 170], gain: 6, bias: -3.6, seed: p.ri(1, 99) });
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" filter="url(#${dk})"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000" opacity="0.8" filter="url(#${lt})"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${f(R - 3)}" fill="none" stroke="#8a6238" stroke-opacity="0.5" stroke-width="6"/>`;
  return s;
}

function stick(p, x0, y0, x1, y1, { w = 10, col = ["#e9cfa2", "#c89a62"] } = {}) {
  const gr = p.linear([[0, col[0]], [1, col[1]]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  return `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="url(#${gr})" stroke-width="${w}" stroke-linecap="round" filter="url(#${p.ds(4, 8, 5, 0.35)})"/>`;
}

function chopsticks(p, x0, y0, x1, y1, gap = 34) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  let s = "";
  for (const k of [-0.5, 0.5]) {
    const ax = x0 + nx * gap * k, ay = y0 + ny * gap * k;
    const bx = x1 + nx * gap * k * 0.6, by = y1 + ny * gap * k * 0.6;
    const gr = p.linear([[0, "#3a2418"], [1, "#6a4228"]], { x1: 0, y1: 0, x2: 1, y2: 1 });
    // tapered: draw as a thin quad
    const w0 = 18, w1 = 7;
    s += `<path d="M${f(ax + nx * w0 / 2)} ${f(ay + ny * w0 / 2)}L${f(bx + nx * w1 / 2)} ${f(by + ny * w1 / 2)}L${f(bx - nx * w1 / 2)} ${f(by - ny * w1 / 2)}L${f(ax - nx * w0 / 2)} ${f(ay - ny * w0 / 2)}Z" fill="url(#${gr})"/>`;
    s += `<path d="M${f(ax - nx * 3)} ${f(ay - ny * 3)}L${f(bx - nx * 1)} ${f(by - ny * 1)}" stroke="#fff" stroke-width="2.5" opacity="0.3"/>`;
  }
  return g(s, { filter: p.ds(10, 16, 9, 0.35) });
}

function chickenChunk(p, x, y, sz, a) {
  let s = P.cube(p, 0, 0, sz, 0, ["#f7d28c", "#df9c46", "#b0661f"], { char: 0.9, wob: 0.07 });
  s += P.dots(p, 0, 0, sz * 0.4, 7, ["#3f7a2a", "#5a9a3a", "#2f5a1f"], [1.6, 3]);
  s += P.dots(p, 0, 0, sz * 0.35, 4, ["#f6ecd2"], [1.4, 2.2]);
  return g(s, { t: `translate(${f(x)} ${f(y)}) rotate(${f(a)})` });
}

function wedge(p, cx, cy, r0, r1, a0, a1, n, minD) {
  const out = [];
  for (let i = 0; i < 4000 && out.length < n; i++) {
    const a = ((a0 + p.rand() * (a1 - a0)) * Math.PI) / 180, d = r0 + Math.sqrt(p.rand()) * (r1 - r0);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (out.every(([u, v]) => (u - x) ** 2 + (v - y) ** 2 >= minD * minD)) out.push([x, y]);
  }
  return out;
}
const polar = (cx, cy, deg, d) => [cx + Math.cos((deg * Math.PI) / 180) * d, cy + Math.sin((deg * Math.PI) / 180) * d];

/* ---------- Bowls ---------- */

dishes["grilled-chicken-salad"] = () => {
  const p = new Pic("gcs", { seed: 21 });
  const cx = 500, cy = 500, R = 440;
  const pl = P.plate(p, cx, cy, R, { kind: "matte", well: 0.8 });
  p.add(pl.under);
  let food = "";
  const kinds = [["#9ad66a", "#4a9a32"], ["#7cc452", "#3a8428"], ["#b8e27e", "#5fa83c"], ["#6a3a5a", "#3a1a30"]];
  for (let i = 0; i < 30; i++) {
    const a = p.r(0, TAU), d = Math.sqrt(p.rand()) * pl.ri * 0.82;
    const col = i % 9 === 8 ? kinds[3] : kinds[i % 3];
    food += P.lettuce(p, cx + Math.cos(a) * d, cy + Math.sin(a) * d, p.r(58, 80), p.r(0, 360), { col, rib: i % 9 === 8 ? "#f0d0e0" : "#e2f5cc" });
  }
  for (let i = 0; i < 10; i++) {
    const a = p.r(0, TAU), d = p.r(0.3, 0.8) * pl.ri;
    food += P.arugula(p, cx + Math.cos(a) * d, cy + Math.sin(a) * d, p.r(1.1, 1.4), p.r(0, 360));
  }
  for (let i = 0; i < 6; i++) {
    const a = p.r(0, TAU), d = p.r(0.25, 0.75) * pl.ri;
    food += P.onionRing(p, cx + Math.cos(a) * d, cy + Math.sin(a) * d, p.r(28, 40), p.r(0, TAU), p.r(0.8, 1.5));
  }
  const toms = [[-230, -120], [-250, 60], [-120, 230], [200, 200], [260, -40], [150, -250], [-60, -260]];
  for (const [dx, dy] of toms) food += P.cherryTomato(p, cx + dx, cy + dy, p.r(34, 40), { half: true, a: p.r(0, 360) });
  food += P.chickenBreast(p, cx + 20, cy - 10, 400, 190, -58);
  food += P.seasoning(p, cx + 20, cy - 10, 120, 45, { cols: ["#2a1d14", "#3b2a1c", "#6b4a2a"] });
  food += P.parsley(p, cx - 40, cy + 150, 1, 20);
  p.add(food);
  return p;
};

dishes["salmon-poke-bowl"] = () => {
  const p = new Pic("poke", { seed: 33 });
  const cx = 500, cy = 500, R = 440;
  const bowl = P.stonewareBowl(p, cx, cy, R, { glaze: ["#faf6ee", "#ece4d5", "#cfc3ad"], speck: [70, 60, 50], ri: 0.82 });
  p.add(bowl.under);
  const ri = bowl.ri;
  let food = P.rice(p, cx, cy, ri, 260);
  // wedges of toppings, poke-shop style
  for (const [x, y] of wedge(p, cx, cy, ri * 0.3, ri * 0.98, 195, 268, 12, 70)) food += P.salmonCube(p, x, y, p.r(74, 84), p.r(0, 90));
  for (const [x, y] of wedge(p, cx, cy, ri * 0.3, ri * 0.98, 272, 322, 9, 58)) food += P.cube(p, x, y, p.r(54, 62), p.r(0, 90), ["#ffd04a", "#ffae22", "#f08a10"]);
  food += P.shreds(p, ...polar(cx, cy, 40, ri * 0.62), 95, 70, { col: ["#5fbf3f", "#4aa832", "#78cf55"], w: 7, vein: "#b8f0a0" });
  food += P.avocadoFan(p, ...polar(cx, cy, -8, ri * 0.28), 1.5, 90, 7);
  food += P.beans(p, ...polar(cx, cy, 118, ri * 0.62), 110, 22, { rx: 22, ry: 16 });
  for (const [x, y] of wedge(p, cx, cy, ri * 0.45, ri * 0.95, 155, 192, 5, 70)) food += P.cucumberSlice(p, x, y, 50, p.r(0, 90));
  const [gx, gy] = polar(cx, cy, 250, ri * 0.08);
  food += g(`<path d="${smooth(blobPts(p, gx, gy, 55, { n: 14, jit: 0.25, fine: 1.5 }))}" fill="#f7c9c4" opacity="0.95"/><path d="${smooth(blobPts(p, gx + 22, gy + 18, 42, { n: 12, jit: 0.25, fine: 1.5 }))}" fill="#f4b3ad" opacity="0.92"/>`, { filter: p.ds(2, 4, 3, 0.3) });
  food += P.scallions(p, cx - 30, cy - 60, 160, 22);
  food += P.sesame(p, cx, cy, ri * 0.85, 90, ["#f6ecd2", "#2b2723", "#2b2723"]);
  p.add(g(food, { clip: bowl.clipId }));
  p.add(bowl.over);
  p.add(chopsticks(p, cx - 330, cy - 390, cx + 470, cy + 60));
  return p;
};

dishes["garden-buddha-bowl"] = () => {
  const p = new Pic("buddha", { seed: 45 });
  const cx = 500, cy = 500, R = 440;
  const bowl = P.stonewareBowl(p, cx, cy, R, { glaze: ["#b9ccb0", "#8fa886", "#5f7a58"], speck: [245, 245, 235], ri: 0.82 });
  p.add(bowl.under);
  const ri = bowl.ri;
  let food = P.quinoa(p, cx, cy, ri);
  for (const [x, y] of wedge(p, cx, cy, ri * 0.4, ri * 1.02, -40, 55, 9, 80)) food += P.kale(p, x, y, p.r(82, 96), p.r(0, 360));
  for (const [x, y] of wedge(p, cx, cy, ri * 0.35, ri * 0.98, 150, 232, 12, 66)) food += P.cube(p, x, y, p.r(60, 68), p.r(0, 90), ["#ffae5a", "#f07a24", "#c85a14"], { char: 0.6 });
  for (const [x, y] of wedge(p, cx, cy, ri * 0.35, ri * 0.98, 240, 305, 1, 1)) food += P.chickpeas(p, x, y, 120, 22);
  food += P.shreds(p, ...polar(cx, cy, 118, ri * 0.66), 100, 70, { w: 7 });
  food += P.avocadoFan(p, ...polar(cx, cy, 55, ri * 0.25), 1.35, 150, 6);
  food += P.cherryTomato(p, cx - 10, cy - 20, 40, { half: true, a: 30 });
  food += P.cherryTomato(p, cx - 70, cy + 40, 38, { half: true, a: 110 });
  const wave = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    wave.push([cx - 260 + 520 * t, cy - 120 + 240 * t + Math.sin(t * Math.PI * 5) * 45]);
  }
  food += P.drizzle(p, wave, { col: "#f3e2bf", w: 9 });
  food += P.beans(p, cx + 40, cy - 60, 90, 14, { col: ["#9fcf6a", "#5f9a3a", "#3f7a2a"], rx: 12, ry: 6.5 });
  food += P.sesame(p, cx, cy, ri * 0.85, 60);
  p.add(g(food, { clip: bowl.clipId }));
  p.add(bowl.over);
  return p;
};

/* ---------- Mains ---------- */

dishes["garlic-chicken-skewers"] = () => {
  const p = new Pic("skw", { seed: 57 });
  const cx = 500, cy = 500, R = 430;
  const pl = P.plate(p, cx, cy, R, { kind: "wood", well: 0.8 });
  p.add(pl.under);
  let food = "";
  food += P.parsley(p, cx - 250, cy - 140, 1.5, -70);
  food += P.parsley(p, cx + 190, cy + 250, 1.2, 120);
  // four skewers laid side by side, running bottom-left to top-right
  const dir = [0.65, -0.76], nrm = [0.76, 0.65];
  for (const k of [-1.5, -0.5, 0.5, 1.5]) {
    const ox = cx + nrm[0] * k * 118 + dir[0] * p.pm(20), oy = cy + nrm[1] * k * 118 + dir[1] * p.pm(20);
    const x0 = ox - dir[0] * 300, y0 = oy - dir[1] * 300, x1 = ox + dir[0] * 300, y1 = oy + dir[1] * 300;
    let sk = stick(p, x0 - dir[0] * 90, y0 - dir[1] * 90, x1 + dir[0] * 110, y1 + dir[1] * 110);
    for (let j = 0; j < 5; j++) {
      const t = 0.1 + j * 0.2;
      sk += chickenChunk(p, x0 + (x1 - x0) * t + p.pm(6), y0 + (y1 - y0) * t + p.pm(6), p.r(92, 104), p.r(0, 90));
    }
    food += sk;
  }
  food += P.seasoning(p, cx, cy, 250, 60, { cols: ["#b8321c", "#d8441e", "#2a1d14"] });
  p.add(food);
  p.add(P.lemonWheel(p, cx - 170, cy + 250, 64));
  return p;
};

dishes["spicy-miso-ramen"] = () => {
  const p = new Pic("ramen", { seed: 69 });
  const cx = 500, cy = 510, R = 440;
  const bowl = P.stonewareBowl(p, cx, cy, R, { glaze: ["#3c3834", "#1f1c1a", "#0f0d0c"], speck: [236, 226, 206], ri: 0.84 });
  p.add(bowl.under);
  const ri = bowl.ri;
  let food = P.broth(p, cx, cy, ri, { col: ["#ee9a4a", "#d0652a", "#9a3e16"] });
  // chili oil
  for (let i = 0; i < 6; i++) {
    const a = p.r(0, TAU), d = p.r(0.2, 0.8) * ri;
    food += `<path d="${smooth(blobPts(p, cx + Math.cos(a) * d, cy + Math.sin(a) * d, p.r(20, 40), { n: 10, jit: 0.3 }))}" fill="#c8260e" opacity="0.45"/>`;
  }
  food += P.noodles(p, cx - 90, cy + 40, 170, 30);
  food += P.nori(p, cx - 215, cy - 170, 130, 190, -30);
  food += P.chashu(p, cx + 150, cy - 170, 84, 20);
  food += P.chashu(p, cx + 215, cy - 60, 80, 60);
  food += P.softEgg(p, cx + 160, cy + 140, 1.0, -30);
  food += P.softEgg(p, cx + 40, cy + 230, 1.0, 20);
  food += P.corn(p, cx - 170, cy + 230, 55, 18);
  food += P.scallions(p, cx - 10, cy - 60, 95, 26);
  food += P.chiliThreads(p, cx + 40, cy - 20, 60, 12);
  food += P.sesame(p, cx, cy, ri * 0.7, 30);
  p.add(g(food, { clip: bowl.clipId }));
  p.add(bowl.over);
  p.add(chopsticks(p, cx - 60, cy + 60, cx + 480, cy - 420, 30));
  return p;
};

/* ---------- Burgers ---------- */

dishes["smash-burger"] = () => {
  const p = new Pic("smash", { seed: 81 });
  const cx = 500, cy = 500, R = 440;
  const pl = P.plate(p, cx, cy, R, { kind: "white", well: 0.8 });
  p.add(pl.under);
  p.add(P.fries(p, cx + 150, cy + 190, 110, 24));
  p.add(P.ramekin(p, cx + 250, cy - 170, 70));
  p.add(P.burgerSkirt(p, cx - 80, cy - 40, 215));
  p.add(P.bun(p, cx - 80, cy - 40, 215));
  return p;
};

dishes["halloumi-burger"] = () => {
  const p = new Pic("hallo", { seed: 93 });
  const cx = 500, cy = 500, R = 440;
  const pl = P.plate(p, cx, cy, R, { kind: "matte", well: 0.8 });
  p.add(pl.under);
  let side = "";
  for (let i = 0; i < 9; i++) side += P.lettuce(p, cx + 190 + p.pm(80), cy + 170 + p.pm(80), p.r(50, 64), p.r(0, 360));
  side += P.cherryTomato(p, cx + 150, cy + 150, 32, { half: true, a: 20 });
  side += P.cherryTomato(p, cx + 230, cy + 220, 30, { half: true, a: 120 });
  side += P.cucumberSlice(p, cx + 250, cy + 120, 36, 10);
  side += P.onionRing(p, cx + 190, cy + 240, 30, 1, 1.4);
  p.add(side);
  p.add(P.burgerSkirt(p, cx - 90, cy - 70, 210));
  p.add(P.bun(p, cx - 90, cy - 70, 210, { col: ["#f0a852", "#c06a22", "#7e3a10"], seeds: 30, gloss: 0.65 }));
  p.add(P.ramekin(p, cx - 250, cy + 250, 62, { sauce: ["#f5e6b8", "#dcc68a"] }));
  return p;
};

/* ---------- Desserts ---------- */

dishes["berry-pancakes"] = () => {
  const p = new Pic("pan", { seed: 105 });
  const cx = 500, cy = 500, R = 440;
  const pl = P.plate(p, cx, cy, R, { kind: "white", well: 0.78 });
  p.add(pl.under);
  p.add(P.pancakes(p, cx - 10, cy, 275));
  p.add(P.syrup(p, cx - 20, cy + 5, 165));
  p.add(P.butter(p, cx - 30, cy - 20, 76, 12));
  const berries = [[120, -150], [165, -110], [140, -70], [95, -110], [70, -175], [185, -170]];
  let top = "";
  for (const [dx, dy] of berries) top += P.blueberry(p, cx + dx, cy + dy, 19);
  top += P.strawberryHalf(p, cx + 150, cy + 60, 1.2, 30);
  top += P.strawberryHalf(p, cx + 90, cy + 120, 1.1, -20);
  top += P.strawberryHalf(p, cx - 170, cy + 140, 1.1, 200);
  top += P.mint(p, cx - 160, cy - 140, 1.1, -30);
  top += P.mint(p, cx - 120, cy - 170, 0.9, 40);
  p.add(top);
  p.add(P.dusting(p, cx, cy, 300, { density: 0.35 }));
  p.add(P.blueberry(p, cx - 330, cy + 150, 18) + P.blueberry(p, cx + 300, cy + 250, 18));
  return p;
};

dishes["molten-lava-cake"] = () => {
  const p = new Pic("lava", { seed: 117 });
  const cx = 500, cy = 500, R = 440;
  const pl = P.plate(p, cx, cy, R, { kind: "white", well: 0.8 });
  p.add(pl.under);
  p.add(P.dots(p, cx - 40, cy - 40, 300, 160, ["#ffffff", "#f3eee6", "#6a3a22"], [1, 2.2]));
  p.add(P.lavaCake(p, cx - 60, cy - 10, 200, { spill: 40 }));
  p.add(P.scoop(p, cx + 190, cy - 200, 92));
  p.add(P.mint(p, cx + 205, cy - 240, 0.85, 35));
  p.add(P.raspberry(p, cx - 250, cy + 170, 30) + P.raspberry(p, cx - 200, cy + 225, 28) + P.raspberry(p, cx - 265, cy + 240, 27));
  p.add(P.mint(p, cx - 215, cy + 170, 0.9, -60));
  p.add(P.blueberry(p, cx + 255, cy - 40, 18) + P.raspberry(p, cx + 250, cy + 10, 24));
  return p;
};

dishes["acai-bowl"] = () => {
  const p = new Pic("acai", { seed: 129 });
  const cx = 500, cy = 500, R = 440;
  const bowl = P.coconutBowl(p, cx, cy, R);
  p.add(bowl.under);
  const ri = bowl.ri;
  let food = P.acai(p, cx, cy, ri);
  // diagonal bands of toppings
  for (let i = 0; i < 6; i++) food += P.bananaSlice(p, cx - 270 + i * 78, cy - 230 + i * 58, 46);
  food += P.granola(p, cx - 60, cy + 40, 150, 110);
  for (let i = 0; i < 5; i++) food += P.strawberrySlice(p, cx + 90 + i * 45, cy + 150 - i * 70, 1.25, 30 + i * 8);
  for (const [dx, dy] of [[-200, 160], [-160, 205], [-115, 245], [-235, 110], [-150, 150], [-75, 215], [-190, 250], [-250, 185], [-40, 260]]) food += P.blueberry(p, cx + dx, cy + dy, 22);
  food += P.coconutFlakes(p, cx + 150, cy - 170, 110, 14);
  food += P.dots(p, cx, cy, ri * 0.85, 80, ["#1c1a18", "#2f2a26", "#4a4038"], [1.2, 2.2]);
  food += P.drizzle(p, [[cx - 260, cy + 30], [cx - 150, cy - 30], [cx - 20, cy + 60], [cx + 100, cy - 20], [cx + 230, cy + 20]], { col: "#f2b632", w: 8, hi: "#fff2c0" });
  food += P.mint(p, cx + 40, cy - 150, 1.1, 20);
  p.add(g(food, { clip: bowl.clipId }));
  p.add(bowl.over);
  return p;
};

/* ---------- Drinks ---------- */

dishes["iced-matcha-latte"] = () => {
  const p = new Pic("matcha", { seed: 141 });
  const cx = 500, cy = 510;
  p.add(coaster(p, cx, cy, 420));
  const gl = P.glass(p, cx, cy, 330, { liquid: ["#a6c46a", "#7ea14a", "#5f8436"] });
  p.add(`<circle cx="${cx + 20}" cy="${cy + 30}" r="330" fill="#4a5a2a" opacity="0.25" filter="url(#${p.blur(20)})"/>`);
  p.add(gl.under);
  let liq = "";
  const swirl = [];
  for (let t = 0; t < 2.4 * TAU; t += 0.3) {
    const rr = 30 + t * 34;
    swirl.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]);
  }
  liq += `<path d="${require("./lib.cjs").smoothOpen(swirl)}" stroke="#f3f1dc" stroke-width="46" fill="none" stroke-linecap="round" opacity="0.75" filter="url(#${p.blur(9)})"/>`;
  liq += `<path d="${require("./lib.cjs").smoothOpen(swirl)}" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.5" filter="url(#${p.blur(4)})"/>`;
  liq += P.iceCube(p, cx - 110, cy - 90, 118, 18);
  liq += P.iceCube(p, cx + 100, cy - 60, 110, -12);
  liq += P.iceCube(p, cx - 40, cy + 110, 112, 40);
  liq += P.iceCube(p, cx + 150, cy + 120, 96, 8);
  p.add(g(liq, { clip: gl.clipId }));
  p.add(gl.over);
  p.add(P.straw(p, cx + 20, cy + 10, cx + 330, cy - 330, { col: "#2f4a34" }));
  p.add(P.mint(p, cx - 285, cy + 265, 1.15, -140));
  return p;
};

dishes["mint-lemonade"] = () => {
  const p = new Pic("lemon", { seed: 153 });
  const cx = 500, cy = 510;
  p.add(coaster(p, cx, cy, 420));
  const gl = P.glass(p, cx, cy, 330, { liquid: ["#fff6c4", "#f9e57e", "#eccb3e"] });
  p.add(`<circle cx="${cx + 20}" cy="${cy + 30}" r="330" fill="#a08020" opacity="0.2" filter="url(#${p.blur(20)})"/>`);
  p.add(gl.under);
  let liq = P.bubbles(p, cx, cy, 280, 40);
  liq += P.lemonWheel(p, cx - 90, cy - 70, 100);
  liq += P.lemonWheel(p, cx + 110, cy + 90, 92);
  liq += P.iceCube(p, cx + 120, cy - 110, 104, 20);
  liq += P.iceCube(p, cx - 130, cy + 120, 108, -15);
  liq += P.mint(p, cx + 10, cy - 10, 1.4, 60) + P.mint(p, cx - 10, cy + 20, 1.2, 150) + P.mint(p, cx + 30, cy + 30, 1.0, -80);
  p.add(g(liq, { clip: gl.clipId }));
  p.add(gl.over);
  p.add(P.straw(p, cx - 30, cy, cx + 300, cy - 360, { col: "#ffffff", stripe: "#f2c21e" }));
  return p;
};

dishes["flat-white"] = () => {
  const p = new Pic("flat", { seed: 165 });
  const cx = 470, cy = 500;
  const cup = P.cupSaucer(p, cx, cy, { saucer: 380, cup: 215, handleA: 20 });
  p.add(cup.under);
  const crema = p.radial([[0, "#d9a066"], [0.55, "#b8743a"], [0.85, "#8a4e22"], [1, "#6a3814"]], { cx: 0.5, cy: 0.5, r: 0.5 });
  let c = `<circle cx="${cx}" cy="${cy}" r="${f(cup.ri)}" fill="url(#${crema})"/>`;
  const tex = p.noise({ freq: 0.04, oct: 3, rgb: [240, 200, 150], gain: 2.4, bias: -1.3, seed: 12 });
  c += `<circle cx="${cx}" cy="${cy}" r="${f(cup.ri)}" fill="#000" opacity="0.4" filter="url(#${tex})"/>`;
  c += P.latteArt(p, cx, cy + 8, cup.ri * 0.95, 110);
  p.add(g(c, { clip: cup.clipId }));
  p.add(cup.over);
  p.add(P.spoon(p, cx - 171, cy + 246, 236, 125));
  // biscuit
  const bis = p.radial([[0, "#e6b56a"], [0.8, "#c98a3e"], [1, "#a86a28"]], { cx: 0.4, cy: 0.38, r: 0.65 });
  p.add(g(`<circle r="62" fill="url(#${bis})"/>` + P.dots(p, 0, 0, 46, 26, ["#8a5a22", "#fff1c8"], [1.5, 3.2]), { t: `translate(${cx - 200} ${cy - 205})`, filter: p.ds(3, 6, 5, 0.35) }));
  return p;
};

module.exports = dishes;
