/* ============================================================
   Views — functions that turn state into HTML strings
   ============================================================ */
(function () {
  "use strict";

  const S = window.Store;
  const R = S.R;
  const icon = window.Icons.icon;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many || one + "s");
  const MODE_ICON = { dineIn: "dineIn", pickup: "bag", delivery: "delivery" };
  const modes = () => Object.keys(R.orderTypes).filter((m) => R.orderTypes[m].enabled);

  /* ----------------------------------------------------------
     Small parts
     ---------------------------------------------------------- */
  function favButton(d, extra) {
    const on = S.isFav(d.id);
    return (
      '<button class="fav' + (on ? " is-on" : "") + (extra ? " " + extra : "") + '" type="button" data-action="toggle-fav" ' +
      'data-id="' + d.id + '" aria-pressed="' + on + '" aria-label="Favorite ' + esc(d.name) + '">' + icon("heart") + "</button>"
    );
  }

  function stepper(value, { action, key = "", label, min = 1, trashAtOne = false }) {
    const dec = trashAtOne && value <= 1 ? "trash" : "minus";
    return (
      '<div class="stepper" role="group" aria-label="' + esc(label) + '">' +
      '<button type="button" class="stepper__btn" data-action="' + action + '-dec" data-key="' + esc(key) + '" ' +
      'aria-label="' + (dec === "trash" ? "Remove" : "One less") + '"' + (!trashAtOne && value <= min ? " disabled" : "") + ">" + icon(dec) + "</button>" +
      '<output class="stepper__val" aria-live="polite">' + value + "</output>" +
      '<button type="button" class="stepper__btn" data-action="' + action + '-inc" data-key="' + esc(key) + '" aria-label="One more"' +
      (value >= 99 ? " disabled" : "") + ">" + icon("plus") + "</button></div>"
    );
  }

  function tagChips(d) {
    return d.tags
      .map((t) => {
        const tag = R.tags[t];
        if (!tag) return "";
        const ic = t === "spicy" ? icon("flame") : t === "v" || t === "vg" ? icon("leaf") : "";
        return '<li class="fact fact--' + t + '">' + ic + esc(tag.label) + "</li>";
      })
      .join("");
  }

  function statusChip() {
    const st = S.openStatus();
    if (st.open) {
      const soon = st.closesIn <= 45;
      return '<span class="status status--' + (soon ? "soon" : "open") + '"><i></i>' +
        (soon ? "Closing soon · " : "Open now · until ") + esc(S.clock(st.closesAt)) + "</span>";
    }
    if (st.opensIn == null) return '<span class="status status--closed"><i></i>Closed</span>';
    const when = st.dayOffset === 0 ? S.clock(st.opensAt) : st.dayOffset === 1 ? "tomorrow " + S.clock(st.opensAt) : S.dayLabel(st.opensAt).split(",")[0] + " " + S.clock(st.opensAt);
    return '<span class="status status--closed"><i></i>Closed · opens ' + esc(when) + "</span>";
  }

  /* Menu plates use the 400px thumbnail, or the 800px photo on dense screens */
  function srcset(d, sizes) {
    return d.thumb === d.image ? "" :
      ' srcset="' + esc(d.thumb) + " 400w, " + esc(d.image) + ' 800w" sizes="' + sizes + '"';
  }

  function dishImg(d, cls, eager, sizes) {
    return '<img class="dish-img ' + (cls || "") + '" src="' + esc(d.thumb) + '"' + srcset(d, sizes) + ' alt="" width="400" height="400" ' +
      (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">';
  }

  /* ----------------------------------------------------------
     Menu tab
     ---------------------------------------------------------- */
  function card(d, i) {
    const n = S.qtyInCart(d.id);
    return (
      '<article class="card" style="--i:' + i + '">' +
      '<div class="card__media">' + dishImg(d, "", i < 4, "150px") + "</div>" +
      '<div class="card__body">' +
      '<h3 class="card__title"><a class="card__link" href="#/dish/' + d.id + '">' + esc(d.name) + "</a></h3>" +
      '<p class="card__desc">' + esc(d.short) + "</p>" +
      '<div class="card__foot"><span class="price">' + S.money(S.cents(d.price)) + "</span>" + favButton(d) + "</div>" +
      "</div>" +
      (n ? '<span class="card__qty" title="In your cart">' + n + '<span class="sr-only"> in your cart</span></span>' : "") +
      "</article>"
    );
  }

  function feature(d, label) {
    return (
      '<article class="feature">' +
      '<div class="feature__body">' +
      '<p class="feature__eyebrow">' + icon("sparkle") + esc(label) + "</p>" +
      '<h3 class="feature__title"><a class="card__link" href="#/dish/' + d.id + '">' + esc(d.name) + "</a></h3>" +
      '<p class="feature__desc">' + esc(d.short) + "</p>" +
      '<div class="feature__foot"><span class="price">' + S.money(S.cents(d.price)) + '</span><span class="feature__time">' +
      icon("clock") + d.minutes + " min</span></div>" +
      "</div>" +
      '<div class="feature__media">' + dishImg(d, "", true, "200px") + "</div>" +
      "</article>"
    );
  }

  function grid(list, withFeature) {
    let i = 0;
    let html = "";
    list.forEach((d) => {
      if (withFeature && d.id === R.featured) return;
      html += card(d, i++);
      if (withFeature && i === 2) html += feature(S.dish(R.featured), "Chef’s pick");
    });
    if (withFeature && i < 2) html += feature(S.dish(R.featured), "Chef’s pick");
    return '<div class="grid">' + html + "</div>";
  }

  function section(title, list, { id, withFeature, count = true } = {}) {
    return (
      '<section class="menu-section"' + (id ? ' aria-labelledby="sec-' + id + '"' : "") + ">" +
      '<div class="section-head"><h2 class="section-head__title"' + (id ? ' id="sec-' + id + '"' : "") + ">" + esc(title) + "</h2>" +
      (count ? '<span class="section-head__count">' + plural(list.length, "dish", "dishes") + "</span>" : "") + "</div>" +
      grid(list, withFeature) +
      "</section>"
    );
  }

  function menuList(ui) {
    const diet = S.state.profile.diet;
    const keep = (d) => S.matchesDiet(d, diet);
    if (ui.query.trim()) {
      const found = S.search(ui.query).filter(keep);
      if (!found.length) {
        return '<div class="empty empty--inline"><p class="empty__title">No dishes match “' + esc(ui.query.trim()) + '”</p>' +
          '<p class="empty__text">Try another word, like “bowl”, “vegan” or “coffee”.</p></div>';
      }
      return section("Results", found, { id: "results" });
    }
    if (ui.category === "all") {
      const featured = S.dish(R.featured);
      let first = true;
      return R.categories
        .filter((c) => c.id !== "all")
        .map((c) => {
          const list = S.dishesIn(c.id).filter(keep);
          if (!list.length) return "";
          const withFeature = first && featured && keep(featured) && featured.category === c.id;
          first = false;
          return section(c.name, list, { id: c.id, withFeature });
        })
        .join("") || dietEmpty();
    }
    const cat = S.category(ui.category);
    const list = S.dishesIn(cat.id).filter(keep);
    return list.length ? section(cat.name, list, { id: cat.id }) : dietEmpty();
  }

  function dietEmpty() {
    return '<div class="empty empty--inline"><p class="empty__title">Nothing here matches your diet filter</p>' +
      '<p class="empty__text">Clear the filter to see every dish in this section.</p>' +
      '<button class="btn btn--ghost" type="button" data-action="clear-diet">Show all dishes</button></div>';
  }

  function dietNotice() {
    const diet = S.state.profile.diet;
    if (!diet.length) return "";
    const names = diet.map((t) => (R.tags[t] || {}).label || t).join(", ").toLowerCase();
    return '<div class="notice"><span>' + icon("leaf") + "Showing " + esc(names) + " dishes</span>" +
      '<button class="textbtn" type="button" data-action="clear-diet">Show all</button></div>';
  }

  function menuView(ui) {
    const table = S.state.checkout.mode === "dineIn" && S.state.checkout.table;
    return (
      '<section class="hero">' +
      '<div class="hero__meta">' + statusChip() +
      (table ? '<span class="status status--table">' + icon("dineIn") + "Table " + esc(table) + "</span>" : "") + "</div>" +
      '<h1 class="hero__title">' + esc(R.headline) + "</h1>" +
      '<p class="hero__sub">' + esc(R.tagline) + "</p>" +
      "</section>" +
      '<div class="search"' + (ui.searchOpen ? "" : " hidden") + ">" +
      '<label class="search__field" for="searchInput"><span class="sr-only">Search the menu</span>' + icon("search") +
      '<input id="searchInput" type="search" placeholder="Search dishes" value="' + esc(ui.query) + '" autocomplete="off" enterkeyhint="search"></label>' +
      '<button class="textbtn" type="button" data-action="close-search">Cancel</button></div>' +
      '<div class="cats" role="group" aria-label="Menu sections">' +
      R.categories
        .map((c) => {
          const on = c.id === ui.category && !ui.query.trim();
          return '<button class="cat' + (on ? " is-on" : "") + '" type="button" data-action="set-cat" data-cat="' + c.id + '" aria-pressed="' + on + '">' +
            '<span class="cat__icon">' + icon(c.icon) + '</span><span class="cat__label">' + esc(c.name) + "</span></button>";
        })
        .join("") +
      "</div>" +
      dietNotice() +
      '<div class="menu-list" id="menuList">' + menuList(ui) + "</div>" +
      footerNote()
    );
  }

  function footerNote() {
    return '<p class="fine">Prices include service. ' + (R.taxRate ? "Sales tax is added at checkout. " : "") +
      'Tell us about allergies when you order. <a href="#/info">Hours &amp; contact</a></p>';
  }

  /* ----------------------------------------------------------
     Favorites / Orders / Profile tabs
     ---------------------------------------------------------- */
  function pageHead(title, sub) {
    return '<header class="page-head"><h1 class="page-title">' + esc(title) + "</h1>" + (sub ? '<p class="page-sub">' + esc(sub) + "</p>" : "") + "</header>";
  }

  function empty(iconName, title, text, cta) {
    return '<div class="empty"><span class="empty__icon">' + icon(iconName) + '</span><p class="empty__title">' + esc(title) + "</p>" +
      '<p class="empty__text">' + esc(text) + "</p>" + (cta || "") + "</div>";
  }

  function favoritesView() {
    const list = S.state.favorites.map(S.dish).filter(Boolean);
    return (
      pageHead("Favorites", list.length ? "The dishes you keep coming back for." : "") +
      (list.length
        ? '<div class="grid grid--solo">' + list.map(card).join("") + "</div>"
        : empty("heart", "No favorites yet", "Tap the heart on any dish to keep it here for next time.",
          '<a class="btn" href="#/menu">Browse the menu</a>'))
    );
  }

  function orderTime(o) {
    const d = new Date(o.placedAt);
    const today = new Date();
    const same = d.toDateString() === today.toDateString();
    return (same ? "Today" : S.dayLabel(d)) + ", " + S.clock(d);
  }

  function orderCard(o) {
    const pr = S.orderProgress(o);
    const thumbs = o.lines.slice(0, 3).map((l) => {
      const d = S.dish(l.dishId);
      return d ? '<img src="' + esc(d.thumb) + '" alt="" width="80" height="80" loading="lazy">' : "";
    }).join("");
    const items = o.lines.map((l) => l.qty + " × " + l.name).join(", ");
    return (
      '<article class="ocard' + (pr.done ? "" : " is-live") + '" data-order="' + o.id + '">' +
      '<div class="ocard__top"><div class="ocard__thumbs">' + thumbs + "</div>" +
      '<div class="ocard__meta"><p class="ocard__no">#' + o.number + " · " + esc(R.orderTypes[o.mode].label) + "</p>" +
      '<p class="ocard__time">' + esc(orderTime(o)) + "</p></div>" +
      '<span class="pill' + (pr.done ? "" : " pill--live") + '" data-ostage>' + esc(pr.labels[pr.stage]) + "</span></div>" +
      '<p class="ocard__items">' + esc(items) + "</p>" +
      (pr.done ? "" : '<div class="bar" aria-hidden="true"><span data-obar style="width:' + Math.round(pr.progress * 100) + '%"></span></div>') +
      '<div class="ocard__foot"><strong class="price">' + S.money(o.total) + "</strong>" +
      '<div class="ocard__actions">' +
      (pr.done ? '<button class="btn btn--sm btn--ghost" type="button" data-action="reorder" data-id="' + o.id + '">' + icon("refresh") + "Reorder</button>" : "") +
      '<a class="btn btn--sm" href="#/order/' + o.id + '">' + (pr.done ? "Details" : "Track") + "</a></div></div>" +
      "</article>"
    );
  }

  function ordersView() {
    const orders = S.state.orders;
    const live = orders.filter((o) => !S.orderProgress(o).done);
    const past = orders.filter((o) => S.orderProgress(o).done);
    if (!orders.length) {
      return pageHead("Orders") + empty("receipt", "No orders yet", "When you place an order you can follow it here, from the kitchen to your table or door.",
        '<a class="btn" href="#/menu">Start an order</a>');
    }
    return (
      pageHead("Orders", "Follow what’s cooking and reorder in one tap.") +
      (live.length ? '<h2 class="list-title">In progress</h2><div class="stack">' + live.map(orderCard).join("") + "</div>" : "") +
      (past.length ? '<h2 class="list-title">Past orders</h2><div class="stack">' + past.map(orderCard).join("") + "</div>" : "")
    );
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return parts.length ? (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase() : "";
  }

  function profileView(ui) {
    const p = S.state.profile;
    const first = String(p.name || "").trim().split(/\s+/)[0];
    const diets = ["v", "vg", "gf", "df"];
    return (
      '<header class="page-head page-head--profile"><span class="avatar" aria-hidden="true">' + (initials(p.name) || icon("user")) + "</span>" +
      '<div><h1 class="page-title">' + (first ? "Hi, " + esc(first) : "Your profile") + "</h1>" +
      '<p class="page-sub">Saved on this device to make checkout quicker.</p></div></header>' +
      '<form class="panel-block" id="profileForm" autocomplete="on">' +
      '<h2 class="block__title">Your details</h2>' +
      field("pfName", "name", "Name", p.name, { autocomplete: "name", placeholder: "Your name" }) +
      field("pfPhone", "phone", "Phone", p.phone, { type: "tel", autocomplete: "tel", placeholder: "For order updates" }) +
      field("pfAddress", "address", "Delivery address", p.address, { autocomplete: "street-address", placeholder: "Street, number, apartment" }) +
      '<p class="hint" data-saved hidden>' + icon("check") + "Saved</p>" +
      "</form>" +
      '<section class="panel-block"><h2 class="block__title">Dietary preferences</h2>' +
      '<p class="block__text">The menu will only show dishes that match.</p><div class="chips">' +
      diets.map((t) => {
        const on = p.diet.includes(t);
        return '<button class="chip' + (on ? " is-on" : "") + '" type="button" data-action="toggle-diet" data-tag="' + t + '" aria-pressed="' + on + '">' +
          (on ? icon("check") : "") + esc(R.tags[t].label) + "</button>";
      }).join("") +
      "</div></section>" +
      '<section class="panel-block"><h2 class="block__title">Usual way to order</h2>' + modeSeg(S.state.checkout.mode, "set-mode") + "</section>" +
      '<section class="panel-block links">' +
      '<a class="linkrow" href="#/info">' + icon("info") + "<span>Hours, address &amp; contact</span>" + icon("arrow", "linkrow__go") + "</a>" +
      '<a class="linkrow" href="#/orders">' + icon("receipt") + "<span>Order history</span>" + icon("arrow", "linkrow__go") + "</a>" +
      "</section>" +
      '<section class="panel-block">' +
      (ui.confirmReset
        ? '<p class="block__text"><strong>Clear everything saved on this device?</strong> This removes your cart, favorites, order history and details.</p>' +
          '<div class="row"><button class="btn btn--danger" type="button" data-action="reset-confirm">Clear my data</button>' +
          '<button class="btn btn--ghost" type="button" data-action="reset-cancel">Keep it</button></div>'
        : '<button class="textbtn textbtn--danger" type="button" data-action="reset-ask">' + icon("trash") + "Clear my data</button>") +
      "</section>"
    );
  }

  function field(id, name, label, value, o) {
    o = o || {};
    const tag = o.textarea
      ? '<textarea id="' + id + '" name="' + name + '" rows="' + (o.rows || 2) + '"' + (o.maxlength ? ' maxlength="' + o.maxlength + '"' : "") +
        (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : "") + ">" + esc(value) + "</textarea>"
      : '<input id="' + id + '" name="' + name + '" type="' + (o.type || "text") + '" value="' + esc(value) + '"' +
        (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : "") + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : "") +
        (o.inputmode ? ' inputmode="' + o.inputmode + '"' : "") + (o.required ? " required" : "") + (o.maxlength ? ' maxlength="' + o.maxlength + '"' : "") + ">";
    return '<div class="field"><label class="field__label" for="' + id + '">' + esc(label) +
      (o.optional ? ' <span class="muted">Optional</span>' : "") + "</label>" + tag +
      '<p class="field__error" id="' + id + '-err" hidden></p></div>';
  }

  function modeSeg(current, action) {
    return '<div class="seg" role="radiogroup" aria-label="Order type">' +
      modes().map((m) => {
        const on = m === current;
        return '<button class="seg__opt' + (on ? " is-on" : "") + '" type="button" role="radio" aria-checked="' + on + '" data-action="' + action + '" data-mode="' + m + '">' +
          icon(MODE_ICON[m]) + "<span>" + esc(R.orderTypes[m].label) + "</span></button>";
      }).join("") +
      "</div>";
  }

  /* ----------------------------------------------------------
     Panel: dish detail
     ---------------------------------------------------------- */
  function optionGroup(d, g, choices) {
    const multi = g.type === "multi";
    const note = multi ? (g.max ? "Up to " + g.max : "Optional") : "Choose 1";
    return (
      '<fieldset class="opt-group" data-group="' + g.id + '"' + (multi && g.max ? ' data-max="' + g.max + '"' : "") + ">" +
      '<legend class="opt-group__title">' + esc(g.name) + ' <span class="muted">' + note + "</span></legend>" +
      '<div class="choices">' +
      g.choices.map((c) => {
        const on = (choices[g.id] || []).includes(c.id);
        const id = "opt-" + d.id + "-" + g.id + "-" + c.id;
        return '<label class="choice" for="' + id + '"><input id="' + id + '" type="' + (multi ? "checkbox" : "radio") + '" name="' + g.id + '" value="' + c.id + '"' +
          (on ? " checked" : "") + ">" + '<span class="choice__pill">' + (multi ? '<span class="choice__tick">' + icon("check") + "</span>" : "") +
          esc(c.name) + (c.price ? '<span class="choice__price">+' + S.money(S.cents(c.price)) + "</span>" : "") + "</span></label>";
      }).join("") +
      "</div></fieldset>"
    );
  }

  function dishView(d, draft, { isDefault = false } = {}) {
    const unit = S.unitPrice(d, draft.choices);
    return (
      '<div class="pview pview--dish" data-view="dish" data-id="' + d.id + '">' +
      '<div class="pview__scroll">' +
      '<header class="pbar">' +
      (isDefault
        ? '<span class="pbar__label">' + icon("sparkle") + "Chef’s pick</span>"
        : '<button class="iconbtn" type="button" data-action="back" aria-label="Back">' + icon("back") + "</button>") +
      '<div class="more"><button class="iconbtn" type="button" data-action="toggle-more" aria-haspopup="true" aria-expanded="false" aria-label="More options">' + icon("more") + "</button>" +
      '<div class="popover" hidden>' +
      '<button type="button" data-action="copy-link" data-id="' + d.id + '">' + icon("link") + "Copy link to this dish</button>" +
      '<button type="button" data-action="show-allergens">' + icon("info") + "Allergens &amp; nutrition</button>" +
      "</div></div></header>" +
      '<div class="dish-hero">' +
      '<img class="dish-img dish-hero__img" src="' + esc(d.image) + '" alt="' + esc(d.name) + ', seen from above" width="800" height="800" fetchpriority="high">' +
      "</div>" +
      '<div class="dish-body">' +
      '<div class="dish-title"><h2 id="dishTitle" tabindex="-1">' + esc(d.name) + "</h2>" +
      '<span class="dish-time">' + icon("clock") + d.minutes + " Mins</span></div>" +
      '<p class="dish-desc">' + esc(d.description) + "</p>" +
      '<ul class="facts">' + tagChips(d) + '<li class="fact">' + d.kcal + " kcal</li></ul>" +
      '<form class="opts" id="dishForm" data-id="' + d.id + '" novalidate>' +
      d.options.map((g) => optionGroup(d, g, draft.choices)).join("") +
      '<div class="opt-group">' +
      '<label class="opt-group__title" for="dishNote">Special instructions <span class="muted">Optional</span></label>' +
      '<textarea id="dishNote" name="note" rows="2" maxlength="140" placeholder="No onion, sauce on the side…">' + esc(draft.note) + "</textarea></div>" +
      '<div class="qty-row"><span class="opt-group__title">Quantity</span>' +
      stepper(draft.qty, { action: "dish-qty", label: "Quantity", min: 1 }) + "</div>" +
      "</form>" +
      '<p class="allergens" id="allergens" tabindex="-1"><strong>Allergens:</strong> ' +
      (d.allergens.length ? esc(d.allergens.join(", ")) : "none of the 14 major allergens") +
      ". " + d.kcal + " kcal per portion. Our kitchen handles nuts, gluten and dairy, so tell us about allergies.</p>" +
      "</div></div>" +
      '<footer class="pfoot">' +
      '<div class="total"><span class="total__label">Total Price</span><strong class="total__value" data-dish-total>' + S.money(unit * draft.qty) + "</strong></div>" +
      favButton(d, "fav--lg") +
      '<button class="cta cta--add" type="submit" form="dishForm">Add to Cart<span class="cta__plus">' + icon("plus") + "</span></button>" +
      "</footer></div>"
    );
  }

  /* ----------------------------------------------------------
     Panel: cart
     ---------------------------------------------------------- */
  function cartLine(l, highlight) {
    const details = l.details.concat(l.note ? ["“" + l.note + "”"] : []);
    return (
      '<li class="line' + (highlight ? " is-new" : "") + '" data-key="' + esc(l.key) + '">' +
      '<a class="line__media" href="#/dish/' + l.dishId + '" tabindex="-1" aria-hidden="true"><img class="dish-img" src="' + esc(l.dish.thumb) + '" alt="" width="120" height="120" loading="lazy"></a>' +
      '<div class="line__info"><p class="line__name">' + esc(l.dish.name) + "</p>" +
      (details.length ? '<p class="line__details">' + esc(details.join(" · ")) + "</p>" : "") +
      '<p class="line__price price">' + S.money(l.total) + "</p></div>" +
      stepper(l.qty, { action: "line", key: l.key, label: "Quantity of " + l.dish.name, trashAtOne: true }) +
      "</li>"
    );
  }

  function summaryRows(t, mode) {
    let rows = '<div class="sum-row"><span>Subtotal</span><span class="price">' + S.money(t.subtotal) + "</span></div>";
    if (t.discount) rows += '<div class="sum-row sum-row--good"><span>Promo ' + esc(t.promo.code) + '</span><span class="price">−' + S.money(t.discount) + "</span></div>";
    if (mode === "delivery") {
      rows += '<div class="sum-row"><span>Delivery</span><span class="price">' + (t.deliveryFee ? S.money(t.deliveryFee) : "Free") + "</span></div>";
    }
    if (t.tax) rows += '<div class="sum-row"><span>Sales tax (' + Math.round(R.taxRate * 1000) / 10 + '%)</span><span class="price">' + S.money(t.tax) + "</span></div>";
    rows += '<div class="sum-row sum-row--total"><span>Total</span><span class="price">' + S.money(t.total) + "</span></div>";
    return rows;
  }

  function modeFields(ck, t) {
    if (ck.mode === "dineIn") {
      return field("tableInput", "table", "Table number", ck.table, {
        inputmode: "numeric", placeholder: "Printed on your table", maxlength: 3,
      }) + '<p class="block__text">We’ll bring everything to your table as soon as it’s ready.</p>';
    }
    if (ck.mode === "pickup") {
      return '<p class="block__text">' + icon("pin") + "Collect from the counter at " + esc(R.address.line1) + ". Ready in about " +
        S.prepMinutes("pickup") + " min.</p>";
    }
    const del = R.orderTypes.delivery;
    let msg = "Delivered in about " + S.prepMinutes("delivery") + " min. ";
    if (t.belowMin) msg += "Delivery starts at " + S.money(S.cents(del.minOrder)) + ": add " + S.money(t.minOrder - t.subtotal) + " more.";
    else if (t.freeDeliveryGap > 0) msg += "Add " + S.money(t.freeDeliveryGap) + " more for free delivery.";
    else if (!t.deliveryFee) msg += "Delivery is on us.";
    return '<p class="block__text' + (t.belowMin ? " is-warn" : "") + '">' + icon("delivery") + esc(msg) + "</p>";
  }

  function cartView(ui, opts) {
    const isDefault = !!(opts && opts.isDefault);
    const backBtn = isDefault
      ? '<span class="pbar__spacer"></span>'
      : '<button class="iconbtn" type="button" data-action="back" aria-label="Back">' + icon("back") + "</button>";
    const ck = S.state.checkout;
    const t = S.totals(ck.mode);
    if (!t.lines.length) {
      return (
        '<div class="pview pview--cart" data-view="cart"><div class="pview__scroll">' +
        '<header class="pbar">' + backBtn +
        '<h2 class="pbar__title" id="panelTitle" tabindex="-1">My Order</h2><span class="pbar__spacer"></span></header>' +
        empty("cart", "Your cart is empty", "Pick something delicious from the menu and it will show up here.",
          '<a class="btn" href="#/menu">Browse the menu</a>') +
        "</div></div>"
      );
    }
    return (
      '<div class="pview pview--cart" data-view="cart"><div class="pview__scroll">' +
      '<header class="pbar">' + backBtn +
      '<h2 class="pbar__title" id="panelTitle" tabindex="-1">My Order</h2>' +
      (ui.confirmClear
        ? '<span class="pbar__confirm"><button class="textbtn textbtn--danger" type="button" data-action="clear-confirm">Remove all</button><button class="textbtn" type="button" data-action="clear-cancel">Keep</button></span>'
        : '<button class="textbtn" type="button" data-action="clear-ask">Clear</button>') +
      "</header>" +
      '<ul class="lines">' + t.lines.map((l) => cartLine(l, l.key === ui.newLine)).join("") + "</ul>" +
      '<a class="addmore" href="#/menu">' + icon("plus") + "Add more dishes</a>" +
      '<section class="panel-block"><h3 class="block__title">How would you like it?</h3>' + modeSeg(ck.mode, "set-mode") +
      '<div class="mode-fields">' + modeFields(ck, t) + "</div></section>" +
      '<section class="panel-block"><h3 class="block__title">Promo code</h3>' +
      (t.promo
        ? '<div class="promo-on">' + icon("tag") + "<span><strong>" + esc(t.promo.code) + "</strong> · " + esc(t.promo.label) + "</span>" +
          '<button class="textbtn" type="button" data-action="remove-promo">Remove</button></div>'
        : '<form class="promo" id="promoForm" novalidate><label class="sr-only" for="promoInput">Promo code</label>' +
          '<input id="promoInput" name="code" placeholder="Enter a code" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
          '<button class="btn btn--sm" type="submit">Apply</button></form>' +
          '<p class="field__error" id="promoInput-err" hidden></p>' +
          '<p class="hint">First order? Try <button class="textbtn textbtn--inline" type="button" data-action="use-promo" data-code="BLOOM10">BLOOM10</button></p>') +
      "</section>" +
      '<section class="panel-block summary">' + summaryRows(t, ck.mode) + "</section>" +
      "</div>" +
      '<footer class="pfoot"><div class="total"><span class="total__label">Total</span><strong class="total__value">' + S.money(t.total) + "</strong></div>" +
      '<a class="cta' + (t.belowMin ? " is-disabled" : "") + '" href="#/checkout"' + (t.belowMin ? ' aria-disabled="true"' : "") + ">Checkout" +
      '<span class="cta__plus">' + icon("arrow") + "</span></a></footer></div>"
    );
  }

  /* ----------------------------------------------------------
     Panel: checkout
     ---------------------------------------------------------- */
  function whenBlock(ck) {
    const asap = S.asapAvailable(ck.mode);
    const slots = S.slots(ck.mode);
    let when = ck.when;
    if (when === "asap" && !asap) when = slots[0] ? slots[0].at.toISOString() : "asap";
    const scheduled = when !== "asap";
    const verb = ck.mode === "delivery" ? "Delivery" : "Pickup";
    return (
      '<fieldset class="opt-group"><legend class="opt-group__title">' + verb + " time</legend>" +
      '<div class="radio-cards">' +
      '<label class="rcard' + (asap ? "" : " is-disabled") + '"><input type="radio" name="whenMode" value="asap"' + (!scheduled ? " checked" : "") + (asap ? "" : " disabled") + ">" +
      '<span class="rcard__body"><strong>As soon as possible</strong><span>' +
      (asap ? "About " + S.prepMinutes(ck.mode) + " min" : "We’re closed right now") + "</span></span></label>" +
      '<label class="rcard"><input type="radio" name="whenMode" value="later"' + (scheduled ? " checked" : "") + ">" +
      '<span class="rcard__body"><strong>Schedule</strong><span>Pick a time</span></span></label>' +
      "</div>" +
      '<div class="field field--select"' + (scheduled ? "" : " hidden") + ' data-slot-field><label class="field__label" for="slotSelect">Time</label>' +
      '<select id="slotSelect" name="slot">' +
      slots.map((s) => {
        const iso = s.at.toISOString();
        return '<option value="' + iso + '"' + (iso === when ? " selected" : "") + ">" + esc(S.slotLabel(s)) + "</option>";
      }).join("") +
      "</select></div></fieldset>"
    );
  }

  function checkoutView() {
    const ck = S.state.checkout;
    const p = S.state.profile;
    const t = S.totals(ck.mode);
    const mode = R.orderTypes[ck.mode];
    const where = ck.mode === "dineIn" ? "At your table" : ck.mode === "pickup" ? "From " + R.address.line1 : "To your door";
    return (
      '<div class="pview pview--checkout" data-view="checkout"><div class="pview__scroll">' +
      '<header class="pbar"><button class="iconbtn" type="button" data-action="back" aria-label="Back to cart">' + icon("back") + "</button>" +
      '<h2 class="pbar__title" id="panelTitle" tabindex="-1">Checkout</h2><span class="pbar__spacer"></span></header>' +
      '<form class="form" id="checkoutForm" novalidate>' +
      '<section class="panel-block">' +
      '<div class="mode-head"><span class="mode-head__icon">' + icon(MODE_ICON[ck.mode]) + "</span><div><h3 class=\"block__title\">" + esc(mode.label) + "</h3>" +
      '<p class="block__text">' + esc(where) + "</p></div>" +
      '<a class="textbtn" href="#/cart">Change</a></div>' +
      (ck.mode === "dineIn"
        ? field("coTable", "table", "Table number", ck.table, { inputmode: "numeric", required: true, placeholder: "Printed on your table", maxlength: 3 })
        : whenBlock(ck)) +
      (ck.mode === "delivery"
        ? field("coAddress", "address", "Delivery address", ck.address || p.address, { autocomplete: "street-address", required: true, placeholder: "Street, number, apartment" }) +
          field("coInstr", "instructions", "Instructions for the rider", ck.instructions, { optional: true, placeholder: "Buzzer, floor, where to leave it", maxlength: 140 })
        : "") +
      "</section>" +
      '<section class="panel-block"><h3 class="block__title">Your details</h3>' +
      field("coName", "name", "Name", ck.name || p.name, { autocomplete: "name", required: true, placeholder: "So we know who it’s for" }) +
      field("coPhone", "phone", "Phone", ck.phone || p.phone, { type: "tel", autocomplete: "tel", inputmode: "tel", required: true, placeholder: "In case we need to reach you" }) +
      "</section>" +
      '<section class="panel-block"><h3 class="block__title">Payment</h3>' +
      '<div class="radio-cards">' +
      ["card", "cash"].map((m) =>
        '<label class="rcard"><input type="radio" name="payment" value="' + m + '"' + (ck.payment === m ? " checked" : "") + ">" +
        '<span class="rcard__body">' + icon(m) + "<strong>" + (m === "card" ? "Card" : "Cash") + "</strong><span>" +
        (ck.mode === "dineIn" ? "At your table" : ck.mode === "pickup" ? "At the counter" : "To the rider") + "</span></span></label>"
      ).join("") +
      "</div><p class=\"block__text\">You pay when you get your food. No card details are needed here.</p></section>" +
      '<section class="panel-block summary">' +
      t.lines.map((l) => '<div class="sum-row sum-row--item"><span>' + l.qty + " × " + esc(l.dish.name) + '</span><span class="price">' + S.money(l.total) + "</span></div>").join("") +
      '<hr class="sum-rule">' + summaryRows(t, ck.mode) + "</section>" +
      (R.demo ? '<p class="demo-note">' + icon("info") + "<span>Demo mode: your order is saved on this device only. No kitchen receives it and nothing is charged.</span></p>" : "") +
      '<p class="field__error field__error--form" id="checkoutForm-err" hidden></p>' +
      "</form></div>" +
      '<footer class="pfoot"><div class="total"><span class="total__label">Total</span><strong class="total__value">' + S.money(t.total) + "</strong></div>" +
      '<button class="cta" type="submit" form="checkoutForm">Place order<span class="cta__plus">' + icon("check") + "</span></button></footer></div>"
    );
  }

  /* ----------------------------------------------------------
     Panel: order tracking
     ---------------------------------------------------------- */
  function trackText(o, pr) {
    const mode = o.mode;
    const ready = S.clock(new Date(pr.readyAt));
    if (pr.done) {
      return {
        title: mode === "delivery" ? "Delivered. Enjoy!" : mode === "dineIn" ? "Served. Enjoy your meal!" : "Picked up. Enjoy!",
        eta: "Thanks for ordering with " + R.name + ".",
      };
    }
    const place = mode === "dineIn" ? "Table " + o.table : mode === "pickup" ? "Pickup at " + R.address.line1 : "To " + o.address;
    const titles = [
      pr.scheduled ? "Scheduled for " + ready : "We’ve got your order",
      "The kitchen is cooking",
      mode === "delivery" ? "Your rider is on the way" : mode === "dineIn" ? "Coming to your table" : "Ready at the counter",
    ];
    const etas = [
      (pr.scheduled ? "We’ll start cooking at " + S.clock(new Date(pr.marks[1])) : "Ready around " + ready) + " · " + place,
      (mode === "delivery" ? "Leaving the kitchen around " : "Ready around ") + ready + " · " + place,
      (mode === "delivery" ? "Arriving around " + S.clock(new Date(pr.marks[3])) : "Ask for order #" + o.number) + " · " + place,
    ];
    return { title: titles[pr.stage], eta: etas[pr.stage] };
  }

  function steps(o, pr) {
    return pr.labels.map((label, i) => {
      const state = i < pr.stage || pr.done ? "is-done" : i === pr.stage ? "is-now" : "";
      const time = i <= pr.stage ? S.clock(new Date(pr.marks[i])) : "";
      return '<li class="step ' + state + '" data-step="' + i + '"><span class="step__dot">' + icon("check") + "</span>" +
        '<span class="step__label">' + esc(label) + '</span><time class="step__time">' + esc(time) + "</time></li>";
    }).join("");
  }

  function orderView(o) {
    if (!o) {
      return '<div class="pview" data-view="order"><div class="pview__scroll"><header class="pbar"><button class="iconbtn" type="button" data-action="back" aria-label="Back">' +
        icon("back") + '</button><h2 class="pbar__title" id="panelTitle" tabindex="-1">Order</h2><span class="pbar__spacer"></span></header>' +
        empty("receipt", "We can’t find that order", "It may have been cleared from this device.", '<a class="btn" href="#/orders">See your orders</a>') + "</div></div>";
    }
    const pr = S.orderProgress(o);
    const txt = trackText(o, pr);
    const first = S.dish(o.lines[0].dishId) || S.dishes[0];
    const payment = (o.payment === "cash" ? "Cash" : "Card") + (o.mode === "dineIn" ? " at your table" : o.mode === "pickup" ? " at the counter" : " to the rider");
    return (
      '<div class="pview pview--order" data-view="order" data-id="' + o.id + '"><div class="pview__scroll">' +
      '<header class="pbar"><a class="iconbtn" href="#/orders" aria-label="All orders">' + icon("back") + "</a>" +
      '<h2 class="pbar__title" id="panelTitle" tabindex="-1">Order #' + o.number + "</h2><span class=\"pbar__spacer\"></span></header>" +
      '<div class="track">' +
      '<div class="track__ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track__bg" cx="60" cy="60" r="56"/>' +
      '<circle class="track__fg" cx="60" cy="60" r="56" pathLength="100" data-ring style="stroke-dasharray:' + (pr.progress * 100).toFixed(1) + ' 100"/></svg>' +
      '<img class="dish-img track__img' + (pr.done ? "" : " is-spinning") + '" src="' + esc(first.thumb) + '"' + srcset(first, "190px") + ' alt="" width="400" height="400"></div>' +
      '<p class="track__stage" data-track-stage>' + esc(pr.labels[pr.stage]) + "</p>" +
      '<h3 class="track__title" data-track-title aria-live="polite">' + esc(txt.title) + "</h3>" +
      '<p class="track__eta" data-track-eta>' + esc(txt.eta) + "</p></div>" +
      '<ol class="steps" data-steps>' + steps(o, pr) + "</ol>" +
      '<section class="panel-block summary"><h3 class="block__title">Your order</h3>' +
      o.lines.map((l) => '<div class="sum-row sum-row--item"><span>' + l.qty + " × " + esc(l.name) +
        (l.details && l.details.length ? '<small>' + esc(l.details.join(" · ")) + "</small>" : "") +
        (l.note ? "<small>“" + esc(l.note) + "”</small>" : "") + '</span><span class="price">' + S.money(l.total) + "</span></div>").join("") +
      '<hr class="sum-rule">' +
      (o.discount ? '<div class="sum-row sum-row--good"><span>Promo ' + esc(o.promo) + '</span><span class="price">−' + S.money(o.discount) + "</span></div>" : "") +
      (o.mode === "delivery" ? '<div class="sum-row"><span>Delivery</span><span class="price">' + (o.deliveryFee ? S.money(o.deliveryFee) : "Free") + "</span></div>" : "") +
      (o.tax ? '<div class="sum-row"><span>Sales tax</span><span class="price">' + S.money(o.tax) + "</span></div>" : "") +
      '<div class="sum-row sum-row--total"><span>Total</span><span class="price">' + S.money(o.total) + "</span></div></section>" +
      '<section class="panel-block"><h3 class="block__title">Details</h3><dl class="deflist">' +
      "<div><dt>Order type</dt><dd>" + esc(R.orderTypes[o.mode].label) + (o.table ? " · Table " + esc(o.table) : "") + "</dd></div>" +
      (o.address ? "<div><dt>Address</dt><dd>" + esc(o.address) + (o.instructions ? "<br><small>" + esc(o.instructions) + "</small>" : "") + "</dd></div>" : "") +
      "<div><dt>Placed</dt><dd>" + esc(orderTime(o)) + "</dd></div>" +
      "<div><dt>Name</dt><dd>" + esc(o.name) + "</dd></div>" +
      "<div><dt>Phone</dt><dd>" + esc(o.phone) + "</dd></div>" +
      "<div><dt>Payment</dt><dd>" + esc(payment) + "</dd></div>" +
      "</dl></section>" +
      '<section class="panel-block"><h3 class="block__title">Need to change something?</h3>' +
      '<p class="block__text">Call us and mention order #' + o.number + ".</p>" + phoneRow() + "</section>" +
      (o.demo ? '<p class="demo-note">' + icon("info") + "<span>Demo mode: the status moves along by itself so you can see the tracker work.</span></p>" : "") +
      "</div>" +
      '<footer class="pfoot pfoot--split">' +
      '<a class="btn btn--ghost" href="#/orders">All orders</a>' +
      '<a class="cta" href="#/menu">Back to menu<span class="cta__plus">' + icon("arrow") + "</span></a></footer></div>"
    );
  }

  function phoneRow() {
    const tel = R.phone.replace(/[^\d+]/g, "");
    return '<div class="phone-row"><a class="phone-row__num" href="tel:' + tel + '">' + icon("phone") + "<span>" + esc(R.phone) + "</span></a>" +
      '<button class="btn btn--sm btn--ghost" type="button" data-action="copy" data-text="' + esc(R.phone) + '">' + icon("copy") + "Copy</button></div>";
  }

  /* ----------------------------------------------------------
     Drawer: restaurant info
     ---------------------------------------------------------- */
  function hoursTable() {
    const today = S.zoned(new Date()).dow;
    const order = [1, 2, 3, 4, 5, 6, 0];
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const fmt = (m) => {
      const d = new Date(2000, 0, 1, Math.floor(m / 60) % 24, m % 60);
      return new Intl.DateTimeFormat(R.locale, { hour: "numeric", minute: "2-digit" }).format(d);
    };
    return '<table class="hours"><caption class="sr-only">Opening hours</caption><tbody>' +
      order.map((dow) => {
        const rs = S.ranges(dow);
        return '<tr' + (dow === today ? ' class="is-today"' : "") + '><th scope="row">' + names[dow] + (dow === today ? " <span>Today</span>" : "") + "</th><td>" +
          (rs.length ? rs.map(([a, b]) => fmt(a) + " – " + fmt(b)).join(", ") : "Closed") + "</td></tr>";
      }).join("") +
      "</tbody></table>";
  }

  function infoView() {
    const del = R.orderTypes.delivery;
    return (
      '<header class="drawer__head"><span class="logo" aria-hidden="true">' + logo() + "</span>" +
      '<div><h2 class="drawer__title" id="drawerTitle" tabindex="-1">' + esc(R.name) + "</h2>" + statusChip() + "</div>" +
      '<button class="iconbtn" type="button" data-action="close-info" aria-label="Close">' + icon("close") + "</button></header>" +
      '<p class="drawer__about">' + esc(R.about) + "</p>" +
      '<section class="drawer__block"><h3 class="block__title">Opening hours</h3>' + hoursTable() + "</section>" +
      '<section class="drawer__block"><h3 class="block__title">Find us</h3>' +
      '<p class="addr">' + icon("pin") + "<span>" + esc(R.address.line1) + "<br>" + esc(R.address.line2) + "</span></p>" +
      '<a class="btn btn--sm btn--ghost" href="' + esc(R.address.mapsUrl) + '" target="_blank" rel="noopener">Get directions' + icon("arrow") + "</a></section>" +
      '<section class="drawer__block"><h3 class="block__title">Call us</h3>' + phoneRow() + "</section>" +
      '<section class="drawer__block"><h3 class="block__title">Ways to order</h3><ul class="ways">' +
      (R.orderTypes.dineIn.enabled ? "<li>" + icon("dineIn") + "<span><strong>Dine in</strong> Scan the code on your table or enter its number at checkout.</span></li>" : "") +
      (R.orderTypes.pickup.enabled ? "<li>" + icon("bag") + "<span><strong>Pickup</strong> Ready in about " + S.prepMinutes("pickup") + " minutes.</span></li>" : "") +
      (del.enabled ? "<li>" + icon("delivery") + "<span><strong>Delivery</strong> " + S.money(S.cents(del.fee)) + " fee, free over " + S.money(S.cents(del.freeOver)) +
        ". Minimum order " + S.money(S.cents(del.minOrder)) + ".</span></li>" : "") +
      "</ul></section>" +
      '<p class="fine">Allergens are listed on every dish. Our kitchen handles nuts, gluten, dairy, eggs, fish and sesame.</p>'
    );
  }

  function logo() {
    return '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="currentColor"/>' +
      '<path d="M12 27c0-9 6-15 16-16 0 10-6 16-16 16z" fill="var(--on-accent)"/><path d="M12.5 26.5c3-4 6.4-7.4 10-9.6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  }

  window.Views = {
    esc, menuView, menuList, dietNotice, favoritesView, ordersView, orderCard, profileView,
    dishView, cartView, checkoutView, orderView, trackText, steps, infoView, logo, statusChip,
  };
})();
