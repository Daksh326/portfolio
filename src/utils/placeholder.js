import { rng } from './math.js';

/**
 * Deterministic abstract plates, drawn on a canvas at runtime.
 *
 * These exist so the layout has real images in it without shipping, hosting or
 * licensing any. Same seed always draws the same picture, so nothing shifts
 * between reloads. Swap any slot for a real photo by giving it a `src` in
 * content.js — the generator is only used when `src` is absent.
 */

/** Dark, desaturated, with just enough vermilion to belong to the palette. */
const STOPS = [
  [0.0, [10, 10, 10]],
  [0.35, [28, 28, 30]],
  [0.62, [72, 72, 76]],
  [0.85, [140, 140, 143]],
  [1.0, [208, 206, 203]],
];

const ACCENT = [250, 78, 62];

function ramp(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i - 1];
    const [p2, c2] = STOPS[i];
    if (t <= p2) {
      const k = (t - p1) / (p2 - p1);
      const s = k * k * (3 - 2 * k);
      return [
        c1[0] + (c2[0] - c1[0]) * s,
        c1[1] + (c2[1] - c1[1]) * s,
        c1[2] + (c2[2] - c1[2]) * s,
      ];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/**
 * @param {number} seed  any number — same seed, same image
 * @param {number} w     pixel width to render at
 * @param {number} h     pixel height to render at
 * @returns {string} a data: URL, or '' if canvas is unavailable
 */
export function makePlaceholder(seed = 1, w = 480, h = 270) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rand = rng(seed * 977 + 13);

  // Tileable value-noise lattice.
  const N = 8;
  const lat = new Float32Array((N + 1) * (N + 1));
  for (let i = 0; i < lat.length; i++) lat[i] = rand();

  const sm = (t) => t * t * (3 - 2 * t);
  const wrap = (v) => ((v % (N + 1)) + N + 1) % (N + 1);
  const at = (x, y) => lat[wrap(y) * (N + 1) + wrap(x)];

  const noise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = sm(x - xi);
    const v = sm(y - yi);
    return (
      (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) +
      (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v
    );
  };

  const fbm = (x, y, oct = 5) => {
    let sum = 0;
    let amp = 0.5;
    let fx = x;
    let fy = y;
    for (let o = 0; o < oct; o++) {
      sum += amp * noise(fx, fy);
      fx *= 2.03;
      fy *= 2.03;
      amp *= 0.5;
    }
    return sum;
  };

  // A drifting light direction per seed, so plates don't all look alike.
  const lightX = rand();
  const lightY = rand() * 0.6;
  const warmth = rand() * 0.5;

  const img = ctx.createImageData(w, h);
  const px = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;

      const warp = fbm(u * 3.4, v * 3.4, 3);
      let f = fbm(u * 5.2 + warp * 1.5, v * 5.2 + warp * 1.1, 5);

      // Ridges read as structure rather than fog.
      const ridge = 1 - Math.abs(f * 2 - 1);
      let t = f * 0.55 + ridge * 0.45;

      // Directional falloff — a light source somewhere off-frame.
      const d = Math.hypot(u - lightX, v - lightY);
      t *= 1.15 - d * 0.55;
      t = Math.max(0, Math.min(1, Math.pow(t, 1.35)));

      let [r, g, b] = ramp(t);

      // A whisper of accent in the highlights only.
      const k = warmth * Math.max(0, (t - 0.6) / 0.4) * 0.28;
      r += (ACCENT[0] - r) * k;
      g += (ACCENT[1] - g) * k;
      b += (ACCENT[2] - b) * k;

      // Vignette + grain.
      const dx = u - 0.5;
      const dy = v - 0.5;
      const vig = 1 - (dx * dx + dy * dy) * 0.85;
      const grain = (rand() - 0.5) * 11;

      const i = (y * w + x) * 4;
      px[i] = Math.max(0, Math.min(255, r * vig + grain));
      px[i + 1] = Math.max(0, Math.min(255, g * vig + grain));
      px[i + 2] = Math.max(0, Math.min(255, b * vig + grain));
      px[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.82);
}
