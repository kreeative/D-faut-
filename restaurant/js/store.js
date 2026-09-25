/* ============================================================
   Store — menu lookups, cart, pricing, hours, orders.
   All money is handled in integer cents.
   ============================================================ */
(function () {
  "use strict";

  const R = window.RESTAURANT;
  const STORAGE_KEY = "tabouret:v1";
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
    promo: "",
    checkout: {
      mode: firstMode(), table: "", when: "asap",
      name: "", phone: "", address: "", instructions: "", payment: "card",
    },
    profile: { name: "", phone: "", address: "", diet: [] },
  });

  function firstMode() {
    const t = R.orderTypes;
    return t.pickup.enabled ? "pickup" : t.dineIn.enabled ? "dineIn" : "delivery";
  }

  /* ----------------------------------------------------------
     Menu
     ---------------------------------------------------------- */
  const dishes = R.dishes.map((d) =>
    Object.assign({
      image: "assets/dishes/" + d.id + ".webp",
      // A dish with its own `image` and no `thumb` uses that image everywhere
      thumb: d.image || "assets/dishes/thumbs/" + d.id + ".webp",
      options: [], tags: [], allergens: [],
    }, d)
  );
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const cents = (n) => Math.round((n || 0) * 100);

  function dish(id) {
    return byId.get(id) || null;
  }
  function category(id) {
    return R.categories.find((c) => c.id === id) || R.categories[0];
  }
  function dishesIn(catId) {
    return catId === "all" ? dishes.slice() : dishes.filter((d) => d.category === catId);
  }

  const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function search(query) {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.length) return dishes.slice();
    return dishes.filter((d) => {
      const hay = fold([d.name, d.short, d.description, category(d.category).name,
        d.tags.map((t) => (R.tags[t] || {}).label).join(" ")].join(" "));
      return words.every((w) => hay.includes(w));
    });
  }

  /* Diet preferences: v, vg, gf, df */
  function matchesDiet(d, diet) {
    return (diet || []).every((pref) => {
      if (pref === "v") return d.tags.includes("v") || d.tags.includes("vg");
      if (pref === "df") return d.tags.includes("df") || d.tags.includes("vg");
      return d.tags.includes(pref);
    });
  }

  /* ----------------------------------------------------------
     Options & prices
     ---------------------------------------------------------- */
  function defaultChoices(d) {
    const out = {};
    d.options.forEach((g) => {
      if (g.type === "single") {
        const def = g.choices.find((c) => c.default) || g.choices[0];
        out[g.id] = def ? [def.id] : [];
      } else {
        out[g.id] = [];
      }
    });
    return out;
  }

  function normalizeChoices(d, choices) {
    const out = defaultChoices(d);
    d.options.forEach((g) => {
      const picked = ((choices || {})[g.id] || []).filter((id) => g.choices.some((c) => c.id === id));
      if (g.type === "single") {
        if (picked.length) out[g.id] = [picked[0]];
      } else {
        out[g.id] = picked.slice(0, g.max || g.choices.length);
      }
    });
    return out;
  }

  function unitPrice(d, choices) {
    let total = cents(d.price);
    d.options.forEach((g) => {
      (choices[g.id] || []).forEach((id) => {
        const c = g.choices.find((x) => x.id === id);
        if (c) total += cents(c.price);
      });
    });
    return total;
  }

  function describeChoices(d, choices) {
    const out = [];
    d.options.forEach((g) => {
      (choices[g.id] || []).forEach((id) => {
        const c = g.choices.find((x) => x.id === id);
        if (c && c.id !== "none") out.push(c.name);
      });
    });
    return out;
  }

  function lineKey(dishId, choices, note) {
    const parts = Object.keys(choices).sort().map((k) => k + ":" + choices[k].slice().sort().join("+"));
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
    if (saved.promo && R.promoCodes[saved.promo]) s.promo = saved.promo;
    if (saved.checkout) Object.assign(s.checkout, pick(saved.checkout, Object.keys(s.checkout)));
    if (!R.orderTypes[s.checkout.mode] || !R.orderTypes[s.checkout.mode].enabled) s.checkout.mode = firstMode();
    if (saved.profile) Object.assign(s.profile, pick(saved.profile, Object.keys(s.profile)));
    if (!Array.isArray(s.profile.diet)) s.profile.diet = [];
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
      nextOrderNo: state.nextOrderNo, promo: state.promo, checkout: state.checkout, profile: state.profile,
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
    state.promo = "";
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

  function totals(mode) {
    mode = mode || state.checkout.mode;
    const lines = cartLines();
    const subtotal = lines.reduce((n, l) => n + l.total, 0);
    const promo = state.promo ? R.promoCodes[state.promo] : null;
    const discount = promo && promo.type === "percent" ? Math.round((subtotal * promo.value) / 100) : 0;
    const del = R.orderTypes.delivery;
    let deliveryFee = 0;
    let freeDeliveryGap = 0;
    if (mode === "delivery") {
      const freeByPromo = promo && promo.type === "delivery";
      const freeOver = cents(del.freeOver);
      if (freeByPromo || (freeOver && subtotal - discount >= freeOver)) deliveryFee = 0;
      else {
        deliveryFee = cents(del.fee);
        if (freeOver) freeDeliveryGap = freeOver - (subtotal - discount);
      }
    }
    const tax = Math.round((subtotal - discount) * (R.taxRate || 0));
    const minOrder = mode === "delivery" ? cents(del.minOrder) : 0;
    return {
      lines, subtotal, discount, deliveryFee, tax,
      total: subtotal - discount + deliveryFee + tax,
      minOrder, belowMin: subtotal < minOrder, freeDeliveryGap,
      promo: promo ? Object.assign({ code: state.promo }, promo) : null,
    };
  }

  function applyPromo(code) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return { ok: false, message: "Enter a promo code first." };
    const promo = R.promoCodes[c];
    if (!promo) return { ok: false, message: "“" + c + "” isn’t a valid code. Check the spelling and try again." };
    if (promo.type === "delivery" && state.checkout.mode !== "delivery") {
      return { ok: false, message: "“" + c + "” only works on delivery orders." };
    }
    state.promo = c;
    commit("cart");
    return { ok: true, message: promo.label + " applied." };
  }
  function removePromo() {
    state.promo = "";
    commit("cart");
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
    if (patch.mode && state.promo && R.promoCodes[state.promo].type === "delivery" && patch.mode !== "delivery") {
      state.promo = "";
    }
    commit(silent ? "draft" : "checkout");
  }

  function setProfile(patch, silent) {
    Object.assign(state.profile, patch);
    commit(silent ? "draft" : "profile");
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
    return t.prepMinutes || R.orderTypes.pickup.prepMinutes || 20;
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
        // the kitchen needs its prep time after opening, and from now
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
  const STAGES = {
    dineIn: ["Order received", "Preparing", "On its way to your table", "Served"],
    pickup: ["Order received", "Preparing", "Ready for pickup", "Picked up"],
    delivery: ["Order received", "Preparing", "Out for delivery", "Delivered"],
  };

  function placeOrder(details) {
    const t = totals(details.mode);
    if (!t.lines.length) throw new Error("Your cart is empty.");
    const now = Date.now();
    const order = {
      id: "o" + now.toString(36),
      number: state.nextOrderNo,
      placedAt: now,
      mode: details.mode,
      table: details.mode === "dineIn" ? details.table : "",
      when: details.mode === "dineIn" ? "asap" : details.when,
      prep: prepMinutes(details.mode),
      name: details.name,
      phone: details.phone,
      address: details.mode === "delivery" ? details.address : "",
      instructions: details.instructions || "",
      payment: details.payment,
      lines: t.lines.map((l) => ({
        dishId: l.dishId, name: l.dish.name, qty: l.qty, unit: l.unit, total: l.total, details: l.details, note: l.note,
      })),
      subtotal: t.subtotal, discount: t.discount, deliveryFee: t.deliveryFee, tax: t.tax, total: t.total,
      promo: t.promo ? t.promo.code : "",
      demo: !!R.demo,
    };
    state.nextOrderNo += 1;
    state.orders.unshift(order);
    state.cart = [];
    state.promo = "";
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
      labels: STAGES[order.mode] || STAGES.pickup,
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
      // map the saved option names back onto current choices
      const choices = {};
      d.options.forEach((g) => {
        choices[g.id] = g.choices.filter((c) => (l.details || []).includes(c.name)).map((c) => c.id);
      });
      const norm = normalizeChoices(d, choices);
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
     Formatting
     ---------------------------------------------------------- */
  let nf, tf, df;
  try {
    nf = new Intl.NumberFormat(R.locale, { style: "currency", currency: R.currency });
    tf = new Intl.DateTimeFormat(R.locale, { hour: "numeric", minute: "2-digit", timeZone: R.timeZone });
    df = new Intl.DateTimeFormat(R.locale, { weekday: "short", month: "short", day: "numeric", timeZone: R.timeZone });
  } catch (e) {
    nf = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    tf = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    df = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  /* "$ 15.00" — a narrow gap after a leading symbol, as on the menu boards */
  function money(amountCents) {
    const parts = nf.formatToParts(amountCents / 100);
    return parts
      .map((p, i) => p.value + (p.type === "currency" && parts[i + 1] && parts[i + 1].type === "integer" ? " " : ""))
      .join("");
  }
  const clock = (date) => tf.format(date);
  const dayLabel = (date) => df.format(date);

  function slotLabel(slot) {
    const day = slot.day === 0 ? "Today" : slot.day === 1 ? "Tomorrow" : dayLabel(slot.at).split(",")[0];
    return day + ", " + clock(slot.at);
  }

  window.Store = {
    R, dishes, dish, category, dishesIn, search, matchesDiet,
    defaultChoices, normalizeChoices, unitPrice, describeChoices,
    get state() {
      return state;
    },
    subscribe, addToCart, setQty, clearCart, cartLines, cartCount, qtyInCart, totals, applyPromo, removePromo,
    isFav, toggleFav, setCheckout, setProfile, resetAll,
    openStatus, slots, asapAvailable, prepMinutes, weekdays: WEEKDAYS, ranges, zoned,
    placeOrder, orderProgress, activeOrders, reorder,
    money, cents, clock, dayLabel, slotLabel,
  };
})();
