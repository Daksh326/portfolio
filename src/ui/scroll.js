import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { reducedMotion } from '../utils/device.js';

gsap.registerPlugin(ScrollTrigger, CustomEase);

/**
 * The reference's house curve. Read straight off its computed colour
 * transitions — `cubic-bezier(0.44, 0, 0.56, 1)` — and reused for its appear
 * animations, which are JS-driven and so don't show up in computed styles.
 */
export const FRAMER_EASE = CustomEase.create('framer', 'M0,0 C0.44,0 0.56,1 1,1');

/** Framer Motion's default appear duration. */
export const FRAMER_DUR = 0.5;

export const lenis = new Lenis({
  duration: reducedMotion ? 0 : 1.15,
  // Expo-out. The long tail is what makes the whole page feel weighted.
  easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  smoothWheel: !reducedMotion,
  syncTouch: false,
  touchMultiplier: 1.6,
  wheelMultiplier: 1,
  autoRaf: false,
});

/**
 * One clock for everything: GSAP's ticker drives Lenis, Lenis drives
 * ScrollTrigger, and the WebGL loop is a ticker callback too. Nothing runs on
 * its own rAF, so nothing can tear against anything else.
 */
export function initScroll() {
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.defaults({ invalidateOnRefresh: true });

  // Fonts change line-heights; refresh once they've settled.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return { gsap, ScrollTrigger, lenis };
}

export function scrollToId(id, opts = {}) {
  const el = typeof id === 'string' ? document.querySelector(id) : id;
  if (!el) return;
  lenis.scrollTo(el, { duration: 1.25, offset: 0, ...opts });
}

export { gsap, ScrollTrigger };
