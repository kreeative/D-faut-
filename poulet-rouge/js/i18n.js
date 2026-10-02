/* ============================================================
   I18N — French first, English on request
   t("key", { n: 3 }) fills {n}; tn(n, "key") picks key.one or
   key.other by the language's plural rule; pick({ fr, en }) reads
   menu text. The choice is remembered on this device.
   ============================================================ */
(function () {
  "use strict";

  const KEY = "poulet-rouge:lang";
  const LANGS = ["fr", "en"];

  function saved() {
    try {
      const v = window.localStorage.getItem(KEY);
      return LANGS.includes(v) ? v : null;
    } catch (e) {
      return null;
    }
  }
  function fromUrl() {
    try {
      const v = new URLSearchParams(window.location.search).get("lang");
      return LANGS.includes(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function store(l) {
    try {
      window.localStorage.setItem(KEY, l);
    } catch (e) {
      /* private mode: keep it for this visit */
    }
  }

  /* A Québec brand: French unless the guest asked for English. A link
     with ?lang= counts as asking, so it is remembered too. */
  let lang = fromUrl() || saved() || "fr";
  if (fromUrl()) store(lang);

  const D = { fr: {}, en: {} };
  function add(key, fr, en) {
    D.fr[key] = fr;
    D.en[key] = en == null ? fr : en;
  }
  window.__i18nAdd = add;

  function t(key, vars) {
    let s = D[lang][key];
    if (s == null) s = D.fr[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
    return s;
  }

  let rules = null;
  function tn(n, key, vars) {
    rules = rules && rules.lang === lang ? rules : { lang, pr: safePlural(lang) };
    const form = rules.pr ? rules.pr.select(n) : n === 1 ? "one" : "other";
    return t(key + "." + (form === "one" ? "one" : "other"), Object.assign({ n: num(n) }, vars || {}));
  }
  function safePlural(l) {
    try {
      return new Intl.PluralRules(l === "fr" ? "fr-CA" : "en-CA");
    } catch (e) {
      return null;
    }
  }
  function num(n) {
    try {
      return new Intl.NumberFormat(locale()).format(n);
    } catch (e) {
      return String(n);
    }
  }

  function pick(v) {
    if (v && typeof v === "object" && ("fr" in v || "en" in v)) return v[lang] != null ? v[lang] : v.fr;
    return v == null ? "" : v;
  }

  const locale = () => (lang === "fr" ? "fr-CA" : "en-CA");

  const listeners = new Set();
  function set(l) {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    store(l);
    // keep a ?lang= in the address in step, so a reload doesn't undo the switch
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has("lang")) {
        u.searchParams.set("lang", l);
        window.history.replaceState(window.history.state, "", u);
      }
    } catch (e) {
      /* the address stays as it was */
    }
    document.documentElement.lang = locale();
    listeners.forEach((fn) => fn(l));
  }

  document.documentElement.lang = locale();

  window.I18N = {
    get lang() {
      return lang;
    },
    t, tn, pick, set, locale, num,
    other: () => (lang === "fr" ? "en" : "fr"),
    onChange: (fn) => listeners.add(fn),
  };
})();
