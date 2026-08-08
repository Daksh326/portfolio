import '@fontsource/bebas-neue/400.css';
import '@fontsource-variable/inter';
import '@fontsource/fira-mono/400.css';
import '@fontsource/fira-mono/500.css';
import './styles/main.css';

import { buildDOM } from './ui/build.js';
import { initLoader } from './ui/preloader.js';
import { initScroll, gsap, ScrollTrigger, lenis } from './ui/scroll.js';
import { initCursor } from './ui/cursor.js';
import { initNav } from './ui/nav.js';
import { initReveals, playIntro } from './ui/reveal.js';
import { initMagnetic } from './ui/magnetic.js';
import { initContact, guardDeadLinks } from './ui/contact.js';
import { clamp } from './utils/math.js';

async function boot() {
  const loader = initLoader();

  buildDOM();
  loader.set(0.25);

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
  loader.set(0.6);

  initScroll();

  const cursor = initCursor();
  initNav();
  initReveals();
  initMagnetic();
  initContact();
  guardDeadLinks();
  loader.set(0.9);

  if (import.meta.env.DEV) {
    Object.assign(window, { __gsap: gsap, __lenis: lenis, __ST: ScrollTrigger });
  }

  let first = true;
  gsap.ticker.add((_time, deltaMS) => {
    // Clamp so a backgrounded tab doesn't fire one enormous frame on return.
    const dt = clamp(deltaMS / 1000, 0.0005, 1 / 20);
    cursor.update(dt);

    if (first) {
      first = false;
      loader.set(1);
    }
  });

  await loader.done();
  ScrollTrigger.refresh();
  playIntro();

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

boot().catch((err) => {
  console.error('[boot] failed', err);
  document.documentElement.classList.remove('is-locked');
  document.getElementById('loader')?.remove();
});
