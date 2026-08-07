import { Color, Vector2 } from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GRAIN } from './glsl.js';

/**
 * Final grade. Two looks in one pass, cross-faded by `uTheme`:
 *
 *   0 — dark: radial chromatic aberration, film grain, vignette, cool lift.
 *   1 — light: the scene's luminance becomes ink density on a rotated dot
 *       screen, printed black on paper.
 *
 * Doing the halftone here rather than in each object's shader is what keeps
 * the light theme cheap: the particle core, the grid and the project cards
 * need no changes at all — whatever is bright becomes ink.
 */
export function makeFilmPass() {
  const shader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uAmount: { value: 0 },
      uGrain: { value: 0.05 },
      uVignette: { value: 0.72 },
      uRes: { value: new Vector2(1, 1) },

      uTheme: { value: 0 },
      uDot: { value: 5 },
      uPaper: { value: new Color('#f4f3f0') },
      uInk: { value: new Color('#0d0d0d') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uAmount;
      uniform float uGrain;
      uniform float uVignette;
      uniform vec2 uRes;

      uniform float uTheme;
      uniform float uDot;
      uniform vec3 uPaper;
      uniform vec3 uInk;

      varying vec2 vUv;

      ${GRAIN}

      const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

      // One screen of dots at a given angle. Returns ink coverage, 0..1.
      float screenDots(vec2 px, float angle, float density){
        float c = cos(angle), s = sin(angle);
        vec2 p = mat2(c, -s, s, c) * px / uDot;

        vec2 cell = fract(p) - 0.5;
        float d = length(cell);

        // Dot area tracks density, so the ramp stays perceptually even.
        float r = sqrt(clamp(density, 0.0, 1.0)) * 0.66;
        float aa = max(fwidth(d), 1e-4) * 1.1;
        return smoothstep(r + aa, r - aa, d);
      }

      void main(){
        vec2 uv = vUv;
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);

        // Fringing grows toward the edges and with scroll energy. Mostly
        // suppressed on paper, where colour fringes would be wrong.
        float amt = uAmount * (0.0016 + r2 * 0.0075) * (1.0 - uTheme * 0.75);
        vec3 col = vec3(
          texture2D(tDiffuse, uv + c * amt).r,
          texture2D(tDiffuse, uv).g,
          texture2D(tDiffuse, uv - c * amt).b
        );

        /* ── dark: film ─────────────────────────────────────────────────── */
        float g = hash12(uv * uRes + floor(uTime * 24.0) * 91.7);
        vec3 dark = col + (g - 0.5) * uGrain;
        dark *= 1.0 - r2 * uVignette;
        float lumD = dot(dark, LUMA);
        dark += vec3(0.003, 0.011, 0.010) * (1.0 - smoothstep(0.0, 0.45, lumD));

        /* ── light: halftone ───────────────────────────────────────────── */
        float lum = dot(col, LUMA);

        // Lift the scene off the paper: near-black background must print as
        // clean white, so the toe is clipped hard before the screen.
        float ink = smoothstep(0.035, 0.62, lum);
        ink = pow(ink, 0.85);

        // A touch of paper tooth, so flat areas aren't mechanically perfect.
        ink += (hash12(floor(uv * uRes / uDot)) - 0.5) * 0.05;

        vec2 px = uv * uRes;
        float cov = screenDots(px, 0.4014, ink); // ~23°, the classic K angle
        vec3 light = mix(uPaper, uInk, clamp(cov, 0.0, 1.0));

        // Very soft edge burn keeps the page from looking like a flat swatch.
        light = mix(light, light * 0.965, smoothstep(0.24, 0.62, r2));

        gl_FragColor = vec4(max(mix(dark, light, uTheme), 0.0), 1.0);
      }
    `,
  };

  return new ShaderPass(shader);
}
