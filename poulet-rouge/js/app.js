/* ============================================================
   App — routing, rendering and interactions
   Routes (hash based so the app runs from any static host):
     #/menu  #/favorites  #/orders  #/profile        main tabs
     #/dish/:id  #/cart  #/checkout  #/order/:id     order panel
     #/info                                           restaurant info
   ============================================================ */
(function () {
  "use strict";

  const S = window.Store;
  const V = window.Views;
  const B = window.Bowl;
  const I = window.I18N;
  const R = S.R;
  const t = I.t;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const wide = window.matchMedia("(min-width: 1024px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const el = {
    app: $(".app"),
    main: $("#main"),
    scroll: $("#mainScroll"),
    topbar: $("#topbar"),
    view: $("#view"),
    side: $("#side"),
    sideInner: $("#sideInner"),
    tabbar: $("#tabbar"),
    cartBtn: $("#cartBtn"),
    drawer: $("#drawer"),
    drawerPanel: $("#drawerPanel"),
    toast: $("#toast"),
  };

  const ui = {
    tab: "menu",
    category: "all",
    query: "",
    searchOpen: false,
    panel: null, // { type: "dish" | "cart" | "checkout" | "order", id }
    drawer: false,
    draft: null, // dish being configured
    newLine: null, // cart line to highlight
    confirmClear: false,
    confirmReset: false,
    scrollByTab: {},
  };

  let lastTrigger = null;
  let depth = 0;

  /* ----------------------------------------------------------
     Navigation
     ---------------------------------------------------------- */
  function currentPath() {
    const h = window.location.hash.replace(/^#/, "");
    return h && h.charAt(0) === "/" ? h : "/menu";
  }

  /* Hash history when the browser allows it; an in-memory stack when a
     sandboxed frame refuses history changes, so Back never leaves the app. */
  let historyOK = true;
  const memory = [];

  function navigate(path, opts) {
    opts = opts || {};
    if (historyOK) {
      try {
        if (opts.replace) window.history.replaceState({ depth }, "", "#" + path);
        else {
          window.history.pushState({ depth: depth + 1 }, "", "#" + path);
          depth += 1;
        }
      } catch (e) {
        historyOK = false;
      }
    }
    if (opts.replace && memory.length) memory[memory.length - 1] = path;
    else {
      memory.push(path);
      if (memory.length > 50) memory.shift();
    }
    route(path);
  }

  function goBack(fallback) {
    if (historyOK && depth > 0) return window.history.back();
    if (!historyOK && memory.length > 1) {
      memory.pop();
      return route(memory[memory.length - 1]);
    }
    navigate(fallback || "/menu", { replace: true });
  }

  window.addEventListener("popstate", (e) => {
    depth = e.state && Number.isFinite(e.state.depth) ? e.state.depth : 0;
    route(currentPath());
  });
  window.addEventListener("hashchange", () => route(currentPath()));

  let routeKey = "";
  function route(path) {
    const parts = path.split("/").filter(Boolean);
    const [a, b] = parts;
    const prev = { tab: ui.tab, panel: panelKey(ui.panel), side: sideKey(), drawer: ui.drawer };

    if (a === "info") {
      ui.drawer = true;
    } else {
      ui.drawer = false;
      if (a === "dish" && S.dish(b)) ui.panel = { type: "dish", id: b };
      else if (a === "cart") ui.panel = { type: "cart" };
      else if (a === "checkout") ui.panel = S.state.cart.length ? { type: "checkout" } : { type: "cart" };
      else if (a === "order") ui.panel = { type: "order", id: b };
      else {
        ui.panel = null;
        ui.tab = ["favorites", "orders", "profile"].includes(a) ? a : "menu";
      }
    }

    const key = ui.tab + "|" + panelKey(ui.panel) + "|" + ui.drawer;
    if (key === routeKey) return;
    routeKey = key;

    if (prev.tab !== ui.tab) {
      ui.scrollByTab[prev.tab] = mainScrollTop();
      ui.confirmReset = false;
      renderMain();
      enterView();
      setMainScroll(ui.scrollByTab[ui.tab] || 0);
      if (!ui.panel) focusMain();
    }
    if (prev.panel !== panelKey(ui.panel) || prev.side !== sideKey()) {
      if (!ui.panel || ui.panel.type !== "cart") ui.confirmClear = false;
      renderPanel({ focus: !!ui.panel });
    }
    if (prev.drawer !== ui.drawer) renderDrawer();
    renderChrome();
  }

  const panelKey = (p) => (p ? p.type + ":" + (p.id || "") : "");
  const sideKey = () => panelKey(resolvePanel().panel);

  /* ----------------------------------------------------------
     Rendering
     ---------------------------------------------------------- */
  function renderMain() {
    const tb = ui.tab;
    el.view.innerHTML =
      tb === "favorites" ? V.favoritesView() :
      tb === "orders" ? V.ordersView() :
      tb === "profile" ? V.profileView(ui) :
      V.menuView(ui);
    el.view.setAttribute("data-tab", tb);
  }

  /* Fade the new tab's content in. Only on a tab change: the same view also
     re-renders in place when its data changes, and that must not replay it. */
  function enterView() {
    if (reduceMotion.matches) return;
    el.view.classList.remove("is-entering");
    void el.view.offsetWidth; // restart the animation if it is still running
    el.view.classList.add("is-entering");
  }
  el.view.addEventListener("animationend", (e) => {
    if (e.target === el.view) el.view.classList.remove("is-entering");
  });

  function renderMenuList() {
    const list = $("#menuList");
    if (!list) return renderMain();
    list.innerHTML = V.menuList(ui);
    $$(".cat", el.view).forEach((b) => {
      const on = b.dataset.cat === ui.category && !ui.query.trim();
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on);
    });
  }

  /* Which view the side panel shows. On wide screens the menu and favorites
     keep it filled: the cart, or the bowl builder while the cart is empty.
     Orders and profile get the whole width until something is opened. */
  const SIDE_TABS = ["menu", "favorites"];
  function resolvePanel() {
    if (ui.panel) return { panel: ui.panel, isDefault: false };
    if (!wide.matches || !SIDE_TABS.includes(ui.tab)) return { panel: null, isDefault: true };
    if (S.state.cart.length) return { panel: { type: "cart" }, isDefault: true };
    return { panel: { type: "dish", id: R.featured }, isDefault: true };
  }

  function renderPanel(opts) {
    opts = opts || {};
    const { panel, isDefault } = resolvePanel();
    const open = !!ui.panel;
    el.side.classList.toggle("is-open", open);
    el.side.classList.toggle("is-default", isDefault);
    el.app.classList.toggle("is-solo", wide.matches && !panel);
    document.documentElement.classList.toggle("sheet-open", open && !wide.matches);
    setInert(el.main, open && !wide.matches);
    setInert(el.side, sideInert());

    if (!panel) {
      // closing: keep the old content while it slides away (a sheet on phones,
      // the side panel gliding off to the right on the desktop)
      if (wide.matches) clearSideAfterExit();
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
      return;
    }
    clearTimeout(sideClear);

    let html = "";
    if (panel.type === "dish") {
      const d = S.dish(panel.id);
      if (!ui.draft || ui.draft.dishId !== d.id) {
        ui.draft = { dishId: d.id, qty: 1, choices: S.defaultChoices(d), note: "" };
      }
      html = V.dishView(d, ui.draft, { isDefault });
    } else if (panel.type === "cart") {
      html = V.cartView(ui, { isDefault });
    } else if (panel.type === "checkout") {
      html = V.checkoutView();
    } else if (panel.type === "order") {
      html = V.orderView(S.state.orders.find((o) => o.id === panel.id));
    }
    el.sideInner.innerHTML = html;
    if (panel.type === "dish") syncDishForm();
    if (opts.focus) {
      const target = $("#dishTitle, #panelTitle", el.sideInner);
      if (target) target.focus({ preventScroll: true });
    }
    if (ui.newLine) {
      const line = $(".line.is-new", el.sideInner);
      if (line) line.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
      ui.newLine = null;
    }
  }

  /* The side panel is out of reach when nothing is shown in it: on a phone
     while the sheet is closed, on the desktop while Orders or Profile have the
     whole width (it is sliding away, then hidden). */
  const sideInert = () => (wide.matches ? !resolvePanel().panel : !ui.panel);

  /* Empty the desktop panel once it has glided out of sight, not before, so it
     leaves with what it was showing. Matches --glide in the stylesheet. */
  const GLIDE_MS = 650;
  let sideClear = 0;
  function clearSideAfterExit() {
    clearTimeout(sideClear);
    sideClear = setTimeout(() => {
      if (wide.matches && !resolvePanel().panel) el.sideInner.innerHTML = "";
    }, reduceMotion.matches ? 0 : GLIDE_MS);
  }

  /* Re-render the side panel without losing scroll position or focus */
  function refreshPanel() {
    const scroller = $(".pview__scroll", el.sideInner);
    const top = scroller ? scroller.scrollTop : 0;
    const a = document.activeElement;
    const sig = a && el.sideInner.contains(a)
      ? (a.id ? "#" + a.id : a.dataset.action ? '[data-action="' + a.dataset.action + '"]' + (a.dataset.key ? '[data-key="' + CSS.escape(a.dataset.key) + '"]' : "") + (a.dataset.mode ? '[data-mode="' + a.dataset.mode + '"]' : "") : null)
      : null;
    renderPanel();
    const next = $(".pview__scroll", el.sideInner);
    if (next) {
      next.scrollTop = top;
      if (top) foldHero(next);
    }
    if (sig) {
      const tg = $(sig, el.sideInner);
      if (tg && !tg.disabled) tg.focus({ preventScroll: true });
      else {
        const s = $(".stepper__btn:not([disabled])", el.sideInner);
        if (s && sig.includes("line-")) s.focus({ preventScroll: true });
      }
    }
  }

  function renderChrome() {
    const n = S.cartCount();
    $$("[data-cart-count]").forEach((b) => {
      b.textContent = n > 99 ? "99+" : String(n);
      b.hidden = n === 0;
    });
    el.cartBtn.setAttribute("aria-label", n ? I.tn(n, "aria.cartN") : t("aria.cartEmpty"));
    $$(".tab", el.tabbar).forEach((tb) => {
      const on = tb.dataset.tab === ui.tab;
      tb.classList.toggle("is-on", on);
      if (on) tb.setAttribute("aria-current", "page");
      else tb.removeAttribute("aria-current");
    });
    const live = S.activeOrders().length;
    const dot = $(".tab__dot", el.tabbar);
    if (dot) dot.hidden = !live;
    const p = ui.panel;
    const part = p
      ? p.type === "dish" ? I.pick(S.dish(p.id).name) : p.type === "cart" ? t("cart.title") : p.type === "checkout" ? t("checkout.title") : t("title.tracking")
      : t("tab." + ui.tab);
    document.title = part + " · " + R.name + " — " + t("title.concept");
  }

  function renderDrawer() {
    if (ui.drawer) {
      el.drawerPanel.innerHTML = V.infoView();
      el.drawer.hidden = false;
      lastDrawerTrigger = lastDrawerTrigger || document.activeElement;
      requestAnimationFrame(() => {
        el.drawer.classList.add("is-open");
        const tt = $("#drawerTitle", el.drawerPanel);
        if (tt) tt.focus({ preventScroll: true });
      });
      setInert(el.main, true);
      setInert(el.side, true);
    } else {
      el.drawer.classList.remove("is-open");
      const done = () => {
        if (!ui.drawer) el.drawer.hidden = true;
      };
      if (reduceMotion.matches) done();
      else setTimeout(done, 450);
      setInert(el.main, !!ui.panel && !wide.matches);
      setInert(el.side, sideInert());
      if (lastDrawerTrigger && document.contains(lastDrawerTrigger)) lastDrawerTrigger.focus({ preventScroll: true });
      lastDrawerTrigger = null;
    }
  }
  let lastDrawerTrigger = null;

  function setInert(node, on) {
    if ("inert" in node) node.inert = on;
    if (on) node.setAttribute("aria-hidden", "true");
    else node.removeAttribute("aria-hidden");
  }

  /* Static text in index.html, in the current language */
  function applyStatic() {
    $$("[data-i18n]").forEach((n) => (n.textContent = t(n.dataset.i18n)));
    $$("[data-i18n-label]").forEach((n) => n.setAttribute("aria-label", t(n.dataset.i18nLabel)));
    const lang = $("[data-lang-label]");
    if (lang) {
      lang.textContent = I.other().toUpperCase();
      lang.setAttribute("lang", I.other() === "fr" ? "fr-CA" : "en-CA");
    }
  }

  /* ----------------------------------------------------------
     Scrolling helpers (the page scrolls on phones, the panel on desktop)
     ---------------------------------------------------------- */
  const mainScrollTop = () => (wide.matches ? el.scroll.scrollTop : window.scrollY);
  function setMainScroll(y) {
    if (wide.matches) el.scroll.scrollTop = y;
    else window.scrollTo(0, y);
  }
  function focusMain() {
    const h = $("h1", el.view);
    if (h && document.activeElement && document.activeElement !== document.body && !el.view.contains(document.activeElement)) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
  }
  function onScroll() {
    el.topbar.classList.toggle("is-scrolled", mainScrollTop() > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  el.scroll.addEventListener("scroll", onScroll, { passive: true });
  /* Panel headers get a backdrop once their content scrolls under them */
  document.addEventListener("scroll", (e) => {
    const tg = e.target;
    if (!tg.classList || !tg.classList.contains("pview__scroll")) return;
    const bar = $(".pbar", tg);
    if (bar) bar.classList.toggle("is-scrolled", tg.scrollTop > 24);
    foldHero(tg);
  }, { passive: true, capture: true });

  /* As a dish's details scroll, its photo folds into the header instead of
     being cut: it spins, shrinks and docks in the middle of the bar. A bowl
     docks larger, hanging under the bar, so it stays in sight while its
     toppings are picked. CSS turns --p into motion. */
  function foldHero(scroller) {
    const hero = $(".dish-hero", scroller);
    const img = hero && $(".dish-hero__img", hero);
    const dock = $(".pbar__dock", scroller);
    if (!img || !dock) return;
    if (!hero.fold) {
      const h = hero.getBoundingClientRect();
      const d = dock.getBoundingClientRect();
      const w = img.offsetWidth;
      if (!w || !h.width) return;
      const cx = img.offsetLeft + w / 2;
      const cy = img.offsetTop + w / 2;
      hero.style.setProperty("--dx", (d.left + d.width / 2 - h.left - cx).toFixed(1) + "px");
      hero.style.setProperty("--dy", (d.top + d.height / 2 - h.top - cy).toFixed(1) + "px");
      hero.style.setProperty("--k", (d.width / w).toFixed(4));
      hero.fold = { dist: Math.max(1, img.offsetTop + w - (d.bottom - h.top)) };
    }
    const p = Math.min(1, Math.max(0, scroller.scrollTop / hero.fold.dist));
    hero.style.setProperty("--p", p.toFixed(4));
    hero.classList.toggle("is-docked", p >= 1);
  }
  window.addEventListener("resize", () => {
    const hero = $(".dish-hero", el.sideInner);
    if (!hero) return;
    hero.fold = null;
    foldHero(hero.parentElement);
  }, { passive: true });

  /* ----------------------------------------------------------
     Dish form and the live bowl
     ---------------------------------------------------------- */
  function readDishForm(form) {
    const d = S.dish(form.dataset.id);
    const choices = {};
    d.groups.forEach((g) => {
      // keep the order things were picked in, so new toppings take new spots
      const prev = (ui.draft.choices[g.id] || []).slice();
      const now = $$('input[name="' + g.id + '"]:checked', form).map((i) => i.value);
      choices[g.id] = prev.filter((id) => now.includes(id)).concat(now.filter((id) => !prev.includes(id)));
    });
    ui.draft.choices = S.normalizeChoices(d, choices);
    ui.draft.note = ($("#dishNote", form) || {}).value || "";
  }

  function syncDishForm(opts) {
    const form = $("#dishForm", el.sideInner);
    if (!form || !ui.draft) return;
    const d = S.dish(form.dataset.id);
    // respect "up to N" limits and show the counts
    $$("fieldset[data-group]", form).forEach((fs) => {
      const boxes = $$('input[type="checkbox"]', fs);
      const count = $$("input:checked", fs).length;
      const max = Number(fs.dataset.max);
      if (max) boxes.forEach((b) => (b.disabled = !b.checked && count >= max));
      const c = $("[data-count]", fs);
      if (c) c.textContent = count;
      fs.classList.toggle("is-full", !!max && count >= max);
      const need = $("[data-need]", fs);
      if (need && !(opts && opts.showNeed)) {
        if (count >= Number(fs.dataset.min || 0)) need.hidden = true;
      }
    });
    const missing = S.missing(d, ui.draft.choices);
    const cta = $(".cta--add", el.sideInner);
    if (cta) {
      if (missing.length) cta.setAttribute("aria-disabled", "true");
      else cta.removeAttribute("aria-disabled");
    }
    if (opts && opts.showNeed) {
      missing.forEach((g) => {
        const need = $('fieldset[data-group="' + g.id + '"] [data-need]', form);
        if (need) need.hidden = false;
      });
    }
    const unit = S.unitPrice(d, ui.draft.choices);
    const total = unit * ui.draft.qty;
    const out = $("[data-dish-total]", el.sideInner);
    if (out) out.textContent = S.money(total);
    const pts = $("[data-dish-points]", el.sideInner);
    if (pts) pts.lastChild.textContent = t("club.plus", { n: I.num(S.pointsFor(total)) });
    const val = $(".qty-row .stepper__val", form);
    if (val) val.textContent = ui.draft.qty;
    const dec = $('[data-action="dish-qty-dec"]', form);
    if (dec) dec.disabled = ui.draft.qty <= 1;
    const inc = $('[data-action="dish-qty-inc"]', form);
    if (inc) inc.disabled = ui.draft.qty >= 99;
    if (S.isBowl(d)) B.update($(".dish-hero .bowl", el.sideInner), B.selection(d, ui.draft.choices));
  }

  function addDraftToCart(form) {
    const d = S.dish(ui.draft.dishId);
    const missing = S.missing(d, ui.draft.choices);
    if (missing.length) {
      syncDishForm({ showNeed: true });
      const fs = $('fieldset[data-group="' + missing[0].id + '"]', form);
      if (fs) {
        fs.scrollIntoView({ block: "center", behavior: reduceMotion.matches ? "auto" : "smooth" });
        const first = $("input", fs);
        if (first) first.focus({ preventScroll: true });
      }
      return;
    }
    const media = $(".dish-hero__img", el.sideInner);
    const from = media ? media.getBoundingClientRect() : null;
    const key = S.addToCart(d.id, ui.draft.qty, ui.draft.choices, ui.draft.note);
    const qty = ui.draft.qty;
    ui.newLine = key;
    ui.draft = null;
    const flyer = media ? media.cloneNode(true) : null;
    if (ui.panel) goBack("/menu");
    else refreshPanel(); // the default bowl builder on desktop: show the cart
    flyToCart(flyer, from);
    toast(t("toast.added", { qty, name: I.pick(d.name) }), wide.matches ? null : { label: t("toast.viewCart"), href: "#/cart" });
  }

  /* ----------------------------------------------------------
     Checkout
     ---------------------------------------------------------- */
  function readCheckout(form) {
    const f = new FormData(form);
    const ck = S.state.checkout;
    const whenMode = f.get("whenMode");
    return {
      mode: ck.mode,
      when: whenMode === "later" ? String(f.get("slot") || "") : "asap",
      name: String(f.get("name") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      address: String(f.get("address") || "").trim(),
      instructions: String(f.get("instructions") || "").trim(),
      payment: String(f.get("payment") || "card"),
    };
  }

  function validateCheckout(form, data) {
    const errors = {};
    if (data.mode === "delivery" && data.address.length < 6) errors.coAddress = t("err.address");
    if (data.name.length < 2) errors.coName = t("err.name");
    if (data.phone.replace(/\D/g, "").length < 7) errors.coPhone = t("err.phone");
    if (data.when !== "asap" && !data.when) errors.slotSelect = t("err.slot");
    if (data.when === "asap" && !S.asapAvailable(data.mode)) errors.slotSelect = t("err.closed");

    $$(".field__error", form).forEach((p) => (p.hidden = true));
    $$("[aria-invalid]", form).forEach((i) => i.removeAttribute("aria-invalid"));
    let first = null;
    Object.keys(errors).forEach((id) => {
      const input = $("#" + id, form);
      const msg = $("#" + id + "-err", form);
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id + "-err");
        first = first || input;
      }
      if (msg) {
        msg.textContent = errors[id];
        msg.hidden = false;
      } else {
        showFormError(form, errors[id]);
      }
    });
    const tot = S.totals(data.mode);
    if (tot.belowMin) {
      showFormError(form, t("err.min", { min: S.money(tot.minOrder), gap: S.money(tot.minOrder - tot.subtotal) }));
      return false;
    }
    if (first) {
      if (first.id === "slotSelect") {
        const later = $('input[name="whenMode"][value="later"]', form);
        if (later && !later.checked) {
          later.checked = true;
          const f = $("[data-slot-field]", form);
          if (f) f.hidden = false;
        }
      }
      first.focus();
      return false;
    }
    return true;
  }

  function showFormError(form, text) {
    const p = $("#checkoutForm-err", form);
    if (!p) return;
    p.textContent = text;
    p.hidden = false;
    p.scrollIntoView({ block: "nearest" });
  }

  function placeOrder(form) {
    const data = readCheckout(form);
    S.setCheckout(data, true);
    if (!validateCheckout(form, data)) return;
    let order;
    try {
      order = S.placeOrder(data);
    } catch (e) {
      showFormError(form, e.message);
      return;
    }
    navigate("/order/" + order.id, { replace: true });
    toast(t("toast.placed", { n: order.number, pts: I.num(order.points) }));
  }

  /* ----------------------------------------------------------
     Live order tracking
     ---------------------------------------------------------- */
  const stageSeen = new Map();
  function tick() {
    const now = Date.now();
    S.state.orders.forEach((o) => {
      const pr = S.orderProgress(o, now);
      const seen = stageSeen.get(o.id);
      if (seen != null && seen !== pr.stage) {
        const msg = t("notify." + (pr.stage >= 3 ? "done" : pr.stage === 2 ? o.mode : "cooking"), { n: o.number });
        const watching = ui.panel && ui.panel.type === "order" && ui.panel.id === o.id;
        if (!watching) toast(msg, { label: t("orders.track"), href: "#/order/" + o.id });
        const stepsEl = watching ? $("[data-steps]", el.sideInner) : null;
        if (stepsEl) stepsEl.innerHTML = V.steps(o, pr);
        if (ui.tab === "orders" && pr.done) renderMain();
      }
      stageSeen.set(o.id, pr.stage);
    });

    // tracker panel
    if (ui.panel && ui.panel.type === "order") {
      const o = S.state.orders.find((x) => x.id === ui.panel.id);
      if (o) {
        const pr = S.orderProgress(o, now);
        const txt = V.trackText(o, pr);
        const ring = $("[data-ring]", el.sideInner);
        if (ring) ring.style.strokeDasharray = (pr.progress * 100).toFixed(1) + " 100";
        setText("[data-track-stage]", V.stageLabel(o, pr.stage));
        setText("[data-track-title]", txt.title);
        setText("[data-track-eta]", txt.eta);
        const img = $(".track__img", el.sideInner);
        if (img) img.classList.toggle("is-spinning", !pr.done);
      }
    }
    // order cards
    if (ui.tab === "orders") {
      $$(".ocard.is-live", el.view).forEach((card) => {
        const o = S.state.orders.find((x) => x.id === card.dataset.order);
        if (!o) return;
        const pr = S.orderProgress(o, now);
        const bar = $("[data-obar]", card);
        if (bar) bar.style.width = Math.round(pr.progress * 100) + "%";
        const st = $("[data-ostage]", card);
        if (st) st.textContent = V.stageLabel(o, pr.stage);
      });
    }
    renderChrome();
  }

  function setText(sel, text) {
    const n = $(sel, el.sideInner);
    if (n && n.textContent !== text) n.textContent = text;
  }

  /* Refresh the open/closed chip once a minute */
  setInterval(() => {
    const meta = $(".hero__meta", el.view);
    if (meta) {
      const chip = $(".status:not(.status--store)", meta);
      if (chip) chip.outerHTML = V.statusChip();
    }
  }, 60000);

  /* ----------------------------------------------------------
     Feedback: toast, fly-to-cart, copy
     ---------------------------------------------------------- */
  let toastTimer = null;
  function toast(message, action) {
    el.toast.innerHTML = '<span class="toast__msg">' + V.esc(message) + "</span>" +
      (action ? '<a class="toast__action" href="' + V.esc(action.href) + '">' + V.esc(action.label) + "</a>" : "");
    el.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("is-on"), 3600);
  }

  function bumpCart() {
    el.cartBtn.classList.remove("is-bump");
    void el.cartBtn.offsetWidth;
    el.cartBtn.classList.add("is-bump");
  }

  /* The photo or bowl leaves the panel and lands in the cart */
  function flyToCart(node, from) {
    const to = el.cartBtn.getBoundingClientRect();
    if (!node || !from || !from.width || reduceMotion.matches || !to.width) return bumpCart();
    const size = Math.min(from.width, 260);
    const fly = node;
    fly.removeAttribute("id");
    fly.classList.add("flyer");
    const x = from.left + from.width / 2 - size / 2;
    const y = from.top + from.height / 2 - size / 2;
    Object.assign(fly.style, { left: x + "px", top: y + "px", width: size + "px", height: size + "px", translate: "none", rotate: "none", scale: "none", margin: "0" });
    document.body.appendChild(fly);
    const dx = to.left + to.width / 2 - (x + size / 2);
    const dy = to.top + to.height / 2 - (y + size / 2);
    const end = Math.max(0.12, 34 / size);
    const anim = fly.animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + dx * 0.35 + "px," + (dy * 0.35 - 70) + "px) scale(0.62) rotate(140deg)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(" + end + ") rotate(320deg)", opacity: 0.4 },
      ],
      { duration: 780, easing: "cubic-bezier(.55,0,.25,1)" }
    );
    anim.onfinish = () => {
      fly.remove();
      bumpCart();
    };
  }

  function copyText(text, label) {
    const done = () => toast(label || t("toast.copied"));
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      ta.remove();
      if (ok) done();
      else toast(t("toast.copyFail"));
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    } catch (e) {
      fallback();
    }
  }

  /* ----------------------------------------------------------
     Language
     ---------------------------------------------------------- */
  function rerenderAll() {
    applyStatic();
    renderMain();
    refreshPanel();
    if (ui.drawer) el.drawerPanel.innerHTML = V.infoView();
    renderChrome();
  }
  I.onChange(rerenderAll);

  /* ----------------------------------------------------------
     Events
     ---------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest('a[href="#view"]')) {
      e.preventDefault();
      el.view.focus();
      return;
    }
    const link = e.target.closest('a[href^="#/"]');
    if (link && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      if (link.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      if (link.closest(".toast")) el.toast.classList.remove("is-on");
      const path = link.getAttribute("href").slice(1);
      if (path.startsWith("/dish/") || path === "/cart" || path.startsWith("/order/") || path === "/info") lastTrigger = link;
      closePopovers();
      if (path === currentPath()) return;
      navigate(path);
      return;
    }

    const btn = e.target.closest("[data-action]");
    if (!btn) {
      if (!e.target.closest(".more")) closePopovers();
      return;
    }
    const handler = actions[btn.dataset.action];
    if (handler) handler(btn, e);
  });

  const actions = {
    "open-info": (b) => {
      lastDrawerTrigger = b;
      navigate("/info");
    },
    "close-info": () => goBack("/menu"),
    "toggle-lang": () => I.set(I.other()),
    "set-lang": (b) => I.set(b.dataset.lang),
    "toggle-search": () => {
      if (ui.tab !== "menu" || ui.panel) navigate("/menu");
      ui.searchOpen = !ui.searchOpen;
      if (!ui.searchOpen) ui.query = "";
      const box = $(".search", el.view);
      if (box) box.hidden = !ui.searchOpen;
      $('[data-action="toggle-search"]').setAttribute("aria-expanded", ui.searchOpen);
      if (ui.searchOpen) {
        const input = $("#searchInput");
        if (input) {
          setMainScroll(0);
          input.focus();
        }
      } else renderMenuList();
    },
    "close-search": () => {
      ui.searchOpen = false;
      ui.query = "";
      const box = $(".search", el.view);
      if (box) box.hidden = true;
      const input = $("#searchInput");
      if (input) input.value = "";
      $('[data-action="toggle-search"]').setAttribute("aria-expanded", "false");
      renderMenuList();
    },
    "set-cat": (b) => {
      ui.category = b.dataset.cat;
      if (ui.query) {
        ui.query = "";
        const input = $("#searchInput");
        if (input) input.value = "";
      }
      renderMenuList();
      const cats = $(".cats", el.view);
      if (cats && mainScrollTop() > cats.offsetTop) setMainScroll(Math.max(0, cats.offsetTop - 70));
    },
    "toggle-fav": (b) => {
      const id = b.dataset.id;
      const on = S.toggleFav(id);
      $$('.fav[data-id="' + id + '"]').forEach((f) => {
        f.classList.toggle("is-on", on);
        f.setAttribute("aria-pressed", on);
        f.classList.remove("is-pop");
        void f.offsetWidth;
        if (on) f.classList.add("is-pop");
      });
      toast(on ? t("toast.favOn") : t("toast.favOff"), on ? { label: t("toast.view"), href: "#/favorites" } : null);
      if (ui.tab === "favorites") renderMain();
    },
    back: () => goBack(ui.panel && ui.panel.type === "checkout" ? "/cart" : "/menu"),
    "toggle-more": (b) => {
      const pop = b.nextElementSibling;
      const open = pop.hidden;
      closePopovers();
      pop.hidden = !open;
      b.setAttribute("aria-expanded", open);
      if (open) {
        const first = $("button", pop);
        if (first) first.focus();
      }
    },
    "copy-link": (b) => {
      closePopovers();
      copyText(window.location.href.split("#")[0] + "#/dish/" + b.dataset.id, t("toast.linkCopied"));
    },
    "show-allergens": () => {
      closePopovers();
      const a = $("#allergens", el.sideInner);
      if (a) {
        a.scrollIntoView({ block: "center", behavior: reduceMotion.matches ? "auto" : "smooth" });
        a.classList.remove("is-flash");
        void a.offsetWidth;
        a.classList.add("is-flash");
        a.focus({ preventScroll: true });
      }
    },
    "dish-qty-dec": () => {
      ui.draft.qty = Math.max(1, ui.draft.qty - 1);
      syncDishForm();
    },
    "dish-qty-inc": () => {
      ui.draft.qty = Math.min(99, ui.draft.qty + 1);
      syncDishForm();
    },
    "line-dec": (b) => {
      const line = S.state.cart.find((l) => l.key === b.dataset.key);
      if (line) S.setQty(line.key, line.qty - 1);
    },
    "line-inc": (b) => {
      const line = S.state.cart.find((l) => l.key === b.dataset.key);
      if (line) S.setQty(line.key, line.qty + 1);
    },
    "clear-ask": () => {
      ui.confirmClear = true;
      refreshPanel();
      const c = $('[data-action="clear-cancel"]', el.sideInner);
      if (c) c.focus();
    },
    "clear-cancel": () => {
      ui.confirmClear = false;
      refreshPanel();
    },
    "clear-confirm": () => {
      ui.confirmClear = false;
      S.clearCart();
      toast(t("toast.cleared"));
    },
    "set-mode": (b) => {
      S.setCheckout({ mode: b.dataset.mode });
    },
    reorder: (b) => {
      const n = S.reorder(b.dataset.id);
      if (n) {
        toast(I.tn(n, "toast.reordered"), { label: t("toast.viewCart"), href: "#/cart" });
        bumpCart();
      } else toast(t("toast.reorderNone"));
    },
    "reset-ask": () => {
      ui.confirmReset = true;
      renderMain();
      const c = $('[data-action="reset-cancel"]', el.view);
      if (c) c.focus();
    },
    "reset-cancel": () => {
      ui.confirmReset = false;
      renderMain();
    },
    "reset-confirm": () => {
      ui.confirmReset = false;
      S.resetAll();
      toast(t("toast.reset"));
    },
  };

  function closePopovers() {
    $$(".popover").forEach((p) => {
      if (!p.hidden) {
        p.hidden = true;
        const tg = p.previousElementSibling;
        if (tg) tg.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("submit", (e) => {
    const form = e.target;
    e.preventDefault();
    if (form.id === "dishForm") {
      readDishForm(form);
      addDraftToCart(form);
    } else if (form.id === "checkoutForm") {
      placeOrder(form);
    }
  });

  let searchTimer = null;
  let profileTimer = null;
  document.addEventListener("input", (e) => {
    const tg = e.target;
    if (tg.id === "searchInput") {
      ui.query = tg.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderMenuList, 90);
      return;
    }
    const form = tg.form;
    if (!form) return;
    if (form.id === "dishForm") {
      readDishForm(form);
      syncDishForm();
    } else if (form.id === "checkoutForm") {
      if (tg.getAttribute("aria-invalid")) {
        tg.removeAttribute("aria-invalid");
        const err = $("#" + tg.id + "-err", form);
        if (err) err.hidden = true;
      }
      if (tg.name === "whenMode") {
        const f = $("[data-slot-field]", form);
        if (f) f.hidden = tg.value !== "later";
      }
      S.setCheckout(readCheckout(form), true);
    } else if (form.id === "profileForm") {
      clearTimeout(profileTimer);
      profileTimer = setTimeout(() => {
        const f = new FormData(form);
        const gift = S.setProfile({ name: String(f.get("name") || "").trim(), phone: String(f.get("phone") || "").trim(), address: String(f.get("address") || "").trim() }, true);
        const saved = $("[data-saved]", form);
        if (saved) saved.hidden = false;
        if (gift) toast(t("toast.welcome", { n: I.num(gift), club: R.club.name }));
      }, 350);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const pop = $(".popover:not([hidden])");
    if (pop) {
      closePopovers();
      const tg = pop.previousElementSibling;
      if (tg) tg.focus();
      return;
    }
    if (ui.drawer) return goBack("/menu");
    if (ui.searchOpen && document.activeElement && document.activeElement.id === "searchInput") return actions["close-search"]();
    if (ui.panel && !wide.matches) goBack("/menu");
  });

  /* Keep keyboard focus inside the info drawer while it is open */
  el.drawer.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', el.drawerPanel);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ----------------------------------------------------------
     Store changes
     ---------------------------------------------------------- */
  S.subscribe((topic) => {
    if (topic === "draft") return;
    renderChrome();
    const p = resolvePanel().panel;
    if (topic === "cart" || topic === "checkout" || topic === "sync" || topic === "reset") {
      if (ui.tab === "menu" || ui.tab === "favorites") syncCardBadges();
      if (p && (p.type === "cart" || p.type === "checkout")) refreshPanel();
      else if (wide.matches && !ui.panel) refreshPanel(); // default panel may switch between bowl and cart
      if (topic === "checkout" && ui.tab === "profile") renderMain();
      if (topic === "cart" && S.cartCount() === 0 && ui.panel && ui.panel.type === "checkout") navigate("/cart", { replace: true });
    }
    if (topic === "club" || topic === "orders" || topic === "sync" || topic === "reset") {
      if (ui.tab === "profile") {
        const card = $(".pf-club", el.view);
        if (card && topic !== "reset" && topic !== "sync") card.outerHTML = V.clubCard();
        else renderMain();
      }
    }
    if (topic === "orders" || topic === "sync" || topic === "reset") {
      if (ui.tab === "orders") renderMain();
      if (ui.tab === "menu") syncCardBadges();
    }
    if (topic === "sync" || topic === "reset") {
      if (ui.tab === "favorites") renderMain();
      if (p && p.type === "order") refreshPanel();
    }
  });

  function syncCardBadges() {
    $$(".card", el.view).forEach((card) => {
      const link = $(".card__link", card);
      if (!link) return;
      const id = link.getAttribute("href").split("/").pop();
      const n = S.qtyInCart(id);
      let badge = $(".card__qty", card);
      if (!n && badge) badge.remove();
      else if (n) {
        if (!badge) {
          card.insertAdjacentHTML("beforeend", '<span class="card__qty" title="' + V.esc(t("card.inCart")) + '"></span>');
          badge = $(".card__qty", card);
        }
        badge.innerHTML = n + '<span class="sr-only"> ' + V.esc(t("card.inCart")) + "</span>";
      }
    });
  }

  /* Layout switches between phone sheet and desktop side panel */
  wide.addEventListener("change", () => {
    renderPanel();
    onScroll();
  });

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  function fillIcons(root) {
    $$("[data-icon]", root).forEach((n) => {
      n.outerHTML = window.Icons.icon(n.dataset.icon, n.dataset.iconClass);
    });
  }

  function boot() {
    fillIcons(document);
    $$(".logo-slot").forEach((n) => (n.innerHTML = V.logo()));
    applyStatic();
    memory.push(currentPath());
    try {
      window.history.replaceState({ depth: 0 }, "", window.location.pathname + window.location.search + "#" + currentPath());
    } catch (e) {
      historyOK = false;
    }
    S.state.orders.forEach((o) => stageSeen.set(o.id, S.orderProgress(o).stage));
    renderMain();
    route(currentPath());
    renderPanel();
    renderChrome();
    onScroll();
    document.documentElement.classList.add("is-ready");
    // Layout transitions start after the first frame, so the page arrives in
    // its layout instead of animating into it.
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("is-settled")));
    setInterval(tick, 1000);
  }

  boot();
})();
