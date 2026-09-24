"use strict";
/* ============================================================
   Renders the dish and garnish illustrations to transparent WebP.

     npm i -D playwright && npx playwright install chromium
     node tools/illustrations/export.cjs            # writes assets/dishes + assets/garnish
     node tools/illustrations/export.cjs --svg      # also keeps the SVG sources in tools/illustrations/svg

   Each illustration is generated from code (see dishes.cjs / garnish.cjs),
   so tweak a composition there and run this again.
   ============================================================ */
const fs = require("fs");
const path = require("path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  console.error("Playwright is needed to rasterise the art:\n  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const dishes = require("./dishes.cjs");
const garnish = require("./garnish.cjs");

const assets = path.join(__dirname, "..", "..", "assets");
const keepSvg = process.argv.includes("--svg");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const jobs = [
  ...Object.entries(dishes).map(([n, fn]) => ({ n, fn, dir: "dishes", px: 800, q: 0.84 })),
  ...Object.entries(garnish).map(([n, fn]) => ({ n, fn, dir: "garnish", px: 240, q: 0.86 })),
].filter((j) => !only.length || only.includes(j.n));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1 });
  let total = 0;
  for (const j of jobs) {
    const svg = j.fn().toString();
    if (keepSvg) {
      fs.mkdirSync(path.join(__dirname, "svg"), { recursive: true });
      fs.writeFileSync(path.join(__dirname, "svg", j.dir + "-" + j.n + ".svg"), svg);
    }
    await page.setViewportSize({ width: j.px, height: j.px });
    await page.setContent(
      '<html><body style="margin:0;background:transparent"><img id="i" width="' + j.px + '" height="' + j.px +
      '" src="data:image/svg+xml;base64,' + Buffer.from(svg).toString("base64") + '"></body></html>'
    );
    await page.waitForFunction(() => document.getElementById("i").complete);
    await page.waitForTimeout(60);
    const png = await page.screenshot({ omitBackground: true, type: "png" });
    const webp = await page.evaluate(async ({ b64, q, px }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = px;
      c.height = px;
      c.getContext("2d").drawImage(img, 0, 0);
      return c.toDataURL("image/webp", q).split(",")[1];
    }, { b64: png.toString("base64"), q: j.q, px: j.px });
    const buf = Buffer.from(webp, "base64");
    fs.mkdirSync(path.join(assets, j.dir), { recursive: true });
    fs.writeFileSync(path.join(assets, j.dir, j.n + ".webp"), buf);
    total += buf.length;
    console.log(j.dir + "/" + j.n + ".webp  " + (buf.length / 1024).toFixed(1) + " KB");
  }
  console.log("total " + (total / 1024).toFixed(0) + " KB");
  await browser.close();
})();
