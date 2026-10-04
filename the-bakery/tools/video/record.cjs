/* Records a short film of The Bakery for the Kreeative case study.
   Runs in GitHub Actions (.github/workflows/the-bakery-video.yml):
   node record.cjs <base url> <frames dir>
   Frames come from Chrome's screencast with their timestamps, so the
   film keeps real time; ffmpeg turns them into an H.264 MP4. */
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PW_MODULE || "playwright");

const BASE = (process.argv[2] || "https://the-bakery-concept.vercel.app/").replace(/\/?$/, "/");
const OUT = process.argv[3] || "/tmp/frames";
const W = 1440, H = 900;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* A cursor drawn into the page, so the clicks read on video */
const CURSOR = `(() => {
  if (window.__cursor) return;
  const c = document.createElement("div");
  c.innerHTML = '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2l19 16-9 1.4L18 28l-4 1.8-5-9.2L3 26z" fill="#1d1018" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
  c.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:none";
  const ring = document.createElement("div");
  ring.style.cssText = "position:fixed;left:0;top:0;z-index:2147483646;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(238,122,175,.45);pointer-events:none;opacity:0;transform:scale(.4)";
  document.documentElement.append(ring, c);
  addEventListener("mousemove", (e) => { c.style.transform = "translate(" + (e.clientX - 3) + "px," + (e.clientY - 2) + "px)"; }, true);
  addEventListener("mousedown", (e) => {
    ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px";
    ring.animate([{ opacity: 1, transform: "scale(.4)" }, { opacity: 0, transform: "scale(1.5)" }], { duration: 520, easing: "ease-out" });
  }, true);
  window.__cursor = c;
})();`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, timezoneId: "America/Toronto" });
  /* the bakery is "open" during the film */
  await ctx.addInitScript({ content: `(() => { const real = Date; const t0 = new real("2026-10-06T09:40:00-04:00").getTime(); const start = real.now();
    class D extends real { constructor(...a) { super(...(a.length ? a : [t0 + (real.now() - start)])); } static now() { return t0 + (real.now() - start); } }
    window.Date = D; })();` });
  await ctx.addInitScript({ content: `addEventListener("DOMContentLoaded", () => { ${CURSOR} });` });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));

  const mouse = { x: W * 0.78, y: H + 40 };
  async function glide(x, y, ms = 600) {
    const x0 = mouse.x, y0 = mouse.y, t0 = Date.now();
    for (;;) {
      const k = Math.min(1, (Date.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      await page.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e);
      if (k >= 1) break;
      await wait(12);
    }
    mouse.x = x; mouse.y = y;
  }
  async function clickOn(sel, opts = {}) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    const b = await el.boundingBox();
    await glide(b.x + b.width * (opts.fx ?? 0.5), b.y + b.height * (opts.fy ?? 0.5), opts.ms ?? 700);
    await wait(opts.pause ?? 180);
    await page.mouse.down(); await wait(90); await page.mouse.up();
  }
  async function scrollTo(y, ms) {
    await page.evaluate(([to, dur]) => new Promise((done) => {
      const el = document.getElementById("mainScroll") && getComputedStyle(document.getElementById("mainScroll")).overflowY !== "visible"
        ? document.getElementById("mainScroll") : null;
      const get = () => (el ? el.scrollTop : scrollY);
      const set = (v) => (el ? (el.scrollTop = v) : window.scrollTo({ top: v, behavior: "instant" }));
      const from = get(), t0 = performance.now();
      const max = (el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - innerHeight);
      const target = Math.max(0, Math.min(max, to));
      (function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        set(from + (target - from) * e);
        if (k < 1) requestAnimationFrame(step); else done();
      })(t0);
    }), [y, ms]);
  }
  const yOf = (sel, offset = 0) => page.evaluate(([s, o]) => {
    const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY + o : 0;
  }, [sel, offset]);

  /* load everything before the camera rolls */
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 50)); }
    window.scrollTo({ top: 0, behavior: "instant" });
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await wait(800);

  /* roll */
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  let n = 0, paused = false, pausedAt = 0, shift = 0;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    if (!paused) {
      const file = path.join(OUT, String(n++).padStart(5, "0") + ".jpg");
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      frames.push({ file: path.basename(file), t: metadata.timestamp - shift });
    }
    try { await cdp.send("Page.screencastFrameAck", { sessionId }); } catch (e) { /* page closing */ }
  });
  const pause = () => { paused = true; pausedAt = Date.now() / 1000; };
  const resume = () => { shift += Date.now() / 1000 - pausedAt; paused = false; };
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 94, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now();
  const mark = (label) => console.log(((Date.now() - t0) / 1000).toFixed(1) + "s", label);

  mark("hero");
  await glide(W * 0.6, H * 0.5, 900);
  await wait(1100);
  mark("bakes");
  await scrollTo(await yOf("#bakes", -30), 1500);
  await glide(W * 0.38, H * 0.56, 500);
  await wait(700);
  mark("story");
  await scrollTo(await yOf("#story", -30), 1400);
  await wait(600);
  await scrollTo(await yOf(".story__cards", -300), 1000);
  await wait(800);
  mark("bags");
  await scrollTo(await yOf("#bags", -50), 1300);
  await wait(1000);
  mark("order");
  await clickOn(".nav__cta", { ms: 650 });
  await wait(220);
  pause();
  await page.waitForURL(/order\//);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))); });
  await page.mouse.move(mouse.x, mouse.y);
  await wait(500);
  resume();
  await wait(900);
  mark("stickers");
  await clickOn('.cat[data-cat="sweets"]', { ms: 650 });
  await wait(800);
  await clickOn('.cat[data-cat="cookies"]', { ms: 500 });
  await wait(800);
  mark("dish");
  await clickOn('a.card__link[href="#/dish/chunk-cookie"]', { ms: 600 });
  await wait(1100);
  if (await page.locator('.choice:has-text("Half dozen")').count()) { await clickOn('.choice:has-text("Half dozen")', { ms: 500 }); await wait(500); }
  mark("add");
  await clickOn(".cta--add", { ms: 500 });
  await wait(1400);
  mark("bag");
  await clickOn("#cartBtn", { ms: 600 });
  await wait(2200);
  mark("end");

  await cdp.send("Page.stopScreencast");
  await wait(300);
  fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify(frames));
  if (errs.length) process.exitCode = 1;
  console.log("frames", frames.length, "seconds", frames.length ? (frames[frames.length - 1].t - frames[0].t).toFixed(1) : 0, errs.length ? "errors: " + errs.join(" | ") : "no page errors");
  await browser.close();
})();
