/* ============================================================
   Views — functions that turn state into HTML strings
   ============================================================ */
(function () {
  "use strict";

  const S = window.Store;
  const R = S.R;
  const I = window.I18N;
  const B = window.Bowl;
  const icon = window.Icons.icon;
  const t = I.t;
  const tn = I.tn;
  const pick = I.pick;
  const ING = R.ingredients;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MODE_ICON = { pickup: "bag", delivery: "delivery" };
  const modes = () => Object.keys(R.orderTypes).filter((m) => R.orderTypes[m].enabled);
  const modeLabel = (m) => pick(R.orderTypes[m].label);
  const pct = (rate) => I.num(Math.round(rate * 100000) / 1000) + (I.lang === "fr" ? " %" : "%");

  /* ----------------------------------------------------------
     Media: a live bowl for bowls, a cut-out photo for the rest
     ---------------------------------------------------------- */
  function bowlFor(d, choices, size, cls) {
    const sel = B.selection(d, choices || d.look || S.defaultChoices(d));
    return B.html(sel, { size, cls });
  }

  function photo(d, cls, eager, sizes) {
    return '<img class="dish-img ' + (cls || "") + '" src="' + esc(d.thumb) + '" srcset="' + esc(d.thumb) + " 400w, " + esc(d.image) + ' 800w" sizes="' + sizes + '" alt="" width="400" height="400" ' +
      (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">';
  }

  function media(d, opts) {
    opts = opts || {};
    return S.isBowl(d) ? bowlFor(d, opts.choices, opts.size || "sm", opts.cls) : photo(d, opts.cls, opts.eager, opts.sizes || "150px");
  }

  /* ----------------------------------------------------------
     Small parts
     ---------------------------------------------------------- */
  function favButton(d, extra) {
    const on = S.isFav(d.id);
    return (
      '<button class="fav' + (on ? " is-on" : "") + (extra ? " " + extra : "") + '" type="button" data-action="toggle-fav" ' +
      'data-id="' + d.id + '" aria-pressed="' + on + '" aria-label="' + esc(t("fav.label", { name: pick(d.name) })) + '">' + icon("heart") + "</button>"
    );
  }

  function stepper(value, { action, key = "", label, min = 1, trashAtOne = false }) {
    const dec = trashAtOne && value <= 1 ? "trash" : "minus";
    return (
      '<div class="stepper" role="group" aria-label="' + esc(label) + '">' +
      '<button type="button" class="stepper__btn" data-action="' + action + '-dec" data-key="' + esc(key) + '" ' +
      'aria-label="' + esc(dec === "trash" ? t("qty.remove") : t("qty.less")) + '"' + (!trashAtOne && value <= min ? " disabled" : "") + ">" + icon(dec) + "</button>" +
      '<output class="stepper__val" aria-live="polite">' + value + "</output>" +
      '<button type="button" class="stepper__btn" data-action="' + action + '-inc" data-key="' + esc(key) + '" aria-label="' + esc(t("qty.more")) + '"' +
      (value >= 99 ? " disabled" : "") + ">" + icon("plus") + "</button></div>"
    );
  }

  function statusChip() {
    const st = S.openStatus();
    if (st.open) {
      const soon = st.closesIn <= 45;
      return '<span class="status status--' + (soon ? "soon" : "open") + '"><i></i>' +
        esc(soon ? t("status.soon", { time: S.clock(st.closesAt) }) : t("status.open", { time: S.clock(st.closesAt) })) + "</span>";
    }
    if (st.opensIn == null) return '<span class="status status--closed"><i></i>' + esc(t("status.closed")) + "</span>";
    const time = S.clock(st.opensAt);
    const when = st.dayOffset === 0 ? t("status.opensToday", { time }) : st.dayOffset === 1 ? t("status.opensTomorrow", { time }) : t("status.opensDay", { day: S.dayLabel(st.opensAt).split(" ")[0].replace(/[.,]/g, ""), time });
    return '<span class="status status--closed"><i></i>' + esc(when) + "</span>";
  }

  function facts(d) {
    let out = "";
    if (d.tags.includes("plant")) out += '<li class="fact fact--plant">' + icon("leaf") + esc(pick(R.tags.plant.label)) + "</li>";
    if (d.kcal) out += '<li class="fact">' + esc(t("dish.kcal", { kcal: d.kcal })) + "</li>";
    return out;
  }

  /* ----------------------------------------------------------
     Menu tab
     ---------------------------------------------------------- */
  function card(d, i) {
    const n = S.qtyInCart(d.id);
    const from = S.isBowl(d) ? t("price.from", { price: S.money(S.cents(d.price)) }) : S.money(S.cents(d.price));
    return (
      '<article class="card' + (S.isBowl(d) ? " card--bowl" : "") + '" style="--i:' + i + '">' +
      '<div class="card__media">' + media(d, { eager: i < 4 }) + "</div>" +
      '<div class="card__body">' +
      '<h3 class="card__title"><a class="card__link" href="#/dish/' + d.id + '">' + esc(pick(d.name)) + "</a></h3>" +
      '<p class="card__desc">' + esc(pick(d.short)) + "</p>" +
      '<div class="card__foot"><span class="price">' + esc(from) + "</span>" + favButton(d) + "</div>" +
      "</div>" +
      (n ? '<span class="card__qty" title="' + esc(t("card.inCart")) + '">' + n + '<span class="sr-only"> ' + esc(t("card.inCart")) + "</span></span>" : "") +
      "</article>"
    );
  }

  function feature(d) {
    return (
      '<article class="feature">' +
      '<div class="feature__body">' +
      '<p class="feature__eyebrow">' + icon("sparkle") + esc(t("feature.eyebrow")) + "</p>" +
      '<h3 class="feature__title"><a class="card__link" href="#/dish/' + d.id + '">' + esc(t("feature.title")) + "</a></h3>" +
      '<p class="feature__desc">' + esc(t("feature.desc")) + "</p>" +
      '<div class="feature__foot"><span class="price">' + esc(t("price.from", { price: S.money(S.cents(d.price)) })) + '</span><span class="feature__time">' +
      icon("clock") + esc(t("dish.minutes", { n: d.minutes })) + "</span></div>" +
      "</div>" +
      '<div class="feature__media">' + bowlFor(d, d.look, "lg") + "</div>" +
      "</article>"
    );
  }

  function grid(list, withFeature) {
    let i = 0;
    let html = "";
    list.forEach((d) => {
      // the featured bowl is the wide "build your bowl" card, not a small one too
      if (withFeature && d.id === R.featured) return;
      html += card(d, i++);
      if (withFeature && i === 2) html += feature(S.dish(R.featured));
    });
    if (withFeature && i < 2) html += feature(S.dish(R.featured));
    return '<div class="grid">' + html + "</div>";
  }

  function section(title, list, { id, withFeature, count = true } = {}) {
    return (
      '<section class="menu-section"' + (id ? ' aria-labelledby="sec-' + id + '"' : "") + ">" +
      '<div class="section-head"><h2 class="section-head__title"' + (id ? ' id="sec-' + id + '"' : "") + ">" + esc(title) + "</h2>" +
      (count ? '<span class="section-head__count">' + esc(tn(list.length, "count.items")) + "</span>" : "") + "</div>" +
      grid(list, withFeature) +
      "</section>"
    );
  }

  function menuList(ui) {
    if (ui.query.trim()) {
      const found = S.search(ui.query);
      if (!found.length) {
        return '<div class="empty empty--inline"><p class="empty__title">' + esc(t("search.none", { q: ui.query.trim() })) + "</p>" +
          '<p class="empty__text">' + esc(t("search.try")) + "</p></div>";
      }
      return section(t("search.results"), found, { id: "results" });
    }
    if (ui.category === "all") {
      return R.categories
        .filter((c) => c.id !== "all")
        .map((c, n) => {
          const list = S.dishesIn(c.id);
          return list.length ? section(pick(c.name), list, { id: c.id, withFeature: n === 0 }) : "";
        })
        .join("");
    }
    const cat = S.category(ui.category);
    return section(pick(cat.name), S.dishesIn(cat.id), { id: cat.id, withFeature: cat.id === "bols" });
  }

  function menuView(ui) {
    return (
      '<section class="hero">' +
      '<div class="hero__meta">' + statusChip() +
      '<span class="status status--store">' + icon("pin") + esc(R.store.name) + "</span>" +
      '<a class="status status--concept" href="#/info">' + icon("info") + esc(t("concept.badge")) + "</a></div>" +
      '<h1 class="hero__title">' + esc(pick(R.headline)) + "</h1>" +
      '<p class="hero__sub">' + esc(pick(R.tagline)) + "</p>" +
      "</section>" +
      '<div class="search"' + (ui.searchOpen ? "" : " hidden") + ">" +
      '<label class="search__field" for="searchInput"><span class="sr-only">' + esc(t("search.label")) + "</span>" + icon("search") +
      '<input id="searchInput" type="search" placeholder="' + esc(t("search.placeholder")) + '" value="' + esc(ui.query) + '" autocomplete="off" enterkeyhint="search"></label>' +
      '<button class="textbtn" type="button" data-action="close-search">' + esc(t("search.cancel")) + "</button></div>" +
      '<div class="cats" role="group" aria-label="' + esc(t("cats.label")) + '">' +
      R.categories
        .map((c) => {
          const on = c.id === ui.category && !ui.query.trim();
          return '<button class="cat' + (on ? " is-on" : "") + '" type="button" data-action="set-cat" data-cat="' + c.id + '" aria-pressed="' + on + '">' +
            '<span class="cat__icon">' + icon(c.icon) + '</span><span class="cat__label">' + esc(pick(c.name)) + "</span></button>";
        })
        .join("") +
      "</div>" +
      '<div class="menu-list" id="menuList">' + menuList(ui) + "</div>" +
      footerNote()
    );
  }

  function footerNote() {
    return '<p class="fine">' + esc(t("fine.prices")) + " " +
      '<a href="#/info">' + esc(t("fine.hours")) + "</a></p>" +
      '<p class="fine fine--concept">' + icon("info") + "<span>" + esc(t("concept.short", { by: R.concept.by })) + ' <a href="#/info">' + esc(t("concept.more")) + "</a></span></p>";
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
      pageHead(t("tab.favorites"), list.length ? t("fav.sub") : "") +
      (list.length
        ? '<div class="grid grid--solo">' + list.map(card).join("") + "</div>"
        : empty("heart", t("fav.emptyTitle"), t("fav.emptyText"), '<a class="btn" href="#/menu">' + esc(t("cta.browse")) + "</a>"))
    );
  }

  function orderTime(o) {
    const d = new Date(o.placedAt);
    const same = d.toDateString() === new Date().toDateString();
    return (same ? t("time.today") : S.dayLabel(d)) + ", " + S.clock(d);
  }

  const lineName = (l) => pick(l.name);
  function lineThumb(l, size) {
    const d = S.dish(l.dishId);
    if (!d) return "";
    return S.isBowl(d)
      ? '<span class="thumb thumb--bowl">' + bowlFor(d, l.choices, "sm") + "</span>"
      : '<img class="thumb" src="' + esc(d.thumb) + '" alt="" width="' + size + '" height="' + size + '" loading="lazy">';
  }
  function lineDetails(l) {
    const d = S.dish(l.dishId);
    return d && l.choices ? S.describeChoices(d, l.choices) : l.details || [];
  }

  function stageLabel(o, i) {
    return t("stage." + o.mode + "." + i);
  }

  function orderCard(o) {
    const pr = S.orderProgress(o);
    const thumbs = o.lines.slice(0, 3).map((l) => lineThumb(l, 80)).join("");
    const items = o.lines.map((l) => l.qty + " × " + lineName(l)).join(", ");
    return (
      '<article class="ocard' + (pr.done ? "" : " is-live") + '" data-order="' + o.id + '">' +
      '<div class="ocard__top"><div class="ocard__thumbs">' + thumbs + "</div>" +
      '<div class="ocard__meta"><p class="ocard__no">#' + o.number + " · " + esc(modeLabel(o.mode)) + "</p>" +
      '<p class="ocard__time">' + esc(orderTime(o)) + "</p></div>" +
      '<span class="pill' + (pr.done ? "" : " pill--live") + '" data-ostage>' + esc(stageLabel(o, pr.stage)) + "</span></div>" +
      '<p class="ocard__items">' + esc(items) + "</p>" +
      (pr.done ? "" : '<div class="bar" aria-hidden="true"><span data-obar style="width:' + Math.round(pr.progress * 100) + '%"></span></div>') +
      '<div class="ocard__foot"><strong class="price">' + S.money(o.total) + "</strong>" +
      '<div class="ocard__actions">' +
      (pr.done ? '<button class="btn btn--sm btn--ghost" type="button" data-action="reorder" data-id="' + o.id + '">' + icon("refresh") + esc(t("orders.reorder")) + "</button>" : "") +
      '<a class="btn btn--sm" href="#/order/' + o.id + '">' + esc(pr.done ? t("orders.details") : t("orders.track")) + "</a></div></div>" +
      "</article>"
    );
  }

  function ordersView() {
    const orders = S.state.orders;
    const live = orders.filter((o) => !S.orderProgress(o).done);
    const past = orders.filter((o) => S.orderProgress(o).done);
    if (!orders.length) {
      return pageHead(t("tab.orders")) + empty("receipt", t("orders.emptyTitle"), t("orders.emptyText"),
        '<a class="btn" href="#/menu">' + esc(t("cta.start")) + "</a>");
    }
    return (
      pageHead(t("tab.orders"), t("orders.sub")) +
      (live.length ? '<h2 class="list-title">' + esc(t("orders.live")) + '</h2><div class="stack">' + live.map(orderCard).join("") + "</div>" : "") +
      (past.length ? '<h2 class="list-title">' + esc(t("orders.past")) + '</h2><div class="stack">' + past.map(orderCard).join("") + "</div>" : "")
    );
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return parts.length ? (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase() : "";
  }

  function clubCard() {
    const pts = S.state.points;
    return (
      '<section class="panel-block club pf-club" aria-labelledby="clubTitle">' +
      '<div class="club__top"><h2 class="club__name" id="clubTitle">' + esc(R.club.name) + "</h2>" +
      '<span class="club__badge">' + icon("star") + esc(t("club.member")) + "</span></div>" +
      '<p class="club__points"><strong data-points>' + esc(I.num(pts)) + "</strong> " + esc(t("club.points")) + "</p>" +
      '<p class="club__text">' + esc(t("club.rule", { n: R.club.perDollar })) + " " +
      esc(S.state.welcomed ? t("club.welcomed", { n: R.club.welcome }) : t("club.welcome", { n: R.club.welcome })) + "</p>" +
      "</section>"
    );
  }

  function profileView(ui) {
    const p = S.state.profile;
    const first = String(p.name || "").trim().split(/\s+/)[0];
    return (
      '<header class="page-head page-head--profile pf-head"><span class="avatar" aria-hidden="true">' + (initials(p.name) || icon("user")) + "</span>" +
      '<div><h1 class="page-title">' + esc(first ? t("profile.hi", { name: first }) : t("profile.title")) + "</h1>" +
      '<p class="page-sub">' + esc(t("profile.sub")) + "</p></div></header>" +
      clubCard() +
      '<form class="panel-block pf-details" id="profileForm" autocomplete="on">' +
      '<h2 class="block__title">' + esc(t("profile.details")) + "</h2>" +
      field("pfName", "name", t("field.name"), p.name, { autocomplete: "name", placeholder: t("field.namePh") }) +
      field("pfPhone", "phone", t("field.phone"), p.phone, { type: "tel", autocomplete: "tel", placeholder: t("field.phonePh") }) +
      field("pfAddress", "address", t("field.address"), p.address, { autocomplete: "street-address", placeholder: t("field.addressPh") }) +
      '<p class="hint" data-saved hidden>' + icon("check") + esc(t("profile.saved")) + "</p>" +
      "</form>" +
      '<section class="panel-block pf-mode"><h2 class="block__title">' + esc(t("profile.usual")) + "</h2>" + modeSeg(S.state.checkout.mode, "set-mode") + "</section>" +
      '<section class="panel-block pf-lang"><h2 class="block__title">' + esc(t("profile.lang")) + "</h2>" + langSeg() + "</section>" +
      '<section class="panel-block links pf-links">' +
      '<a class="linkrow" href="#/info">' + icon("info") + "<span>" + esc(t("profile.info")) + "</span>" + icon("arrow", "linkrow__go") + "</a>" +
      '<a class="linkrow" href="#/orders">' + icon("receipt") + "<span>" + esc(t("profile.history")) + "</span>" + icon("arrow", "linkrow__go") + "</a>" +
      "</section>" +
      '<section class="panel-block pf-reset">' +
      (ui.confirmReset
        ? '<p class="block__text"><strong>' + esc(t("reset.q")) + "</strong> " + esc(t("reset.text")) + "</p>" +
          '<div class="row"><button class="btn btn--danger" type="button" data-action="reset-confirm">' + esc(t("reset.yes")) + "</button>" +
          '<button class="btn btn--ghost" type="button" data-action="reset-cancel">' + esc(t("reset.no")) + "</button></div>"
        : '<button class="textbtn textbtn--danger" type="button" data-action="reset-ask">' + icon("trash") + esc(t("reset.yes")) + "</button>") +
      "</section>"
    );
  }

  function langSeg() {
    return '<div class="seg seg--lang" role="radiogroup" aria-label="' + esc(t("profile.lang")) + '">' +
      ["fr", "en"].map((l) => {
        const on = l === I.lang;
        return '<button class="seg__opt' + (on ? " is-on" : "") + '" type="button" role="radio" aria-checked="' + on + '" data-action="set-lang" data-lang="' + l + '" lang="' + (l === "fr" ? "fr-CA" : "en-CA") + '">' +
          "<span>" + (l === "fr" ? "Français" : "English") + "</span></button>";
      }).join("") + "</div>";
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
      (o.optional ? ' <span class="muted">' + esc(t("field.optional")) + "</span>" : "") + "</label>" + tag +
      '<p class="field__error" id="' + id + '-err" hidden></p></div>';
  }

  function modeSeg(current, action) {
    return '<div class="seg" role="radiogroup" aria-label="' + esc(t("mode.label")) + '">' +
      modes().map((m) => {
        const on = m === current;
        return '<button class="seg__opt' + (on ? " is-on" : "") + '" type="button" role="radio" aria-checked="' + on + '" data-action="' + action + '" data-mode="' + m + '">' +
          icon(MODE_ICON[m]) + "<span>" + esc(modeLabel(m)) + "</span></button>";
      }).join("") +
      "</div>";
  }

  /* ----------------------------------------------------------
     Panel: dish detail (the bowl builder, or a simple item)
     ---------------------------------------------------------- */
  function groupNote(g) {
    if (g.hint) return pick(g.hint);
    if (S.single(g)) return t("opt.choose1");
    if (g.min >= 1) return t("opt.range", { min: g.min, max: g.max });
    return t("opt.upTo", { n: g.max });
  }

  function thumbFor(g, c) {
    if (g.from === "bases" || g.from === "toppings") {
      return '<span class="choice__thumb" style="background-image:url(assets/textures/' + c.id + '-320.webp)"></span>';
    }
    if (g.from === "flavours") {
      return '<span class="choice__thumb choice__thumb--flavour' + (c.plant ? " is-plant" : "") + '" style="background-image:url(assets/textures/' + (c.plant ? "plant" : "chicken") + "-320.webp);" +
        (c.tint ? "--tint:" + c.tint + ";--tint-a:" + c.tintAlpha : "--tint-a:0") + '"></span>';
    }
    if (g.from === "sauces") return '<span class="choice__dot" style="--sauce:' + c.color + '"></span>';
    return "";
  }

  function optionGroup(d, g, choices) {
    const asRadio = S.single(g);
    const list = S.choicesOf(g);
    const picked = choices[g.id] || [];
    const visual = !!g.from;
    return (
      '<fieldset class="opt-group' + (visual ? " opt-group--ing" : "") + '" data-group="' + g.id + '"' + (!asRadio && g.max ? ' data-max="' + g.max + '"' : "") + ' data-min="' + (g.min || 0) + '">' +
      '<legend class="opt-group__title"><span>' + esc(pick(g.title)) + "</span>" +
      (!asRadio && g.max > 1 ? ' <span class="opt-count"><span data-count>' + picked.length + "</span>/" + g.max + "</span>" : "") + "</legend>" +
      '<p class="opt-hint">' + esc(groupNote(g)) + "</p>" +
      '<div class="choices' + (visual ? " choices--ing" : "") + '">' +
      list.map((c) => {
        const on = picked.includes(c.id);
        const id = "opt-" + d.id + "-" + g.id + "-" + c.id;
        const spicy = c.spicy ? '<span class="choice__hot" title="' + esc(pick(R.tags.spicy.label)) + '">' + icon("flame") + '<span class="sr-only">' + esc(pick(R.tags.spicy.label)) + "</span></span>" : "";
        return '<label class="choice" for="' + id + '"><input id="' + id + '" type="' + (asRadio ? "radio" : "checkbox") + '" name="' + g.id + '" value="' + c.id + '"' +
          (on ? " checked" : "") + ">" + '<span class="choice__pill">' + thumbFor(g, c) + (!asRadio && !visual ? '<span class="choice__tick">' + icon("check") + "</span>" : "") +
          '<span class="choice__name">' + esc(pick(c.name)) + "</span>" + spicy +
          (c.price ? '<span class="choice__price">+' + esc(S.money(S.cents(c.price))) + "</span>" : "") + "</span></label>";
      }).join("") +
      "</div>" +
      '<p class="opt-need" data-need hidden>' + esc(t("opt.need." + g.id, {})) + "</p>" +
      "</fieldset>"
    );
  }

  function dishView(d, draft, { isDefault = false } = {}) {
    const unit = S.unitPrice(d, draft.choices);
    const bowl = S.isBowl(d);
    const lack = S.missing(d, draft.choices).length > 0;
    return (
      '<div class="pview pview--dish' + (bowl ? " pview--bowl" : "") + '" data-view="dish" data-id="' + d.id + '">' +
      '<div class="pview__scroll">' +
      '<header class="pbar">' +
      (isDefault
        ? '<span class="pbar__label">' + icon("sparkle") + esc(t("feature.eyebrow")) + "</span>"
        : '<button class="iconbtn" type="button" data-action="back" aria-label="' + esc(t("nav.back")) + '">' + icon("back") + "</button>") +
      '<span class="pbar__dock" aria-hidden="true"></span>' +
      '<div class="more"><button class="iconbtn" type="button" data-action="toggle-more" aria-haspopup="true" aria-expanded="false" aria-label="' + esc(t("more.label")) + '">' + icon("more") + "</button>" +
      '<div class="popover" hidden>' +
      '<button type="button" data-action="copy-link" data-id="' + d.id + '">' + icon("link") + esc(t("more.copy")) + "</button>" +
      '<button type="button" data-action="show-allergens">' + icon("info") + esc(t("more.allergens")) + "</button>" +
      "</div></div></header>" +
      '<div class="dish-hero">' +
      (bowl
        ? '<div class="dish-hero__img dish-hero__bowl" role="img" aria-label="' + esc(t("dish.bowlAlt", { name: pick(d.name) })) + '">' + bowlFor(d, draft.choices, "lg") + "</div>"
        : '<img class="dish-img dish-hero__img" src="' + esc(d.image) + '" alt="' + esc(t("dish.photoAlt", { name: pick(d.name) })) + '" width="800" height="800" fetchpriority="high">') +
      "</div>" +
      '<div class="dish-body">' +
      '<div class="dish-title"><h2 id="dishTitle" tabindex="-1">' + esc(pick(d.name)) + "</h2>" +
      '<span class="dish-time">' + icon("clock") + esc(t("dish.minutes", { n: d.minutes })) + "</span></div>" +
      '<p class="dish-desc">' + esc(pick(d.description)) + "</p>" +
      '<ul class="facts">' + facts(d) + "</ul>" +
      '<form class="opts" id="dishForm" data-id="' + d.id + '" novalidate>' +
      d.groups.map((g) => optionGroup(d, g, draft.choices)).join("") +
      '<div class="opt-group">' +
      '<label class="opt-group__title" for="dishNote">' + esc(t("dish.note")) + ' <span class="muted">' + esc(t("field.optional")) + "</span></label>" +
      '<textarea id="dishNote" name="note" rows="2" maxlength="140" placeholder="' + esc(t(bowl ? "dish.notePhBowl" : "dish.notePh")) + '">' + esc(draft.note) + "</textarea></div>" +
      '<div class="qty-row"><span class="opt-group__title">' + esc(t("dish.qty")) + "</span>" +
      stepper(draft.qty, { action: "dish-qty", label: t("dish.qty"), min: 1 }) + "</div>" +
      "</form>" +
      '<p class="allergens" id="allergens" tabindex="-1"><strong>' + esc(t("allergens.title")) + "</strong> " + esc(t("allergens.text")) + "</p>" +
      "</div></div>" +
      '<footer class="pfoot">' +
      '<div class="total"><span class="total__label">' + esc(t("total.price")) + '</span><strong class="total__value" data-dish-total>' + S.money(unit * draft.qty) + "</strong>" +
      '<span class="total__pts" data-dish-points>' + icon("star") + esc(t("club.plus", { n: I.num(S.pointsFor(unit * draft.qty)) })) + "</span></div>" +
      favButton(d, "fav--lg") +
      '<button class="cta cta--add" type="submit" form="dishForm"' + (lack ? ' aria-disabled="true"' : "") + ">" + esc(t("cta.add")) + '<span class="cta__plus">' + icon("plus") + "</span></button>" +
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
      '<a class="line__media" href="#/dish/' + l.dishId + '" tabindex="-1" aria-hidden="true">' + media(l.dish, { choices: l.choices, sizes: "64px" }) + "</a>" +
      '<div class="line__info"><p class="line__name">' + esc(pick(l.dish.name)) + "</p>" +
      (details.length ? '<p class="line__details">' + esc(details.join(" · ")) + "</p>" : "") +
      '<p class="line__price price">' + S.money(l.total) + "</p></div>" +
      stepper(l.qty, { action: "line", key: l.key, label: t("qty.of", { name: pick(l.dish.name) }), trashAtOne: true }) +
      "</li>"
    );
  }

  function summaryRows(tot, mode) {
    let rows = '<div class="sum-row"><span>' + esc(t("sum.subtotal")) + '</span><span class="price">' + S.money(tot.subtotal) + "</span></div>";
    if (mode === "delivery") {
      rows += '<div class="sum-row"><span>' + esc(t("sum.delivery")) + '</span><span class="price">' + (tot.deliveryFee ? S.money(tot.deliveryFee) : esc(t("sum.free"))) + "</span></div>";
    }
    tot.taxes.forEach((x) => {
      rows += '<div class="sum-row"><span>' + esc(pick(x.label)) + " (" + esc(pct(x.rate)) + ')</span><span class="price">' + S.money(x.amount) + "</span></div>";
    });
    rows += '<div class="sum-row sum-row--total"><span>' + esc(t("sum.total")) + '</span><span class="price">' + S.money(tot.total) + "</span></div>";
    return rows;
  }

  function modeFields(ck, tot) {
    if (ck.mode === "pickup") {
      return '<p class="block__text">' + icon("pin") + esc(t("mode.pickupText", { store: R.store.name, n: S.prepMinutes("pickup") })) + "</p>";
    }
    const del = R.orderTypes.delivery;
    let msg = t("mode.deliveryText", { n: S.prepMinutes("delivery") }) + " ";
    if (tot.belowMin) msg += t("mode.min", { min: S.money(S.cents(del.minOrder)), gap: S.money(tot.minOrder - tot.subtotal) });
    else if (tot.freeDeliveryGap > 0) msg += t("mode.freeGap", { gap: S.money(tot.freeDeliveryGap) });
    else if (!tot.deliveryFee) msg += t("mode.freeNow");
    return '<p class="block__text' + (tot.belowMin ? " is-warn" : "") + '">' + icon("delivery") + esc(msg) + "</p>";
  }

  function cartView(ui, opts) {
    const isDefault = !!(opts && opts.isDefault);
    const backBtn = isDefault
      ? '<span class="pbar__spacer"></span>'
      : '<button class="iconbtn" type="button" data-action="back" aria-label="' + esc(t("nav.back")) + '">' + icon("back") + "</button>";
    const ck = S.state.checkout;
    const tot = S.totals(ck.mode);
    if (!tot.lines.length) {
      return (
        '<div class="pview pview--cart" data-view="cart"><div class="pview__scroll">' +
        '<header class="pbar">' + backBtn +
        '<h2 class="pbar__title" id="panelTitle" tabindex="-1">' + esc(t("cart.title")) + '</h2><span class="pbar__spacer"></span></header>' +
        empty("cart", t("cart.emptyTitle"), t("cart.emptyText"), '<a class="btn" href="#/menu">' + esc(t("cta.browse")) + "</a>") +
        "</div></div>"
      );
    }
    return (
      '<div class="pview pview--cart" data-view="cart"><div class="pview__scroll">' +
      '<header class="pbar">' + backBtn +
      '<h2 class="pbar__title" id="panelTitle" tabindex="-1">' + esc(t("cart.title")) + "</h2>" +
      (ui.confirmClear
        ? '<span class="pbar__confirm"><button class="textbtn textbtn--danger" type="button" data-action="clear-confirm">' + esc(t("cart.removeAll")) + '</button><button class="textbtn" type="button" data-action="clear-cancel">' + esc(t("cart.keep")) + "</button></span>"
        : '<button class="textbtn" type="button" data-action="clear-ask">' + esc(t("cart.clear")) + "</button>") +
      "</header>" +
      '<ul class="lines">' + tot.lines.map((l) => cartLine(l, l.key === ui.newLine)).join("") + "</ul>" +
      '<a class="addmore" href="#/menu">' + icon("plus") + esc(t("cart.addMore")) + "</a>" +
      '<section class="panel-block"><h3 class="block__title">' + esc(t("cart.how")) + "</h3>" + modeSeg(ck.mode, "set-mode") +
      '<div class="mode-fields">' + modeFields(ck, tot) + "</div></section>" +
      '<section class="panel-block club-earn">' + icon("star") + "<p>" + esc(t("cart.points", { n: I.num(tot.points), club: R.club.name })) + "</p></section>" +
      '<section class="panel-block summary">' + summaryRows(tot, ck.mode) + "</section>" +
      "</div>" +
      '<footer class="pfoot"><div class="total"><span class="total__label">' + esc(t("sum.total")) + '</span><strong class="total__value">' + S.money(tot.total) + "</strong></div>" +
      '<a class="cta' + (tot.belowMin ? " is-disabled" : "") + '" href="#/checkout"' + (tot.belowMin ? ' aria-disabled="true"' : "") + ">" + esc(t("cta.checkout")) +
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
    return (
      '<fieldset class="opt-group"><legend class="opt-group__title">' + esc(t(ck.mode === "delivery" ? "when.delivery" : "when.pickup")) + "</legend>" +
      '<div class="radio-cards">' +
      '<label class="rcard' + (asap ? "" : " is-disabled") + '"><input type="radio" name="whenMode" value="asap"' + (!scheduled ? " checked" : "") + (asap ? "" : " disabled") + ">" +
      '<span class="rcard__body"><strong>' + esc(t("when.asap")) + "</strong><span>" +
      esc(asap ? t("when.about", { n: S.prepMinutes(ck.mode) }) : t("when.closed")) + "</span></span></label>" +
      '<label class="rcard"><input type="radio" name="whenMode" value="later"' + (scheduled ? " checked" : "") + ">" +
      '<span class="rcard__body"><strong>' + esc(t("when.schedule")) + "</strong><span>" + esc(t("when.pick")) + "</span></span></label>" +
      "</div>" +
      '<div class="field field--select"' + (scheduled ? "" : " hidden") + ' data-slot-field><label class="field__label" for="slotSelect">' + esc(t("when.time")) + "</label>" +
      '<select id="slotSelect" name="slot">' +
      slots.map((s) => {
        const iso = s.at.toISOString();
        return '<option value="' + iso + '"' + (iso === when ? " selected" : "") + ">" + esc(S.slotLabel(s)) + "</option>";
      }).join("") +
      '</select><p class="field__error" id="slotSelect-err" hidden></p></div></fieldset>'
    );
  }

  function checkoutView() {
    const ck = S.state.checkout;
    const p = S.state.profile;
    const tot = S.totals(ck.mode);
    const where = ck.mode === "pickup" ? t("checkout.wherePickup", { store: R.store.name }) : t("checkout.whereDelivery");
    const payWhere = ck.mode === "pickup" ? t("pay.counter") : t("pay.rider");
    return (
      '<div class="pview pview--checkout" data-view="checkout"><div class="pview__scroll">' +
      '<header class="pbar"><button class="iconbtn" type="button" data-action="back" aria-label="' + esc(t("nav.backCart")) + '">' + icon("back") + "</button>" +
      '<h2 class="pbar__title" id="panelTitle" tabindex="-1">' + esc(t("checkout.title")) + '</h2><span class="pbar__spacer"></span></header>' +
      '<form class="form" id="checkoutForm" novalidate>' +
      '<section class="panel-block">' +
      '<div class="mode-head"><span class="mode-head__icon">' + icon(MODE_ICON[ck.mode]) + '</span><div><h3 class="block__title">' + esc(modeLabel(ck.mode)) + "</h3>" +
      '<p class="block__text">' + esc(where) + "</p></div>" +
      '<a class="textbtn" href="#/cart">' + esc(t("checkout.change")) + "</a></div>" +
      whenBlock(ck) +
      (ck.mode === "delivery"
        ? field("coAddress", "address", t("field.address"), ck.address || p.address, { autocomplete: "street-address", required: true, placeholder: t("field.addressPh") }) +
          field("coInstr", "instructions", t("field.instructions"), ck.instructions, { optional: true, placeholder: t("field.instructionsPh"), maxlength: 140 })
        : "") +
      "</section>" +
      '<section class="panel-block"><h3 class="block__title">' + esc(t("profile.details")) + "</h3>" +
      field("coName", "name", t("field.name"), ck.name || p.name, { autocomplete: "name", required: true, placeholder: t("field.namePh2") }) +
      field("coPhone", "phone", t("field.phone"), ck.phone || p.phone, { type: "tel", autocomplete: "tel", inputmode: "tel", required: true, placeholder: t("field.phonePh2") }) +
      "</section>" +
      '<section class="panel-block"><h3 class="block__title">' + esc(t("pay.title")) + "</h3>" +
      '<div class="radio-cards">' +
      ["card", "cash"].map((m) =>
        '<label class="rcard"><input type="radio" name="payment" value="' + m + '"' + (ck.payment === m ? " checked" : "") + ">" +
        '<span class="rcard__body">' + icon(m) + "<strong>" + esc(t("pay." + m)) + "</strong><span>" + esc(payWhere) + "</span></span></label>"
      ).join("") +
      '</div><p class="block__text">' + esc(t("pay.note")) + "</p></section>" +
      '<section class="panel-block summary">' +
      tot.lines.map((l) => '<div class="sum-row sum-row--item"><span>' + l.qty + " × " + esc(pick(l.dish.name)) + '</span><span class="price">' + S.money(l.total) + "</span></div>").join("") +
      '<hr class="sum-rule">' + summaryRows(tot, ck.mode) +
      '<p class="sum-pts">' + icon("star") + esc(t("cart.points", { n: I.num(tot.points), club: R.club.name })) + "</p></section>" +
      (R.demo ? '<p class="demo-note">' + icon("info") + "<span>" + esc(t("checkout.demo")) + "</span></p>" : "") +
      '<p class="field__error field__error--form" id="checkoutForm-err" hidden></p>' +
      "</form></div>" +
      '<footer class="pfoot"><div class="total"><span class="total__label">' + esc(t("sum.total")) + '</span><strong class="total__value">' + S.money(tot.total) + "</strong></div>" +
      '<button class="cta" type="submit" form="checkoutForm">' + esc(t("cta.place")) + '<span class="cta__plus">' + icon("check") + "</span></button></footer></div>"
    );
  }

  /* ----------------------------------------------------------
     Panel: order tracking
     ---------------------------------------------------------- */
  function trackText(o, pr) {
    const ready = S.clock(new Date(pr.readyAt));
    if (pr.done) {
      return { title: t("track.done." + o.mode), eta: t("track.thanks", { name: R.name }) };
    }
    const place = o.mode === "pickup" ? t("track.placePickup", { store: R.store.name }) : t("track.placeDelivery", { address: o.address });
    const titles = [
      pr.scheduled ? t("track.scheduled", { time: ready }) : t("track.received"),
      t("track.cooking"),
      t("track.ready." + o.mode),
    ];
    const etas = [
      (pr.scheduled ? t("track.startAt", { time: S.clock(new Date(pr.marks[1])) }) : t("track.readyAround", { time: ready })) + " · " + place,
      (o.mode === "delivery" ? t("track.leaving", { time: ready }) : t("track.readyAround", { time: ready })) + " · " + place,
      (o.mode === "delivery" ? t("track.arriving", { time: S.clock(new Date(pr.marks[3])) }) : t("track.askFor", { n: o.number })) + " · " + place,
    ];
    return { title: titles[pr.stage], eta: etas[pr.stage] };
  }

  function steps(o, pr) {
    return [0, 1, 2, 3].map((i) => {
      const state = i < pr.stage || pr.done ? "is-done" : i === pr.stage ? "is-now" : "";
      const time = i <= pr.stage ? S.clock(new Date(pr.marks[i])) : "";
      return '<li class="step ' + state + '" data-step="' + i + '"><span class="step__dot">' + icon("check") + "</span>" +
        '<span class="step__label">' + esc(stageLabel(o, i)) + '</span><time class="step__time">' + esc(time) + "</time></li>";
    }).join("");
  }

  function trackMedia(o, spinning) {
    const l = o.lines[0];
    const d = l && S.dish(l.dishId);
    if (!d) return "";
    if (S.isBowl(d)) return '<div class="track__img track__bowl' + (spinning ? " is-spinning" : "") + '">' + bowlFor(d, l.choices, "lg") + "</div>";
    return '<img class="dish-img track__img' + (spinning ? " is-spinning" : "") + '" src="' + esc(d.thumb) + '" srcset="' + esc(d.thumb) + " 400w, " + esc(d.image) + ' 800w" sizes="190px" alt="" width="400" height="400">';
  }

  function orderView(o) {
    if (!o) {
      return '<div class="pview" data-view="order"><div class="pview__scroll"><header class="pbar"><button class="iconbtn" type="button" data-action="back" aria-label="' + esc(t("nav.back")) + '">' +
        icon("back") + '</button><h2 class="pbar__title" id="panelTitle" tabindex="-1">' + esc(t("order.title")) + '</h2><span class="pbar__spacer"></span></header>' +
        empty("receipt", t("order.missingTitle"), t("order.missingText"), '<a class="btn" href="#/orders">' + esc(t("order.seeAll")) + "</a>") + "</div></div>";
    }
    const pr = S.orderProgress(o);
    const txt = trackText(o, pr);
    const payment = t("pay." + (o.payment === "cash" ? "cash" : "card")) + " · " + (o.mode === "pickup" ? t("pay.counter") : t("pay.rider"));
    return (
      '<div class="pview pview--order" data-view="order" data-id="' + o.id + '"><div class="pview__scroll">' +
      '<header class="pbar"><a class="iconbtn" href="#/orders" aria-label="' + esc(t("order.all")) + '">' + icon("back") + "</a>" +
      '<h2 class="pbar__title" id="panelTitle" tabindex="-1">' + esc(t("order.number", { n: o.number })) + '</h2><span class="pbar__spacer"></span></header>' +
      '<div class="track">' +
      '<div class="track__ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track__bg" cx="60" cy="60" r="56"/>' +
      '<circle class="track__fg" cx="60" cy="60" r="56" pathLength="100" data-ring style="stroke-dasharray:' + (pr.progress * 100).toFixed(1) + ' 100"/></svg>' +
      trackMedia(o, !pr.done) + "</div>" +
      '<p class="track__stage" data-track-stage>' + esc(stageLabel(o, pr.stage)) + "</p>" +
      '<h3 class="track__title" data-track-title aria-live="polite">' + esc(txt.title) + "</h3>" +
      '<p class="track__eta" data-track-eta>' + esc(txt.eta) + "</p></div>" +
      '<ol class="steps" data-steps>' + steps(o, pr) + "</ol>" +
      '<section class="panel-block summary"><h3 class="block__title">' + esc(t("order.yours")) + "</h3>" +
      o.lines.map((l) => {
        const det = lineDetails(l);
        return '<div class="sum-row sum-row--item"><span>' + l.qty + " × " + esc(lineName(l)) +
          (det.length ? "<small>" + esc(det.join(" · ")) + "</small>" : "") +
          (l.note ? "<small>“" + esc(l.note) + "”</small>" : "") + '</span><span class="price">' + S.money(l.total) + "</span></div>";
      }).join("") +
      '<hr class="sum-rule">' +
      (o.mode === "delivery" ? '<div class="sum-row"><span>' + esc(t("sum.delivery")) + '</span><span class="price">' + (o.deliveryFee ? S.money(o.deliveryFee) : esc(t("sum.free"))) + "</span></div>" : "") +
      (o.taxes || []).map((x) => '<div class="sum-row"><span>' + esc(pick(x.label)) + '</span><span class="price">' + S.money(x.amount) + "</span></div>").join("") +
      '<div class="sum-row sum-row--total"><span>' + esc(t("sum.total")) + '</span><span class="price">' + S.money(o.total) + "</span></div>" +
      (o.points ? '<p class="sum-pts">' + icon("star") + esc(t("order.earned", { n: I.num(o.points), club: R.club.name })) + "</p>" : "") +
      "</section>" +
      '<section class="panel-block"><h3 class="block__title">' + esc(t("order.details")) + '</h3><dl class="deflist">' +
      "<div><dt>" + esc(t("order.type")) + "</dt><dd>" + esc(modeLabel(o.mode)) + "</dd></div>" +
      (o.address ? "<div><dt>" + esc(t("field.address")) + "</dt><dd>" + esc(o.address) + (o.instructions ? "<br><small>" + esc(o.instructions) + "</small>" : "") + "</dd></div>" : "") +
      "<div><dt>" + esc(t("order.placed")) + "</dt><dd>" + esc(orderTime(o)) + "</dd></div>" +
      "<div><dt>" + esc(t("field.name")) + "</dt><dd>" + esc(o.name) + "</dd></div>" +
      "<div><dt>" + esc(t("field.phone")) + "</dt><dd>" + esc(o.phone) + "</dd></div>" +
      "<div><dt>" + esc(t("pay.title")) + "</dt><dd>" + esc(payment) + "</dd></div>" +
      "</dl></section>" +
      '<section class="panel-block"><h3 class="block__title">' + esc(t("order.changeTitle")) + "</h3>" +
      '<p class="block__text">' + esc(t("order.changeText", { n: o.number })) + "</p></section>" +
      (o.demo ? '<p class="demo-note">' + icon("info") + "<span>" + esc(t("order.demo")) + "</span></p>" : "") +
      "</div>" +
      '<footer class="pfoot pfoot--split">' +
      '<a class="btn btn--ghost" href="#/orders">' + esc(t("order.all")) + "</a>" +
      '<a class="cta" href="#/menu">' + esc(t("order.backMenu")) + '<span class="cta__plus">' + icon("arrow") + "</span></a></footer></div>"
    );
  }

  /* ----------------------------------------------------------
     Drawer: restaurant info and the concept
     ---------------------------------------------------------- */
  function hoursTable() {
    const today = S.zoned(new Date()).dow;
    const order = [1, 2, 3, 4, 5, 6, 0];
    const names = t("days").split(",");
    const fmt = (m) => {
      const d = new Date(2000, 0, 1, Math.floor(m / 60) % 24, m % 60);
      return new Intl.DateTimeFormat(I.locale(), { hour: "numeric", minute: "2-digit" }).format(d);
    };
    return '<table class="hours"><caption class="sr-only">' + esc(t("info.hours")) + "</caption><tbody>" +
      order.map((dow) => {
        const rs = S.ranges(dow);
        return "<tr" + (dow === today ? ' class="is-today"' : "") + '><th scope="row">' + esc(names[dow]) + (dow === today ? " <span>" + esc(t("time.today")) + "</span>" : "") + "</th><td>" +
          (rs.length ? rs.map(([a, b]) => fmt(a) + " – " + fmt(b)).join(", ") : esc(t("status.closed"))) + "</td></tr>";
      }).join("") +
      "</tbody></table>";
  }

  function infoView() {
    const del = R.orderTypes.delivery;
    return (
      '<header class="drawer__head"><span class="logo" aria-hidden="true">' + logo() + "</span>" +
      '<div><h2 class="drawer__title" id="drawerTitle" tabindex="-1">' + esc(R.name) + "</h2>" + statusChip() + "</div>" +
      '<button class="iconbtn" type="button" data-action="close-info" aria-label="' + esc(t("nav.close")) + '">' + icon("close") + "</button></header>" +
      '<p class="drawer__about">' + esc(pick(R.about)) + "</p>" +
      '<section class="drawer__block"><h3 class="block__title">' + esc(t("info.store")) + "</h3>" +
      '<p class="addr">' + icon("pin") + "<span>" + esc(R.store.name) + "<br>" + esc(R.store.city) + "</span></p></section>" +
      '<section class="drawer__block"><h3 class="block__title">' + esc(t("info.hours")) + "</h3>" + hoursTable() + "</section>" +
      '<section class="drawer__block"><h3 class="block__title">' + esc(t("info.ways")) + '</h3><ul class="ways">' +
      "<li>" + icon("bag") + "<span><strong>" + esc(modeLabel("pickup")) + "</strong> " + esc(t("info.pickup", { n: S.prepMinutes("pickup") })) + "</span></li>" +
      (del.enabled ? "<li>" + icon("delivery") + "<span><strong>" + esc(modeLabel("delivery")) + "</strong> " +
        esc(t("info.delivery", { fee: S.money(S.cents(del.fee)), free: S.money(S.cents(del.freeOver)), min: S.money(S.cents(del.minOrder)) })) + "</span></li>" : "") +
      "<li>" + icon("star") + "<span><strong>" + esc(R.club.name) + "</strong> " + esc(t("club.rule", { n: R.club.perDollar })) + " " + esc(t("club.welcome", { n: R.club.welcome })) + "</span></li>" +
      "</ul></section>" +
      '<section class="drawer__block concept" id="concept"><h3 class="block__title">' + esc(t("concept.title")) + "</h3>" +
      '<p class="block__text">' + esc(t("concept.p1", { by: R.concept.by })) + "</p>" +
      '<p class="block__text">' + esc(t("concept.p2")) + "</p>" +
      '<p class="block__text">' + esc(t("concept.p3")) + "</p>" +
      credits() +
      '<a class="btn btn--sm btn--ghost" href="' + esc(R.concept.url) + '" target="_blank" rel="noopener">' + esc(t("concept.link", { by: R.concept.by })) + icon("arrow") + "</a></section>"
    );
  }

  /* Who took each photo, with its licence (CC BY asks for the author's name) */
  const LICENCE_FR = { "Pexels License": "Licence Pexels", "Public Domain Mark 1.0": "Marque du domaine public 1.0" };
  function credits() {
    const list = window.PHOTO_CREDITS || [];
    if (!list.length) return "";
    const ext = (href, text) => '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(text) + "</a>";
    const rows = list.map((c) => {
      const licence = I.lang === "fr" && LICENCE_FR[c.license] ? LICENCE_FR[c.license] : c.license;
      const parts = [ext(c.page, c.title ? "“" + c.title + "”" : t("credits.photo"))];
      if (c.by) parts.push(esc(t("credits.by", { by: c.by })));
      parts.push(esc(t("credits.on", { site: c.site })) + ",");
      parts.push(c.licenseUrl ? ext(c.licenseUrl, licence) : esc(licence));
      return "<li><b>" + esc(pick(c.what)) + "</b>" + esc(t("credits.sep")) + parts.join(" ") + "</li>";
    });
    return '<details class="credits"><summary>' + esc(t("credits.title")) + icon("chevron") + "</summary>" +
      '<p class="credits__note">' + esc(t("credits.note")) + "</p>" +
      '<ul class="credits__list">' + rows.join("") + "</ul></details>";
  }

  /* The concept's mark: a red bowl with a black inside under a cockscomb.
     It is drawn for this concept, not Poulet Rouge's own logo. */
  function logo() {
    return '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="20" fill="var(--accent)"/>' +
      '<path d="M14.2 14.6c-.2-1.9 1.4-3.2 2.9-2.4.6-1.9 3.2-2.4 4.3-.6 1.4-1.3 3.8-.4 3.6 1.7" fill="none" stroke="var(--on-accent)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M9.4 18.6h21.2a10.6 10.6 0 0 1-21.2 0z" fill="var(--on-accent)"/>' +
      '<path d="M12.6 20.6h14.8" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" opacity=".35"/></svg>';
  }

  window.Views = {
    esc, menuView, menuList, favoritesView, ordersView, orderCard, profileView, clubCard,
    dishView, cartView, checkoutView, orderView, trackText, steps, infoView, logo, statusChip, media, stageLabel,
  };
})();
