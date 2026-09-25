/* =====================================================================
   BORDEAUX — invitation logic (vanilla JS, no dependencies)
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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const safe = (fn) => { try { return fn(); } catch { return null; } };
  const RSVP_KEY = "invite-rsvp:" + (C.couple && C.couple.names);

  // Personal link: ?to=Sophie%20%26%20Tom
  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || params.get("guest") || "").replace(/\s+/g, " ").trim().slice(0, 60);

  /* ------------------------------------------------------------------
     Content: copy config values into the page
     ------------------------------------------------------------------ */
  function bindContent() {
    document.documentElement.lang = C.lang || "en";
    if (C.pageTitle) document.title = C.pageTitle;
    if (C.hero && C.hero.blackAndWhite !== false) document.body.classList.add("bw");

    $$("[data-t]").forEach((el) => {
      const v = get(el.dataset.t);
      if (v == null || v === "") el.hidden = true;
      else el.textContent = v;
    });
    $$("[data-ph]").forEach((el) => { el.placeholder = get(el.dataset.ph) || ""; });
    $$("[data-src]").forEach((el) => {
      const src = get(el.dataset.src);
      if (src) el.src = src;
      else (el.closest("figure") || el).hidden = true;
    });
    $$("[data-lines]").forEach((el) => {
      String(get(el.dataset.lines) || "").split("\n").forEach((line, i) => {
        const span = document.createElement("span");
        span.textContent = line;
        span.style.setProperty("--i", i);
        el.appendChild(span);
      });
    });
    $$("[data-guest]").forEach((el) => { el.textContent = guest || get("envelope.defaultGuest") || ""; });

    const mono = get("couple.monogram") || "";
    $$(".seal-mono").forEach((t) => {
      t.textContent = mono;
      if (mono.length > 3) t.style.fontSize = Math.max(14, 27 - (mono.length - 3) * 4) + "px";
    });

    const title = $(".title");
    if (title) title.setAttribute("aria-label", [get("hero.overlay"), get("hero.script"), "·", get("hero.kicker")].filter(Boolean).join(" "));

    const pm = $("#postmarkText");
    if (pm) {
      pm.textContent = [get("rsvp.postmark"), get("footer.date"), ""].filter((x) => x != null).join("  ·  ");
      pm.setAttribute("textLength", "246");
    }

    const credit = get("footer.credit");
    if (credit && credit.text) {
      const box = $("#credit"), a = box.querySelector("a");
      a.textContent = credit.text;
      if (credit.url) a.href = credit.url; else a.removeAttribute("href");
      box.hidden = false;
    }
  }

  // Shrink one-line titles (long names) so they never overflow
  function fitText() {
    $$(".title__script").forEach((el) => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > 34) {
        size -= 2;
        el.style.fontSize = size + "px";
      }
    });
  }

  /* ------------------------------------------------------------------
     Lists: story, tags, colours, schedule, notes, film strip
     ------------------------------------------------------------------ */
  function renderLists() {
    const story = get("story.chapters") || [];
    const chapters = $("#chapters"), tplC = $("#tplChapter");
    story.forEach((ch) => {
      const node = tplC.content.firstElementChild.cloneNode(true);
      const img = node.querySelector("img");
      img.src = ch.photo; img.alt = ch.caption || ch.title || ""; img.loading = "lazy";
      node.querySelector("figcaption").textContent = ch.caption || "";
      node.querySelector(".chapter__date").textContent = ch.date || "";
      node.querySelector(".chapter__title").textContent = ch.title || "";
      node.querySelector(".chapter__body").textContent = ch.text || "";
      chapters.appendChild(node);
    });
    if (!story.length) $("#story").hidden = true;

    const tags = $("#tags"), tplT = $("#tplTag");
    (get("details.events") || []).forEach((ev, i) => {
      const node = tplT.content.firstElementChild.cloneNode(true);
      node.style.setProperty("--len", (i % 2 ? 46 : 28) + "px");
      node.style.setProperty("--d", i * 0.25 + "s");
      node.querySelector(".tag__label").textContent = ev.label || "";
      node.querySelector(".tag__time").textContent = ev.time || "";
      node.querySelector(".tag__place").textContent = ev.place || "";
      node.querySelector(".tag__address").textContent = ev.address || "";
      const a = node.querySelector(".tag__map");
      const url = ev.map || (ev.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ev.address) : "");
      if (url) { a.href = url; a.querySelector("span").textContent = get("details.mapLabel") || "Map"; }
      else a.hidden = true;
      tags.appendChild(node);
    });

    const colors = get("dressCode.colors") || [];
    const chips = $("#chips");
    colors.forEach((c, i) => {
      const li = document.createElement("li");
      li.style.setProperty("--c", c.hex);
      li.style.setProperty("--r", ((i - (colors.length - 1) / 2) * 4.5).toFixed(1) + "deg");
      li.innerHTML = "<i></i><span></span>";
      li.querySelector("span").textContent = c.name || "";
      chips.appendChild(li);
    });
    if (!C.dressCode) $(".dress").hidden = true;

    const timeline = $("#timeline");
    (get("schedule.items") || []).forEach((it, i) => {
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.innerHTML = '<span class="t"></span><span class="x"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13l5 5L21 5" /></svg>';
      li.querySelector(".t").textContent = it.time || "";
      li.querySelector(".x").textContent = it.text || "";
      timeline.appendChild(li);
    });
    if (!C.schedule) $("#schedule").hidden = true;

    const notes = $("#notesGrid");
    (get("notes.items") || []).forEach((n, i) => {
      const art = document.createElement("article");
      art.className = "sticky";
      art.dataset.reveal = "note";
      art.style.setProperty("--d", i * 0.12 + "s");
      art.innerHTML = '<span class="tape"></span><h3></h3><p></p>';
      art.querySelector("h3").textContent = n.title || "";
      art.querySelector("p").textContent = n.text || "";
      notes.appendChild(art);
    });
    if (!C.notes) $("#notes").hidden = true;

    const photos = get("gallery.photos") || [];
    const track = $("#filmTrack");
    if (!photos.length) { $("#gallery").hidden = true; return; }
    const base = [];
    while (base.length < Math.max(10, photos.length)) base.push(...photos.map((p, i) => ({ p, n: i })));
    const frame = (item, clone) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "frame";
      b.dataset.full = item.p.src;
      b.dataset.n = String(item.n + 1).padStart(2, "0") + "A  ▸";
      if (clone) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); }
      else b.setAttribute("aria-label", item.p.caption || "Photo");
      const img = new Image();
      img.src = item.p.src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      b.appendChild(img);
      return b;
    };
    base.forEach((it, i) => track.appendChild(frame(it, i >= photos.length)));
    base.forEach((it) => track.appendChild(frame(it, true)));
    track.style.animationDuration = base.length * 7 + "s";
    track.addEventListener("pointerdown", () => track.classList.add("is-paused"));
    ["pointerup", "pointercancel"].forEach((ev) => window.addEventListener(ev, () => track.classList.remove("is-paused")));
  }

  /* ------------------------------------------------------------------
     Envelope intro
     ------------------------------------------------------------------ */
  function intro() {
    const box = $("#intro");
    // deep links (e.g. …/#rsvp) skip the envelope
    if (location.hash.length > 1) { reveal(); return; }

    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      music.start();
      const k = reduceMotion ? 0.05 : 1;
      box.classList.add("is-open");
      setTimeout(() => box.classList.add("is-flipped"), 700 * k);
      setTimeout(() => {
        const r = $("#envelope").getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height * 0.35, 46);
      }, 900 * k);
      setTimeout(() => box.classList.add("is-leaving"), 2300 * k);
      setTimeout(reveal, 2500 * k);
    };
    $("#sealBtn").addEventListener("click", open);
    $("#envelope").addEventListener("click", open);
  }

  function reveal() {
    const body = document.body;
    body.classList.remove("is-sealed");
    body.classList.add("is-revealed");
    requestAnimationFrame(() => {
      fitText();
      startReveals();
      floatingChip();
    });
    setTimeout(() => { const i = $("#intro"); if (i) i.remove(); }, 1400);
  }

  /* ------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------ */
  function startReveals() {
    const items = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  function floatingChip() {
    const chip = $("#rsvpChip"), hero = $(".hero"), rsvp = $("#rsvp");
    if (!chip) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      // show between the main card and the RSVP postcard
      chip.classList.toggle("is-shown", hero.getBoundingClientRect().bottom < 0 && rsvp.getBoundingClientRect().top > window.innerHeight);
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
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
        $("#countdownGrid").hidden = true;
        $("#countdownAfter").hidden = false;
        return;
      }
      const parts = [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60];
      parts.forEach((v, i) => {
        const txt = String(v).padStart(2, "0");
        if (last[i] === txt) return;
        nums[i].textContent = txt;
        if (last[i] !== undefined && !reduceMotion) {
          nums[i].classList.remove("tick");
          void nums[i].offsetWidth;
          nums[i].classList.add("tick");
        }
        last[i] = txt;
      });
      setTimeout(tick, 1000 - (Date.now() % 1000) + 15);
    })();
  }

  function calendar() {
    const btn = $("#calBtn"), menu = $("#calMenu");
    const start = new Date(get("event.start"));
    if (isNaN(start)) { btn.closest(".cal").hidden = true; return; }
    const end = new Date(get("event.end") || +start + 6 * 36e5);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const first = (get("details.events") || [])[0] || {};
    const where = [first.place, first.address].filter(Boolean).join(", ") || get("event.city") || "";
    const title = get("event.calendarTitle") || get("couple.names") || "Wedding";
    const details = (get("event.calendarDetails") || "") + location.href.split("#")[0];

    $("#calGoogle").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + stamp(start) + "/" + stamp(end) +
      "&details=" + encodeURIComponent(details) +
      "&location=" + encodeURIComponent(where);

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

    const toggle = (open) => {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(menu.hidden); });
    document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) toggle(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
  }

  /* ------------------------------------------------------------------
     Instant camera: flash + a print that develops
     ------------------------------------------------------------------ */
  function camera() {
    const cam = $("#camera"), print = $("#print"), flash = $("#flash");
    if (!cam || !print) return;
    const img = print.querySelector("img");
    const photos = (get("gallery.photos") || []).map((p) => p.src);
    if (!photos.length) { cam.hidden = true; return; }
    let i = 0, busy = false;

    const eject = () => {
      img.src = photos[i++ % photos.length];
      print.className = "print";
      void print.offsetWidth;
      print.classList.add("is-out");
      setTimeout(() => print.classList.add("is-developed"), 650);
      setTimeout(() => { busy = false; }, 1000);
    };
    cam.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      cam.classList.add("is-used", "is-firing");
      setTimeout(() => cam.classList.remove("is-firing"), 260);
      if (!reduceMotion) {
        flash.classList.remove("is-on");
        void flash.offsetWidth;
        flash.classList.add("is-on");
      }
      if (print.classList.contains("is-out")) {
        print.classList.add("is-gone");
        setTimeout(eject, 420);
      } else eject();
    });
    print.addEventListener("click", () => {
      print.classList.add("is-gone");
      setTimeout(() => { print.className = "print"; }, 700);
    });
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
      const p = list[idx];
      img.src = p.src;
      img.alt = p.caption || "";
      cap.textContent = p.caption || "";
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

    document.addEventListener("click", (e) => {
      const hit = e.target.closest("[data-photo], .frame");
      if (hit) {
        const im = hit.querySelector("img");
        open(hit.dataset.full || (im && im.getAttribute("src")));
        return;
      }
      const b = e.target.closest("[data-lb]");
      if (b) { const a = b.dataset.lb; if (a === "close") close(); else show(idx + (a === "next" ? 1 : -1)); }
      else if (e.target === lb) close();
    });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
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
     RSVP
     ------------------------------------------------------------------ */
  function rsvp() {
    const form = $("#rsvpForm");
    if (!form) return;
    const R = C.rsvp || {}, L = R.labels || {};
    const out = $("#guestsOut"), input = $("#guestsInput"), err = $("#rsvpError"), submit = $("#rsvpSubmit");
    const label = submit.querySelector("span");
    const max = Math.max(1, parseInt(R.maxGuests, 10) || 1);
    let guests = 1;

    if (max === 1) $(".stepper", form).closest(".field").hidden = true;
    if (guest) form.elements.name.value = guest;

    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]");
      if (!b) return;
      guests = Math.min(max, Math.max(1, guests + Number(b.dataset.step)));
      out.textContent = input.value = guests;
    });
    form.addEventListener("change", (e) => {
      if (e.target.name === "attending") form.classList.toggle("is-no", e.target.value === "no");
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
      "RSVP — " + (get("couple.names") || ""),
      (L.name || "Name") + ": " + d.name,
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
      d.invitation = get("couple.names") || "";
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
          setTimeout(() => burst(r.left + r.width / 2, r.top + r.height / 2, 40), 250);
        }
      }
    }

    $("#rsvpAgain").addEventListener("click", () => {
      safe(() => localStorage.removeItem(RSVP_KEY));
      $("#thanks").hidden = true;
      form.hidden = false;
      form.reset();
      form.classList.remove("is-no");
      guests = 1;
      out.textContent = input.value = 1;
      if (guest) form.elements.name.value = guest;
      form.elements.name.focus();
    });

    const saved = safe(() => JSON.parse(localStorage.getItem(RSVP_KEY)));
    if (saved && saved.name) showThanks(saved, "", false);
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
     Petal confetti
     ------------------------------------------------------------------ */
  function burst(x, y, n) {
    if (reduceMotion || !Element.prototype.animate) return;
    const box = $("#confetti");
    const colors = ["#8c1c24", "#b3303b", "#6b1119", "#f2d6d2", "#e6cfa7", "#c9a45c", "#fff6ea"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      const s = 8 + Math.random() * 10;
      p.style.width = s + "px";
      p.style.height = s * 1.25 + "px";
      p.style.background = colors[i % colors.length];
      box.appendChild(p);
      const a = Math.random() * Math.PI * 2, v = 110 + Math.random() * 240;
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 180;
      const rot = Math.random() * 900 - 450;
      p.animate([
        { transform: `translate(${x}px, ${y}px) rotate(0deg) scale(.3)`, opacity: 1 },
        { transform: `translate(${x + dx * 0.7}px, ${y + dy * 0.7}px) rotate(${rot * 0.4}deg) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x + dx * 1.1}px, ${y + dy + 460 + Math.random() * 240}px) rotate(${rot}deg) scale(.85)`, opacity: 0 },
      ], { duration: 2000 + Math.random() * 1400, easing: "cubic-bezier(.15,.6,.35,1)", fill: "forwards" }).onfinish = () => p.remove();
    }
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    bindContent();
    renderLists();
    countdown();
    calendar();
    camera();
    lightbox();
    rsvp();
    intro();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fitText, 150); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
