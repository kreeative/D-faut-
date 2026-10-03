/* ============================================================
   The Bakery — landing page
   Today's bakes, hours and credits come from the ordering app's
   own settings (order/js/config.js), so both stay in step.
   ============================================================ */
(function () {
  "use strict";

  const R = window.RESTAURANT;
  if (!R) return;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = new Intl.NumberFormat(R.locale, { style: "currency", currency: R.currency });
  const timeFmt = new Intl.DateTimeFormat(R.locale, { hour: "numeric", minute: "2-digit" });

  /* ---------- Today's bakes ---------- */
  const PICKS = ["butter-croissant", "pain-au-chocolat", "chunk-cookie", "baguette", "sourdough", "butter-pretzel", "pink-cupcake", "macarons"];
  const grid = $("[data-bakes]");
  if (grid) {
    grid.innerHTML = PICKS.map((id) => R.dishes.find((d) => d.id === id)).filter(Boolean).map((d) =>
      '<li class="bake"><a href="order/#/dish/' + d.id + '">' +
      '<img src="assets/menu/' + d.id + '-400.webp" srcset="assets/menu/' + d.id + "-400.webp 400w, assets/menu/" + d.id + '-800.webp 800w" ' +
      'sizes="(min-width: 960px) 280px, 45vw" width="400" height="400" loading="lazy" alt="">' +
      '<span class="bake__name">' + esc(d.name) + "</span>" +
      '<span class="bake__meta"><span class="bake__price">' + money.format(d.price) + '</span><span class="bake__go">Order</span></span>' +
      "</a></li>"
    ).join("");
  }

  /* ---------- Hours, in the bakery's time zone ---------- */
  const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const toMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
  const label = (min) => timeFmt.format(new Date(2000, 0, 1, Math.floor(min / 60) % 24, min % 60));
  const now = (() => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: R.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
      .formatToParts(new Date()).reduce((o, p) => ((o[p.type] = p.value), o), {});
    return { dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday), min: Number(parts.hour) * 60 + Number(parts.minute) };
  })();
  const ranges = (dow) => (R.hours[dow] || []).map(([a, b]) => [toMin(a), toMin(b)]);

  function status() {
    const open = ranges(now.dow).find(([a, b]) => now.min >= a && now.min < b);
    if (open) return '<span class="dot dot--open"></span>Open now · until ' + label(open[1]);
    for (let i = 0; i < 7; i++) {
      const dow = (now.dow + i) % 7;
      const next = ranges(dow).find(([a]) => i > 0 || a > now.min);
      if (next) {
        const day = i === 0 ? "" : i === 1 ? "tomorrow " : NAMES[dow] + " ";
        return '<span class="dot dot--closed"></span>Closed · opens ' + day + label(next[0]);
      }
    }
    return "";
  }
  document.querySelectorAll("[data-status]").forEach((n) => (n.innerHTML = status()));

  const hours = $("[data-hours] tbody");
  if (hours) {
    hours.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
      const rs = ranges(dow);
      const today = dow === now.dow;
      return "<tr" + (today ? ' class="is-today"' : "") + '><th scope="row">' + NAMES[dow] + (today ? " <span>Today</span>" : "") + "</th><td>" +
        (rs.length ? rs.map(([a, b]) => label(a) + " – " + label(b)).join(", ") : "Closed") + "</td></tr>";
    }).join("");
  }
  const addr = $("[data-address]");
  if (addr) addr.textContent = R.address.line1 + ", " + R.address.line2;
  const maps = $("[data-maps]");
  if (maps) maps.href = R.address.mapsUrl;

  /* ---------- Photo credits ---------- */
  const credits = $("[data-credits]");
  if (credits && window.PHOTO_CREDITS) {
    credits.innerHTML = window.PHOTO_CREDITS.map((c) => {
      const d = R.dishes.find((x) => x.id === c.item);
      const what = d ? d.name : c.item;
      const by = c.creator ? " by " + (c.creator_url ? '<a href="' + esc(c.creator_url) + '" target="_blank" rel="noopener">' + esc(c.creator) + "</a>" : esc(c.creator)) : "";
      const src = c.page ? ' on <a href="' + esc(c.page) + '" target="_blank" rel="noopener">' + esc(c.source) + "</a>" : "";
      const lic = c.license_url ? '<a href="' + esc(c.license_url) + '" target="_blank" rel="noopener">' + esc(c.license) + "</a>" : esc(c.license);
      return "<li><span>" + esc(what) + "</span>: " + (c.title ? "“" + esc(c.title) + "”" : "Photo") + by + src + ", " + lic + "</li>";
    }).join("");
  }

  /* Links to #credits (from the ordering app) open the list */
  const openCredits = () => { const d = $("#credits"); if (d && window.location.hash === "#credits") d.open = true; };
  window.addEventListener("hashchange", openCredits);
  openCredits();

  /* ---------- Nav shadow once the page moves ---------- */
  const nav = $("#nav");
  const onScroll = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
