export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Frame-rate independent damping. `k` is roughly "fraction closed per 60fps
 * frame", so damp(x, target, 0.1, dt) behaves identically at 60Hz and 144Hz.
 */
export const damp = (current, target, k, dt) =>
  lerp(current, target, 1 - Math.pow(1 - k, dt * 60));

export const map = (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1);

export const mapClamp = (v, a1, a2, b1, b2) =>
  clamp(map(v, a1, a2, b1, b2), Math.min(b1, b2), Math.max(b1, b2));

/** Smooth 0→1→0 window; 1 at the centre of [a,b]. */
export const bell = (v, a, b) => {
  const t = clamp((v - a) / (b - a));
  return Math.sin(t * Math.PI);
};

export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Deterministic PRNG so a project's `seed` always renders the same art. */
export const rng = (seed) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const pad2 = (n) => String(n).padStart(2, '0');
