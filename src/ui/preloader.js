import { gsap } from './scroll.js';
import { reducedMotion } from '../utils/device.js';

/**
 * Progress is real, not a fake timer: `set()` is called at genuine milestones
 * during boot. The counter just eases between them so it never stalls visibly.
 */
export function initLoader() {
  const root = document.getElementById('loader');
  const num = document.getElementById('loaderNum');
  const bar = document.getElementById('loaderBar');

  document.documentElement.classList.add('is-locked');

  const state = { p: 0, shown: 0 };
  let raf = 0;

  function paint() {
    state.shown += (state.p - state.shown) * 0.09;
    num.textContent = String(Math.min(100, Math.round(state.shown * 100))).padStart(3, '0');
    bar.style.width = `${state.shown * 100}%`;
    raf = requestAnimationFrame(paint);
  }
  raf = requestAnimationFrame(paint);

  const set = (p) => {
    state.p = Math.max(state.p, Math.min(1, p));
  };

  function done() {
    set(1);

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(failsafe);
        cancelAnimationFrame(raf);
        document.documentElement.classList.remove('is-locked');
        root.remove();
        resolve();
      };

      /**
       * The exit runs on GSAP's ticker, which is rAF-backed — so a tab that is
       * backgrounded or throttled mid-load can stall it indefinitely. That used
       * to leave a full-screen, opaque, `pointer-events: auto` overlay sitting
       * on the page forever, swallowing every click and holding the scroll
       * lock. This timer is the guarantee that the page always becomes usable,
       * whatever the ticker is doing.
       */
      const failsafe = setTimeout(finish, 4000);

      if (reducedMotion) {
        finish();
        return;
      }

      gsap
        .timeline({ onComplete: finish })
        .to(state, { shown: 1, duration: 0.45, ease: 'power2.out' })
        .to('.loader__row', { opacity: 0, duration: 0.3, ease: 'power2.out' }, '+=0.1')
        .to('.loader__bar', { scaleX: 0, transformOrigin: 'right', duration: 0.6, ease: 'expo.inOut' }, '<')
        .fromTo(
          root,
          { clipPath: 'inset(0 0 0% 0)' },
          { clipPath: 'inset(0 0 100% 0)', duration: 0.95, ease: 'expo.inOut' },
          '-=0.3'
        );
    });
  }

  return { set, done };
}
