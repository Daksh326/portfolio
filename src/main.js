import '@fontsource/anton/400.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { Stage } from './gl/index.js';
import { buildDOM, startMarquee } from './ui/build.js';
import { initLoader } from './ui/preloader.js';
import { initScroll, gsap, ScrollTrigger, lenis } from './ui/scroll.js';
import { initCursor } from './ui/cursor.js';
import { initNav } from './ui/nav.js';
import { initWork } from './ui/work.js';
import { initReveals, playIntro } from './ui/reveal.js';
import { initMagnetic } from './ui/magnetic.js';
import { initTheme } from './ui/theme.js';
import { projects, sections } from './content.js';
import { hasWebGL } from './utils/device.js';
import { clamp } from './utils/math.js';

/** Per-section opacity targets for the three shared 3D objects. */
const MODES = {
  hero: { core: 1.0, rail: 0, grid: 1.0 },
  about: { core: 0.5, rail: 0, grid: 0.8 },
  work: { core: 0.0, rail: 1, grid: 0.35 },
  stack: { core: 0.32, rail: 0, grid: 0.7 },
  path: { core: 0.2, rail: 0, grid: 0.55 },
  contact: { core: 0.95, rail: 0, grid: 0.9 },
};

/** Stand-in so the DOM layer works identically with WebGL unavailable. */
function nullStage() {
  return {
    rail: {
      count: projects.length,
      enabled: false,
      hovered: -1,
      velocity: 0,
      setTarget() {},
    },
    targets: {},
    setPointer() {},
    setEnergy() {},
    setScroll() {},
    render() {},
    resize() {},
  };
}

async function boot() {
  const loader = initLoader();

  buildDOM();
  loader.set(0.18);

  // Splitting text before the fonts land measures the fallback face, so wait —
  // but never let a stalled font request hold the page hostage behind the loader.
  try {
    await Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* non-fatal */
  }
  loader.set(0.42);

  initScroll();

  let stage;
  if (hasWebGL) {
    try {
      stage = new Stage(document.getElementById('gl'), { projects });
    } catch (err) {
      console.warn('[gl] stage failed, falling back to DOM only', err);
    }
  }

  if (!stage) {
    document.documentElement.classList.add('no-webgl');
    document.getElementById('gl')?.remove();
    stage = nullStage();
  }
  loader.set(0.7);

  const cursor = initCursor();
  const theme = initTheme(stage);
  initNav();
  const work = initWork(stage, cursor);

  if (import.meta.env.DEV) {
    // Dev handle for poking at the scene from the console.
    Object.assign(window, { __stage: stage, __gsap: gsap, __lenis: lenis, __work: work, __theme: theme });
  }
  initReveals();
  initMagnetic();
  startMarquee(gsap);
  loader.set(0.88);

  /* ── section → 3D mode ─────────────────────────────────────────────── */
  for (const s of sections) {
    const el = document.getElementById(s.id);
    const mode = MODES[s.id];
    if (!el || !mode) continue;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        if (self.isActive) Object.assign(stage.targets, mode);
      },
    });
  }
  Object.assign(stage.targets, MODES.hero);

  /* ── input plumbing ────────────────────────────────────────────────── */
  window.addEventListener(
    'pointermove',
    (e) => stage.setPointer(e.clientX, e.clientY),
    { passive: true }
  );

  lenis.on('scroll', ({ velocity, progress }) => {
    stage.setEnergy(velocity);
    stage.setScroll(progress * 6);
  });

  /* ── one loop for everything ───────────────────────────────────────── */
  let first = true;
  gsap.ticker.add((time, deltaMS) => {
    // Clamp so a backgrounded tab doesn't fire one enormous frame on return.
    const dt = clamp(deltaMS / 1000, 0.0005, 1 / 20);
    cursor.update(dt);
    work.tick(dt);
    stage.render(time, dt);

    if (first) {
      first = false;
      loader.set(1);
    }
  });

  /* ── hand over ─────────────────────────────────────────────────────── */
  await loader.done();
  ScrollTrigger.refresh();
  playIntro();

  // Late refresh: images, fonts and the pin spacer all settle by now.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot().catch((err) => {
  console.error('[boot] failed', err);
  document.documentElement.classList.remove('is-booting', 'is-locked');
  document.getElementById('loader')?.remove();
});
