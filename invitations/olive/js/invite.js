/* =====================================================================
   OLIVE — invitation logic (vanilla JS, no dependencies)
   Reads window.INVITE from config.js and brings the page to life.
   You shouldn't need to edit this file.
   ===================================================================== */
(function () {
  "use strict";

  const C = window.INVITE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const get = (path, obj = C) => String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const fill = (tpl, vars) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const safe = (fn) => { try { return fn(); } catch { return null; } };
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const names = [get("couple.first"), get("couple.second")].filter(Boolean).join(" & ");
  const RSVP_KEY = "invite-rsvp:" + names;

  // Personal link: ?to=Anna%20%26%20Luca
  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || params.get("guest") || "").replace(/\s+/g, " ").trim().slice(0, 60);

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ------------------------------------------------------------------
     Content
     ------------------------------------------------------------------ */
  function bindContent() {
    document.documentElement.lang = C.lang || "en";
    if (C.pageTitle) document.title = C.pageTitle;

    $$("[data-t]").forEach((n) => {
      const v = get(n.dataset.t);
      if (v == null || v === "") n.hidden = true;
      else n.textContent = v;
    });
    $$("[data-ph]").forEach((n) => { n.placeholder = get(n.dataset.ph) || ""; });
    $$("[data-src]").forEach((n) => {
      const v = get(n.dataset.src);
      if (v) n.src = v;
      else (n.closest("figure") || n).hidden = true;
    });
    $$("[data-srcset]").forEach((n) => {
      const v = get(n.dataset.srcset);
      if (v) n.srcset = v; else n.remove();
    });
    $$("[data-guest]").forEach((n) => { n.textContent = guest || get("cover.defaultGuest") || ""; });

    const mono = get("couple.monogram") || [];
    $$(".crest__l--1").forEach((t) => { t.textContent = mono[0] || ""; });
    $$(".crest__l--2").forEach((t) => { t.textContent = mono[1] || ""; });
    $$(".seal-mono").forEach((t) => { t.textContent = mono.join(" "); });

    const credit = get("footer.credit");
    if (credit && credit.text) {
      const box = $("#credit"), a = box.querySelector("a");
      a.textContent = credit.text;
      if (credit.url) a.href = credit.url; else a.removeAttribute("href");
      box.hidden = false;
    }
    const map = $("#venueMap");
    if (map) {
      const url = get("venue.map") || (get("venue.address") ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(get("venue.address").replace(/\n/g, ", ")) : "");
      if (url) map.href = url; else map.hidden = true;
    }
    if (get("hero.swans") === false) $("#swans").remove();
    const toggle = $("#navToggle");
    if (toggle) toggle.setAttribute("aria-label", get("menuLabel") || "Menu");
  }

  /* ------------------------------------------------------------------
     Lists
     ------------------------------------------------------------------ */
  function renderLists() {
    // navigation (desktop: split around the crest; mobile: full-screen menu)
    const links = get("nav") || [];
    const half = Math.ceil(links.length / 2);
    const item = (l, i) => {
      const li = el("li");
      const a = el("a", "", l.label);
      a.href = l.href;
      li.style.setProperty("--i", i);
      li.appendChild(a);
      return li;
    };
    links.forEach((l, i) => ($(i < half ? "#navL" : "#navR").appendChild(item(l, i))));
    links.forEach((l, i) => $("#menuLinks").appendChild(item(l, i)));

    // story milestones
    const ms = $("#milestones");
    (get("story.milestones") || []).forEach((m, i) => {
      const li = el("li", "milestone");
      li.dataset.reveal = "";
      li.style.setProperty("--d", i * 0.15 + "s");
      li.append(el("p", "milestone__year", m.year), el("span", "milestone__dot"), el("h3", "milestone__title", m.title), el("p", "milestone__text", m.text));
      ms.appendChild(li);
    });
    if (!ms.children.length) ms.remove();

    // details
    const list = $("#detailsList");
    const details = get("details") || [];
    details.forEach((d, i) => {
      const art = el("article", "detail");
      art.dataset.reveal = "";
      art.append(el("h3", "script detail__title", d.title), el("p", "detail__text", d.text));
      if (d.colors && d.colors.length) {
        const ul = el("ul", "swatches");
        d.colors.forEach((c) => {
          const li = el("li", "swatch");
          const dot = el("i");
          li.style.setProperty("--c", c.hex);
          li.append(dot, el("span", "", c.name));
          ul.appendChild(li);
        });
        art.appendChild(ul);
      }
      if (i < details.length - 1) {
        const sv = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        sv.setAttribute("class", "sprig");
        sv.setAttribute("aria-hidden", "true");
        sv.innerHTML = '<use href="#sprig"></use>';
        art.appendChild(sv);
      }
      list.appendChild(art);
    });

    // schedule
    const tl = $("#timeline");
    (get("schedule.items") || []).forEach((it) => {
      const li = el("li", "tl-item");
      li.append(el("span", "tl-time", it.time), el("span", "tl-dot"), el("span", "tl-text", it.text));
      tl.appendChild(li);
    });
    if (!C.schedule) $("#schedule").hidden = true;

    // gallery
    const grid = $("#grid");
    const ratios = ["4 / 5", "1 / 1", "3 / 4", "4 / 3", "4 / 5", "1 / 1"];
    (get("gallery.photos") || []).forEach((p, i) => {
      const fig = el("figure", "tile");
      fig.tabIndex = 0;
      fig.dataset.photo = "";
      fig.dataset.full = p.src;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", p.caption || "Photo");
      fig.style.setProperty("--ar", ratios[i % ratios.length]);
      fig.style.setProperty("--d", (i % 3) * 0.12 + "s");
      const img = new Image();
      img.src = p.src; img.alt = p.caption || ""; img.loading = "lazy"; img.decoding = "async";
      fig.append(img, el("figcaption", "", p.caption || ""));
      grid.appendChild(fig);
    });
    if (!grid.children.length) $("#gallery").hidden = true;

    // FAQ accordion
    const acc = $("#accordion");
    (get("faq.items") || []).forEach((f, i) => {
      const box = el("div", "acc");
      box.dataset.reveal = "";
      box.style.setProperty("--d", i * 0.08 + "s");
      const q = el("button", "acc__q");
      q.type = "button";
      q.id = "faq-q" + i;
      q.setAttribute("aria-expanded", "false");
      q.setAttribute("aria-controls", "faq-a" + i);
      q.append(el("span", "", f.q), el("span", "acc__icon"));
      const a = el("div", "acc__a");
      a.id = "faq-a" + i;
      a.setAttribute("role", "region");
      a.setAttribute("aria-labelledby", q.id);
      const inner = el("div");
      inner.appendChild(el("p", "", f.a));
      a.appendChild(inner);
      q.addEventListener("click", () => {
        const open = !box.classList.contains("is-open");
        box.classList.toggle("is-open", open);
        q.setAttribute("aria-expanded", String(open));
      });
      box.append(q, a);
      acc.appendChild(box);
    });
    if (!C.faq) $("#faq").hidden = true;
  }

  /* ------------------------------------------------------------------
     Hero effects: floating motes + falling olive leaves
     ------------------------------------------------------------------ */
  function heroFx() {
    if (reduceMotion) return;
    const motes = $("#motes"), leaves = $("#leaves");
    for (let i = 0; i < 22; i++) {
      const m = el("i");
      m.style.cssText = `left:${rand(4, 96)}%;--s:${rand(2, 4.5).toFixed(1)}px;--t:${rand(14, 26).toFixed(1)}s;--delay:${rand(-26, 0).toFixed(1)}s;--dx:${rand(-60, 60).toFixed(0)}px`;
      motes.appendChild(m);
    }
    for (let i = 0; i < 7; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.innerHTML = '<use href="#leaf"></use>';
      s.setAttribute("viewBox", "0 0 40 14");
      s.style.cssText = `left:${rand(-5, 90)}%;--s:${rand(22, 36).toFixed(0)}px;--t:${rand(16, 28).toFixed(1)}s;--delay:${rand(-28, 0).toFixed(1)}s;--dx:${rand(40, 220).toFixed(0)}px;--rot:${rand(240, 720).toFixed(0)}deg`;
      leaves.appendChild(s);
    }
  }

  /* ------------------------------------------------------------------
     Gatefold cover
     ------------------------------------------------------------------ */
  function cover() {
    const gate = $("#gate");
    // deep links (e.g. …/#rsvp) skip the cover
    if (location.hash.length > 1) { reveal(); return; }
    requestAnimationFrame(() => setTimeout(() => gate.classList.add("is-drawn"), 60));
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      music.start();
      gate.classList.add("is-open");
      setTimeout(reveal, reduceMotion ? 50 : 1500);
    };
    $("#gateOpen").addEventListener("click", open);
    $("#gateSeal").addEventListener("click", open);
  }

  function reveal() {
    document.body.classList.remove("is-sealed");
    document.body.classList.add("is-revealed");
    requestAnimationFrame(() => {
      startReveals();
      floatingUi();
    });
    setTimeout(() => { const g = $("#gate"); if (g) g.remove(); }, 2600);
  }

  /* ------------------------------------------------------------------
     Scroll-driven bits: reveals, nav, parallax, timeline, chip
     ------------------------------------------------------------------ */
  function startReveals() {
    const items = $$("[data-reveal], .tile, .tl-item");
    if (!("IntersectionObserver" in window)) { items.forEach((n) => n.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach((n) => io.observe(n));
  }

  function floatingUi() {
    const nav = $("#nav"), hero = $("#hero"), chip = $("#rsvpChip"), rsvp = $("#rsvp");
    const par = reduceMotion ? [] : $$("[data-parallax]");
    const tl = $("#timeline");
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const past = hero.getBoundingClientRect().bottom < 90;
      nav.classList.toggle("is-solid", past && !nav.classList.contains("is-menu"));
      const r = rsvp.getBoundingClientRect();
      chip.classList.toggle("is-shown", past && r.top > vh);
      par.forEach((n) => {
        const b = n.getBoundingClientRect();
        if (b.bottom < -200 || b.top > vh + 200) return;
        const f = parseFloat(n.dataset.parallax) || 0;
        n.style.setProperty("--py", ((b.top + b.height / 2 - vh / 2) * f).toFixed(1) + "px");
      });
      if (tl) {
        const t = tl.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.62 - t.top) / t.height));
        tl.style.setProperty("--p", p.toFixed(3));
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function menu() {
    const nav = $("#nav"), btn = $("#navToggle"), m = $("#menu");
    const set = (open) => {
      m.hidden = !open;
      nav.classList.toggle("is-menu", open);
      btn.setAttribute("aria-expanded", String(open));
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (!open) window.dispatchEvent(new Event("scroll"));
    };
    btn.addEventListener("click", () => set(m.hidden));
    m.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) set(false); });
  }

  /* ------------------------------------------------------------------
     Countdown + calendar
     ------------------------------------------------------------------ */
  function countdown() {
    const target = Date.parse(get("event.start"));
    const nums = $$("[data-cd]");
    if (!isFinite(target) || !nums.length) return;
    const last = [];
    (function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        $("#counter").hidden = true;
        $("#countdownAfter").hidden = false;
        return;
      }
      [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60].forEach((v, i) => {
        const txt = String(v).padStart(2, "0");
        if (last[i] === txt) return;
        nums[i].textContent = txt;
        if (last[i] !== undefined && !reduceMotion) {
          nums[i].classList.remove("roll");
          void nums[i].offsetWidth;
          nums[i].classList.add("roll");
        }
        last[i] = txt;
      });
      setTimeout(tick, 1000 - (Date.now() % 1000) + 15);
    })();
  }

  function calendar() {
    const btn = $("#calBtn"), menuEl = $("#calMenu");
    const start = new Date(get("event.start"));
    if (isNaN(start)) { btn.closest(".cal").hidden = true; return; }
    const end = new Date(get("event.end") || +start + 6 * 36e5);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const where = [get("venue.name"), String(get("venue.address") || "").replace(/\n/g, ", ")].filter(Boolean).join(", ") || get("event.place") || "";
    const title = get("event.calendarTitle") || names || "Wedding";
    const details = (get("event.calendarDetails") || "") + location.href.split("#")[0];

    $("#calGoogle").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + stamp(start) + "/" + stamp(end) +
      "&details=" + encodeURIComponent(details) +
      "&location=" + encodeURIComponent(where);

    const toggle = (open) => {
      menuEl.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    };
    const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
    $("#calIcs").addEventListener("click", () => {
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:" + stamp(start) + "-" + Math.random().toString(36).slice(2) + "@invitation",
        "DTSTAMP:" + stamp(new Date()),
        "DTSTART:" + stamp(start), "DTEND:" + stamp(end),
        "SUMMARY:" + esc(title), "LOCATION:" + esc(where), "DESCRIPTION:" + esc(details),
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + esc(title), "END:VALARM",
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = "wedding.ics";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toggle(false);
    });
    btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(menuEl.hidden); });
    document.addEventListener("click", (e) => { if (!menuEl.hidden && !menuEl.contains(e.target)) toggle(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
  }

  /* ------------------------------------------------------------------
     RSVP: envelope → card → form → thank you
     ------------------------------------------------------------------ */
  function rsvp() {
    const env = $("#envelope"), card = $("#rsvpCard"), form = $("#rsvpForm");
    if (!form) return;
    const R = C.rsvp || {}, L = R.labels || {};
    const err = $("#rsvpError"), submit = $("#rsvpSubmit"), label = submit.querySelector("span");
    env.setAttribute("aria-label", (get("rsvp.script") || "RSVP") + " — " + (get("rsvp.envelopeHint") || "open"));

    const max = Math.max(1, parseInt(R.maxGuests, 10) || 1);
    const sel = $("#guestsSelect");
    for (let i = 1; i <= max; i++) { const o = el("option", "", String(i)); o.value = i; sel.appendChild(o); }
    if (max === 1) $("#guestsField").hidden = true;
    if (guest) form.elements.name.value = guest;

    const showCard = (animate) => {
      env.hidden = true;
      card.hidden = false;
      if (!animate) card.style.animation = "none";
    };
    env.addEventListener("click", () => {
      if (env.classList.contains("is-open")) return;
      env.classList.add("is-open");
      const k = reduceMotion ? 0.05 : 1;
      setTimeout(() => env.classList.add("is-flipped"), 380 * k);
      setTimeout(() => env.classList.add("is-gone"), 1500 * k);
      setTimeout(() => {
        showCard(true);
        const r = card.getBoundingClientRect();
        if (r.top < 0 || r.top > window.innerHeight * 0.5) card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        form.elements.name.focus({ preventScroll: true });
      }, 1950 * k);
    });

    form.addEventListener("change", (e) => {
      if (e.target.name !== "attending") return;
      $$(".choice__opt", form).forEach((o) => o.classList.toggle("is-checked", o.querySelector("input").checked));
      form.classList.toggle("is-no", e.target.value === "no");
    });

    form.addEventListener("input", () => { err.hidden = true; });
    const showError = (msg) => {
      err.textContent = msg;
      err.hidden = false;
      form.classList.remove("is-shaking");
      void form.offsetWidth;
      form.classList.add("is-shaking");
    };
    const message = (d) => [
      "RSVP — " + names,
      (L.name || "Name") + ": " + d.name,
      d.email ? (L.email || "Email") + ": " + d.email : "",
      (L.attending || "Attending") + ": " + (d.attending === "yes" ? L.yes : L.no),
      d.attending === "yes" ? (L.guests || "Guests") + ": " + d.guests : "",
      d.diet ? (L.diet || "Diet") + ": " + d.diet : "",
      d.song ? (L.song || "Song") + ": " + d.song : "",
      d.message ? (L.message || "Message") + ": " + d.message : "",
    ].filter(Boolean).join("\n");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const d = Object.fromEntries(new FormData(form).entries());
      d.name = String(d.name || "").trim();
      if (!d.name || !d.attending) return showError(L.required || "Please fill in the form.");
      if (d.attending === "no") { d.guests = "0"; d.diet = ""; d.song = ""; }
      d.invitation = names;
      d.link_name = guest;
      d.sent_at = new Date().toISOString();

      form.classList.add("is-sending");
      label.textContent = L.sending || "…";
      try {
        let note = "";
        if (R.endpoint) {
          const res = await fetch(R.endpoint, { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams(d) });
          if (!res.ok) throw new Error("HTTP " + res.status);
        } else if (R.whatsapp) {
          window.open("https://wa.me/" + String(R.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(message(d)), "_blank", "noopener");
          note = L.whatsappDone || "";
        } else if (R.email) {
          location.href = "mailto:" + R.email + "?subject=" + encodeURIComponent("RSVP — " + d.name) + "&body=" + encodeURIComponent(message(d));
          note = L.emailDone || "";
        } else {
          await wait(900);
          note = L.demo || "";
        }
        showThanks(d, note, true);
        safe(() => localStorage.setItem(RSVP_KEY, JSON.stringify({ name: d.name, attending: d.attending })));
      } catch {
        showError(L.error || "Something went wrong.");
      } finally {
        form.classList.remove("is-sending");
        label.textContent = L.submit || "Send";
      }
    });

    function showThanks(d, note, celebrate) {
      const yes = d.attending === "yes";
      $("#thanksTitle").textContent = fill(yes ? R.thanksYesTitle : R.thanksNoTitle, { name: d.name });
      $("#thanksText").textContent = yes ? R.thanksYes || "" : R.thanksNo || "";
      $("#thanksNote").textContent = note || "";
      form.hidden = true;
      $("#thanks").hidden = false;
      if (celebrate) {
        $("#thanksTitle").focus({ preventScroll: true });
        if (yes) {
          const r = $(".thanks__seal").getBoundingClientRect();
          setTimeout(() => burst(r.left + r.width / 2, r.top + r.height / 2, 40), 300);
        }
      }
    }

    $("#rsvpAgain").addEventListener("click", () => {
      safe(() => localStorage.removeItem(RSVP_KEY));
      $("#thanks").hidden = true;
      form.hidden = false;
      form.reset();
      form.classList.remove("is-no");
      $$(".choice__opt", form).forEach((o) => o.classList.remove("is-checked"));
      if (guest) form.elements.name.value = guest;
      form.elements.name.focus();
    });

    const saved = safe(() => JSON.parse(localStorage.getItem(RSVP_KEY)));
    if (saved && saved.name) { showCard(false); showThanks(saved, "", false); }
  }

  /* ------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------ */
  function lightbox() {
    const lb = $("#lightbox");
    const img = lb.querySelector("img"), cap = lb.querySelector("figcaption");
    const L = C.lightbox || {};
    $("[data-lb=close]", lb).setAttribute("aria-label", L.close || "Close");
    $("[data-lb=prev]", lb).setAttribute("aria-label", L.prev || "Previous");
    $("[data-lb=next]", lb).setAttribute("aria-label", L.next || "Next");
    let list = [], idx = 0, lastFocus = null;

    const show = (n) => {
      idx = (n + list.length) % list.length;
      img.src = list[idx].src;
      img.alt = list[idx].caption || "";
      cap.textContent = list[idx].caption || "";
      img.style.animation = "none";
      void img.offsetWidth;
      img.style.animation = "";
    };
    const open = (src) => {
      const all = get("gallery.photos") || [];
      const found = all.findIndex((p) => p.src === src);
      list = found >= 0 ? all : [{ src, caption: "" }];
      lastFocus = document.activeElement;
      show(found >= 0 ? found : 0);
      lb.hidden = false;
      $$(".lightbox__prev, .lightbox__next", lb).forEach((b) => { b.hidden = list.length < 2; });
      document.documentElement.style.overflow = "hidden";
      $("[data-lb=close]", lb).focus();
    };
    const close = () => {
      lb.hidden = true;
      document.documentElement.style.overflow = "";
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    const hitOpen = (t) => {
      const hit = t.closest("[data-photo]");
      if (!hit) return false;
      const im = hit.querySelector("img");
      open(hit.dataset.full || (im && im.getAttribute("src")));
      return true;
    };
    document.addEventListener("click", (e) => {
      if (hitOpen(e.target)) return;
      const b = e.target.closest("[data-lb]");
      if (b) { const a = b.dataset.lb; if (a === "close") close(); else show(idx + (a === "next" ? 1 : -1)); }
      else if (e.target === lb) close();
    });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) {
        if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".tile")) { e.preventDefault(); hitOpen(e.target); }
        return;
      }
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
    let x0 = null;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45 && list.length > 1) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ------------------------------------------------------------------
     Music
     ------------------------------------------------------------------ */
  const music = (function () {
    const audio = $("#music"), btn = $("#musicBtn");
    const src = get("music.src");
    const labels = C.musicLabels || {};
    if (!audio || !btn || !src) return { start() {} };
    audio.src = src;
    btn.hidden = false;
    const set = (on) => {
      btn.classList.toggle("is-playing", on);
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? labels.pause || "Pause music" : labels.play || "Play music");
    };
    const play = () => audio.play().then(() => set(true)).catch(() => set(false));
    set(false);
    btn.addEventListener("click", () => (audio.paused ? play() : (audio.pause(), set(false))));
    return { start: play };
  })();

  /* ------------------------------------------------------------------
     Olive-leaf confetti
     ------------------------------------------------------------------ */
  function burst(x, y, n) {
    if (reduceMotion || !Element.prototype.animate) return;
    const box = $("#confetti");
    const colors = ["#6f7659", "#8c9570", "#a3aa8c", "#3d4430", "#c9ad6a", "#e9dfc4"];
    for (let i = 0; i < n; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 40 14");
      s.innerHTML = '<use href="#leaf"></use>';
      s.style.fill = colors[i % colors.length];
      const size = rand(14, 26);
      s.style.width = size + "px";
      s.style.height = size * 0.36 + "px";
      box.appendChild(s);
      const a = Math.random() * Math.PI * 2, v = rand(110, 330);
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 170;
      const rot = rand(-600, 600);
      s.animate([
        { transform: `translate(${x}px, ${y}px) rotate(0deg) scale(.3)`, opacity: 1 },
        { transform: `translate(${x + dx * 0.7}px, ${y + dy * 0.7}px) rotate(${rot * 0.4}deg) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x + dx * 1.15}px, ${y + dy + rand(420, 640)}px) rotate(${rot}deg) scale(.9)`, opacity: 0 },
      ], { duration: rand(2200, 3600), easing: "cubic-bezier(.15,.6,.35,1)", fill: "forwards" }).onfinish = () => s.remove();
    }
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    bindContent();
    renderLists();
    heroFx();
    menu();
    countdown();
    calendar();
    rsvp();
    lightbox();
    cover();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
