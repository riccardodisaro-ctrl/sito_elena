(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  /* ---------- NAV: solid, hide on scroll down, show on scroll up ---------- */
  const nav = $('[data-nav]');
  const toggle = $('[data-toggle]');
  let lastY = scrollY;
  const isOpen = () => nav.classList.contains('nav--open');

  function onNavScroll(y) {
    nav.classList.toggle('nav--solid', y > 20);
    if (isOpen()) return;
    if (y > lastY + 4 && y > innerHeight * 0.6) nav.classList.add('nav--hide');
    else if (y < lastY - 4 || y < 80) nav.classList.remove('nav--hide');
    lastY = y;
  }

  function setMenu(open) {
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', () => setMenu(!isOpen()));
  $$('[data-mlink]').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) setMenu(false); });

  /* active section in the menu */
  const links = $$('[data-link]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => spy.observe(s));
  $('[data-hero]') && new IntersectionObserver(([e]) => {
    if (e.isIntersecting) links.forEach(l => l.classList.remove('is-active'));
  }, { rootMargin: '-45% 0px -50% 0px' }).observe($('[data-hero]'));

  /* ---------- REVEALS ---------- */
  $$('[data-title]').forEach(t => $$('.riga__in', t).forEach((r, i) => r.style.setProperty('--i', i)));
  $$('[data-traits] .trait').forEach((t, i) => {
    t.style.setProperty('--i', i);
    t.style.setProperty('--r', (Math.random() * 10 - 5).toFixed(1) + 'deg');
  });
  $$('[data-svc] .svc__item').forEach((t, i) => t.style.setProperty('--i', i));
  $$('[data-pains] .pain').forEach((t, i) => t.style.setProperty('--i', i));

  function reveal(el) {
    el.classList.add('is-in');
    if (el.hasAttribute('data-title')) {
      const n = $$('.riga', el).length;
      setTimeout(() => $$('.riga', el).forEach(r => r.classList.add('is-done')), reduce ? 0 : 1100 + n * 90);
    }
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });

  /* ---------- HERO ---------- */
  const hero = $('[data-hero]');
  const heroTitle = $('[data-title]', hero);
  const heroUps = $$('[data-up]', hero);
  [0, .5, .65, .8].forEach((d, i) => heroUps[i] && heroUps[i].style.setProperty('--d', d + 's'));

  $$('[data-title], [data-up], [data-traits], [data-svc], [data-pains]')
    .filter(el => !hero.contains(el))
    .forEach(el => io.observe(el));

  document.fonts.ready.then(() => requestAnimationFrame(() => {
    reveal(heroTitle);
    heroUps.forEach(reveal);
  }));
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layoutSteps(); onScroll(); }, 150); });

  /* ---------- MARQUEE: speeds up with scroll velocity ---------- */
  const track = $('[data-track]');
  const items = [...track.children];
  for (let k = 0; k < 2; k++) items.forEach(n => track.appendChild(n.cloneNode(true)));
  let mx = 0, boost = 0, mVisible = false, last = performance.now();
  new IntersectionObserver(([e]) => mVisible = e.isIntersecting).observe($('[data-marquee]'));
  function marquee(now) {
    const dt = Math.min(64, now - last); last = now;
    if (mVisible && !reduce) {
      const loop = track.scrollWidth / 3;
      mx -= (0.06 + boost) * dt;
      if (-mx >= loop) mx += loop;
      track.style.transform = `translate3d(${mx}px,0,0)`;
    }
    boost *= 0.94;
    requestAnimationFrame(marquee);
  }
  requestAnimationFrame(marquee);

  /* ---------- PARALLAX SHAPES ---------- */
  const floats = $$('[data-float]').map(el => ({ el, f: parseFloat(el.dataset.float), sec: el.closest('section') }));

  /* ---------- METHOD TIMELINE ---------- */
  const steps = $('[data-steps]');
  const stepItems = $$('.step', steps);
  const line = $('.steps__line', steps);
  const fill = $('[data-fill]', steps);
  let dotY = [];
  function layoutSteps() {
    const top = steps.getBoundingClientRect().top;
    dotY = stepItems.map(s => { const r = $('.step__dot', s).getBoundingClientRect(); return r.top + r.height / 2 - top; });
    line.style.top = dotY[0] + 'px';
    line.style.bottom = 'auto';
    line.style.height = dotY[dotY.length - 1] - dotY[0] + 'px';
  }

  function updateSteps() {
    const top = steps.getBoundingClientRect().top;
    const mark = innerHeight * 0.6 - top;
    const p = Math.min(1, Math.max(0, (mark - dotY[0]) / (dotY[dotY.length - 1] - dotY[0])));
    fill.style.setProperty('--p', p.toFixed(4));
    stepItems.forEach((s, i) => s.classList.toggle('is-active', mark >= dotY[i] - 2));
  }

  /* ---------- SCROLL LOOP (one rAF per frame) ---------- */
  let ticking = false, prevY = scrollY;
  function onScroll() {
    const y = scrollY;
    boost = Math.min(1.2, boost + Math.abs(y - prevY) * 0.004);
    prevY = y;
    onNavScroll(y);
    if (!reduce) floats.forEach(({ el, f, sec }) => {
      const r = sec.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) el.style.setProperty('--py', (-r.top * f).toFixed(1) + 'px');
    });
    updateSteps();
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  document.fonts.ready.then(() => { layoutSteps(); onScroll(); });
  layoutSteps(); onScroll();

  /* ---------- SERVICES ACCORDION ---------- */
  $$('.svc__item').forEach(item => {
    const btn = $('.svc__head', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.svc__item.is-open').forEach(o => { o.classList.remove('is-open'); $('.svc__head', o).setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
      setTimeout(() => { layoutSteps(); updateSteps(); }, 650);
    });
  });

  /* ---------- SCENA: Elena ascolta e scrive, intorno si chiacchiera ---------- */
  const scene = $('[data-scene]');
  if (scene) {
    const svg = $('[data-scene-svg]', scene);
    const ppl = $$('[data-pp]', scene);
    const bubs = $$('[data-bub]', scene);
    const bubT = bubs.map(b => $('[data-bub-t]', b));
    const qWrap = $('[data-q-wrap]', scene), qText = $('[data-q]', scene), qAv = $('[data-q-av]', scene);
    const aText = $('[data-a]', scene), under = $('[data-under]', scene), pen = $('[data-pen]', scene);
    const beats = [
      { q: 'Il mio brand sembra uno dei tanti.', a: 'Troviamo cosa ti distingue.' },
      { q: 'Come racconto cosa mi rende diverso?', a: 'Partiamo dalla tua storia.' },
      { q: 'Che tono di voce dovremmo usare?', a: 'Uno che ti somigli davvero.' },
      { q: 'Cosa pubblichiamo questo mese?', a: 'Ecco il piano editoriale.' }
    ];
    const chatter = ['…', '?', '!', '♥', 'ok!', 'ah!', 'sì!', '✺'];
    const mq = matchMedia('(max-width:700px)');
    const MOBILE = [4, 5];
    const shown = i => !mq.matches || MOBILE.includes(i);
    const who = i => mq.matches ? [4, 5, 4, 5][i] : [4, 5, 3, 6][i];

    // inquadratura: su desktop la fascia si allarga fino a riempire lo spazio disponibile
    function setBox() {
      if (mq.matches) { svg.setAttribute('viewBox', '905 10 590 690'); return; }
      const r = scene.getBoundingClientRect();
      const w = Math.min(2400, Math.max(1150, 700 * r.width / Math.max(r.height, 1)));
      svg.setAttribute('viewBox', `${(1200 - w / 2).toFixed(1)} 0 ${w.toFixed(1)} 700`);
    }
    setBox();
    new ResizeObserver(setBox).observe(scene);

    let visible = false, started = false, b = 0, speaker = -1;
    const busy = new Set();
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const talk = (i, on, txt) => {
      if (txt) bubT[i].textContent = txt;
      ppl[i].classList.toggle('is-talk', on);
      bubs[i].classList.toggle('is-on', on);
    };
    const setAnswer = t => {
      aText.textContent = t;
      const len = t ? aText.getComputedTextLength() : 0;
      under.setAttribute('d', `M432 182 H${434 + len}`);
      pen.setAttribute('transform', `translate(${440 + len} 168)`);
    };
    const show = i => {
      speaker = who(i);
      busy.delete(speaker);
      talk(speaker, true, '?');
      qText.textContent = beats[i].q;
      qAv.setAttribute('fill', bubs[speaker].dataset.c);
      qWrap.classList.remove('is-pop'); qWrap.getBBox(); qWrap.classList.add('is-pop');
    };

    async function loop() {
      while (true) {
        while (!visible || document.hidden) await wait(400);
        setAnswer(''); show(b);
        await wait(1500);
        ppl[speaker].classList.remove('is-talk');
        scene.classList.add('is-writing');
        for (let n = 1; n <= beats[b].a.length; n++) { setAnswer(beats[b].a.slice(0, n)); await wait(55); }
        scene.classList.remove('is-writing');
        await wait(2200);
        talk(speaker, false); speaker = -1;
        await wait(350);
        b = (b + 1) % beats.length;
      }
    }

    // chiacchiere di sottofondo: due o tre persone alla volta
    function chat() {
      if (visible && !document.hidden && busy.size < (mq.matches ? 1 : 3)) {
        const pool = ppl.map((_, i) => i).filter(i => i !== speaker && !busy.has(i) && shown(i));
        if (pool.length) {
          const i = pool[Math.random() * pool.length | 0];
          busy.add(i);
          talk(i, true, chatter[Math.random() * chatter.length | 0]);
          setTimeout(() => { if (i !== speaker) talk(i, false); busy.delete(i); }, 1600 + Math.random() * 1400);
        }
      }
      setTimeout(chat, 500 + Math.random() * 700);
    }

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !started) {
        started = true;
        scene.classList.add('is-in');
        if (reduce) { show(0); setAnswer(beats[0].a); ppl[speaker].classList.remove('is-talk'); }
        else document.fonts.ready.then(() => wait(1600).then(() => { loop(); chat(); }));
      }
    }, { threshold: .2 }).observe(scene);
  }

  /* ---------- PC: si accende, scrive "Ciao, sono Elena." ---------- */
  const pc = $('[data-pc]');
  if (pc) {
    const l1 = $('[data-pc-l1]', pc), l2 = $('[data-pc-l2]', pc), caret = $('[data-pc-caret]', pc);
    const keysEl = $$('.key', pc);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const placeCaret = el => {
      const x = +el.getAttribute('x') + (el.textContent ? el.getComputedTextLength() : 0) + 3;
      const big = el === l2;
      caret.setAttribute('x', x); caret.setAttribute('y', big ? 126 : 102);
      caret.setAttribute('height', big ? 40 : 20);
    };
    const hit = () => {
      const k = keysEl[Math.random() * keysEl.length | 0];
      k.classList.add('is-hit'); setTimeout(() => k.classList.remove('is-hit'), 120);
    };
    async function type(el, txt) {
      for (let n = 1; n <= txt.length; n++) {
        el.textContent = txt.slice(0, n); placeCaret(el); hit();
        await sleep(70 + Math.random() * 60);
      }
    }
    placeCaret(l1);
    let pcVisible = false;
    new IntersectionObserver(([e]) => {
      pcVisible = e.isIntersecting;
      if (!pcVisible || pc.classList.contains('is-in')) return;
      pc.classList.add('is-in');
      if (reduce) { pc.classList.add('is-on'); l1.textContent = 'Ciao, sono'; l2.textContent = 'Elena.'; placeCaret(l2); return; }
      document.fonts.ready.then(async () => {
        await sleep(800); pc.classList.add('is-on');
        await sleep(1300); await type(l1, 'Ciao, sono');
        await sleep(250); await type(l2, 'Elena.');
        // ogni tanto qualche tasto, come se stesse lavorando
        (function idle() {
          if (pcVisible && !document.hidden) { const n = 2 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) setTimeout(hit, i * 110); }
          setTimeout(idle, 2200 + Math.random() * 2200);
        })();
      });
    }, { threshold: .35 }).observe(pc);
  }

  /* ---------- PILL WIGGLE ---------- */
  if (canHover && !reduce) $$('[data-wiggle]').forEach(el => {
    el.addEventListener('pointerenter', () => el.animate(
      [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-4deg) scale(1.05)' }, { transform: 'rotate(3deg) scale(1.05)' }, { transform: 'rotate(-1deg) scale(1.03)' }, { transform: 'rotate(0) scale(1)' }],
      { duration: 650, easing: 'ease-out' }
    ));
  });

  /* ---------- FORM: invio a /api/contact (email a Elena via Resend) ---------- */
  const form = $('[data-form]');
  const ok = $('[data-ok]'), err = $('[data-err]');
  const btn = $('.form__btn', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    ok.hidden = err.hidden = true;
    if (!form.reportValidity()) return;
    btn.disabled = true;
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!r.ok) throw new Error(r.status);
      form.reset();
      ok.hidden = false;
    } catch {
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
})();
