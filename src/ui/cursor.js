import { gsap } from './scroll.js';
import { isTouch } from '../utils/device.js';
import { damp } from '../utils/math.js';

/**
 * Two-part cursor: a dot that tracks almost 1:1 and a ring that lags behind it.
 * The lag is the whole trick — it reads as weight.
 */
export function initCursor() {
  if (isTouch) return { update() {} };

  const root = document.querySelector('.cursor');
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');

  document.documentElement.classList.add('has-cursor');

  const m = { x: innerWidth / 2, y: innerHeight / 2 };
  const r = { ...m };
  const d = { ...m };

  /**
   * Because the native cursor is hidden, whenever this is invisible the user
   * has no pointer at all. It must therefore come back unconditionally — an
   * earlier `if (!shown)` guard latched after the first move, so once the
   * pointer left the window the class was removed and never re-added, leaving
   * the page with no visible cursor until a reload.
   */
  const show = () => root.classList.add('is-on');
  const hide = () => root.classList.remove('is-on');

  window.addEventListener(
    'pointermove',
    (e) => {
      m.x = e.clientX;
      m.y = e.clientY;
      show();
    },
    { passive: true }
  );

  // Leaving through any edge, or losing the window entirely.
  document.addEventListener('pointerleave', hide);
  document.addEventListener('pointerenter', show);
  window.addEventListener('blur', hide);

  // A touch anywhere means the pointer model changed — get out of the way.
  window.addEventListener('touchstart', hide, { passive: true });

  // Delegated, so content injected from content.js works without rebinding.
  const HOVER = 'a, button, [data-cursor], .stats li, .focus li, .quotes li';

  document.addEventListener(
    'pointerover',
    (e) => {
      if (e.target.closest?.(HOVER)) root.classList.add('is-hover');
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerout',
    (e) => {
      if (e.target.closest?.(HOVER)) root.classList.remove('is-hover');
    },
    { passive: true }
  );

  function update(dt) {
    d.x = damp(d.x, m.x, 0.5, dt);
    d.y = damp(d.y, m.y, 0.5, dt);
    r.x = damp(r.x, m.x, 0.17, dt);
    r.y = damp(r.y, m.y, 0.17, dt);
    gsap.set(dot, { x: d.x, y: d.y });
    gsap.set(ring, { x: r.x, y: r.y });
  }

  return { update };
}
