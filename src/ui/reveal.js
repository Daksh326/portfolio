import { gsap, ScrollTrigger, FRAMER_EASE, FRAMER_DUR } from './scroll.js';
import { reducedMotion } from '../utils/device.js';

/**
 * Entrance animations, matched to the reference.
 *
 * Its motion is JS-driven, so none of it shows in computed styles — but the
 * pre-animation states do, and those pin the shapes exactly:
 *
 *   blocks   translateY(10px)   opacity 0     (perspective(1200px) on the hero)
 *   menu     translateY(-40px)  opacity 0.001  — drops down, not up
 *   images   scale(1.2)         opacity 0.001  — zooms out, not in
 *
 * The travel is the thing an earlier pass got wrong: it moved a whole element
 * height (yPercent 110) where the reference moves 10 pixels. Same easing, same
 * duration, but roughly ten times the distance, which is why it read as a
 * different site.
 */

const START = 'top 88%';

export function initReveals(root = document) {
  for (const el of root.querySelectorAll('[data-reveal]')) {
    if (el.dataset.revealed) continue;
    // The hero is choreographed by playIntro().
    if (el.closest('.hero')) continue;
    el.dataset.revealed = '1';

    const type = el.dataset.reveal || 'fade';

    if (reducedMotion) {
      gsap.set(type === 'stagger' ? el.children : el, { clearProps: 'all' });
      continue;
    }

    if (type === 'stagger') revealStagger(el);
    else revealFade(el);
  }

  revealShots(root);
}

function trigger(el) {
  return { trigger: el, start: START, once: true };
}

function revealFade(el) {
  gsap.fromTo(
    el,
    { y: 10, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: FRAMER_DUR,
      ease: FRAMER_EASE,
      scrollTrigger: trigger(el),
    }
  );
}

function revealStagger(el) {
  gsap.fromTo(
    [...el.children],
    { y: 10, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: FRAMER_DUR,
      ease: FRAMER_EASE,
      stagger: 0.06,
      scrollTrigger: trigger(el),
    }
  );
}

/** Images settle out of a 1.2 zoom rather than zooming in on hover. */
function revealShots(root) {
  for (const shot of root.querySelectorAll('.shot')) {
    if (shot.dataset.revealed) continue;
    shot.dataset.revealed = '1';

    const img = shot.querySelector('img');
    if (!img || reducedMotion) continue;

    gsap.fromTo(
      img,
      { scale: 1.2 },
      {
        scale: 1,
        duration: 0.9,
        ease: FRAMER_EASE,
        scrollTrigger: { trigger: shot, start: 'top 92%', once: true },
      }
    );
  }
}

/** Hero intro — runs once, straight after the preloader hands over. */
export function playIntro() {
  const tl = gsap.timeline({ defaults: { ease: FRAMER_EASE, duration: FRAMER_DUR } });
  const stack = [...document.querySelectorAll('.hero__stack span')];
  const parts = ['.hero__display', '.hero__rule', '.hero__meta'];

  if (reducedMotion) {
    gsap.set([...parts, ...stack, '.hero__cue'], { clearProps: 'all' });
    return tl;
  }

  // perspective(1200px) is what the reference's matrix3d resolves to.
  gsap.set('.hero', { perspective: 1200 });
  gsap.set([...parts, ...stack, '.hero__cue'], { y: 10, opacity: 0 });

  tl.to('.hero__display', { y: 0, opacity: 1 }, 0)
    .to('.hero__rule', { y: 0, opacity: 1 }, 0.08)
    .to('.hero__meta', { y: 0, opacity: 1 }, 0.14)
    .to(stack, { y: 0, opacity: 1, stagger: 0.06 }, 0.2)
    .to('.hero__cue', { y: 0, opacity: 1 }, 0.42);

  return tl;
}

export { ScrollTrigger };
