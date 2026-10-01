/* Enregistre une vidéo verticale (1080 × 1920) du concept pour TikTok / Reels.
   Prérequis : Playwright (Chromium) et un serveur local à la racine du dépôt :
     python3 -m http.server 8123
     NODE_PATH=$(npm root -g) node docs/video/record.js
   Produit docs/video/out/tiktok-raw.webm ; convertir en H.264 avec ffmpeg :
     ffmpeg -ss 0.6 -i docs/video/out/tiktok-raw.webm -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -r 30 -movflags +faststart -an docs/video/concept-gouv-ci-tiktok.mp4 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:8123';
const OUT = process.env.OUT || path.resolve(__dirname, 'out');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } }
  });
  const page = await ctx.newPage();
  const video = page.video();
  await page.goto(BASE + '/docs/video/stage.html', { waitUntil: 'load' });
  const frame = page.frame({ name: 'site' });
  await frame.waitForLoadState('load');
  await frame.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.fonts.ready);

  await frame.evaluate(() => {
    window.__scrollTo = (y, dur) => new Promise((res) => {
      const start = window.scrollY, d = y - start, t0 = performance.now();
      const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
      const step = (now) => { const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, start + d * ease(p)); if (p < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
    window.__y = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + window.scrollY : 0; };
    window.__type = async (sel, text, delay) => {
      const el = document.querySelector(sel); el.focus(); el.value = '';
      for (const ch of text) { el.value += ch; el.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((r) => setTimeout(r, delay)); }
    };
  });

  const cap = (k, h) => page.evaluate(([k, h]) => window.stage.caption(k, h), [k, h]);
  const scrollTo = (sel, offset, dur) => frame.evaluate(([s, o, d]) => window.__scrollTo(Math.max(0, window.__y(s) + o), d), [sel, offset, dur]);
  const tapOn = async (sel) => {
    const r = await frame.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, sel);
    await page.evaluate((p) => window.stage.tapFrame(p.x, p.y), r);
  };
  // dispatchEvent plutôt que .click() : les tracés SVG de la carte n'ont pas de méthode click()
  const click = (sel) => frame.evaluate((s) => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), sel);

  await sleep(700);
  // 1. Accroche
  await cap('Concept non officiel', "J'ai redesigné le site du <em>Gouvernement ivoirien.</em>");
  await sleep(3400);

  // 2. Recherche
  await cap('Recherche', 'Une recherche qui <em>comprend</em> vos démarches.');
  await scrollTo('#recherche', -150, 900);
  await sleep(300);
  await frame.evaluate(() => window.__type('#q', 'passeport', 105));
  await sleep(1900);
  await frame.evaluate(() => document.getElementById('q').blur());

  // 3. Démarches (bento)
  await cap('Démarches', 'Les démarches les plus demandées, <em>dès le premier écran.</em>');
  await scrollTo('#services', -30, 1400);
  await sleep(1100);
  await frame.evaluate(() => window.__scrollTo(window.scrollY + 760, 1700));
  await sleep(800);

  // 4. Carte des districts
  await cap('Ma localité', "Touchez votre district : <em>tout s'adapte.</em>");
  await scrollTo('.map-wrap', -130, 1500);
  await sleep(700);
  await tapOn('[data-district-path="montagnes"]'); await click('[data-district-path="montagnes"]');
  await sleep(950);
  await tapOn('[data-district-path="savanes"]'); await click('[data-district-path="savanes"]');
  await sleep(950);
  await scrollTo('#pres-de-chez-vous', -120, 1300);
  await sleep(1900);

  // 5. Actualités et galerie
  await cap('Actualités', 'Actualités et galerie, <em>en mode magazine.</em>');
  await scrollTo('#actualites', -30, 1500);
  await sleep(1300);
  await scrollTo('#galerie', -30, 1500);
  await sleep(1500);

  // 6. Assistant
  await cap('Akwaba', "L'assistant qui <em>vous guide.</em>");
  await click('.assist__toggle');
  await sleep(900);
  await frame.evaluate(() => window.__type('#assist-input', 'acte de naissance', 85));
  await sleep(350);
  await frame.evaluate(() => document.getElementById('assist-form').requestSubmit());
  await sleep(2700);

  // 7. Carte de fin
  await page.evaluate(() => window.stage.end());
  await sleep(4200);

  await ctx.close();
  const p = await video.path();
  const dest = path.join(OUT, 'tiktok-raw.webm');
  fs.renameSync(p, dest);
  console.log('video:', dest, Math.round(fs.statSync(dest).size / 1024), 'KB');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
