import { gsap } from './scroll.js';
import { isTouch, reducedMotion } from '../utils/device.js';

/**
 * Elements marked `[data-magnetic]` drift toward the pointer while it's within
 * a padded bounding box, and spring back on exit.
 */
export function initMagnetic(root = document) {
  if (isTouch || reducedMotion) return;

  for (const el of root.querySelectorAll('[data-magnetic]')) {
    if (el.dataset.magneticBound) continue;
    el.dataset.magneticBound = '1';

    const pad = Number(el.dataset.magneticPad || 46);
    const pull = Number(el.dataset.magneticPull || 0.34);
    const qx = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'expo.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'expo.out' });

    let inside = false;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const near =
        e.clientX > r.left - pad &&
        e.clientX < r.right + pad &&
        e.clientY > r.top - pad &&
        e.clientY < r.bottom + pad;

      if (!near) {
        if (inside) {
          inside = false;
          qx(0);
          qy(0);
        }
        return;
      }

      inside = true;
      qx((e.clientX - (r.left + r.width / 2)) * pull);
      qy((e.clientY - (r.top + r.height / 2)) * pull);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
  }
}
