const mql = (q) => window.matchMedia(q);

export const reducedMotion = mql('(prefers-reduced-motion: reduce)').matches;

export const isTouch = mql('(hover: none), (pointer: coarse)').matches;

export const isMobile = window.innerWidth < 768 || isTouch;
