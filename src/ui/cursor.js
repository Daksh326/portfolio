import { gsap } from './scroll.js';
import { isTouch } from '../utils/device.js';
import { damp } from '../utils/math.js';

/**
 * Two-part cursor: a dot that tracks 1:1 and a ring that lags behind it.
 * The lag is the whole trick — it reads as weight.
 */
export function initCursor() {
  if (isTouch) return { update() {}, enter() {}, leave() {} };

  const root = document.querySelector('.cursor');
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  const label = root.querySelector('.cursor__label');

  document.documentElement.classList.add('has-cursor');

  const m = { x: innerWidth / 2, y: innerHeight / 2 };
  const r = { x: m.x, y: m.y };
  const d = { x: m.x, y: m.y };
  let shown = false;
  let forced = null;

  const LABELS = {
    link: '',
    play: 'Play',
    view: 'View',
    arrow: '',
    drag: 'Drag',
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      m.x = e.clientX;
      m.y = e.clientY;
      if (!shown) {
        shown = true;
        root.classList.add('is-on');
      }
    },
    { passive: true }
  );

  window.addEventListener('pointerdown', () => root.classList.add('is-down'), { passive: true });
  window.addEventListener('pointerup', () => root.classList.remove('is-down'), { passive: true });
  document.addEventListener('pointerleave', () => root.classList.remove('is-on'));

  // Delegate hover state so dynamically injected content works for free.
  const HOVER_SEL = 'a, button, [data-cursor], .thumbs li, .rail__list li, .stackCard li';

  document.addEventListener(
    'pointerover',
    (e) => {
      const t = e.target.closest?.(HOVER_SEL);
      if (!t || forced) return;
      root.classList.add('is-hover');
      label.textContent = LABELS[t.dataset.cursor] ?? '';
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerout',
    (e) => {
      if (e.target.closest?.(HOVER_SEL) && !forced) root.classList.remove('is-hover');
    },
    { passive: true }
  );

  function enter(kind) {
    forced = kind;
    root.classList.add('is-hover');
    label.textContent = LABELS[kind] ?? '';
  }

  function leave() {
    if (!forced) return;
    forced = null;
    root.classList.remove('is-hover');
    label.textContent = '';
  }

  function update(dt) {
    d.x = damp(d.x, m.x, 0.45, dt);
    d.y = damp(d.y, m.y, 0.45, dt);
    r.x = damp(r.x, m.x, 0.16, dt);
    r.y = damp(r.y, m.y, 0.16, dt);

    gsap.set(dot, { x: d.x, y: d.y });
    gsap.set(ring, { x: r.x, y: r.y });
  }

  return { update, enter, leave };
}
