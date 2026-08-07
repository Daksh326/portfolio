import { rng } from './math.js';

/**
 * Canvas-2D echo of the card shader: same seed, same family of shapes, a
 * hundredth of the cost. Used for the episode rail so there are no image
 * assets to ship, host or keep in sync.
 */

const STOPS = [
  [0.0, [14, 25, 23]],
  [0.42, [37, 73, 67]],
  [0.74, [95, 154, 140]],
  [1.0, [208, 227, 221]],
];

const AMBER = [255, 138, 61];

function ramp(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i - 1];
    const [p2, c2] = STOPS[i];
    if (t <= p2) {
      const k = (t - p1) / (p2 - p1);
      const s = k * k * (3 - 2 * k);
      return [c1[0] + (c2[0] - c1[0]) * s, c1[1] + (c2[1] - c1[1]) * s, c1[2] + (c2[2] - c1[2]) * s];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export function makeThumb(seed = 1, hue = 0, w = 168, h = 104) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rand = rng(seed * 1000 + 7);

  // Tileable value-noise lattice.
  const N = 8;
  const lat = new Float32Array((N + 1) * (N + 1));
  for (let i = 0; i < lat.length; i++) lat[i] = rand();

  const sm = (t) => t * t * (3 - 2 * t);
  const at = (x, y) => lat[(((y % (N + 1)) + N + 1) % (N + 1)) * (N + 1) + (((x % (N + 1)) + N + 1) % (N + 1))];

  const noise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = sm(x - xi);
    const v = sm(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };

  const fbm = (x, y, oct = 4) => {
    let v = 0;
    let amp = 0.5;
    let fx = x;
    let fy = y;
    for (let o = 0; o < oct; o++) {
      v += amp * noise(fx, fy);
      fx *= 2.02;
      fy *= 2.02;
      amp *= 0.5;
    }
    return v;
  };

  const img = ctx.createImageData(w, h);
  const px = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;

      const w1 = fbm(u * 4.2, v * 3.0, 3);
      const f = fbm(u * 5.6 + w1 * 1.6, v * 4.0 + w1 * 1.2, 4);

      const ridge = 1 - Math.abs(f * 2 - 1);
      let t = f * 0.6 + ridge * 0.4;

      // Same vertical light fall as the shader.
      t *= 0.6 + 0.7 * (1 - v);

      let [r, g, b] = ramp(t);

      if (hue > 0) {
        const k = hue * Math.max(0, (t - 0.45) / 0.55) * 0.5;
        r += (AMBER[0] - r) * k;
        g += (AMBER[1] - g) * k;
        b += (AMBER[2] - b) * k;
      }

      // Scanlines + vignette + grain.
      const scan = y % 2 === 0 ? 0.94 : 1;
      const dx = u - 0.5;
      const dy = v - 0.5;
      const vig = 1 - (dx * dx + dy * dy) * 1.5;
      const grain = (rand() - 0.5) * 14;

      const i = (y * w + x) * 4;
      px[i] = Math.max(0, Math.min(255, r * scan * vig + grain));
      px[i + 1] = Math.max(0, Math.min(255, g * scan * vig + grain));
      px[i + 2] = Math.max(0, Math.min(255, b * scan * vig + grain));
      px[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}
