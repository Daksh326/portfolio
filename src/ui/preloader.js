import { gsap } from './scroll.js';
import { reducedMotion } from '../utils/device.js';

const STEPS = [
  'fonts / metrics',
  'core / geometry',
  'shaders / compile',
  'rail / layout',
  'ready',
];

/**
 * Progress is real, not a fake timer: `set()` is called at genuine milestones
 * during boot. The counter just eases between them so it never stalls visibly.
 */
export function initLoader() {
  const root = document.getElementById('loader');
  const num = document.getElementById('loaderNum');
  const bar = document.getElementById('loaderBar');
  const status = root.querySelector('.loader__status');

  document.documentElement.classList.add('is-locked');

  const state = { p: 0, shown: 0 };
  let raf = 0;

  function paint() {
    // Ease toward the real value; never rewind.
    state.shown += (state.p - state.shown) * 0.09;
    const v = Math.min(100, Math.round(state.shown * 100));
    num.textContent = String(v).padStart(3, '0');
    bar.style.width = `${state.shown * 100}%`;
    status.textContent = STEPS[Math.min(STEPS.length - 1, Math.floor(state.shown * STEPS.length))];
    raf = requestAnimationFrame(paint);
  }
  raf = requestAnimationFrame(paint);

  function set(p) {
    state.p = Math.max(state.p, Math.min(1, p));
  }

  function done() {
    set(1);

    return new Promise((resolve) => {
      const finish = () => {
        cancelAnimationFrame(raf);
        num.textContent = '100';
        bar.style.width = '100%';
        document.documentElement.classList.remove('is-locked', 'is-booting');
        root.remove();
        resolve();
      };

      if (reducedMotion) {
        gsap.set(['.nav', '.rail', 'main'], { opacity: 1 });
        finish();
        return;
      }

      const tl = gsap.timeline({ onComplete: finish });

      tl.to(state, { shown: 1, duration: 0.5, ease: 'power2.out' })
        .to('.loader__num', { yPercent: -115, duration: 0.85, ease: 'expo.inOut' }, '+=0.12')
        .to('.loader__meta', { opacity: 0, duration: 0.35, ease: 'power2.out' }, '<')
        .to('.loader__bar', { scaleX: 0, transformOrigin: 'right', duration: 0.7, ease: 'expo.inOut' }, '<0.05')
        .fromTo(
          root,
          { clipPath: 'inset(0 0 0% 0)' },
          { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' },
          '-=0.35'
        )
        .fromTo(
          ['.nav', 'main'],
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.75'
        )
        .fromTo('.rail', { opacity: 0 }, { opacity: 1, duration: 0.6 }, '<0.2');
    });
  }

  return { set, done };
}
