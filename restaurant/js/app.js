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
  const R = S.R;
  const icon = window.Icons.icon;

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
    const t = ui.tab;
    el.view.innerHTML =
      t === "favorites" ? V.favoritesView() :
      t === "orders" ? V.ordersView() :
      t === "profile" ? V.profileView(ui) :
      V.menuView(ui);
    el.view.setAttribute("data-tab", t);
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
     keep it filled: the cart, or the chef's pick while the cart is empty.
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
    if (next) next.scrollTop = top;
    if (sig) {
      const t = $(sig, el.sideInner);
      if (t && !t.disabled) t.focus({ preventScroll: true });
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
    el.cartBtn.setAttribute("aria-label", n ? "Cart, " + n + (n === 1 ? " item" : " items") : "Cart, empty");
    $$(".tab", el.tabbar).forEach((t) => {
      const on = t.dataset.tab === ui.tab;
      t.classList.toggle("is-on", on);
      if (on) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
    const live = S.activeOrders().length;
    const dot = $(".tab__dot", el.tabbar);
    if (dot) dot.hidden = !live;
    const titles = { menu: "Menu", favorites: "Favorites", orders: "Orders", profile: "Profile" };
    const p = ui.panel;
    const part = p
      ? p.type === "dish" ? S.dish(p.id).name : p.type === "cart" ? "Your order" : p.type === "checkout" ? "Checkout" : "Order tracking"
      : titles[ui.tab];
    document.title = part + " · " + R.name;
  }

  function renderDrawer() {
    if (ui.drawer) {
      el.drawerPanel.innerHTML = V.infoView();
      el.drawer.hidden = false;
      lastDrawerTrigger = lastDrawerTrigger || document.activeElement;
      requestAnimationFrame(() => {
        el.drawer.classList.add("is-open");
        const t = $("#drawerTitle", el.drawerPanel);
        if (t) t.focus({ preventScroll: true });
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
    const t = e.target;
    if (!t.classList || !t.classList.contains("pview__scroll")) return;
    const bar = $(".pbar", t);
    if (bar) bar.classList.toggle("is-scrolled", t.scrollTop > 24);
    foldHero(t);
  }, { passive: true, capture: true });

  /* As a dish's details scroll, its photo folds into the header instead of
     being cut: it spins, shrinks and docks in the middle of the bar. The
     plate's bottom edge moves with the title, so the two never overlap, and
     scrolling back up returns it to its place. CSS turns --p into motion. */
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
  }
  window.addEventListener("resize", () => {
    const hero = $(".dish-hero", el.sideInner);
    if (!hero) return;
    hero.fold = null;
    foldHero(hero.parentElement);
  }, { passive: true });

  /* ----------------------------------------------------------
     Dish form
     ---------------------------------------------------------- */
  function readDishForm(form) {
    const d = S.dish(form.dataset.id);
    const choices = {};
    d.options.forEach((g) => {
      choices[g.id] = $$('input[name="' + g.id + '"]:checked', form).map((i) => i.value);
    });
    ui.draft.choices = S.normalizeChoices(d, choices);
    ui.draft.note = ($("#dishNote", form) || {}).value || "";
  }

  function syncDishForm() {
    const form = $("#dishForm", el.sideInner);
    if (!form || !ui.draft) return;
    const d = S.dish(form.dataset.id);
    // respect "up to N" limits
    $$("fieldset[data-max]", form).forEach((fs) => {
      const max = Number(fs.dataset.max);
      const boxes = $$('input[type="checkbox"]', fs);
      const count = boxes.filter((b) => b.checked).length;
      boxes.forEach((b) => (b.disabled = !b.checked && count >= max));
    });
    const total = S.unitPrice(d, ui.draft.choices) * ui.draft.qty;
    const out = $("[data-dish-total]", el.sideInner);
    if (out) out.textContent = S.money(total);
    const val = $(".qty-row .stepper__val", form);
    if (val) val.textContent = ui.draft.qty;
    const dec = $('[data-action="dish-qty-dec"]', form);
    if (dec) dec.disabled = ui.draft.qty <= 1;
    const inc = $('[data-action="dish-qty-inc"]', form);
    if (inc) inc.disabled = ui.draft.qty >= 99;
  }

  function addDraftToCart() {
    const d = S.dish(ui.draft.dishId);
    const img = $(".dish-hero__img", el.sideInner);
    const from = img ? img.getBoundingClientRect() : null;
    const key = S.addToCart(d.id, ui.draft.qty, ui.draft.choices, ui.draft.note);
    const qty = ui.draft.qty;
    ui.newLine = key;
    ui.draft = null;
    if (ui.panel) goBack("/menu");
    else refreshPanel(); // the default chef's pick on desktop: show the cart
    flyToCart(img, from);
    toast(qty + " × " + d.name + " added", wide.matches ? null : { label: "View cart", href: "#/cart" });
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
      table: String(f.get("table") || ck.table || "").trim(),
      when: ck.mode === "dineIn" ? "asap" : whenMode === "later" ? String(f.get("slot") || "") : "asap",
      name: String(f.get("name") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      address: String(f.get("address") || "").trim(),
      instructions: String(f.get("instructions") || "").trim(),
      payment: String(f.get("payment") || "card"),
    };
  }

  function validateCheckout(form, data) {
    const errors = {};
    if (data.mode === "dineIn") {
      const n = Number(data.table);
      const max = R.orderTypes.dineIn.tables || 99;
      if (!data.table) errors.coTable = "Enter your table number. It’s printed on the table.";
      else if (!Number.isInteger(n) || n < 1 || n > max) errors.coTable = "Tables are numbered 1 to " + max + ".";
    }
    if (data.mode === "delivery" && data.address.length < 6) errors.coAddress = "Enter the street, number and apartment so the rider can find you.";
    if (data.name.length < 2) errors.coName = "Enter the name for this order.";
    if (data.phone.replace(/\D/g, "").length < 7) errors.coPhone = "Enter a phone number with at least 7 digits.";
    if (data.mode !== "dineIn" && data.when !== "asap" && !data.when) errors.slotSelect = "Choose a time.";
    if (data.mode !== "dineIn" && data.when === "asap" && !S.asapAvailable(data.mode)) {
      errors.slotSelect = "We’re closed right now. Choose a time from the list.";
    }

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
    const t = S.totals(data.mode);
    if (t.belowMin) {
      showFormError(form, "Delivery starts at " + S.money(t.minOrder) + ". Add " + S.money(t.minOrder - t.subtotal) + " more or switch to pickup.");
      return false;
    }
    if (first) {
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
    toast("Order #" + order.number + " placed");
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
        const msg = pr.stage === 1 ? "The kitchen started on order #" + o.number
          : pr.stage === 2 ? (o.mode === "pickup" ? "Order #" + o.number + " is ready for pickup" : o.mode === "delivery" ? "Order #" + o.number + " is on its way" : "Order #" + o.number + " is coming to your table")
          : "Order #" + o.number + " is complete. Enjoy!";
        const watching = ui.panel && ui.panel.type === "order" && ui.panel.id === o.id;
        if (!watching) toast(msg, { label: "Track", href: "#/order/" + o.id });
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
        setText("[data-track-stage]", pr.labels[pr.stage]);
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
        if (st) st.textContent = pr.labels[pr.stage];
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
      const chip = $(".status:not(.status--table)", meta);
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

  function flyToCart(img, from) {
    const to = el.cartBtn.getBoundingClientRect();
    if (!img || !from || !from.width || reduceMotion.matches || !to.width) return bumpCart();
    const size = Math.min(from.width, 260);
    const fly = document.createElement("img");
    fly.src = img.currentSrc || img.src;
    fly.alt = "";
    fly.className = "flyer";
    const x = from.left + from.width / 2 - size / 2;
    const y = from.top + from.height / 2 - size / 2;
    Object.assign(fly.style, { left: x + "px", top: y + "px", width: size + "px", height: size + "px" });
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
    const done = () => toast((label || "Copied") + " to clipboard");
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
      else toast("Couldn’t copy. Select the text and copy it yourself.");
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    } catch (e) {
      fallback();
    }
  }

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
    const act = btn.dataset.action;
    const handler = actions[act];
    if (handler) handler(btn, e);
  });

  const actions = {
    "open-info": (b) => {
      lastDrawerTrigger = b;
      navigate("/info");
    },
    "close-info": () => goBack("/menu"),
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
      toast(on ? "Saved to favorites" : "Removed from favorites", on ? { label: "View", href: "#/favorites" } : null);
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
      copyText(window.location.href.split("#")[0] + "#/dish/" + b.dataset.id, "Link copied");
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
      toast("Cart cleared");
    },
    "set-mode": (b) => {
      S.setCheckout({ mode: b.dataset.mode });
    },
    "use-promo": (b) => {
      const input = $("#promoInput", el.sideInner);
      if (input) input.value = b.dataset.code;
      applyPromo(b.dataset.code);
    },
    "remove-promo": () => S.removePromo(),
    reorder: (b) => {
      const n = S.reorder(b.dataset.id);
      if (n) {
        toast(n + (n === 1 ? " item" : " items") + " added to your cart", { label: "View cart", href: "#/cart" });
        bumpCart();
      } else toast("Those dishes are no longer on the menu.");
    },
    "toggle-diet": (b) => {
      const tag = b.dataset.tag;
      const diet = S.state.profile.diet.slice();
      const i = diet.indexOf(tag);
      if (i >= 0) diet.splice(i, 1);
      else diet.push(tag);
      S.setProfile({ diet });
    },
    "clear-diet": () => S.setProfile({ diet: [] }),
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
      toast("Your data was cleared from this device");
    },
    copy: (b) => copyText(b.dataset.text, "Number copied"),
  };

  function closePopovers() {
    $$(".popover").forEach((p) => {
      if (!p.hidden) {
        p.hidden = true;
        const t = p.previousElementSibling;
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });
  }

  function applyPromo(code) {
    const res = S.applyPromo(code);
    if (res.ok) toast(res.message);
    else {
      const err = $("#promoInput-err", el.sideInner);
      const input = $("#promoInput", el.sideInner);
      if (err) {
        err.textContent = res.message;
        err.hidden = false;
      }
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", "promoInput-err");
        input.focus();
      }
    }
  }

  document.addEventListener("submit", (e) => {
    const form = e.target;
    e.preventDefault();
    if (form.id === "dishForm") {
      readDishForm(form);
      addDraftToCart();
    } else if (form.id === "checkoutForm") {
      placeOrder(form);
    } else if (form.id === "promoForm") {
      applyPromo(new FormData(form).get("code"));
    }
  });

  let searchTimer = null;
  let profileTimer = null;
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "searchInput") {
      ui.query = t.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderMenuList, 90);
      return;
    }
    const form = t.form;
    if (!form) return;
    if (form.id === "dishForm") {
      readDishForm(form);
      syncDishForm();
    } else if (form.id === "checkoutForm") {
      if (t.getAttribute("aria-invalid")) {
        t.removeAttribute("aria-invalid");
        const err = $("#" + t.id + "-err", form);
        if (err) err.hidden = true;
      }
      if (t.name === "whenMode") {
        const f = $("[data-slot-field]", form);
        if (f) f.hidden = t.value !== "later";
      }
      S.setCheckout(readCheckout(form), true);
    } else if (form.id === "profileForm") {
      clearTimeout(profileTimer);
      profileTimer = setTimeout(() => {
        const f = new FormData(form);
        S.setProfile({ name: String(f.get("name") || "").trim(), phone: String(f.get("phone") || "").trim(), address: String(f.get("address") || "").trim() }, true);
        const saved = $("[data-saved]", form);
        if (saved) saved.hidden = false;
      }, 350);
    } else if (form.id === "promoForm") {
      const err = $("#promoInput-err", el.sideInner);
      if (err) err.hidden = true;
      t.removeAttribute("aria-invalid");
    }
  });

  /* Table number typed in the cart */
  document.addEventListener("change", (e) => {
    if (e.target.id === "tableInput") S.setCheckout({ table: e.target.value.trim() }, true);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const pop = $(".popover:not([hidden])");
    if (pop) {
      closePopovers();
      const t = pop.previousElementSibling;
      if (t) t.focus();
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
      if (ui.tab === "menu") syncCardBadges();
      if (p && (p.type === "cart" || p.type === "checkout")) refreshPanel();
      else if (wide.matches && !ui.panel) refreshPanel(); // default panel may switch between chef's pick and cart
      if (topic === "checkout" && ui.tab === "profile") renderMain();
      if (topic === "cart" && S.cartCount() === 0 && ui.panel && ui.panel.type === "checkout") navigate("/cart", { replace: true });
    }
    if (topic === "profile" || topic === "sync" || topic === "reset") {
      if (ui.tab === "menu") {
        renderMenuList();
        refreshDietNotice();
      }
      if (ui.tab === "profile") renderMain();
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

  function refreshDietNotice() {
    const old = $(".notice", el.view);
    const html = V.dietNotice();
    if (old) old.outerHTML = html;
    else if (html) {
      const cats = $(".cats", el.view);
      if (cats) cats.insertAdjacentHTML("afterend", html);
    }
  }

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
          card.insertAdjacentHTML("beforeend", '<span class="card__qty" title="In your cart"></span>');
          badge = $(".card__qty", card);
        }
        badge.innerHTML = n + '<span class="sr-only"> in your cart</span>';
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
      n.outerHTML = icon(n.dataset.icon, n.dataset.iconClass);
    });
  }

  function readTableParam() {
    try {
      const t = new URLSearchParams(window.location.search).get("table");
      if (t && /^\d{1,3}$/.test(t) && R.orderTypes.dineIn.enabled) {
        S.setCheckout({ mode: "dineIn", table: String(Number(t)) }, true);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function boot() {
    fillIcons(document);
    $$(".logo-slot").forEach((n) => (n.innerHTML = V.logo()));
    readTableParam();
    memory.push(currentPath());
    try {
      window.history.replaceState({ depth: 0 }, "", "#" + currentPath());
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
