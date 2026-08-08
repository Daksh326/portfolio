import { gsap, ScrollTrigger } from './scroll.js';
import { splitChars, splitLines } from './split.js';
import { reducedMotion } from '../utils/device.js';

const START = 'top 84%';

/**
 * Wires every `[data-reveal]` in a root to a one-shot scroll animation.
 * Types: chars · lines · fade · rule · stagger
 */
export function initReveals(root = document) {
  const nodes = [...root.querySelectorAll('[data-reveal]')];

  for (const el of nodes) {
    if (el.dataset.revealed) continue;
    // The hero is choreographed by playIntro(); letting a scroll trigger also
    // claim it would animate the same characters twice.
    if (el.closest('.hero')) continue;
    el.dataset.revealed = '1';

    const type = el.dataset.reveal || 'fade';

    if (reducedMotion) {
      // Still split (layout parity) but show everything immediately.
      if (type === 'chars') splitChars(el);
      if (type === 'lines') splitLines(el);
      gsap.set(el, { clearProps: 'all' });
      if (type === 'rule') gsap.set(el, { scaleX: 1 });
      continue;
    }

    switch (type) {
      case 'chars':
        revealChars(el);
        break;
      case 'lines':
        revealLines(el);
        break;
      case 'rule':
        revealRule(el);
        break;
      case 'stagger':
        revealStagger(el);
        break;
      default:
        revealFade(el);
    }
  }
}

function trigger(el, extra = {}) {
  return { trigger: el, start: START, once: true, ...extra };
}

function revealChars(el) {
  const chars = splitChars(el);
  gsap.set(chars, { yPercent: 118, rotate: 4 });
  gsap.to(chars, {
    yPercent: 0,
    rotate: 0,
    duration: 1.15,
    ease: 'expo.out',
    stagger: { each: 0.022, from: 'start' },
    scrollTrigger: trigger(el),
  });
}

function revealLines(el) {
  const lines = splitLines(el);
  gsap.set(lines, { yPercent: 108, opacity: 0 });
  gsap.to(lines, {
    yPercent: 0,
    opacity: 1,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: trigger(el),
  });
}

function revealFade(el) {
  gsap.set(el, { y: 26, opacity: 0 });
  gsap.to(el, {
    y: 0,
    opacity: 1,
    duration: 1.05,
    ease: 'expo.out',
    scrollTrigger: trigger(el),
  });
}

function revealRule(el) {
  gsap.set(el, { scaleX: 0 });
  gsap.to(el, {
    scaleX: 1,
    duration: 1.35,
    ease: 'expo.inOut',
    scrollTrigger: trigger(el),
  });
}

function revealStagger(el) {
  const kids = [...el.children];
  gsap.set(kids, { y: 34, opacity: 0 });
  gsap.to(kids, {
    y: 0,
    opacity: 1,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.07,
    scrollTrigger: trigger(el),
  });
}

/** Hero intro — runs once, straight after the preloader hands over. */
export function playIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const stack = [...document.querySelectorAll('.hero__stack span')];

  if (reducedMotion) {
    gsap.set(['.hero__rule', '.hero__meta', '.hero__cue'], { opacity: 1, y: 0 });
    gsap.set(stack, { opacity: 1, yPercent: 0 });
    return tl;
  }

  const display = document.querySelector('.hero__display');
  const chars = display ? splitChars(display) : [];

  gsap.set(chars, { yPercent: 118 });
  gsap.set(stack, { yPercent: 110, opacity: 0 });
  gsap.set(['.hero__rule', '.hero__meta', '.hero__cue'], { y: 24, opacity: 0 });

  tl.to(chars, { yPercent: 0, duration: 1.5, stagger: { each: 0.03, from: 'start' } }, 0.05)
    .to('.hero__rule', { y: 0, opacity: 1, duration: 1 }, 0.45)
    .to('.hero__meta', { y: 0, opacity: 1, duration: 1 }, 0.55)
    // The stacked assertions land one after another — the signature beat.
    .to(stack, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.075 }, 0.6)
    .to('.hero__cue', { y: 0, opacity: 1, duration: 1 }, 0.95);

  return tl;
}

export { ScrollTrigger };
