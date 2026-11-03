/* =========================================================
   Pradeep & Janhavi · Royal Mysore Heritage Wedding Invitation
   Vanilla JS — no external libraries.
   ========================================================= */
(() => {
  'use strict';

  const CONFIG = {
    // Subha Muhurtham start: Thursday 3 Dec 2026, 8:00 AM IST (window 8:00–9:05).
    muhurtham: '2026-12-03T08:00:00+05:30',
    introDuration: 10000,
    musicVolume: 0.55,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  /* ---------------------------------------------------------
     Synthesised temple ambience — fallback when MP3s are missing
     --------------------------------------------------------- */
  const Synth = (() => {
    let ctx = null, master = null, built = false, running = false, bellTimer = 0;
    const LEVEL = 0.32;

    function prime() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }

    // Tanpura-like drone on Sa–Pa–Sa
    function build() {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      lp.connect(master);
      [[73.42, 0.3], [110, 0.2], [146.83, 0.26], [220, 0.1]].forEach(([freq, gain], i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (i - 1.5) * 3;
        const g = ctx.createGain();
        g.gain.value = gain;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.07 + i * 0.03;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = gain * 0.4;
        lfo.connect(lfoGain).connect(g.gain);
        osc.connect(g).connect(lp);
        osc.start();
        lfo.start();
      });
      built = true;
    }

    function bell() {
      const t = ctx.currentTime;
      [[1, 0.16], [2, 0.05], [2.76, 0.07], [5.4, 0.025]].forEach(([mult, peak], i) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = 587.33 * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6 - i * 0.6);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + 4);
      });
    }

    function scheduleBell() {
      clearTimeout(bellTimer);
      if (!running) return;
      bell();
      bellTimer = setTimeout(scheduleBell, 7000 + Math.random() * 5000);
    }

    function setLevel(v) {
      if (!ctx) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(v, t, 0.4);
    }

    return {
      prime,
      start(muted) {
        if (!prime()) return false;
        if (!built) build();
        running = true;
        setLevel(muted ? 0 : LEVEL);
        scheduleBell();
        return true;
      },
      stop() {
        running = false;
        clearTimeout(bellTimer);
        setLevel(0);
      },
      setMuted(m) { if (running) setLevel(m ? 0 : LEVEL); },
    };
  })();

  /* ---------------------------------------------------------
     Music controller
     --------------------------------------------------------- */
  const Music = (() => {
    const tracks = { opening: $('#openingAudio'), wedding: $('#weddingAudio') };
    const labels = { opening: 'Opening Music', wedding: 'Wedding Music', synth: 'Temple Ambience' };
    const ui = $('#music');
    const playBtn = $('#musicPlay');
    const muteBtn = $('#musicMute');
    const label = $('#musicLabel');
    const failed = new Set();
    let current = null; // 'opening' | 'wedding' | 'synth'
    let playing = false;
    let muted = false;
    let resumeOnVisible = false;
    const listeners = [];

    // With <source> children a missing file leaves play() pending forever, so fall back on the source error.
    Object.entries(tracks).forEach(([key, el]) => {
      el.volume = CONFIG.musicVolume;
      const src = el.querySelector('source');
      if (!src) return;
      src.addEventListener('error', () => {
        failed.add(el);
        if (current === key && playing) useSynth();
      });
    });

    function useSynth() {
      current = 'synth';
      playing = Synth.start(muted);
      render();
    }

    function render() {
      ui.classList.toggle('is-playing', playing);
      ui.classList.toggle('is-muted', muted);
      playBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
      muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
      muteBtn.setAttribute('aria-pressed', String(muted));
      label.textContent = current ? labels[current] : 'Music';
      listeners.forEach((fn) => fn(playing, current));
    }

    function fadeOutAndPause(el) {
      if (el.paused) return;
      const start = el.volume;
      let step = 0;
      const id = setInterval(() => {
        step += 1;
        el.volume = Math.max(0, start * (1 - step / 10));
        if (step >= 10) {
          clearInterval(id);
          el.pause();
          el.volume = CONFIG.musicVolume;
        }
      }, 80);
    }

    function tryPlay(el) {
      if (failed.has(el)) return Promise.resolve(false);
      el.muted = muted;
      el.volume = CONFIG.musicVolume;
      let p;
      try { p = el.play(); } catch (e) { return Promise.resolve(false); }
      return Promise.resolve(p).then(() => true).catch((err) => {
        if (!err || err.name !== 'NotAllowedError') failed.add(el);
        return false;
      });
    }

    // Must be called from a user gesture.
    function start(name) {
      Synth.prime();
      const el = tracks[name];
      Object.entries(tracks).forEach(([key, t]) => { if (key !== name) fadeOutAndPause(t); });
      if (current === 'synth' && !failed.has(el)) Synth.stop();
      current = name;
      playing = true;
      render();
      tryPlay(el).then((ok) => {
        if (current !== name) return;
        if (!ok) useSynth();
        else render();
      });
    }

    function pause() {
      if (current === 'synth') Synth.stop();
      else if (current) tracks[current].pause();
      playing = false;
      render();
    }

    function resume() {
      if (!current) return start('wedding');
      if (current === 'synth') {
        playing = Synth.start(muted);
        render();
        return;
      }
      start(current);
    }

    playBtn.addEventListener('click', () => (playing ? pause() : resume()));
    muteBtn.addEventListener('click', () => {
      muted = !muted;
      Object.values(tracks).forEach((t) => { t.muted = muted; });
      Synth.setMuted(muted);
      render();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playing) {
        resumeOnVisible = true;
        pause();
      } else if (!document.hidden && resumeOnVisible) {
        resumeOnVisible = false;
        resume();
      }
    });

    return {
      start,
      pause,
      get playing() { return playing; },
      get current() { return current; },
      onChange(fn) { listeners.push(fn); },
      showControls() { ui.hidden = false; },
    };
  })();

  /* ---------------------------------------------------------
     Intro golden particles (canvas)
     --------------------------------------------------------- */
  const Particles = (() => {
    const canvas = $('#introParticles');
    if (!canvas || reduceMotion || !canvas.getContext) return { stop() {} };
    const ctx = canvas.getContext('2d');
    const count = window.innerWidth < 640 ? 36 : 70;
    const ps = [];
    let w = 0, h = 0, raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(p, initial) {
      p.x = Math.random() * w;
      p.y = initial ? Math.random() * h : h + 10;
      p.r = 0.6 + Math.random() * 2.2;
      p.vy = 0.2 + Math.random() * 0.6;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.a = 0.3 + Math.random() * 0.7;
      p.ph = Math.random() * Math.PI * 2;
      return p;
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of ps) {
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t / 1000 + p.ph) * 0.15;
        if (p.y < -10) spawn(p, false);
        const a = p.a * (0.6 + 0.4 * Math.sin(t / 500 + p.ph));
        ctx.fillStyle = `rgba(246, 214, 140, ${a * 0.18})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 232, 170, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    for (let i = 0; i < count; i += 1) ps.push(spawn({}, true));
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);

    return {
      stop() {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      },
    };
  })();

  /* ---------------------------------------------------------
     Cinematic intro + envelope
     --------------------------------------------------------- */
  const Intro = (() => {
    const intro = $('#intro');
    const openBtn = $('#openInvitation');
    const skipBtn = $('#skipIntro');
    const soundBtn = $('#introSound');
    const video = $('#introVideo');
    const timers = [];
    let opened = false;

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()); };
    const setScene = (n) => { intro.dataset.scene = String(n); };

    // Opening video: use it if present, otherwise keep the illustrated scene.
    if (video) {
      const src = video.querySelector('source');
      const dropVideo = () => { video.pause(); video.remove(); };
      if (reduceMotion || saveData) dropVideo();
      else {
        if (src) src.addEventListener('error', dropVideo);
        video.addEventListener('error', dropVideo);
        video.addEventListener('playing', () => intro.classList.add('has-video'), { once: true });
        const p = video.play && video.play();
        if (p && p.catch) p.catch(() => {});
      }
    }

    function showCta() {
      clearTimers();
      setScene(4);
      intro.classList.remove('is-playing');
      openBtn.focus({ preventScroll: true });
    }

    function play() {
      if (reduceMotion) { showCta(); return; }
      intro.classList.add('is-playing');
      setScene(1);
      later(() => setScene(2), 3000);
      later(() => setScene(3), 6000);
      later(showCta, CONFIG.introDuration);
    }

    function finish() {
      intro.classList.add('is-done');
      intro.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-intro');
      Particles.stop();
      if (video && video.isConnected) video.pause();
      Music.showControls();
      Petals.start();
      window.scrollTo(0, 0);
      const home = $('#home');
      home.setAttribute('tabindex', '-1');
      home.focus({ preventScroll: true });
    }

    function open() {
      if (opened) return;
      opened = true;
      clearTimers();
      Music.start('wedding');
      if (reduceMotion) { finish(); return; }
      intro.classList.add('env-in');
      later(() => intro.classList.add('env-open'), 700);
      later(() => intro.classList.add('env-rise'), 1500);
      later(() => intro.classList.add('intro-out'), 2500);
      later(finish, 3400);
    }

    openBtn.addEventListener('click', open);
    skipBtn.addEventListener('click', showCta);
    soundBtn.addEventListener('click', () => {
      if (Music.playing) Music.pause();
      else Music.start('opening');
    });
    Music.onChange((playing) => soundBtn.setAttribute('aria-pressed', String(playing)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !opened && intro.dataset.scene !== '4') showCta();
    });

    return { play };
  })();

  /* ---------------------------------------------------------
     Falling petals (started after the intro)
     --------------------------------------------------------- */
  const Petals = {
    started: false,
    start() {
      if (this.started || reduceMotion) return;
      this.started = true;
      const layer = $('#petals');
      const colors = ['#E8902A', '#F7B643', '#C0392B', '#F3E5C8', '#D4AF62', '#B3243C'];
      const count = window.innerWidth < 640 ? 10 : 18;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i += 1) {
        const p = document.createElement('span');
        const size = 8 + Math.random() * 8;
        p.className = 'petal';
        p.style.left = `${Math.random() * 100}vw`;
        p.style.width = `${size}px`;
        p.style.height = `${size * 1.2}px`;
        p.style.background = colors[i % colors.length];
        p.style.animationDuration = `${10 + Math.random() * 9}s`;
        p.style.animationDelay = `${Math.random() * 10}s`;
        p.style.setProperty('--drift', `${-80 + Math.random() * 200}px`);
        frag.appendChild(p);
      }
      layer.appendChild(frag);
    },
  };

  /* ---------------------------------------------------------
     Countdown
     --------------------------------------------------------- */
  function initCountdown() {
    const target = new Date(CONFIG.muhurtham).getTime();
    const out = {
      d: $('#cdDays'), h: $('#cdHours'), m: $('#cdMinutes'), s: $('#cdSeconds'),
    };
    const done = $('#cdDone');
    const pad = (n) => String(n).padStart(2, '0');
    let id = 0;

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        out.d.textContent = out.h.textContent = out.m.textContent = out.s.textContent = '00';
        done.hidden = false;
        clearInterval(id);
        return;
      }
      out.d.textContent = pad(Math.floor(diff / 86400000));
      out.h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      out.m.textContent = pad(Math.floor((diff % 3600000) / 60000));
      out.s.textContent = pad(Math.floor((diff % 60000) / 1000));
    }
    tick();
    id = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     Photos: fade-in on load, labelled placeholder when missing
     --------------------------------------------------------- */
  function initPhotos() {
    const frames = $$('.photo-frame');
    frames.forEach((frame) => {
      const img = $('img', frame);
      const ok = () => {
        img.classList.add('is-loaded');
        frame.setAttribute('tabindex', '0');
        frame.setAttribute('role', 'button');
        frame.setAttribute('aria-label', `View photo: ${img.alt}`);
      };
      const missing = () => frame.classList.add('is-missing');
      img.addEventListener('load', ok);
      img.addEventListener('error', missing);
      if (img.complete) (img.naturalWidth ? ok : missing)();
    });

    const lb = $('#lightbox');
    if (!lb || typeof lb.showModal !== 'function') return;
    const lbImg = $('.lightbox__img', lb);
    const prevBtn = $('.lightbox__prev', lb);
    const nextBtn = $('.lightbox__next', lb);
    let list = [];
    let idx = 0;

    const available = () => frames.filter((f) => $('img', f).classList.contains('is-loaded'));
    function show(i) {
      idx = (i + list.length) % list.length;
      const img = $('img', list[idx]);
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      prevBtn.hidden = nextBtn.hidden = list.length < 2;
    }
    function openAt(frame) {
      list = available();
      const i = list.indexOf(frame);
      if (i < 0) return;
      show(i);
      lb.showModal();
    }

    frames.forEach((f) => {
      f.addEventListener('click', () => openAt(f));
      f.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(f); }
      });
    });
    $('.lightbox__close', lb).addEventListener('click', () => lb.close());
    prevBtn.addEventListener('click', () => show(idx - 1));
    nextBtn.addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------------------------------------------------------
     Scroll reveals, nav state, parallax
     --------------------------------------------------------- */
  function initScroll() {
    const reveals = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach((el) => io.observe(el));
    }

    const nav = $('#siteNav');
    const links = $$('.site-nav nav a');
    if ('IntersectionObserver' in window) {
      const sectionIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) sectionIO.observe(s); });
    }

    const parallax = reduceMotion ? [] : $$('[data-parallax]');
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('is-scrolled', y > 40);
        if (y < window.innerHeight * 1.2) {
          parallax.forEach((el) => {
            el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`;
          });
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  initCountdown();
  initPhotos();
  initScroll();
  Intro.play();
})();
