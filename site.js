(function () {
  var root = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !!(M && M.animate) && !reduce;
  var late = !root.classList.contains('motion-pending'); // the 3 s safety timeout already revealed the page
  var ease = [0.22, 1, 0.36, 1];
  var pop = [0.34, 1.56, 0.64, 1];
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // Language: French by default, English on request. The choice is remembered on this device.
  var I18N = window.CAMELEON_I18N || { fr: {}, en: {} };
  var lang = 'fr';
  function t(key) { return (I18N[lang] && I18N[lang][key]) || (I18N.fr && I18N.fr[key]) || ''; }
  function fill(str, vars) { return str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }
  function storedLang() {
    var q = /[?&]lang=(fr|en)\b/.exec(location.search);
    if (q) return q[1];
    try { return localStorage.getItem('cameleon-lang'); } catch (e) { return null; }
  }
  function applyLang(next) {
    lang = next === 'en' ? 'en' : 'fr';
    root.lang = lang === 'fr' ? 'fr-CA' : 'en-CA';
    $$('[data-i18n]').forEach(function (el) { var v = t(el.getAttribute('data-i18n')); if (v) el.textContent = v; });
    $$('[data-i18n-html]').forEach(function (el) { var v = t(el.getAttribute('data-i18n-html')); if (v) el.innerHTML = v; });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); var v = t(p[1].trim()); if (v) el.setAttribute(p[0].trim(), v);
      });
    });
    document.title = t('meta.title');
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.description'));
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    renderBrand();
    $$('[data-count]').forEach(function (el) { if (el._done !== false) renderCount(el, +el.getAttribute('data-count')); });
    try { localStorage.setItem('cameleon-lang', lang); } catch (e) {}
  }

  // Mobile menu
  var nav = $('.nav');
  var toggle = $('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.nav__links a', nav).forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('data-lang') === lang) return;
      applyLang(b.getAttribute('data-lang'));
      if (motion) M.animate('main', { opacity: [0.4, 1] }, { duration: 0.35, ease: 'easeOut' });
    });
  });

  // Brand studio: previews the visitor's brand on the product photos. Runs in the browser only, nothing is sent anywhere.
  var TEES = ['black', 'charcoal', 'heather', 'ecru', 'mint'];
  var INKS = { mint: '#aeff6e', white: '#fbfbf3', camo: '#2f2e0c' };
  var state = { brand: '', tee: 'black', ink: 'mint', touched: false };
  var input = $('#brandInput');
  var company = $('#quoteForm [name="company"]');
  var autoCompany = '';

  function brandText() { return state.brand.trim() || t('brand.default'); }
  function describe() {
    var tee = t('tee.' + state.tee), ink = t('ink.' + state.ink);
    return fill(t('describe'), { tee: tee, ink: ink, Ink: cap(ink), a: /^[aeiou]/.test(tee) ? 'an' : 'a' });
  }
  function teeAlt(name) { var tee = t('tee.' + name); return fill(t('studio.teeAlt'), { tee: tee, Tee: cap(tee) }); }

  function renderBrand() {
    var text = brandText();
    $$('[data-brand]').forEach(function (el) { el.textContent = text; el.style.setProperty('--len', Math.max(text.length, 6)); });
    $$('[data-brand-svg]').forEach(function (el) {
      el.textContent = text;
      if (text.length > 11) { el.setAttribute('textLength', '150'); el.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      else { el.removeAttribute('textLength'); el.removeAttribute('lengthAdjust'); }
    });
    var d = $('[data-preview-desc]');
    if (d) d.textContent = describe();
    var current = $('.studio__img.is-current');
    if (current) current.alt = teeAlt(state.tee);
  }

  function pulse() {
    if (motion) M.animate('.print, .screen b, .preview-card b', { scale: [0.94, 1], opacity: [0.55, 1] }, { duration: 0.35, ease: ease });
  }

  // Tee colour: cross-fade between two stacked photos. Rapid clicks queue up and only the last choice is shown.
  var teeImgs = $$('.studio__img');
  var swapping = false;
  var queued = null;
  function setTee(name) {
    if (swapping) { queued = name; return; }
    var cur = teeImgs.filter(function (i) { return i.classList.contains('is-current'); })[0];
    var next = teeImgs.filter(function (i) { return i !== cur; })[0];
    var src = 'img/tee-' + name + '.webp';
    if (!cur || cur.getAttribute('src') === src) return;
    swapping = true;
    next.src = src;
    var preview = $('[data-preview-img]');
    if (preview) preview.src = src;
    var finish = function () {
      next.classList.add('is-current'); cur.classList.remove('is-current');
      next.style.zIndex = ''; next.style.opacity = '';
      next.alt = teeAlt(name); next.removeAttribute('aria-hidden');
      cur.alt = ''; cur.setAttribute('aria-hidden', 'true');
      swapping = false;
      if (queued && queued !== name) { var q = queued; queued = null; setTee(q); } else { queued = null; }
    };
    (next.decode ? next.decode() : Promise.resolve()).catch(function () {}).then(function () {
      if (!motion) return finish();
      next.style.zIndex = 2;
      M.animate(next, { opacity: [0, 1] }, { duration: 0.45, ease: 'easeOut' }).then(finish);
    });
  }

  var preloaded = false;
  function preloadTees() {
    if (preloaded) return;
    preloaded = true;
    TEES.forEach(function (n) { var i = new Image(); i.src = 'img/tee-' + n + '.webp'; });
  }
  var studio = $('.studio');
  if (studio) {
    studio.addEventListener('pointerenter', preloadTees);
    studio.addEventListener('focusin', preloadTees);
  }

  if (input) {
    input.addEventListener('input', function () {
      state.brand = input.value; state.touched = true;
      renderBrand(); pulse();
      // Carry the brand into the quote form, unless the visitor typed their own company name there
      if (company && (company.value === '' || company.value === autoCompany)) { company.value = state.brand.trim(); autoCompany = company.value; }
    });
  }
  $$('.swatches input').forEach(function (radio) {
    radio.addEventListener('change', function () {
      state.touched = true;
      if (radio.name === 'tee') { state.tee = radio.value; setTee(radio.value); }
      if (radio.name === 'ink') { state.ink = radio.value; root.style.setProperty('--print-ink', INKS[radio.value]); pulse(); }
      renderBrand();
    });
  });

  // Quote form: concept only. Opens a pre-filled email with no recipient until Caméléon has its own inbox.
  var form = document.getElementById('quoteForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var sep = t('mail.sep');
      var lines = [
        t('mail.product') + sep + d.get('product'),
        t('mail.qty') + sep + d.get('qty'),
        t('mail.name') + sep + d.get('name'),
        t('mail.company') + sep + (d.get('company') || '-'),
        t('mail.email') + sep + d.get('email'),
        t('mail.date') + sep + (d.get('date') || '-')
      ];
      if (state.touched) lines.push(t('mail.preview') + sep + '"' + brandText() + '", ' + describe().toLowerCase());
      lines.push('', d.get('notes') || '');
      var subject = fill(t('mail.subject'), { product: d.get('product'), qty: d.get('qty') });
      window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      form.classList.add('is-sent');
    });
  }

  // Count-up numbers read their prefix/suffix at render time, so a language switch re-renders them correctly
  function renderCount(el, v) {
    el.textContent = (el.getAttribute('data-prefix') || '') + Math.round(v) + (el.getAttribute('data-suffix') || '');
  }

  applyLang(storedLang() || 'fr');
  if (motion) initMotion();
  root.classList.remove('motion-pending');

  function initMotion() {
    // Hide what will animate in, then let the stylesheet's pending state go
    var heroParts = $$('[data-hero], .studio__main, .float, .studio__controls');
    var reveal = $$('[data-reveal]');
    var groups = $$('[data-stagger]');
    var eco = $$('.eco-badge, .eco-drive');
    if (!late) heroParts.forEach(function (el) { el.style.opacity = '0'; });
    reveal.concat(eco).forEach(function (el) { el.style.opacity = '0'; });
    groups.forEach(function (g) { Array.prototype.slice.call(g.children).forEach(function (k) { k.style.opacity = '0'; }); });

    // Hero entrance
    if (!late) {
      M.animate($$('[data-hero]'), { opacity: [0, 1], y: [26, 0] }, { duration: 0.9, delay: M.stagger(0.08), ease: ease });
      M.animate('.studio__main', { opacity: [0, 1], scale: [0.94, 1] }, { duration: 1.1, delay: 0.15, ease: ease });
      M.animate($$('.float'), { opacity: [0, 1], y: [46, 0] }, { duration: 0.9, delay: M.stagger(0.14, { startDelay: 0.45 }), ease: pop });
      M.animate('.studio__controls', { opacity: [0, 1], y: [18, 0] }, { duration: 0.8, delay: 0.6, ease: ease });
    }
    // Idle bob on the small product cards; rotation lives in the keyframes so the CSS tilt is kept
    M.animate('.mini--usb', { y: [0, -9, 0], rotate: [4, 2.5, 4] }, { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.4 });
    M.animate('.mini--tote', { y: [0, 8, 0], rotate: [-5, -3.5, -5] }, { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.6 });

    // Count-up numbers
    $$('[data-count]').forEach(function (el) {
      var to = +el.getAttribute('data-count');
      el._done = false;
      renderCount(el, 0);
      M.inView(el, function () {
        M.animate(0, to, { duration: 1.4, ease: ease, onUpdate: function (v) { renderCount(el, v); } }).then(function () { el._done = true; renderCount(el, to); });
      }, { amount: 0.6 });
    });

    // Scroll reveals
    M.inView(reveal, function (el) {
      M.animate(el, { opacity: [0, 1], y: [30, 0] }, { duration: 0.9, ease: ease }).then(function () { el.style.transform = ''; });
    }, { amount: 0.15 });
    groups.forEach(function (g) {
      var kids = Array.prototype.slice.call(g.children);
      M.inView(g, function () {
        // Clear the transform afterwards so the cards' CSS hover lift works again
        M.animate(kids, { opacity: [0, 1], y: [36, 0] }, { duration: 0.85, delay: M.stagger(0.09), ease: ease })
          .then(function () { kids.forEach(function (k) { k.style.transform = ''; }); });
      }, { amount: 0.1 });
    });
    M.inView('.feature__art', function (art) {
      M.animate($$('.eco-drive', art), { opacity: [0, 1], x: [-40, 0], rotate: [-8, 0] }, { duration: 1, delay: 0.1, ease: ease });
      M.animate($$('.eco-badge', art), { opacity: [0, 1], scale: [0.8, 1] }, { duration: 0.6, delay: M.stagger(0.12, { startDelay: 0.3 }), ease: pop });
    }, { amount: 0.3 });

    // Scroll-linked: reading progress, eco photo parallax, the process line filling as you pass the steps
    var bar = $('.progress');
    if (bar) M.scroll(M.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
    $$('[data-parallax]').forEach(function (img) {
      M.scroll(M.animate(img, { y: ['-6%', '6%'] }, { ease: 'linear' }), { target: img.parentElement, offset: ['start end', 'end start'] });
    });
    var line = $('.steps__line i');
    var steps = $('.steps');
    if (line && steps) M.scroll(M.animate(line, { scaleX: [0, 1] }, { ease: 'linear' }), { target: steps, offset: ['start 85%', 'end 60%'] });

    // Use-case marquee: duplicate the chips once and loop, pausing on hover
    var mq = $('.marquee');
    var track = $('.marquee__track');
    if (mq && track) {
      Array.prototype.slice.call(track.children).forEach(function (c) {
        var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); track.appendChild(k);
      });
      mq.classList.add('is-animated');
      var loop = M.animate(track, { x: ['0%', '-50%'] }, { duration: 45, repeat: Infinity, ease: 'linear' });
      mq.addEventListener('mouseenter', function () { loop.pause(); });
      mq.addEventListener('mouseleave', function () { loop.play(); });
    }

    // Tilt the preview card towards the pointer (mouse and trackpad only)
    var card = $('.studio__main');
    var stage = $('.studio__stage');
    if (card && stage && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        M.animate(card, { rotateY: dx * 8, rotateX: -dy * 8 }, { type: 'spring', stiffness: 160, damping: 20 });
      });
      stage.addEventListener('pointerleave', function () {
        M.animate(card, { rotateY: 0, rotateX: 0 }, { type: 'spring', stiffness: 120, damping: 16 });
      });
    }
  }
})();
