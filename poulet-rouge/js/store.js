/* ============================================================
   Store — menu lookups, cart, pricing, hours, orders, Rouge Club.
   All money is handled in integer cents.
   ============================================================ */
(function () {
  "use strict";

  const R = window.RESTAURANT;
  const I = window.I18N;
  const ING = R.ingredients;
  const STORAGE_KEY = "poulet-rouge:v1";
  const DAY = 1440;

  /* ----------------------------------------------------------
     Persistence (localStorage can be missing or throw)
     ---------------------------------------------------------- */
  const storage = {
    read() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    write(data) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        /* private mode or storage full: keep working in memory */
      }
    },
  };

  const defaults = () => ({
    cart: [],
    favorites: [],
    orders: [],
    nextOrderNo: 1042,
    points: 0,
    welcomed: false,
    checkout: { mode: firstMode(), when: "asap", name: "", phone: "", address: "", instructions: "", payment: "card" },
    profile: { name: "", phone: "", address: "" },
  });

  function firstMode() {
    return R.orderTypes.pickup.enabled ? "pickup" : "delivery";
  }

  /* ----------------------------------------------------------
     Menu
     ---------------------------------------------------------- */
  const dishes = R.dishes.map((d) =>
    Object.assign({
      image: d.kind === "bowl" ? null : "assets/dishes/" + d.id + "-800.webp",
      thumb: d.kind === "bowl" ? null : "assets/dishes/" + d.id + "-400.webp",
      groups: [], tags: [],
    }, d)
  );
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const cents = (n) => Math.round((n || 0) * 100);
  const isBowl = (d) => d && d.kind === "bowl";

  function dish(id) {
    return byId.get(id) || null;
  }
  function category(id) {
    return R.categories.find((c) => c.id === id) || R.categories[0];
  }
  function dishesIn(catId) {
    return catId === "all" ? dishes.slice() : dishes.filter((d) => d.category === catId);
  }

  /* The choices a group offers: bowl ingredients, or its own list */
  function choicesOf(g) {
    return g.from ? ING[g.from] : g.choices || [];
  }
  const single = (g) => g.type === "single" || (g.min === 1 && g.max === 1);

  const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const both = (v) => (v && typeof v === "object" ? [v.fr, v.en].join(" ") : String(v || ""));
  function search(query) {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.length) return dishes.slice();
    return dishes.filter((d) => {
      const parts = [both(d.name), both(d.short), both(d.description), both(category(d.category).name)];
      d.groups.forEach((g) => choicesOf(g).forEach((c) => parts.push(both(c.name))));
      const hay = fold(parts.join(" "));
      return words.every((w) => hay.includes(w));
    });
  }

  /* ----------------------------------------------------------
     Options & prices
     ---------------------------------------------------------- */
  function defaultChoices(d) {
    const out = {};
    d.groups.forEach((g) => {
      if (d.defaults && d.defaults[g.id]) out[g.id] = d.defaults[g.id].slice();
      else if (single(g)) {
        const list = choicesOf(g);
        const def = list.find((c) => c.default) || list[0];
        out[g.id] = def ? [def.id] : [];
      } else out[g.id] = [];
    });
    return out;
  }

  function normalizeChoices(d, choices) {
    const out = defaultChoices(d);
    d.groups.forEach((g) => {
      const list = choicesOf(g);
      if (!choices || !Array.isArray(choices[g.id])) return;
      const picked = choices[g.id].filter((id, i, a) => list.some((c) => c.id === id) && a.indexOf(id) === i);
      if (single(g)) {
        if (picked.length) out[g.id] = [picked[0]];
      } else {
        out[g.id] = picked.slice(0, g.max || list.length);
      }
    });
    return out;
  }

  /* Groups that still need a choice, e.g. a bowl with no base */
  function missing(d, choices) {
    return d.groups.filter((g) => (choices[g.id] || []).length < (g.min || 0));
  }

  function unitPrice(d, choices) {
    let total = cents(d.price);
    d.groups.forEach((g) => {
      const picked = choices[g.id] || [];
      picked.forEach((id) => {
        const c = choicesOf(g).find((x) => x.id === id);
        if (c) total += cents(c.price);
      });
      if (g.extra) total += Math.max(0, picked.length - (g.included || 0)) * cents(g.extra);
    });
    return total;
  }

  /* Choice names in the current language, group by group */
  function describeChoices(d, choices) {
    const out = [];
    d.groups.forEach((g) => {
      const names = (choices[g.id] || []).map((id) => {
        const c = choicesOf(g).find((x) => x.id === id);
        return c ? I.pick(c.name) : "";
      }).filter(Boolean);
      if (names.length) out.push(names.join(", "));
    });
    return out;
  }

  function lineKey(dishId, choices, note) {
    const parts = Object.keys(choices).sort().map((k) => k + ":" + choices[k].join("+"));
    return dishId + "|" + parts.join(",") + "|" + note.toLowerCase();
  }

  /* ----------------------------------------------------------
     State
     ---------------------------------------------------------- */
  let state = hydrate(storage.read());

  function hydrate(saved) {
    const s = defaults();
    if (!saved || typeof saved !== "object") return s;
    if (Array.isArray(saved.cart)) {
      s.cart = saved.cart
        .filter((l) => l && byId.has(l.dishId) && l.qty > 0)
        .map((l) => {
          const d = dish(l.dishId);
          const choices = normalizeChoices(d, l.choices);
          const note = String(l.note || "").slice(0, 140);
          return { key: lineKey(d.id, choices, note), dishId: d.id, qty: Math.min(99, Math.floor(l.qty)), choices, note };
        });
    }
    if (Array.isArray(saved.favorites)) s.favorites = saved.favorites.filter((id) => byId.has(id));
    if (Array.isArray(saved.orders)) s.orders = saved.orders.filter((o) => o && o.id && Array.isArray(o.lines)).slice(0, 30);
    if (Number.isFinite(saved.nextOrderNo)) s.nextOrderNo = saved.nextOrderNo;
    if (Number.isFinite(saved.points)) s.points = Math.max(0, Math.floor(saved.points));
    s.welcomed = !!saved.welcomed;
    if (saved.checkout) Object.assign(s.checkout, pick(saved.checkout, Object.keys(s.checkout)));
    if (!R.orderTypes[s.checkout.mode] || !R.orderTypes[s.checkout.mode].enabled) s.checkout.mode = firstMode();
    if (saved.profile) Object.assign(s.profile, pick(saved.profile, Object.keys(s.profile)));
    return s;
  }

  function pick(obj, keys) {
    const out = {};
    keys.forEach((k) => {
      if (obj[k] !== undefined) out[k] = obj[k];
    });
    return out;
  }

  const listeners = new Set();
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function commit(topic) {
    storage.write({
      v: 1, cart: state.cart, favorites: state.favorites, orders: state.orders.slice(0, 30),
      nextOrderNo: state.nextOrderNo, points: state.points, welcomed: state.welcomed,
      checkout: state.checkout, profile: state.profile,
    });
    listeners.forEach((fn) => fn(topic));
  }

  /* Another tab changed the order: pick it up */
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = hydrate(storage.read());
    listeners.forEach((fn) => fn("sync"));
  });

  /* ----------------------------------------------------------
     Cart
     ---------------------------------------------------------- */
  function addToCart(dishId, qty, choices, note) {
    const d = dish(dishId);
    if (!d) return null;
    const norm = normalizeChoices(d, choices);
    const n = String(note || "").trim().slice(0, 140);
    const key = lineKey(dishId, norm, n);
    const line = state.cart.find((l) => l.key === key);
    if (line) line.qty = Math.min(99, line.qty + qty);
    else state.cart.push({ key, dishId, qty: Math.min(99, qty), choices: norm, note: n });
    commit("cart");
    return key;
  }

  function setQty(key, qty) {
    const line = state.cart.find((l) => l.key === key);
    if (!line) return;
    if (qty <= 0) state.cart = state.cart.filter((l) => l.key !== key);
    else line.qty = Math.min(99, qty);
    commit("cart");
  }

  function clearCart() {
    state.cart = [];
    commit("cart");
  }

  function cartLines() {
    return state.cart.map((l) => {
      const d = dish(l.dishId);
      const unit = unitPrice(d, l.choices);
      return Object.assign({}, l, { dish: d, unit, total: unit * l.qty, details: describeChoices(d, l.choices) });
    });
  }

  const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
  const qtyInCart = (dishId) => state.cart.reduce((n, l) => n + (l.dishId === dishId ? l.qty : 0), 0);

  /* Rouge Club: 10 points per dollar of food */
  const pointsFor = (subtotalCents) => Math.floor((subtotalCents / 100) * (R.club.perDollar || 0));

  function totals(mode) {
    mode = mode || state.checkout.mode;
    const lines = cartLines();
    const subtotal = lines.reduce((n, l) => n + l.total, 0);
    const del = R.orderTypes.delivery;
    let deliveryFee = 0;
    let freeDeliveryGap = 0;
    if (mode === "delivery") {
      const freeOver = cents(del.freeOver);
      if (freeOver && subtotal >= freeOver) deliveryFee = 0;
      else {
        deliveryFee = cents(del.fee);
        if (freeOver) freeDeliveryGap = freeOver - subtotal;
      }
    }
    // Québec taxes apply to the food and the delivery fee
    const taxable = subtotal + deliveryFee;
    const taxes = (R.taxes || []).map((t) => ({ id: t.id, label: t.label, rate: t.rate, amount: Math.round(taxable * t.rate) }));
    const taxTotal = taxes.reduce((n, t) => n + t.amount, 0);
    const minOrder = mode === "delivery" ? cents(del.minOrder) : 0;
    return {
      lines, subtotal, deliveryFee, taxes,
      total: subtotal + deliveryFee + taxTotal,
      minOrder, belowMin: subtotal < minOrder, freeDeliveryGap,
      points: pointsFor(subtotal),
    };
  }

  /* ----------------------------------------------------------
     Favorites, checkout draft, profile
     ---------------------------------------------------------- */
  const isFav = (id) => state.favorites.includes(id);
  function toggleFav(id) {
    if (isFav(id)) state.favorites = state.favorites.filter((x) => x !== id);
    else state.favorites.push(id);
    commit("favorites");
    return isFav(id);
  }

  function setCheckout(patch, silent) {
    Object.assign(state.checkout, patch);
    commit(silent ? "draft" : "checkout");
  }

  /* Completing the profile (name and phone) earns the welcome gift, once */
  function setProfile(patch, silent) {
    Object.assign(state.profile, patch);
    let gift = 0;
    if (!state.welcomed && state.profile.name.trim().length >= 2 && state.profile.phone.replace(/\D/g, "").length >= 7) {
      state.welcomed = true;
      gift = R.club.welcome || 0;
      state.points += gift;
    }
    commit(gift ? "club" : silent ? "draft" : "profile");
    return gift;
  }

  function resetAll() {
    state = defaults();
    commit("reset");
  }

  /* ----------------------------------------------------------
     Opening hours (evaluated in the restaurant's time zone)
     ---------------------------------------------------------- */
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let zonedFmt = null;
  function zoned(date) {
    try {
      zonedFmt = zonedFmt || new Intl.DateTimeFormat("en-US", {
        timeZone: R.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
      });
      const parts = zonedFmt.formatToParts(date);
      const get = (t) => (parts.find((p) => p.type === t) || {}).value;
      const hour = Number(get("hour")) % 24;
      return { dow: WEEKDAYS.indexOf(get("weekday")), min: hour * 60 + Number(get("minute")) };
    } catch (e) {
      return { dow: date.getDay(), min: date.getHours() * 60 + date.getMinutes() };
    }
  }

  const toMin = (s) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  function ranges(dow) {
    return (R.hours[dow] || [])
      .map(([a, b]) => {
        const s = toMin(a);
        let e = toMin(b);
        if (e <= s) e += DAY; // closes after midnight
        return [s, e];
      })
      .sort((x, y) => x[0] - y[0]);
  }
  const addMin = (date, m) => new Date(date.getTime() + m * 60000);

  function openStatus(now) {
    now = now || new Date();
    const { dow, min } = zoned(now);
    for (const [a, b] of ranges(dow)) {
      if (min >= a && min < b) return { open: true, closesIn: b - min, closesAt: addMin(now, b - min) };
    }
    for (const [a, b] of ranges((dow + 6) % 7)) {
      if (b > DAY && min + DAY >= a && min + DAY < b) {
        return { open: true, closesIn: b - DAY - min, closesAt: addMin(now, b - DAY - min) };
      }
    }
    for (let k = 0; k < 8; k++) {
      for (const [a] of ranges((dow + k) % 7)) {
        const delta = k * DAY + a - min;
        if (delta > 0) return { open: false, opensIn: delta, opensAt: addMin(now, delta), dayOffset: k };
      }
    }
    return { open: false, opensIn: null };
  }

  function prepMinutes(mode) {
    const t = R.orderTypes[mode] || {};
    return t.prepMinutes || R.orderTypes.pickup.prepMinutes || 15;
  }

  /* Time slots customers can schedule, aligned to the wall clock. */
  function slots(mode, now, count) {
    now = new Date((now || new Date()).getTime());
    now.setSeconds(0, 0);
    count = count || 24;
    const step = R.slotMinutes || 15;
    const prep = prepMinutes(mode);
    const { dow, min } = zoned(now);
    const out = [];
    for (let k = 0; k < 8 && out.length < count; k++) {
      for (const [a, b] of ranges((dow + k) % 7)) {
        let first = Math.max(k * DAY + a - min + prep, prep);
        first = Math.ceil((first + min) / step) * step - min;
        const last = k * DAY + b - min;
        for (let t = first; t <= last && out.length < count; t += step) {
          out.push({ at: addMin(now, t), day: Math.floor((t + min) / DAY) });
        }
      }
    }
    return out;
  }

  function asapAvailable(mode, now) {
    const st = openStatus(now);
    return st.open && st.closesIn >= Math.min(prepMinutes(mode), 30);
  }

  /* ----------------------------------------------------------
     Orders
     ---------------------------------------------------------- */
  function placeOrder(details) {
    const t = totals(details.mode);
    if (!t.lines.length) throw new Error(I.t("err.emptyCart"));
    const now = Date.now();
    const order = {
      id: "o" + now.toString(36),
      number: state.nextOrderNo,
      placedAt: now,
      mode: details.mode,
      when: details.when,
      prep: prepMinutes(details.mode),
      name: details.name,
      phone: details.phone,
      address: details.mode === "delivery" ? details.address : "",
      instructions: details.instructions || "",
      payment: details.payment,
      lines: t.lines.map((l) => ({
        dishId: l.dishId, name: l.dish.name, qty: l.qty, unit: l.unit, total: l.total,
        choices: l.choices, details: l.details, note: l.note,
      })),
      subtotal: t.subtotal, deliveryFee: t.deliveryFee, taxes: t.taxes, total: t.total,
      points: t.points,
      demo: !!R.demo,
    };
    state.nextOrderNo += 1;
    state.orders.unshift(order);
    state.points += order.points;
    state.cart = [];
    // remember contact details for next time
    state.profile.name = details.name || state.profile.name;
    state.profile.phone = details.phone || state.profile.phone;
    if (details.mode === "delivery") state.profile.address = details.address || state.profile.address;
    commit("orders");
    return order;
  }

  /* Stage timeline. Demo ASAP orders move along in about 90 seconds so the
     tracker can be seen working; scheduled orders follow the clock. */
  function orderProgress(order, now) {
    now = now || Date.now();
    const min = 60000;
    let marks;
    if (order.when === "asap" || !order.when) {
      marks = order.demo
        ? [0, 12, 50, 90].map((s) => order.placedAt + s * 1000)
        : [0, 2 * min, order.prep * min, (order.prep + (order.mode === "delivery" ? 20 : 10)) * min].map((m) => order.placedAt + m);
    } else {
      const at = Date.parse(order.when);
      marks = [order.placedAt, at - order.prep * min, at, at + 10 * min];
    }
    let stage = 0;
    marks.forEach((m, i) => {
      if (now >= m) stage = i;
    });
    const done = stage >= 3;
    const span = done ? 1 : Math.max(1, marks[stage + 1] - marks[stage]);
    const within = done ? 0 : Math.min(1, (now - marks[stage]) / span);
    return {
      stage, done, marks,
      progress: done ? 1 : (stage + within) / 3,
      readyAt: marks[2],
      scheduled: order.when && order.when !== "asap",
    };
  }

  const activeOrders = () => state.orders.filter((o) => !orderProgress(o).done);

  function reorder(orderId) {
    const o = state.orders.find((x) => x.id === orderId);
    if (!o) return 0;
    let added = 0;
    o.lines.forEach((l) => {
      const d = dish(l.dishId);
      if (!d) return;
      const norm = normalizeChoices(d, l.choices || {});
      const key = lineKey(d.id, norm, l.note || "");
      const line = state.cart.find((x) => x.key === key);
      if (line) line.qty = Math.min(99, line.qty + l.qty);
      else state.cart.push({ key, dishId: d.id, qty: l.qty, choices: norm, note: l.note || "" });
      added += l.qty;
    });
    commit("cart");
    return added;
  }

  /* ----------------------------------------------------------
     Formatting, in the current language
     ---------------------------------------------------------- */
  let fmtLang = null;
  let nf, tf, df, wf;
  function fmts() {
    if (fmtLang === I.lang) return;
    fmtLang = I.lang;
    const loc = I.locale();
    try {
      nf = new Intl.NumberFormat(loc, { style: "currency", currency: R.currency });
      tf = new Intl.DateTimeFormat(loc, { hour: "numeric", minute: "2-digit", timeZone: R.timeZone });
      df = new Intl.DateTimeFormat(loc, { weekday: "short", month: "short", day: "numeric", timeZone: R.timeZone });
      wf = new Intl.DateTimeFormat(loc, { weekday: "long", timeZone: R.timeZone });
    } catch (e) {
      nf = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
      tf = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });
      df = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric" });
      wf = new Intl.DateTimeFormat("en-CA", { weekday: "long" });
    }
  }

  function money(amountCents) {
    fmts();
    return nf.format(amountCents / 100);
  }
  const clock = (date) => (fmts(), tf.format(date));
  const dayLabel = (date) => (fmts(), df.format(date));
  const weekday = (date) => (fmts(), wf.format(date));

  function slotLabel(slot) {
    const day = slot.day === 0 ? I.t("time.today") : slot.day === 1 ? I.t("time.tomorrow") : cap(weekday(slot.at));
    return day + ", " + clock(slot.at);
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  window.Store = {
    R, dishes, dish, category, dishesIn, search, isBowl, choicesOf, single,
    defaultChoices, normalizeChoices, missing, unitPrice, describeChoices, pointsFor,
    get state() {
      return state;
    },
    subscribe, addToCart, setQty, clearCart, cartLines, cartCount, qtyInCart, totals,
    isFav, toggleFav, setCheckout, setProfile, resetAll,
    openStatus, slots, asapAvailable, prepMinutes, ranges, zoned,
    placeOrder, orderProgress, activeOrders, reorder,
    money, cents, clock, dayLabel, slotLabel, cap,
  };
})();
