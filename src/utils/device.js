/**
 * Capability probe. Everything expensive in the WebGL layer is gated on `tier`
 * so a phone or an integrated GPU still gets a smooth 60fps page.
 */

const mql = (q) => window.matchMedia(q);

export const reducedMotion = mql('(prefers-reduced-motion: reduce)').matches;

export const isTouch = mql('(hover: none), (pointer: coarse)').matches;

export const isMobile = window.innerWidth < 768 || isTouch;

function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export const hasWebGL = detectWebGL();

/** 0 = low (no bloom, thin particle field) · 1 = mid · 2 = high */
export function detectTier() {
  if (!hasWebGL || reducedMotion) return 0;

  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const dpr = window.devicePixelRatio || 1;
  const px = window.innerWidth * window.innerHeight * dpr * dpr;

  if (isMobile) return cores >= 6 && mem >= 4 ? 1 : 0;
  if (cores <= 4 || mem <= 4) return 1;
  // A 5K display with a mid GPU is slower than 1080p with the same GPU.
  if (px > 1920 * 1080 * 4) return 1;
  return 2;
}

export const tier = detectTier();

export const maxDPR = tier === 0 ? 1 : tier === 1 ? 1.5 : 2;
