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

  // Brand studio: previews the visitor's brand on the product photos. Runs in the browser only, nothing is sent anywhere.
  var TEES = { black: 'black', charcoal: 'charcoal', heather: 'heather grey', ecru: 'ecru', mint: 'mint' };
  var INKS = { mint: ['#aeff6e', 'Mint'], white: ['#fbfbf3', 'White'], camo: ['#2f2e0c', 'Camo'] };
  var state = { brand: '', tee: 'black', ink: 'mint', touched: false };
  var input = $('#brandInput');
  var company = $('#quoteForm [name="company"]');
  var autoCompany = '';

  function brandText() { return state.brand.trim() || 'YOUR LOGO'; }
  function describe() {
    var tee = TEES[state.tee];
    return INKS[state.ink][1] + ' ink on ' + (/^[aeiou]/.test(tee) ? 'an ' : 'a ') + tee + ' tee';
  }

  function renderBrand() {
    var t = brandText();
    $$('[data-brand]').forEach(function (el) { el.textContent = t; el.style.setProperty('--len', Math.max(t.length, 6)); });
    $$('[data-brand-svg]').forEach(function (el) {
      el.textContent = t;
      if (t.length > 11) { el.setAttribute('textLength', '150'); el.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      else { el.removeAttribute('textLength'); el.removeAttribute('lengthAdjust'); }
    });
    var desc = $('[data-preview-desc]');
    if (desc) desc.textContent = describe();
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
      next.alt = TEES[name].charAt(0).toUpperCase() + TEES[name].slice(1) + ' t-shirt on a hanger against grey brick, previewing your brand printed on the chest';
      next.removeAttribute('aria-hidden'); cur.alt = ''; cur.setAttribute('aria-hidden', 'true');
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
    Object.keys(TEES).forEach(function (n) { var i = new Image(); i.src = 'img/tee-' + n + '.webp'; });
  }
  var studio = $('#studio');
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
      if (radio.name === 'ink') { state.ink = radio.value; root.style.setProperty('--print-ink', INKS[radio.value][0]); pulse(); }
      renderBrand();
    });
  });

  // Quote form: concept only, opens a prefilled email
  var form = document.getElementById('quoteForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var lines = [
        'Product: ' + d.get('product'),
        'Quantity: ' + d.get('qty'),
        'Name: ' + d.get('name'),
        'Company: ' + (d.get('company') || '-'),
        'Email: ' + d.get('email'),
        'Need it by: ' + (d.get('date') || '-')
      ];
      if (state.touched) lines.push('Preview: "' + brandText() + '", ' + describe().toLowerCase());
      lines.push('', d.get('notes') || '');
      var subject = 'Quote request: ' + d.get('product') + ' x ' + d.get('qty');
      window.location.href = 'mailto:info@wearables.ca?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      form.classList.add('is-sent');
    });
  }

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
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      el.textContent = pre + '0' + suf;
      M.inView(el, function () {
        M.animate(0, to, { duration: 1.4, ease: ease, onUpdate: function (v) { el.textContent = pre + Math.round(v) + suf; } });
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
