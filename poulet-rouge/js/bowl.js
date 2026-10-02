/* ============================================================
   Bowl — the live, top-down Poulet Rouge bowl
   A red bowl with a black inside, as in the restaurants. Its food is
   built from real photos: the base fills the bowl, each topping is a
   heap in its own spot around the edge, the grilled chicken sits in the
   middle (tinted by its flavour) and each sauce is a drizzle on top.
   Bowl.html() draws one; Bowl.update() changes it in place so that new
   toppings drop in, removed ones shrink away and sauces draw themselves.
   ============================================================ */
(function () {
  "use strict";

  const R = window.RESTAURANT;
  const ING = R.ingredients;
  const find = (list, id) => list.find((x) => x.id === id) || null;

  /* Organic outlines and turns for the heaps, one per spot */
  const SHAPES = [
    "58% 42% 55% 45% / 47% 56% 44% 53%",
    "45% 55% 42% 58% / 55% 45% 58% 42%",
    "52% 48% 60% 40% / 42% 58% 46% 54%",
    "40% 60% 50% 50% / 52% 46% 54% 48%",
    "55% 45% 48% 52% / 60% 40% 55% 45%",
    "47% 53% 58% 42% / 48% 52% 42% 58%",
    "60% 40% 45% 55% / 44% 56% 50% 50%",
  ];
  const TURNS = [12, -24, 37, -8, 51, -33, 19];
  const NUDGE = [[0, 0], [1.5, -1], [-1, 1.5], [1, 1], [-1.5, -0.5], [0.5, 1.5], [-0.5, -1.5]];

  /* Where the heaps go: evenly around the bowl, starting at the top.
     Measured in % of the food's circle. */
  function spots(count) {
    const big = count <= 3;
    const r = big ? 27 : 31;
    const d = big ? 44 : 34;
    const out = [];
    for (let k = 0; k < count; k++) {
      const a = (-90 + (k * 360) / count + (big ? 0 : 6)) * (Math.PI / 180);
      const n = NUDGE[k % NUDGE.length];
      out.push({ x: 50 + r * Math.cos(a) + n[0], y: 50 + r * Math.sin(a) + n[1], d });
    }
    return out;
  }

  const tex = (id, size) => "assets/textures/" + id + "-" + (size === "lg" ? 640 : 320) + ".webp";
  const topTex = (id) => "assets/textures/" + id + "-320.webp";

  /* The drizzle: two loose passes across the middle (viewBox 0 0 100 100) */
  const DRIZZLE = [
    "M19 37 C27 25 33 49 42 38 S56 25 63 39 S77 51 83 41",
    "M17 58 C27 46 33 71 45 59 S59 46 66 61 S80 71 85 58",
  ].join(" ");

  /* ----------------------------------------------------------
     Markup
     ---------------------------------------------------------- */
  function baseLayer(id, i, size) {
    return '<div class="bowl__base' + (i ? " bowl__base--half" : "") + '" data-base="' + id + '" style="background-image:url(' + tex(id, size) + ')"></div>';
  }

  function heap(id, spot, k) {
    return '<div class="heap" data-top="' + id + '" data-spot="' + k + '" style="left:' + spot.x.toFixed(2) + "%;top:" + spot.y.toFixed(2) + "%;width:" + spot.d + "%;" +
      "--rot:" + TURNS[k % TURNS.length] + "deg;border-radius:" + SHAPES[k % SHAPES.length] + ";background-image:url(" + topTex(id) + ')"></div>';
  }

  function proteinHeaps(flavours) {
    const list = flavours.length ? flavours : [];
    return list.map((id, i) => {
      const f = find(ING.flavours, id);
      if (!f) return "";
      const two = list.length > 1;
      const x = two ? (i ? 59 : 41) : 50;
      const d = two ? 31 : 41;
      const img = f.plant ? topTex("plant") : topTex("chicken");
      return '<div class="heap heap--protein' + (f.plant ? " is-plant" : "") + '" data-flavour="' + id + '" data-i="' + i + '" style="left:' + x + "%;top:" + (two ? (i ? 53 : 47) : 50) + "%;width:" + d + "%;" +
        "--rot:" + (i ? -18 : 24) + "deg;border-radius:" + SHAPES[(i + 3) % SHAPES.length] + ";background-image:url(" + img + ");" +
        (f.tint ? "--tint:" + f.tint + ";--tint-a:" + f.tintAlpha : "--tint-a:0") + '"></div>';
    }).join("");
  }

  function drizzle(id, i) {
    const s = find(ING.sauces, id);
    if (!s) return "";
    return '<svg class="drizzle" data-sauce="' + id + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="--turn:' + (i ? 62 : -8) + 'deg">' +
      '<path class="drizzle__shadow" d="' + DRIZZLE + '" pathLength="100"/>' +
      '<path class="drizzle__line" d="' + DRIZZLE + '" pathLength="100" stroke="' + s.color + '"/>' +
      (s.fleck ? '<path class="drizzle__fleck" d="' + DRIZZLE + '" pathLength="100" stroke="' + s.fleck + '"/>' : "") +
      '<path class="drizzle__shine" d="' + DRIZZLE + '" pathLength="100"/></svg>';
  }

  /* sel: { base, bases, flavours, toppings, sauces, spots } */
  function html(sel, opts) {
    opts = opts || {};
    const size = opts.size || "sm";
    const bases = sel.base ? [sel.base] : (sel.bases || []).slice(0, 2);
    const count = sel.spots || 7;
    const pos = spots(count);
    const tops = (sel.toppings || []).slice(0, count);
    return (
      '<div class="bowl' + (opts.cls ? " " + opts.cls : "") + '" data-spots="' + count + '" data-size="' + size + '" aria-hidden="true">' +
      '<div class="bowl__rim"></div><div class="bowl__well"></div>' +
      '<div class="bowl__food">' +
      '<div class="bowl__bases">' + bases.map((b, i) => baseLayer(b, i, size)).join("") + "</div>" +
      '<div class="bowl__heaps">' + tops.map((t, k) => heap(t, pos[k], k)).join("") + "</div>" +
      '<div class="bowl__protein">' + proteinHeaps(sel.flavours || []) + "</div>" +
      '<div class="bowl__sauces">' + (sel.sauces || []).slice(0, 2).map(drizzle).join("") + "</div>" +
      "</div></div>"
    );
  }

  /* ----------------------------------------------------------
     Live updates: keep what stays, animate what changes
     ---------------------------------------------------------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function leave(node) {
    if (reduce.matches) return node.remove();
    node.classList.remove("is-in");
    node.classList.add("is-out");
    setTimeout(() => node.remove(), 320);
  }
  function enter(node) {
    if (reduce.matches) return;
    node.classList.add("is-in");
    node.addEventListener("animationend", () => node.classList.remove("is-in"), { once: true });
  }
  function fromHTML(s) {
    const t = document.createElement("template");
    t.innerHTML = s.trim();
    return t.content.firstElementChild;
  }

  function update(bowl, sel) {
    if (!bowl) return;
    const size = bowl.dataset.size || "sm";
    const count = Number(bowl.dataset.spots) || 7;
    const pos = spots(count);

    // bases: swap layers, cross-fading
    const bases = sel.base ? [sel.base] : (sel.bases || []).slice(0, 2);
    const baseBox = bowl.querySelector(".bowl__bases");
    const current = Array.from(baseBox.children).filter((n) => !n.classList.contains("is-out")).map((n) => n.dataset.base);
    if (current.join() !== bases.join()) {
      Array.from(baseBox.children).forEach(leave);
      bases.forEach((b, i) => {
        const n = fromHTML(baseLayer(b, i, size));
        baseBox.appendChild(n);
        enter(n);
      });
    }

    // toppings: each keeps its spot; a new one takes the first free spot
    const heaps = bowl.querySelector(".bowl__heaps");
    const wanted = (sel.toppings || []).slice(0, count);
    const live = Array.from(heaps.children).filter((n) => !n.classList.contains("is-out"));
    live.forEach((n) => {
      if (!wanted.includes(n.dataset.top)) leave(n);
    });
    const taken = new Set(live.filter((n) => wanted.includes(n.dataset.top)).map((n) => Number(n.dataset.spot)));
    wanted.forEach((id) => {
      if (live.some((n) => n.dataset.top === id)) return;
      let k = 0;
      while (taken.has(k) && k < count - 1) k++;
      taken.add(k);
      const n = fromHTML(heap(id, pos[k], k));
      heaps.appendChild(n);
      enter(n);
    });

    // protein: redraw when the flavours change; tint changes glide
    const prot = bowl.querySelector(".bowl__protein");
    const fl = (sel.flavours || []).join();
    if (prot.dataset.key !== fl) {
      const before = Array.from(prot.children).map((n) => n.dataset.flavour);
      const same = before.length === (sel.flavours || []).length;
      if (same && before.length) {
        // same number of heaps: only the tint changes
        Array.from(prot.children).forEach((n, i) => {
          const f = find(ING.flavours, sel.flavours[i]);
          n.dataset.flavour = f.id;
          n.classList.toggle("is-plant", !!f.plant);
          n.style.backgroundImage = "url(" + (f.plant ? topTex("plant") : topTex("chicken")) + ")";
          n.style.setProperty("--tint", f.tint || "transparent");
          n.style.setProperty("--tint-a", f.tint ? f.tintAlpha : 0);
        });
      } else {
        Array.from(prot.children).forEach(leave);
        const wrap = document.createElement("div");
        wrap.innerHTML = proteinHeaps(sel.flavours || []);
        Array.from(wrap.children).forEach((n) => {
          prot.appendChild(n);
          enter(n);
        });
      }
      prot.dataset.key = fl;
    }

    // sauces
    const sauces = bowl.querySelector(".bowl__sauces");
    const wantS = (sel.sauces || []).slice(0, 2);
    const haveS = Array.from(sauces.children).filter((n) => !n.classList.contains("is-out")).map((n) => n.dataset.sauce);
    if (haveS.join() !== wantS.join()) {
      Array.from(sauces.children).forEach((n) => {
        if (!wantS.includes(n.dataset.sauce)) leave(n);
      });
      wantS.forEach((id, i) => {
        const existing = Array.from(sauces.children).find((n) => n.dataset.sauce === id && !n.classList.contains("is-out"));
        if (existing) {
          existing.style.setProperty("--turn", (i ? 62 : -8) + "deg");
          return;
        }
        const n = fromHTML(drizzle(id, i));
        sauces.appendChild(n);
        enter(n);
      });
    }
  }

  /* A product's selection in the form the bowl understands */
  function selection(dish, choices) {
    const c = choices || {};
    return {
      base: dish.base || null,
      bases: c.bases || [],
      flavours: c.flavours || [],
      toppings: c.toppings || [],
      sauces: c.sauces || [],
      spots: (dish.groups.find((g) => g.id === "toppings") || { max: 7 }).max > 3 ? 7 : 3,
    };
  }

  window.Bowl = { html, update, selection, spots };
})();
