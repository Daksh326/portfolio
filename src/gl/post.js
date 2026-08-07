import { Vector2 } from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GRAIN } from './glsl.js';

/**
 * Final film pass: radial chromatic aberration, grain, vignette and a cool
 * shadow lift. Runs after tone mapping so it grades the finished image.
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

      varying vec2 vUv;

      ${GRAIN}

      void main(){
        vec2 uv = vUv;
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);

        // Fringing grows toward the edges and with scroll energy.
        float amt = uAmount * (0.0016 + r2 * 0.0075);
        vec3 col = vec3(
          texture2D(tDiffuse, uv + c * amt).r,
          texture2D(tDiffuse, uv).g,
          texture2D(tDiffuse, uv - c * amt).b
        );

        // Grain, animated per frame but stable per pixel within a frame.
        float g = hash12(uv * uRes + floor(uTime * 24.0) * 91.7);
        col += (g - 0.5) * uGrain;

        // Vignette + cool shadow lift.
        col *= 1.0 - r2 * uVignette;
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col += vec3(0.003, 0.011, 0.010) * (1.0 - smoothstep(0.0, 0.45, lum));

        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }
    `,
  };

  return new ShaderPass(shader);
}
