/* ============================================================================
   Concept non officiel de refonte — Portail du Gouvernement de Côte d'Ivoire
   Script principal (vanilla JS, amélioration progressive : le site reste
   lisible et navigable sans JavaScript).
   Auteur : Kreeative (Anne-Kelly Kouyaté) — projet personnel, non affilié.
   ----------------------------------------------------------------------------
   1. Menu mobile accessible
   2. Recherche de services (combobox + résultats inline)
   3. Personnalisation géographique (« Ma localité »)
   4. Retour citoyen (« Votre avis compte »)
   4b. Assistant conversationnel « Akwaba » (démonstration)
   5. Apparition au défilement
   6. Divers (année, liens externes)
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* --------------------------------------------------------------------------
     1. Menu mobile
     -------------------------------------------------------------------------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("navigation");

  if (menuBtn && nav) {
    var header = menuBtn.closest(".header");
    var setMenu = function (open) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      nav.setAttribute("data-open", open ? "true" : "false");
      if (header) header.classList.toggle("is-open", !!open);
    };
    setMenu(false);

    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (nav.getAttribute("data-open") !== "true") return;
      if (nav.contains(e.target) || menuBtn.contains(e.target)) return;
      setMenu(false);
    });

    var desktop = window.matchMedia("(min-width: 64em)");
    var onChange = function () { setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* --------------------------------------------------------------------------
     2. Recherche de services
     Index local de démonstration : dans une version réelle, il serait servi
     par une API de recherche (démarches, ministères, actualités, documents).
     Les liens pointent vers les services en ligne officiels listés sur gouv.ci.
     -------------------------------------------------------------------------- */
  var SERVICES = [
    { t: "Carte nationale d'identité (CNI)", d: "Première demande, renouvellement, suivi", u: "https://servicepublic.gouv.ci/", k: "cni identite carte piece oneci" },
    { t: "Passeport ordinaire", d: "Rendez-vous, pièces à fournir, retrait", u: "https://servicepublic.gouv.ci/", k: "passeport voyage" },
    { t: "Extrait d'acte de naissance", d: "Demande en ligne ou en mairie", u: "https://servicepublic.gouv.ci/", k: "acte naissance extrait etat civil mairie jugement suppletif" },
    { t: "Casier judiciaire", d: "Extrait de casier judiciaire", u: "https://e-justice.ci/", k: "casier judiciaire justice bulletin tribunal" },
    { t: "Impôts et déclarations", d: "Déclarer et payer en ligne (e-impôts)", u: "https://e-impots.gouv.ci/", k: "impots impot taxe declaration dgi facture normalisee contribuable" },
    { t: "Créer une entreprise", d: "Guichet unique du CEPICI", u: "https://www.cepici.gouv.ci/", k: "entreprise societe creation rccm cepici investir" },
    { t: "Couverture maladie universelle (CMU)", d: "Enrôlement et carte CMU", u: "https://ipscnam.ci/enrolement-cmu/", k: "cmu sante maladie assurance enrolement cnam soins" },
    { t: "Permis de conduire et immatriculation", d: "Permis, carte grise, immatriculation des motos", u: "https://servicepublic.gouv.ci/", k: "permis conduire voiture moto immatriculation carte grise vehicule" },
    { t: "Sécurité sociale (CNPS)", d: "Espace assuré et employeur e-CNPS", u: "https://e.cnps.ci/", k: "cnps retraite cotisation salarie employeur" },
    { t: "Pension de retraite (CGRAE)", d: "Fonctionnaires et agents de l'État", u: "https://www.cgrae.ci/", k: "retraite pension fonctionnaire cgrae" },
    { t: "Carnet de vaccination électronique", d: "e-Vaccination", u: "https://opisms.net/ecarnet/", k: "vaccin vaccination sante enfant carnet" },
    { t: "Espace fonctionnaire (SIGFAE)", d: "Carrière et actes administratifs", u: "https://espacefonctionnaire.fonctionpublique.gouv.ci/", k: "fonctionnaire fonction publique sigfae carriere concours" },
    { t: "Foncier urbain (SIGFU)", d: "Titres et démarches foncières", u: "https://sigfu.gouv.ci/", k: "foncier terrain titre logement sigfu acd" },
    { t: "Douane numérique", d: "Procédures douanières en ligne", u: "https://www.douanes.ci/", k: "douane import export vehicule dedouanement" },
    { t: "Commerce extérieur (GUCE)", d: "Guichet unique du commerce extérieur", u: "https://guce.gouv.ci/", k: "import export commerce guce" },
    { t: "Emploi et insertion des jeunes", d: "Offres, programmes, formation", u: "https://servicepublic.gouv.ci/", k: "emploi jeunes travail stage agence recrutement" },
    { t: "Bourses, orientation et examens", d: "Affectations, bourses, résultats", u: "https://servicepublic.gouv.ci/", k: "ecole bourse orientation affectation examen bepc bac cepe eleve etudiant universite" },
    { t: "Écrire au Gouvernement", d: "Poser une question, signaler un problème", u: "https://www.gouv.ci/ecrire-au-gouvernement", k: "contact ecrire question reclamation avis plainte" },
    { t: "Conseil des ministres", d: "Communiqués et comptes rendus", u: "https://www.gouv.ci/publications/documents/Conseils%20des%20Ministres", k: "conseil ministres communique compte rendu" },
    { t: "Ministères et institutions", d: "Composition du Gouvernement", u: "https://www.gouv.ci/gouvernement", k: "ministere ministre institution gouvernement premier president" },
    { t: "Données ouvertes (open data)", d: "Jeux de données publics", u: "https://data.gouv.ci/", k: "donnees open data statistiques" }
  ];

  var normalize = function (s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  var scoreService = function (svc, terms) {
    var title = normalize(svc.t);
    var desc = normalize(svc.d);
    var keys = normalize(svc.k);
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (term.length < 2) continue;
      var hit = 0;
      if (title.indexOf(term) !== -1) hit += 3;
      if (keys.split(" ").some(function (w) { return w.indexOf(term) === 0; })) hit += 2;
      if (desc.indexOf(term) !== -1) hit += 1;
      if (!hit) return 0; // chaque terme doit correspondre
      score += hit;
    }
    return score;
  };

  var searchServices = function (query, limit) {
    var terms = normalize(query).split(" ").filter(Boolean);
    if (!terms.length) return [];
    return SERVICES
      .map(function (s) { return { s: s, score: scoreService(s, terms) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, limit || 6)
      .map(function (r) { return r.s; });
  };

  var form = document.getElementById("recherche");
  var input = document.getElementById("q");
  var list = document.getElementById("search-suggestions");
  var status = document.getElementById("search-status");
  var results = document.getElementById("resultats");

  var escapeHTML = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var iconSvg = function (id) {
    return '<svg class="icon" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
  };

  if (form && input && list) {
    var active = -1;
    var current = [];

    var closeList = function () {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      active = -1;
      current = [];
    };

    var setActive = function (idx) {
      var items = list.querySelectorAll('[role="option"]');
      if (!items.length) return;
      if (idx < 0) idx = items.length - 1;
      if (idx >= items.length) idx = 0;
      active = idx;
      items.forEach(function (li, i) {
        li.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
      input.setAttribute("aria-activedescendant", items[idx].id);
      items[idx].scrollIntoView({ block: "nearest" });
    };

    var openList = function (matches) {
      current = matches;
      if (!matches.length) { closeList(); return; }
      list.innerHTML = matches.map(function (m, i) {
        return '<li role="option" id="sugg-' + i + '" aria-selected="false" data-url="' + escapeHTML(m.u) + '">' +
          iconSvg("i-arrow") + '<span class="sugg__text"><span class="sugg__title">' + escapeHTML(m.t) + '</span><span class="sugg__desc">' + escapeHTML(m.d) + '</span></span></li>';
      }).join("");
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      active = -1;
    };

    var announce = function (msg) { if (status) status.textContent = msg; };

    var renderResults = function (query) {
      if (!results) return;
      var matches = searchServices(query, 8);
      var heading = results.querySelector("h2");
      var body = results.querySelector(".results__body");
      if (heading) heading.textContent = matches.length
        ? "Résultats pour « " + query + " »"
        : "Aucun résultat pour « " + query + " »";
      if (body) {
        body.innerHTML = matches.length
          ? '<ul class="results__list">' + matches.map(function (m) {
              return '<li><a href="' + escapeHTML(m.u) + '" rel="noopener">' + iconSvg("i-arrow") +
                '<span>' + escapeHTML(m.t) + ' <small>— ' + escapeHTML(m.d) + '</small></span></a></li>';
            }).join("") + "</ul>"
          : '<div class="results__empty"><p>Essayez un autre mot, par exemple « passeport », « impôts » ou « acte de naissance ». ' +
            'Vous pouvez aussi consulter le <a href="https://servicepublic.gouv.ci/" rel="noopener">portail des démarches administratives</a> ' +
            'ou <a href="https://www.gouv.ci/ecrire-au-gouvernement" rel="noopener">écrire au Gouvernement</a>.</p></div>';
      }
      results.hidden = false;
      announce(matches.length
        ? matches.length + " résultat" + (matches.length > 1 ? "s" : "") + " affiché" + (matches.length > 1 ? "s" : "") + " sous le formulaire."
        : "Aucun résultat. Suggestions affichées sous le formulaire.");
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: false }); }
    };

    input.addEventListener("input", function () {
      var q = input.value;
      if (normalize(q).length < 2) { closeList(); announce(""); return; }
      var matches = searchServices(q, 6);
      openList(matches);
      announce(matches.length
        ? matches.length + " suggestion" + (matches.length > 1 ? "s" : "") + ". Utilisez les flèches pour parcourir."
        : "Aucune suggestion. Validez pour lancer la recherche.");
    });

    input.addEventListener("keydown", function (e) {
      var open = !list.hidden;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open && normalize(input.value).length >= 2) openList(searchServices(input.value, 6));
        setActive(active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (open) setActive(active - 1);
      } else if (e.key === "Escape") {
        if (open) { e.preventDefault(); closeList(); }
      } else if (e.key === "Enter") {
        if (open && active >= 0 && current[active]) {
          e.preventDefault();
          window.location.href = current[active].u;
        }
      } else if (e.key === "Tab") {
        closeList();
      }
    });

    list.addEventListener("mousedown", function (e) {
      var li = e.target.closest('[role="option"]');
      if (!li) return;
      e.preventDefault();
      window.location.href = li.getAttribute("data-url");
    });

    input.addEventListener("blur", function () {
      window.setTimeout(closeList, 150);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      closeList();
      if (!q) { input.focus(); announce("Saisissez un mot-clé, par exemple « passeport »."); return; }
      renderResults(q);
    });

    // Recherches fréquentes : les puces remplissent et lancent la recherche
    document.querySelectorAll("[data-query]").forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        e.preventDefault();
        input.value = chip.getAttribute("data-query");
        renderResults(input.value);
      });
    });
  }

  /* --------------------------------------------------------------------------
     3. Personnalisation géographique
     Les 14 districts (dont 2 autonomes) et leur chef-lieu. Le choix est
     mémorisé localement (localStorage) : aucune donnée n'est transmise.
     -------------------------------------------------------------------------- */
  var DISTRICTS = {
    abidjan: { name: "District autonome d'Abidjan", city: "Abidjan" },
    yamoussoukro: { name: "District autonome de Yamoussoukro", city: "Yamoussoukro" },
    "bas-sassandra": { name: "District du Bas-Sassandra", city: "San-Pédro" },
    comoe: { name: "District de la Comoé", city: "Abengourou" },
    denguele: { name: "District du Denguélé", city: "Odienné" },
    "goh-djiboua": { name: "District du Gôh-Djiboua", city: "Gagnoa" },
    lacs: { name: "District des Lacs", city: "Dimbokro" },
    lagunes: { name: "District des Lagunes", city: "Dabou" },
    montagnes: { name: "District des Montagnes", city: "Man" },
    "sassandra-marahoue": { name: "District du Sassandra-Marahoué", city: "Daloa" },
    savanes: { name: "District des Savanes", city: "Korhogo" },
    "vallee-du-bandama": { name: "District de la Vallée du Bandama", city: "Bouaké" },
    woroba: { name: "District du Woroba", city: "Séguéla" },
    zanzan: { name: "District du Zanzan", city: "Bondoukou" }
  };
  var STORAGE_KEY = "ci-concept-district";

  var select = document.getElementById("district");
  var savedDistrict = null;
  try { savedDistrict = window.localStorage.getItem(STORAGE_KEY); } catch (err) { savedDistrict = null; }
  var applyDistrict = function (key) {
    var d = DISTRICTS[key];
    if (!d) return;
    document.querySelectorAll("[data-district-name]").forEach(function (el) { el.textContent = d.name; });
    document.querySelectorAll("[data-district-city]").forEach(function (el) { el.textContent = d.city; });
    document.querySelectorAll("[data-district-path]").forEach(function (el) {
      el.setAttribute("aria-pressed", el.getAttribute("data-district-path") === key ? "true" : "false");
    });
    var live = document.getElementById("district-status");
    if (live) live.textContent = "Contenus locaux mis à jour pour : " + d.name + ".";
  };

  var saveDistrict = function (key) {
    try { window.localStorage.setItem(STORAGE_KEY, key); } catch (err) { /* stockage indisponible */ }
  };

  var chooseDistrict = function (key) {
    if (!DISTRICTS[key]) return;
    if (select) select.value = key;
    applyDistrict(key);
    saveDistrict(key);
  };

  if (select) {
    if (savedDistrict && DISTRICTS[savedDistrict]) select.value = savedDistrict;
    applyDistrict(select.value);

    select.addEventListener("change", function () { chooseDistrict(select.value); });
  } else if (savedDistrict && DISTRICTS[savedDistrict]) {
    applyDistrict(savedDistrict);
  }

  // Carte interactive : chaque district est un bouton (souris, tactile, clavier)
  document.querySelectorAll("[data-district-path]").forEach(function (path) {
    var key = path.getAttribute("data-district-path");
    path.addEventListener("click", function () { chooseDistrict(key); });
    path.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chooseDistrict(key); }
    });
  });

  /* --------------------------------------------------------------------------
     4. Retour citoyen (démonstration : rien n'est envoyé)
     -------------------------------------------------------------------------- */
  document.querySelectorAll("[data-feedback]").forEach(function (group) {
    var thanks = group.querySelector(".feedback__thanks");
    group.querySelectorAll("button[data-vote]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group.querySelectorAll("button[data-vote]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
          b.disabled = true;
        });
        if (thanks) {
          thanks.textContent = btn.getAttribute("data-vote") === "oui"
            ? "Merci ! Votre avis nous aide à améliorer ce service. (Démonstration : rien n'est transmis.)"
            : "Merci. Dites-nous ce qui manque via « Écrire au Gouvernement ». (Démonstration : rien n'est transmis.)";
          thanks.hidden = false;
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     4b. Assistant conversationnel « Akwaba » (démonstration locale)
     Répond à partir du même index que la recherche ; aucune donnée transmise.
     -------------------------------------------------------------------------- */
  var assist = document.getElementById("assist");
  if (assist) {
    var toggle = assist.querySelector(".assist__toggle");
    var panel = document.getElementById("assist-panel");
    var closeBtn = assist.querySelector(".assist__close");
    var log = document.getElementById("assist-log");
    var quick = document.getElementById("assist-quick");
    var aform = document.getElementById("assist-form");
    var ainput = document.getElementById("assist-input");
    var started = false;

    var GREETING = "<p><strong>Akwaba&nbsp;!</strong> Je suis l'assistant du portail. Dites-moi ce que vous cherchez&nbsp;: une démarche, un service, un contact.</p>";
    var QUICK = [
      { label: "Carte d'identité", query: "carte nationale d'identité" },
      { label: "Passeport", query: "passeport" },
      { label: "Impôts", query: "impôts" },
      { label: "Acte de naissance", query: "acte de naissance" },
      { label: "Écrire au Gouvernement", query: "écrire au gouvernement" },
      { label: "Ma localité", query: "ma localité" }
    ];

    var addMsg = function (html, who) {
      var div = document.createElement("div");
      div.className = "assist__msg assist__msg--" + who;
      div.innerHTML = html;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    };
    var setQuick = function (items) {
      quick.innerHTML = items.map(function (it) {
        return it.href
          ? '<a class="assist__chip" href="' + escapeHTML(it.href) + '">' + escapeHTML(it.label) + '</a>'
          : '<button class="assist__chip" type="button" data-say="' + escapeHTML(it.query || it.label) + '">' + escapeHTML(it.label) + '</button>';
      }).join("");
    };
    var reply = function (text) {
      var q = normalize(text);
      var html;
      var next = QUICK;
      if (/^(bonjour|bonsoir|salut|hello|akwaba|coucou)/.test(q)) {
        html = GREETING;
      } else if (/merci/.test(q)) {
        html = "<p>Avec plaisir. Bonne continuation dans vos démarches&nbsp;!</p>";
      } else if (/localite|district|pres de chez|region|ville|commune/.test(q)) {
        html = "<p>Choisissez votre district sur la carte&nbsp;: les services, contacts et actualités s'adaptent à votre localité.</p>";
        next = [{ label: "Voir la carte des districts", href: "index.html#carte" }].concat(QUICK.slice(0, 3));
      } else {
        var matches = searchServices(text, 3);
        if (matches.length) {
          html = "<p>Voici ce que j'ai trouvé&nbsp;:</p><ul class=\"assist__links\">" + matches.map(function (m) {
            return '<li><a href="' + escapeHTML(m.u) + '" rel="noopener">' + escapeHTML(m.t) + '</a><small>' + escapeHTML(m.d) + '</small></li>';
          }).join("") + "</ul><p>Ce n'est pas ce que vous cherchiez&nbsp;? Reformulez, ou écrivez au Gouvernement.</p>";
        } else {
          html = "<p>Je n'ai rien trouvé pour «&nbsp;" + escapeHTML(text) + "&nbsp;». Essayez un autre mot (par exemple «&nbsp;passeport&nbsp;»), ou écrivez directement au Gouvernement&nbsp;: une personne vous répondra.</p>";
          next = [{ label: "Écrire au Gouvernement", href: "https://www.gouv.ci/ecrire-au-gouvernement" }].concat(QUICK.slice(0, 3));
        }
      }
      window.setTimeout(function () { addMsg(html, "bot"); setQuick(next); }, 350);
    };
    var say = function (text) {
      if (!text || !text.trim()) return;
      addMsg("<p>" + escapeHTML(text.trim()) + "</p>", "user");
      reply(text.trim());
    };
    var openPanel = function () {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      assist.classList.add("is-open");
      if (!started) { started = true; addMsg(GREETING, "bot"); setQuick(QUICK); }
      ainput.focus();
    };
    var closePanel = function () {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      assist.classList.remove("is-open");
      toggle.focus();
    };
    toggle.addEventListener("click", function () { if (panel.hidden) openPanel(); else closePanel(); });
    closeBtn.addEventListener("click", closePanel);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closePanel(); } });
    quick.addEventListener("click", function (e) {
      var b = e.target.closest("[data-say]");
      if (b) { say(b.getAttribute("data-say")); ainput.focus(); }
    });
    aform.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = ainput.value;
      ainput.value = "";
      say(t);
    });
  }

  /* --------------------------------------------------------------------------
     5. Apparition au défilement (désactivée si « réduire les animations »)
     -------------------------------------------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reveals.length || reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------------------------------------------------------
     6. Divers
     -------------------------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Les liens externes s'ouvrent dans le même onglet (contrôle laissé à
  // l'utilisateur) mais sont annoncés comme externes aux lecteurs d'écran.
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (a.hostname === window.location.hostname) return;
    if (!a.getAttribute("rel")) a.setAttribute("rel", "noopener");
    if (!a.querySelector(".visually-hidden") && !a.hasAttribute("aria-label")) {
      var sr = document.createElement("span");
      sr.className = "visually-hidden";
      sr.textContent = " (site externe)";
      a.appendChild(sr);
    }
  });
})();
