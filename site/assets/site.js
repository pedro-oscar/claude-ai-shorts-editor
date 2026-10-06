/* Claude AI Shorts Editor — site. Sem framework, sem build. */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- repositório (troque aqui) ---------------- */
  const REPO = root.dataset.repo || 'pedro-oscar/claude-ai-shorts-editor';
  $$('[data-repo-href]').forEach((a) => (a.href = `https://github.com/${REPO}`));

  /* ---------------- tema ---------------- */
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const effective = () => root.dataset.theme || (dark.matches ? 'dark' : 'light');
  const paintTheme = () => (root.dataset.themeEffective = effective());
  paintTheme();
  dark.addEventListener?.('change', paintTheme);
  $$('[data-theme-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      const next = effective() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      store.set('theme', next);
      paintTheme();
    }),
  );

  /* ---------------- idioma ---------------- */
  const setLang = (l) => {
    root.dataset.lang = l;
    root.lang = l === 'en' ? 'en' : 'pt-BR';
    const t = root.dataset[l === 'en' ? 'titleEn' : 'titlePt'];
    if (t) document.title = t;
    $$('[data-lang-toggle] span').forEach((s) => s.setAttribute('aria-current', String(s.dataset.l === l)));
    $$('[data-pt-label]').forEach((el) => el.setAttribute('aria-label', el.dataset[l === 'en' ? 'enLabel' : 'ptLabel']));
    store.set('lang', l);
    document.dispatchEvent(new CustomEvent('langchange', {detail: l}));
  };
  setLang(root.dataset.lang || 'pt');
  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => setLang(root.dataset.lang === 'en' ? 'pt' : 'en')));

  /* ---------------- menu móvel ---------------- */
  const mb = $('.menu-btn');
  if (mb) mb.addEventListener('click', () => {
    const m = $('.mobile-nav');
    const open = m.classList.toggle('open');
    mb.setAttribute('aria-expanded', String(open));
  });

  /* ---------------- copiar ---------------- */
  $$('.copy').forEach((b) =>
    b.addEventListener('click', async () => {
      const codes = [...(b.closest('.cmd, pre')?.querySelectorAll('code') || [])];
      const vis = codes.find((c) => c.offsetParent !== null) || codes[0];
      const src = b.dataset.copy ?? (vis?.innerText || '');
      const text = src.replace(/^\s*\$ /gm, '');
      try {
        await navigator.clipboard.writeText(text.trim());
      } catch {
        const ta = Object.assign(document.createElement('textarea'), {value: text.trim()});
        document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      const old = b.innerHTML;
      b.classList.add('done');
      b.textContent = root.dataset.lang === 'en' ? 'copied' : 'copiado';
      setTimeout(() => { b.classList.remove('done'); b.innerHTML = old; }, 1400);
    }),
  );

  /* ---------------- personagem (SVG compartilhado) ---------------- */
  // Mesmo traço das cenas do Remotion: formas simples, contorno preto grosso, 3–4 cores.
  const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="spk" viewBox="0 0 300 380" overflow="visible">
    <path d="M2 600L18 380c8-70 52-112 132-112s124 42 132 112l16 220z" fill="#2C4A7C" stroke="#0E0F12" stroke-width="7"/>
    <path d="M118 270l32 40 32-40" fill="none" stroke="#0E0F12" stroke-width="7" stroke-linejoin="round"/>
    <path d="M128 222h44v52l-22 18-22-18z" fill="#E2A784" stroke="#0E0F12" stroke-width="7" stroke-linejoin="round"/>
    <ellipse cx="86" cy="160" rx="15" ry="20" fill="#E2A784" stroke="#0E0F12" stroke-width="7"/>
    <ellipse cx="214" cy="160" rx="15" ry="20" fill="#E2A784" stroke="#0E0F12" stroke-width="7"/>
    <ellipse cx="150" cy="150" rx="64" ry="78" fill="#EDB592" stroke="#0E0F12" stroke-width="7"/>
    <path d="M86 140c-6-52 22-80 66-80 46 0 72 30 64 82-12-24-34-34-58-34-30 0-48-4-72 32z" fill="#3A2618" stroke="#0E0F12" stroke-width="7" stroke-linejoin="round"/>
    <path d="M114 142q12-8 24 0M162 142q12-8 24 0" fill="none" stroke="#0E0F12" stroke-width="6" stroke-linecap="round"/>
    <circle cx="126" cy="160" r="6.5" fill="#0E0F12"/><circle cx="174" cy="160" r="6.5" fill="#0E0F12"/>
    <path d="M150 166l-6 22h10" fill="none" stroke="#0E0F12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse class="mouth" cx="150" cy="202" rx="16" ry="7" fill="#7A1F1A" stroke="#0E0F12" stroke-width="5"/>
    <path d="M72 168c-6-84 30-128 78-128s84 44 78 128" fill="none" stroke="#17181C" stroke-width="11" stroke-linecap="round"/>
    <rect x="58" y="138" width="26" height="48" rx="10" fill="#17181C"/>
    <rect x="216" y="138" width="26" height="48" rx="10" fill="#17181C"/>
    <path d="M268 600v-316" stroke="#0E0F12" stroke-width="9"/>
    <rect x="248" y="226" width="40" height="70" rx="20" fill="#26282E" stroke="#0E0F12" stroke-width="7"/>
    <path d="M256 250h24M256 264h24M256 278h24" stroke="#555963" stroke-width="4" stroke-linecap="round"/>
  </symbol>
  <symbol id="host" viewBox="0 0 300 380" overflow="visible">
    <path d="M2 600L18 380c8-70 52-112 132-112s124 42 132 112l16 220z" fill="#7C2E2A" stroke="#0E0F12" stroke-width="7"/>
    <path d="M128 222h44v52l-22 18-22-18z" fill="#B97D5C" stroke="#0E0F12" stroke-width="7"/>
    <ellipse cx="150" cy="150" rx="62" ry="76" fill="#C68A66" stroke="#0E0F12" stroke-width="7"/>
    <path d="M90 128c4-46 30-66 62-66 34 0 58 22 58 64-24-16-80-20-120 2z" fill="#16110D" stroke="#0E0F12" stroke-width="7"/>
    <circle cx="128" cy="160" r="6" fill="#0E0F12"/><circle cx="172" cy="160" r="6" fill="#0E0F12"/>
    <path d="M134 200q16 10 32 0" fill="none" stroke="#0E0F12" stroke-width="5" stroke-linecap="round"/>
  </symbol>
  </defs></svg>
  <style>.mouth{transform-box:fill-box;transform-origin:center;animation:talk .32s ease-in-out infinite alternate}
  @keyframes talk{from{transform:scaleY(.35)}to{transform:scaleY(1.25)}}
  @media (prefers-reduced-motion: reduce){.mouth{animation:none}}</style>`;
  document.body.insertAdjacentHTML('afterbegin', SPRITE);

  /* ---------------- tiles de motion (catálogo) ---------------- */
  const playTile = (el) => {
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
    const c = $('[data-count]', el);
    if (c) countUp(c, +c.dataset.count, 1300, c.dataset.prefix || '');
  };
  const fmt = (n) => Math.round(n).toLocaleString(root.dataset.lang === 'en' ? 'en-US' : 'pt-BR');
  function countUp(el, to, ms, prefix) {
    if (reduced) { el.firstChild.textContent = prefix + fmt(to); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      el.firstChild.textContent = prefix + fmt(to * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const tiles = $$('.mtile .mini');
  if (tiles.length) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { playTile(e.target); io.unobserve(e.target); }
    }), {threshold: .6});
    tiles.forEach((t) => { io.observe(t); t.addEventListener('click', () => playTile(t)); });
  }

  /* ---------------- trilho da página "como funciona" ---------------- */
  const railLinks = $$('.rail a');
  if (railLinks.length) {
    const map = new Map(railLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      railLinks.forEach((a) => a.classList.remove('on'));
      const a = map.get(e.target.id);
      if (a) { a.classList.add('on'); a.scrollIntoView({block: 'nearest', inline: 'nearest'}); }
    }), {rootMargin: '-40% 0px -55% 0px'});
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- abas (cada tablist é um grupo; a primeira segue o #hash) ---------------- */
  $$('[role="tablist"]').forEach((list, li) => {
    const tabs = $$('[role="tab"]', list);
    const show = (id, push) => {
      tabs.forEach((t) => {
        const on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (push && li === 0) history.replaceState(null, '', '#' + id);
      if (list.dataset.store) store.set(list.dataset.store, id);
    };
    tabs.forEach((t) => {
      t.addEventListener('click', () => show(t.getAttribute('aria-controls'), true));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const i = tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1);
        const n = tabs[(i + tabs.length) % tabs.length];
        n.focus(); n.click();
      });
    });
    const ids = tabs.map((t) => t.getAttribute('aria-controls'));
    const h = location.hash.slice(1);
    const saved = list.dataset.store && store.get(list.dataset.store);
    show(li === 0 && ids.includes(h) ? h : ids.includes(saved) ? saved : ids[0]);
    list._show = show;
  });
  // sistema do visitante: sugere a aba certa na primeira visita
  const osList = $('[data-os-tabs]');
  if (osList && !store.get('os')) {
    const ua = navigator.userAgent;
    const os = /Mac/.test(ua) ? 'os-mac' : /Linux|X11/.test(ua) && !/Android/.test(ua) ? 'os-linux' : 'os-win';
    osList._show(os);
  }
  $$('[data-goto-tab]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    $('[role="tablist"]')._show(a.dataset.gotoTab, true);
    document.getElementById('tabs').scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
  }));

  /* ---------------- ilha de edição do hero ---------------- */
  const bay = $('#bay');
  if (bay) heroBay(bay);

  function heroBay(bay) {
    // onda do vídeo inteiro (2:14:08) e da janela ampliada
    const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const wave = (svg, n, seed, gapFn) => {
      const r = rnd(seed);
      let d = '';
      for (let i = 0; i < n; i++) {
        const x = (i + .5) / n * 1000;
        let h = .15 + r() * .55 + Math.sin(i / 7) * .12;
        if (gapFn && gapFn(i / n)) h *= .25;
        h = Math.max(.05, Math.min(.95, h)) * 50;
        d += `M${x.toFixed(1)} ${(27 - h / 2).toFixed(1)}v${h.toFixed(1)}`;
      }
      svg.innerHTML = `<path d="${d}" stroke="#5E626C" stroke-width="${(1000 / n * .55).toFixed(2)}" stroke-linecap="round"/>`;
    };
    wave($('#wave-all'), 240, 7, null);

    // janela ampliada: 1:08:08 → 1:08:52 (44 s); dois trechos e a enrolação removida no meio
    const W0 = 4088, W1 = 4132;
    const A = [4092.3, 4099.8], B = [4121.0, 4127.9];
    const f = (s) => (s - W0) / (W1 - W0);
    wave($('#wave-zoom'), 150, 31, (p) => (p > .13 && p < .16) || (p > .62 && p < .66) || (p > .9));
    const segA = $('#segA'), segB = $('#segB'), cutX = $('#cutX');
    segA.style.left = f(A[0]) * 100 + '%'; segA.style.width = (f(A[1]) - f(A[0])) * 100 + '%';
    segB.style.left = f(B[0]) * 100 + '%'; segB.style.width = (f(B[1]) - f(B[0])) * 100 + '%';
    cutX.style.left = f(A[1]) * 100 + '%'; cutX.style.width = (f(B[0]) - f(A[1])) * 100 + '%';

    const ph = $('#ph'), tcSrc = $('#tc-src'), tcReel = $('#tc-reel'), mtc = $('#mon-tc');
    const face = $('#facebox'), spkMon = $('#mon-spk');
    const reel = $('#reel');
    const stage = $('.stage', reel), cap = $('.r-cap', reel), ttl = $('.r-title', reel), key = $('.r-key', reel),
      card = $('.r-card', reel), cnt = $('.r-count', reel), flash = $('.r-flash', reel), fade = $('.r-fade', reel);

    const SCRIPT = {
      // corte de um podcast sobre séries e família: gancho → mesa × sofá → 96 episódios → payoff
      pt: {
        words: '0.3 Minha|0.6 família|1.05 só|1.25 conversa|1.75 de|1.9 verdade||2.35 quando|2.7 tem|2.9 série|3.3 passando.||3.9 Na|4.05 mesa,|4.5 ninguém|4.9 fala|5.15 nada.||5.6 No|5.75 sofá,|6.2 todo|6.45 mundo|6.7 vira|6.95 crítico.||7.6 Foi|7.8 assim|8.1 por|8.25 dois|8.55 anos.||9.3 Noventa|9.7 e|9.8 seis|10.1 episódios.||11.0 A|11.1 série|11.4 era|11.6 desculpa.||12.2 O|12.35 assunto|12.75 era|12.95 a|13.05 gente.',
        em: ['série', 'crítico.', 'desculpa.', 'gente.'],
        title: 'A série que uniu a família', key: 'Maratona', cardH: 'Onde se conversa?',
        l: ['Mesa de jantar', 'Quase nunca'], r: ['Sofá + série', 'Toda semana'], cnt: 'episódios juntos', pre: '', to: 96,
      },
      en: {
        words: '0.3 My|0.55 family|1.0 only|1.25 really|1.6 talks||2.1 when|2.35 a|2.45 show|2.8 is|3.0 on.||3.9 At|4.05 dinner,|4.5 nobody|4.9 says|5.15 a|5.25 word.||5.6 On|5.75 the|5.85 couch,|6.2 everyone’s|6.7 a|6.8 critic.||7.6 We|7.75 did|7.95 that|8.15 for|8.3 two|8.55 years.||9.3 Ninety-six|10.1 episodes.||11.0 The|11.1 show|11.4 was|11.6 the|11.7 excuse.||12.2 The|12.35 topic|12.75 was|12.95 us.',
        em: ['show', 'critic.', 'excuse.', 'us.'],
        title: 'The show that brought us together', key: 'Binge night', cardH: 'Where we talk',
        l: ['Dinner table', 'Almost never'], r: ['Couch + a show', 'Every week'], cnt: 'episodes together', pre: '', to: 96,
      },
    };
    const LOOP = 14.4;
    let groups = [], S;
    const build = () => {
      S = SCRIPT[root.dataset.lang === 'en' ? 'en' : 'pt'];
      groups = S.words.split('||').map((g) => g.split('|').map((w) => {
        const [t, ...rest] = w.split(' ');
        return {t: +t, w: rest.join(' ')};
      }));
      ttl.textContent = S.title;
      key.textContent = S.key;
      card.innerHTML = `<div class="h">${S.cardH}</div><div class="vs"><div class="box">${S.l[0]}<b>${S.l[1]}</b></div><span class="x">VS</span><div class="box red">${S.r[0]}<b>${S.r[1]}</b></div></div>`;
      cnt.innerHTML = `<span></span><small>${S.cnt}</small>`;
      lastG = -1;
    };
    let lastG = -1;
    document.addEventListener('langchange', build);
    build();

    const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const pop = (t, a, b, inD = .25, outD = .25) => {
      if (t < a || t > b) return 0;
      return Math.min(ease((t - a) / inD), ease((b - t) / outD));
    };
    const clock = (s) => {
      const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = (s % 60).toFixed(1).padStart(4, '0');
      return `${h}:${String(m).padStart(2, '0')}:${x}`;
    };

    function frame(t) {
      // fonte ↔ reel
      const src = t < 7.5 ? A[0] + t : B[0] + (t - 7.5);
      ph.style.left = (f(Math.min(src, W1)) * 100) + '%';
      segA.classList.toggle('on', t < 7.5);
      segB.classList.toggle('on', t >= 7.5);
      tcSrc.textContent = clock(src);
      tcReel.textContent = '0:' + t.toFixed(1).padStart(4, '0');
      mtc.textContent = clock(src);
      // rosto: a cabeça mexe um pouco; o enquadramento segue
      const sway = Math.sin(t * 1.3) * 1.6 + (t >= 7.5 ? -4 : 0);
      spkMon.style.left = (40 + sway) + '%';
      face.style.left = (40 + sway - 7) + '%';
      $('#cropwin').style.left = (40 + sway) + '%';

      // legenda
      let gi = groups.findIndex((g, i) => t >= g[0].t - .05 && (i === groups.length - 1 || t < groups[i + 1][0].t - .05));
      if (t < groups[0][0].t) gi = -1;
      if (gi !== lastG) {
        cap.innerHTML = gi < 0 ? '' : groups[gi].map((w) => `<span data-t="${w.t}">${w.w}</span>`).join(' ');
        lastG = gi;
      }
      $$('span', cap).forEach((s, i, all) => {
        const st = +s.dataset.t, nx = all[i + 1] ? +all[i + 1].dataset.t : st + .6;
        s.classList.toggle('now', t >= st && t < nx);
        s.classList.toggle('em', S.em.includes(s.textContent) && !(t >= st && t < nx));
        s.style.opacity = t >= st - .02 ? 1 : 0;
      });

      // motions
      const a1 = pop(t, .2, 2.8, .3, .3);
      ttl.style.opacity = a1; ttl.style.scale = .6 + .4 * Math.min(1, ease((t - .2) / .3) * 1.06);
      const a2 = pop(t, 2.85, 3.85, .22, .2);
      key.style.opacity = a2; key.style.scale = .4 + .6 * a2;
      const a3 = pop(t, 3.95, 7.35, .35, .3);
      card.style.opacity = a3; card.style.translate = `0 ${(1 - a3) * -8}cqw`;
      const fl = t >= 7.45 && t < 7.9 ? 1 - (t - 7.45) / .45 : 0;
      flash.style.opacity = fl * .85;
      const a4 = pop(t, 9.25, 10.9, .2, .25);
      cnt.style.opacity = a4;
      if (a4 > 0) cnt.firstChild.textContent = S.pre + fmt(S.to * ease((t - 9.25) / 1.1));
      // zoom no payoff e saída suave
      const z = pop(t, 12.1, 13.6, .25, .5);
      stage.style.scale = 1 + .18 * z;
      fade.style.opacity = t > 13.6 ? Math.min(1, (t - 13.6) / .6) : 0;
    }

    if (reduced) { frame(6.6); return; }
    let t0 = performance.now(), visible = true, paused = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(bay);
    let last = performance.now();
    const loop = (now) => {
      const dt = now - last; last = now;
      if (!visible || document.hidden) paused += dt;
      else frame(((now - t0 - paused) / 1000) % LOOP);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
