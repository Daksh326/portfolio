import { gsap } from './scroll.js';
import { reducedMotion } from '../utils/device.js';

const KEY = 'dc-theme';

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const write = (v) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode — the toggle still works, it just won't persist */
  }
};

/**
 * Dark (cinematic) ↔ light (halftone paper).
 *
 * CSS owns every surface colour via tokens; this only has to move the WebGL
 * grade, because the halftone lives entirely in the film pass. The initial
 * attribute is set by an inline script in the document head so there's no
 * flash of the wrong theme on reload — this picks up from there.
 */
export function initTheme(stage) {
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn');
  const meta = document.querySelector('meta[name="theme-color"]');

  let theme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

  const film = stage.film?.uniforms;
  const bloom = stage.bloom;

  function paint(next, instant) {
    theme = next;
    const light = theme === 'light';

    root.setAttribute('data-theme', theme);
    meta?.setAttribute('content', light ? '#f4f3f0' : '#070908');

    if (btn) {
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    }

    if (!film) return;

    const to = light ? 1 : 0;
    // Bloom reads as blown-out ink once luminance is inverted into dots.
    const strength = light ? 0.22 : 0.42;

    if (instant || reducedMotion) {
      film.uTheme.value = to;
      if (bloom) bloom.strength = strength;
      return;
    }

    gsap.to(film.uTheme, { value: to, duration: 0.85, ease: 'power2.inOut', overwrite: true });
    if (bloom) gsap.to(bloom, { strength, duration: 0.85, ease: 'power2.inOut', overwrite: true });
  }

  paint(theme, true);

  btn?.addEventListener('click', () => {
    paint(theme === 'light' ? 'dark' : 'light');
    write(theme);
  });

  return {
    get theme() {
      return theme;
    },
    set: (t) => {
      paint(t);
      write(t);
    },
  };
}
