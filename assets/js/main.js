/* Lun’Aphrodite Piercing — animations (GSAP + ScrollTrigger + Lenis) et réservation sans back-end */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;

  var CFG = {
    phone: '+33667946425',
    email: 'lunaphrodite.piercing@gmail.com',
    // jour (getDay) -> [ouverture, fermeture] en minutes
    open: { 2: [810, 1080], 3: [810, 1080], 4: [810, 1080], 5: [810, 1080], 6: [780, 1080] }
  };
  var DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var lenis = null;
  var loaderGone = false;

  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[init ' + name + ']', e); } }
  function hm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + 'h' + String(m % 60).padStart(2, '0'); }

  function killLoader() {
    if (loaderGone) return; loaderGone = true;
    var l = $('#loader'), i = $('#iris');
    if (l) l.remove(); if (i) i.remove();
    if (lenis) lenis.start();
    root.classList.remove('is-loading');
  }

  /* Sans GSAP : on affiche le site tel quel */
  if (!G || !ST) { killLoader(); initBooking(); initMisc(); return; }
  G.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  var safety = setTimeout(killLoader, 9000);

  /* ---------- Split text (masques) ---------- */
  function splitText(el, mode, opts) {
    opts = opts || {};
    if (el.dataset.splitDone) return $$('.sp', el);
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    if (opts.hide !== false) el.setAttribute('aria-label', label);
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            if (opts.hide !== false) w.setAttribute('aria-hidden', 'true');
            if (mode === 'chars') {
              Array.from(tok).forEach(function (ch) {
                var c = document.createElement('span'); c.className = 'c';
                var i = document.createElement('span'); i.className = 'sp'; i.textContent = ch;
                c.appendChild(i); w.appendChild(c);
              });
            } else {
              var s = document.createElement('span'); s.className = 'sp'; s.textContent = tok; w.appendChild(s);
            }
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    el.dataset.splitDone = '1';
    return $$('.sp', el);
  }

  /* ---------- Smooth scroll ---------- */
  safe('lenis', function () {
    if (reduce || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    lenis.stop();
  });

  /* ---------- Navigation ---------- */
  var nav = $('#nav'), lastY = 0, menuOpen = false;
  function onScrollY(y) {
    nav.classList.toggle('is-solid', y > 40);
    if (!menuOpen) {
      if (y > lastY + 2 && y > 220) nav.classList.add('is-hidden');
      else if (y < lastY - 3 || y < 120) nav.classList.remove('is-hidden');
    }
    lastY = y;
  }
  if (lenis) lenis.on('scroll', function (e) { onScrollY(e.scroll); });
  else window.addEventListener('scroll', function () { onScrollY(window.scrollY); }, { passive: true });

  function scrollToEl(target, offset) {
    if (target === undefined || target === null) return;
    offset = offset || 0;
    if (lenis) lenis.scrollTo(target, { offset: offset, duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* Menu plein écran */
  var menu = $('#menu'), burger = $('#burger');
  function menuGeom() { var x = window.innerWidth - 44; return { x: x, R: Math.hypot(window.innerWidth, window.innerHeight) * 1.15 }; }
  function openMenu() {
    menuOpen = true; var g = menuGeom();
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
    menu.classList.add('is-open'); menu.removeAttribute('inert'); nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    G.killTweensOf(menu);
    G.fromTo(menu, { clipPath: 'circle(0px at ' + g.x + 'px 38px)' }, { clipPath: 'circle(' + g.R + 'px at ' + g.x + 'px 38px)', duration: reduce ? 0.01 : 1, ease: 'expo.inOut' });
    G.fromTo($$('.menu__nav a span'), { yPercent: 105 }, { yPercent: 0, duration: reduce ? 0.01 : 0.9, stagger: 0.06, delay: reduce ? 0 : 0.35, ease: 'power4.out' });
    var f = $('.menu__nav a'); if (f) setTimeout(function () { f.focus(); }, 50);
  }
  function closeMenu(cb) {
    if (!menuOpen) { if (cb) cb(); return; }
    menuOpen = false; var g = menuGeom();
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
    G.to(menu, { clipPath: 'circle(0px at ' + g.x + 'px 38px)', duration: reduce ? 0.01 : 0.8, ease: 'expo.inOut', onComplete: function () {
      menu.classList.remove('is-open'); menu.setAttribute('inert', ''); if (lenis) lenis.start(); if (cb) cb();
    } });
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { closeMenu(); burger.focus(); } });
  window.addEventListener('resize', function () { if (menuOpen && window.innerWidth > 1100) closeMenu(); });

  /* Ancres */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var t = $(id); if (!t) return;
      e.preventDefault();
      closeMenu(function () { scrollToEl(id === '#accueil' ? 0 : t); });
    });
  });

  /* ---------- Marquee réactif au scroll ---------- */
  safe('marquee', function () {
    var el = $('[data-marquee]'); if (!el || reduce) return;
    var track = $('.marq__track', el), item = $('.marq__item', track);
    var x = 0, dir = -1, vel = 0, prev = window.scrollY;
    G.ticker.add(function () {
      var y = window.scrollY, dy = y - prev; prev = y;
      vel += (dy - vel) * 0.12;
      if (Math.abs(dy) > 0.5) dir = dy > 0 ? -1 : 1;
      var speed = 1.1 + Math.min(Math.abs(vel) * 0.45, 22);
      x += dir * speed * G.ticker.deltaRatio(60) * 0.9;
      var w = item.offsetWidth;
      if (x <= -w) x += w; else if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
  });

  /* ---------- Hero : intro, parallaxe ---------- */
  var heroSp = [];
  safe('hero-prep', function () {
    heroSp = $$('.hero [data-split]').reduce(function (a, el) { return a.concat(splitText(el, 'chars')); }, []);
    if (!reduce) {
      G.set(heroSp, { yPercent: 118 });
      G.set($$('[data-hero-in]'), { autoAlpha: 0, y: 30 });
      G.set('[data-hero-media]', { scale: 1.2 });
      G.set(['[data-hero-moon]', '[data-hero-rings]'], { autoAlpha: 0 });
    }
    var v = $('.hero__video');
    if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });

  safe('hero-parallax', function () {
    if (reduce) return;
    var st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    G.to('[data-hero-media]', { yPercent: 14, ease: 'none', scrollTrigger: st });
    G.to('[data-hero-moon]', { yPercent: -80, ease: 'none', scrollTrigger: st });
    G.to('.hero .ring-a', { rotation: 50, yPercent: -22, ease: 'none', scrollTrigger: st });
    G.to('.hero .ring-b', { rotation: -70, yPercent: -40, ease: 'none', scrollTrigger: st });
    G.to('[data-hero-content]', { yPercent: -14, ease: 'none', scrollTrigger: st });
    G.to('.hero__shade', { opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: '60% top', end: 'bottom top', scrub: true } });
    if (fine) {
      var mps = $$('.hero .mp');
      window.addEventListener('pointermove', function (e) {
        if (window.scrollY > window.innerHeight) return;
        var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        mps.forEach(function (m) { var d = +m.dataset.depth || 1; G.to(m, { x: -nx * d * 34, y: -ny * d * 34, duration: 1.4, ease: 'power3.out', overwrite: 'auto' }); });
      }, { passive: true });
    }
  });

  /* ---------- Sections épinglées / défilement horizontal ---------- */
  var mm = G.matchMedia();

  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var steps = $$('.step'), imgs = $$('.story__img'), ring = $('.story__ring .prog');
    if (!steps.length) return;
    G.set(steps.slice(1), { autoAlpha: 0, y: 50 });
    G.set(imgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
    var tl = G.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: '.story__pin', start: 'top top', end: '+=' + (steps.length * 90) + '%', pin: true, scrub: 0.7, anticipatePin: 1 } });
    steps.forEach(function (s, i) {
      if (!i) return;
      tl.to(steps[i - 1], { autoAlpha: 0, y: -50, duration: 0.5 }, i - 0.15)
        .to(s, { autoAlpha: 1, y: 0, duration: 0.6 }, i + 0.05)
        .fromTo(imgs[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 }, i - 0.2)
        .fromTo($('img', imgs[i]), { scale: 1.3 }, { scale: 1, duration: 1 }, i - 0.2);
    });
    tl.fromTo($('img', imgs[0]), { scale: 1.12 }, { scale: 1, duration: 1.2, ease: 'none' }, 0);
    tl.to(ring, { strokeDashoffset: 0, ease: 'none', duration: steps.length - 1 }, 0);
    tl.to({}, { duration: 0.5 });
  });

  mm.add('(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)', function () {
    var sec = $('[data-hscroll]'), track = $('.hscroll__track', sec);
    if (!sec || !track) return;
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var panels = $$('.panel', track), shown = [];
    G.set(panels.slice(1), { y: 70, autoAlpha: 0 });
    var reveal = function (self) {
      var x = -dist() * (self && self.progress ? self.progress : 0);
      panels.forEach(function (p, i) {
        if (shown[i] || !i) return;
        if (p.offsetLeft + x < window.innerWidth * 0.94) { shown[i] = true; G.to(p, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', overwrite: 'auto' }); }
      });
    };
    G.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: reveal, onRefresh: reveal } });
    G.fromTo($('.hscroll__bar i', sec), { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: true, invalidateOnRefresh: true } });
    return function () { panels.forEach(function (p) { G.set(p, { clearProps: 'opacity,visibility,transform' }); }); };
  });

  /* Cartes empilées (guests) */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var cards = $$('.gcard');
    cards.forEach(function (c, i) {
      if (i === cards.length - 1) return;
      G.to(c, { scale: 0.93, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 85%', end: 'top 30%', scrub: true } });
    });
  });

  /* ---------- Révélations génériques ---------- */
  safe('reveals', function () {
    $$('[data-split]').forEach(function (el) {
      if (el.closest('.hero')) return;
      var sp = splitText(el, 'words');
      if (reduce) return;
      G.set(sp, { yPercent: 112 });
      G.to(sp, { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-reveal]').forEach(function (el) {
      if (reduce) return;
      G.fromTo(el, { y: 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-mask]').forEach(function (el) {
      if (reduce) return;
      var circle = el.dataset.mask === 'circle';
      G.fromTo(el, { clipPath: circle ? 'circle(0% at 50% 60%)' : 'inset(0% 0% 100% 0%)' }, { clipPath: circle ? 'circle(78% at 50% 60%)' : 'inset(0% 0% 0% 0%)', duration: circle ? 1.7 : 1.3, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
    $$('[data-parallax]').forEach(function (f) {
      if (reduce) return;
      var img = $('img', f); if (!img) return;
      G.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-parallax-y]').forEach(function (f) {
      if (reduce) return;
      var v = +f.dataset.parallaxY;
      G.fromTo(f, { yPercent: -v / 2 * 3 }, { yPercent: v / 2 * 3, ease: 'none', scrollTrigger: { trigger: f.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* texte qui s'allume mot à mot */
    $$('[data-scrub-words], [data-scrub]').forEach(function (el) {
      var sp = splitText(el, 'words', { hide: false });
      if (reduce) return;
      var big = el.hasAttribute('data-scrub-words');
      G.fromTo(sp, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: el, start: big ? 'top 72%' : 'top 86%', end: big ? 'bottom 45%' : 'bottom 62%', scrub: true } });
    });
    /* grand nom du footer */
    $$('.foot__big span').forEach(function (s, i) {
      if (reduce) return;
      G.fromTo(s, { yPercent: 40 + i * 14 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'top 25%', scrub: true } });
    });
  });

  /* ---------- Chiffres animés ---------- */
  safe('stats', function () {
    $$('.stat').forEach(function (st) {
      var ring = $('circle', st), n = $('[data-count]', st);
      var to = parseFloat(n.dataset.count), dec = +(n.dataset.dec || 0);
      if (reduce) { G.set(ring, { strokeDashoffset: 0 }); n.textContent = to.toFixed(dec).replace('.', ','); return; }
      n.textContent = (0).toFixed(dec).replace('.', ',');
      ST.create({ trigger: st, start: 'top 86%', once: true, onEnter: function () {
        G.to(ring, { strokeDashoffset: 0, duration: 2.6, ease: 'power3.inOut' });
        var o = { v: 0 };
        G.to(o, { v: to, duration: 2.4, ease: 'power3.out', onUpdate: function () { n.textContent = o.v.toFixed(dec).replace('.', ','); } });
      } });
    });
  });

  /* ---------- Micro-interactions ---------- */
  safe('cursor', function () {
    if (!fine || reduce) return;
    var c = $('.cursor');
    var xTo = G.quickTo(c, 'x', { duration: 0.55, ease: 'power3' }), yTo = G.quickTo(c, 'y', { duration: 0.55, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); c.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerover', function (e) { c.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a,button,.tilt,input,textarea,label,[data-lb]'))); });
    document.documentElement.addEventListener('mouseleave', function () { c.classList.remove('is-on'); });
  });

  safe('magnetic', function () {
    if (!fine || reduce) return;
    $$('.magnetic').forEach(function (el) {
      var xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32); yTo((e.clientY - (r.top + r.height / 2)) * 0.42);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  });

  safe('tilt', function () {
    if (!fine || reduce) return;
    $$('.tilt').forEach(function (card) {
      G.set(card, { transformPerspective: 1000 });
      var rx = G.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' }), ry = G.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 9); rx((0.5 - py) * 9);
        card.style.setProperty('--mx', (px * 100) + '%'); card.style.setProperty('--my', (py * 100) + '%');
        var a = $('a', card); if (a) { a.style.setProperty('--mx', (px * 100) + '%'); a.style.setProperty('--my', (py * 100) + '%'); }
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  });

  /* ---------- Intro (loader) ---------- */
  function runIntro() {
    var loader = $('#loader'), iris = $('#iris'), nameEl = $('#loaderName'), cnt = $('#loaderCount'), path = $('.loader__inf path');
    if (!loader) { killLoader(); return; }
    var finish = function () { clearTimeout(safety); killLoader(); ST.refresh(); };

    if (reduce) {
      G.to(loader, { autoAlpha: 0, duration: 0.4, onComplete: finish });
      return;
    }
    var nameSp = splitText(nameEl, 'chars');
    G.set(nameSp, { yPercent: 115 });
    var D = Math.hypot(window.innerWidth, window.innerHeight) * 1.05;
    var tl = G.timeline();
    tl.to(path, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 0)
      .to(nameSp, { yPercent: 0, duration: 0.9, stagger: 0.045, ease: 'power4.out' }, 0.35)
      .to({ v: 0 }, { v: 100, duration: 2, ease: 'power2.inOut', onUpdate: function () { cnt.textContent = String(Math.round(this.targets()[0].v)).padStart(3, '0'); } }, 0)
      .to('.loader__inner', { autoAlpha: 0, scale: 1.05, duration: 0.55, ease: 'power2.in' }, 2.15)
      .add(function () { loader.classList.add('is-open'); iris.classList.add('is-on'); }, 2.6)
      .to(iris, { width: D, height: D, duration: 1.7, ease: 'expo.inOut' }, 2.6)
      .to('[data-hero-media]', { scale: 1, duration: 2.8, ease: 'power3.out' }, 2.9)
      .to(['[data-hero-moon]', '[data-hero-rings]'], { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 3.3)
      .to(heroSp, { yPercent: 0, duration: 1.4, stagger: 0.055, ease: 'power4.out' }, 3.4)
      .to($$('[data-hero-in]'), { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 3.9)
      .add(finish, 4.35);
  }

  /* ---------- Démarrage ---------- */
  function start() {
    ST.sort();
    runIntro();
  }
  window.addEventListener('load', function () { ST.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  if (document.readyState === 'complete') start(); else window.addEventListener('DOMContentLoaded', start);

  /* =========================================================
     Modules sans dépendance GSAP : réservation, avis, FAQ…
     ========================================================= */
  initBooking();
  initMisc();

  function initMisc() {
    /* FAQ */
    $$('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', !open);
      });
    });

    /* Anodisation */
    var demo = $('#demo');
    if (demo) {
      var rgba = function (hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
      $$('.swb').forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.swb').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
          demo.style.setProperty('--ano', b.dataset.c); demo.style.setProperty('--ano2', b.dataset.c2); demo.style.setProperty('--glow', rgba(b.dataset.c, 0.22));
          $('#demoName').textContent = b.dataset.n;
          $('#demoPrice').textContent = b.dataset.p === 'inclus' ? 'inclus dans le tarif' : b.dataset.p + ' sur le bijou basique';
        });
      });
    }

    /* Statut & horaires (heure de Paris) */
    function updateStatus() {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      var min = (+get('hour')) * 60 + (+get('minute'));
      var el = $('#status'); if (!el) return;
      var o = CFG.open[wd], txt;
      if (o && min >= o[0] && min < o[1]) { el.classList.add('is-open'); txt = 'Ouvert · sur rendez-vous · jusqu’à ' + hm(o[1]); }
      else {
        el.classList.remove('is-open'); txt = 'Fermé';
        for (var i = 0; i < 8; i++) {
          var d = (wd + i) % 7, o2 = CFG.open[d];
          if (o2 && (i > 0 || min < o2[0])) { txt = 'Fermé · réouvre ' + (i === 0 ? 'aujourd’hui' : i === 1 ? 'demain' : DAYS_FR[d]) + ' à ' + hm(o2[0]); break; }
        }
      }
      $('span', el).textContent = txt;
      $$('.hours tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.dataset.day === wd); });
    }
    updateStatus(); setInterval(updateStatus, 60000);

    /* Lightbox */
    var links = $$('[data-lb]'), lb = $('#lb');
    if (links.length && lb) {
      var li = 0, lastFocus = null, img = $('#lbImg'), cap = $('#lbCap');
      var show = function (i) { li = (i + links.length) % links.length; var a = links[li]; img.src = a.getAttribute('href'); img.alt = $('img', a).alt; cap.textContent = a.dataset.cap || ''; };
      var open = function (i) { lastFocus = document.activeElement; show(i); lb.hidden = false; if (lenis) lenis.stop(); $('#lbX').focus(); };
      var close = function () { lb.hidden = true; if (lenis && !menuOpen) lenis.start(); if (lastFocus) lastFocus.focus(); };
      links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(i); }); });
      $('#lbX').addEventListener('click', close);
      $('#lbP').addEventListener('click', function () { show(li - 1); });
      $('#lbN').addEventListener('click', function () { show(li + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
      document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(li - 1); else if (e.key === 'ArrowRight') show(li + 1);
      });
    }

    /* Éléments flottants (FAB mobile + panier) */
    var fab = $('#fab'), basketEl = $('#basket'), pastHero = false, inResa = false;
    var upd = function () {
      if (fab) fab.classList.toggle('is-away', !pastHero || inResa);
      if (basketEl) basketEl.classList.toggle('is-away', inResa);
    };
    if (fab) fab.classList.add('is-away');
    if (ST) {
      ST.create({ trigger: '.hero', start: 'bottom 70%', onEnter: function () { pastHero = true; upd(); }, onLeaveBack: function () { pastHero = false; upd(); } });
      ST.create({ trigger: '.resa', start: 'top 65%', end: 'bottom top', onToggle: function (s) { inResa = s.isActive; upd(); } });
    } else { pastHero = true; upd(); }

    /* Avis (carrousel) */
    initReviews();
  }

  function initReviews() {
    var slides = $$('.rv__slide'); if (!slides.length) return;
    var i = 0, busy = false, auto = null;
    var idx = $('#rvIdx'), prog = $('.rv__prog circle'), rv = $('#rv');
    var words = slides.map(function (s) { return splitText($('blockquote p', s), 'words', { hide: false }); });
    var pad = function (n) { return String(n + 1).padStart(2, '0'); };

    function restart() {
      if (!G || reduce) return;
      if (auto) auto.kill();
      auto = G.fromTo(prog, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 8, ease: 'none', onComplete: function () { go(i + 1); } });
      if (ST) { var vis = ST.isInViewport ? ST.isInViewport(rv, 0.2) : true; if (!vis) auto.pause(); }
    }
    function go(n) {
      n = (n + slides.length) % slides.length;
      if (n === i || busy) return;
      var cur = slides[i], nxt = slides[n], dir = (n > i || (i === slides.length - 1 && n === 0)) ? 1 : -1;
      idx.textContent = pad(n);
      if (!G || reduce) { cur.classList.remove('is-active'); nxt.classList.add('is-active'); i = n; return; }
      busy = true;
      nxt.classList.add('is-active');
      var extra = $$('.rv__stars, footer', nxt);
      G.set(nxt, { autoAlpha: 1 }); G.set(words[n], { yPercent: 112 }); G.set(extra, { autoAlpha: 0, y: 16 });
      G.timeline({ onComplete: function () { cur.classList.remove('is-active'); G.set(cur, { clearProps: 'all' }); i = n; busy = false; } })
        .to(cur, { autoAlpha: 0, x: -40 * dir, duration: 0.5, ease: 'power2.in' })
        .to(words[n], { yPercent: 0, duration: 0.95, ease: 'power4.out', stagger: 0.012 }, 0.35)
        .to(extra, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 }, 0.5);
      restart();
    }
    $('#rvPrev').addEventListener('click', function () { go(i - 1); });
    $('#rvNext').addEventListener('click', function () { go(i + 1); });
    var sx = null;
    rv.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    rv.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1); });
    rv.addEventListener('pointercancel', function () { sx = null; });
    rv.addEventListener('mouseenter', function () { if (auto) auto.pause(); });
    rv.addEventListener('mouseleave', function () { if (auto) auto.play(); });
    document.addEventListener('keydown', function (e) { if (e.target && e.target.closest && e.target.closest('#rv')) { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); } });
    if (G && ST && !reduce) {
      restart();
      ST.create({ trigger: rv, start: 'top 90%', end: 'bottom 10%', onToggle: function (s) { if (auto) s.isActive ? auto.play() : auto.pause(); } });
    }
  }

  /* =========================================================
     Réservation : message prérempli (SMS / Instagram / e-mail) + .ics
     Aucun serveur, aucun service tiers.
     ========================================================= */
  function initBooking() {
    var form = $('#book'); if (!form) return;
    var rows = $$('.row[data-id]');
    var byId = {};
    rows.forEach(function (r) {
      var n = r.querySelector('.row__n').cloneNode(true);
      $$('small', n).forEach(function (s) { s.remove(); });
      byId[r.dataset.id] = { id: r.dataset.id, name: n.textContent.replace(/\s+/g, ' ').trim(), price: +r.dataset.price, zone: r.closest('.panel').dataset.zone, row: r };
    });
    var basket = {}; // id -> service
    var count = function () { return Object.keys(basket).length; };
    var total = function () { return Object.keys(basket).reduce(function (a, k) { return a + basket[k].price; }, 0); };

    var toastEl = $('#toast'), toastT;
    function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600); }

    /* panier */
    var activeZone = 'Oreille';
    var chipsEl = $('#chips');
    function toggle(id) { if (basket[id]) delete basket[id]; else basket[id] = byId[id]; sync(); }
    function renderChips() {
      chipsEl.innerHTML = '';
      Object.keys(byId).filter(function (k) { return byId[k].zone === activeZone; }).forEach(function (k) {
        var s = byId[k], b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.dataset.id = k; b.setAttribute('aria-pressed', basket[k] ? 'true' : 'false');
        b.innerHTML = '<span></span><small>' + s.price + ' €</small>'; b.firstChild.textContent = s.name;
        b.addEventListener('click', function () { toggle(k); });
        chipsEl.appendChild(b);
      });
    }
    function sync() {
      rows.forEach(function (r) {
        var on = !!basket[r.dataset.id], b = $('.row__add', r);
        r.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $$('.chip', chipsEl).forEach(function (c) { c.setAttribute('aria-pressed', basket[c.dataset.id] ? 'true' : 'false'); });
      ['Oreille', 'Visage', 'Corps', 'Divers'].forEach(function (z) {
        var n = Object.keys(basket).filter(function (k) { return basket[k].zone === z; }).length;
        var e = $('[data-zc="' + z + '"]'); if (e) e.textContent = n ? '(' + n + ')' : '';
      });
      var n = count(), s1 = $('#sum1');
      s1.innerHTML = n ? '<b>' + n + ' sélection' + (n > 1 ? 's' : '') + ' · ' + total() + ' €</b> <span>avant remises et hors bijou de la vitrine</span>' : 'Aucune sélection pour le moment.';
      var bk = $('#basket');
      if (bk) { bk.hidden = !n; $('#basketTxt').textContent = n + ' perçage' + (n > 1 ? 's' : '') + ' · ' + total() + ' €'; }
      if (step === 4) fillStep4();
    }
    rows.forEach(function (r) { $('.row__add', r).addEventListener('click', function () { toggle(r.dataset.id); }); });
    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-selected', 'false'); });
        t.classList.add('is-on'); t.setAttribute('aria-selected', 'true'); activeZone = t.dataset.zone; renderChips();
      });
    });
    $('#undecided').addEventListener('change', function () { if (step === 4) fillStep4(); });

    /* jours / heures */
    var sel = { day: null, time: null };
    var fmtLong = function (d) { return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
    var daysEl = $('#days'), timesEl = $('#times');
    (function buildDays() {
      var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
      var out = [];
      while (out.length < 18) { if (CFG.open[d.getDay()]) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
      out.forEach(function (day) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'day'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.setAttribute('aria-label', fmtLong(day));
        b.innerHTML = '<span>' + day.toLocaleDateString('fr-FR', { weekday: 'short' }) + '</span><b>' + day.getDate() + '</b><small>' + day.toLocaleDateString('fr-FR', { month: 'short' }) + '</small>';
        b.addEventListener('click', function () {
          sel.day = day; sel.time = null;
          $$('.day', daysEl).forEach(function (o) { o.setAttribute('aria-checked', 'false'); });
          b.setAttribute('aria-checked', 'true'); renderTimes(day);
        });
        daysEl.appendChild(b);
      });
    })();
    function renderTimes(day) {
      var o = CFG.open[day.getDay()]; timesEl.innerHTML = '';
      for (var m = o[0]; m <= o[1] - 60; m += 30) {
        (function (mm_) {
          var b = document.createElement('button'), label = hm(mm_);
          b.type = 'button'; b.className = 'time'; b.textContent = label; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
          b.addEventListener('click', function () { sel.time = label; $$('.time', timesEl).forEach(function (x) { x.setAttribute('aria-checked', 'false'); }); b.setAttribute('aria-checked', 'true'); });
          timesEl.appendChild(b);
        })(m);
      }
    }

    /* message */
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    function buildMsg() {
      var items = Object.keys(basket).map(function (k) { return basket[k]; });
      var name = $('#fName').value.trim(), tel = $('#fTel').value.trim(), note = $('#fNote').value.trim();
      var age = $('input[name="age"]:checked').value;
      var L = ['Bonjour Léa,', '', 'Je souhaiterais prendre rendez-vous chez Lun’Aphrodite Piercing :'];
      L.push('• Perçage(s) : ' + (items.length ? items.map(function (s) { return s.name + ' (' + s.price + ' €)'; }).join(', ') : 'à définir avec vous'));
      if ($('#undecided').checked) L.push('• J’hésite : j’aimerais vos conseils.');
      L.push('• Créneau souhaité : ' + (sel.day ? fmtLong(sel.day) + (sel.time ? ' à ' + sel.time : '') : 'à convenir'));
      if (items.length) L.push('• Estimation : ' + total() + ' € (acte avec bijou simple en titane, hors bijou de la vitrine et remises)');
      L.push('• ' + age);
      L.push('• Prénom : ' + name);
      if (tel) L.push('• Téléphone : ' + tel);
      if (note) L.push('• Message : ' + note);
      L.push('', 'Merci beaucoup !', '(Demande envoyée depuis le site de Lun’Aphrodite Piercing)');
      return L.join('\n');
    }
    function copyText(t) {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
      return new Promise(function (ok, ko) {
        var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? ok() : ko(); } catch (e) { ko(e); } ta.remove();
      });
    }
    function icsText() {
      var d = sel.day, t = (sel.time || '15h00').split('h'), h = +t[0], mi = +t[1];
      var p = function (n) { return String(n).padStart(2, '0'); };
      var st = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi), en = new Date(st.getTime() + 3600000);
      var f = function (x) { return x.getFullYear() + p(x.getMonth() + 1) + p(x.getDate()) + 'T' + p(x.getHours()) + p(x.getMinutes()) + '00'; };
      var items = Object.keys(basket).map(function (k) { return basket[k].name; }).join(', ') || 'à définir';
      return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lun’Aphrodite Piercing//Demande de rendez-vous//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
        'UID:' + Date.now() + '@lunaphrodite-piercing', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
        'DTSTART:' + f(st), 'DTEND:' + f(en), 'SUMMARY:Piercing — Lun’Aphrodite (à confirmer)',
        'LOCATION:74 rue des Jardins Fleuris\\, 54340 Pompey', 'DESCRIPTION:Demande de rendez-vous à confirmer par Léa. Perçage(s) : ' + items + '. Tél. 06 67 94 64 25.',
        'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Rendez-vous piercing', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    }
    function fillStep4() {
      var items = Object.keys(basket).map(function (k) { return basket[k]; });
      var name = $('#fName').value.trim(), msg = buildMsg();
      var rc = $('#recap');
      var row = function (a, b) { return '<div><span>' + a + '</span><b>' + b + '</b></div>'; };
      var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      rc.innerHTML = row('Perçage(s)', items.length ? esc(items.map(function (s) { return s.name; }).join(', ')) : 'À définir avec Léa') +
        row('Créneau', sel.day ? esc(fmtLong(sel.day) + ' à ' + sel.time) : '—') +
        (items.length ? row('Estimation', total() + ' € <small>avant remises, hors bijou de la vitrine</small>') : '') +
        row('Vous', esc(name) + ' · ' + esc($('input[name="age"]:checked').value));
      var sms = msg.replace(/’/g, "'").replace(/•/g, '-');
      $('#sendSms').href = 'sms:' + CFG.phone + (ios ? '&' : '?') + 'body=' + encodeURIComponent(sms);
      $('#sendMail').href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Demande de rendez-vous — ' + name) + '&body=' + encodeURIComponent(msg);
      $('#dlIcs').disabled = !(sel.day && sel.time);
    }
    $('#sendIg').addEventListener('click', function () { copyText(buildMsg()).then(function () { toast('Message copié : collez-le dans la discussion Instagram.'); }, function () { toast('Copiez le message avec « Copier le message » puis collez-le sur Instagram.'); }); });
    $('#copyMsg').addEventListener('click', function () { copyText(buildMsg()).then(function () { toast('Message copié.'); }, function () { toast('Copie impossible : sélectionnez le texte manuellement.'); }); });
    $('#dlIcs').addEventListener('click', function () {
      if (!(sel.day && sel.time)) return;
      var blob = new Blob([icsText()], { type: 'text/calendar;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'rendez-vous-lunaphrodite.ics'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); toast('Événement ajouté à vos téléchargements.');
    });

    /* étapes */
    var step = 1, steps = $$('.bstep', form), dots = $$('.book__steps li', form), err = $('#bookErr');
    var prevB = $('#bPrev'), nextB = $('#bNext');
    function validate(n) {
      if (n === 1 && !count() && !$('#undecided').checked) return 'Choisissez au moins un perçage, ou cochez « J’hésite ».';
      if (n === 2 && !(sel.day && sel.time)) return 'Choisissez un jour puis une heure.';
      if (n === 3 && !$('#fName').value.trim()) return 'Indiquez votre prénom pour que Léa vous reconnaisse.';
      return '';
    }
    function go(n) {
      step = n;
      steps.forEach(function (s) { var on = +s.dataset.step === n; s.hidden = !on; s.classList.toggle('is-active', on); });
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i < n); });
      prevB.hidden = n === 1; nextB.hidden = n === 4;
      $('span', nextB).textContent = n === 3 ? 'Voir le récapitulatif' : 'Continuer';
      err.hidden = true;
      if (n === 4) fillStep4();
      var cur = steps[n - 1];
      if (G && !reduce) G.fromTo(cur, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' });
      var top = form.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * 0.4) scrollToEl(form, -100);
    }
    nextB.addEventListener('click', function () {
      var m = validate(step);
      if (m) { err.textContent = m; err.hidden = false; return; }
      go(step + 1);
    });
    prevB.addEventListener('click', function () { go(step - 1); });
    form.addEventListener('submit', function (e) { e.preventDefault(); if (step < 4) nextB.click(); });

    renderChips(); sync();
  }
})();
