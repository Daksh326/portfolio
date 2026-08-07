import { Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { damp } from '../utils/math.js';

/**
 * Floor grid receding into haze. It's what makes the page read as a 3D space
 * rather than a flat canvas with particles on it. Lines are measured in world
 * units and fade with real distance, so perspective does the work.
 */
export class Grid extends Mesh {
  constructor() {
    const geo = new PlaneGeometry(90, 90, 1, 1);

    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uScroll: { value: 0 },
        uColor: { value: new Color('#3c6f65') },
        uHot: { value: new Color('#ff8a3d') },
      },
      vertexShader: /* glsl */ `
        varying vec2 vPos;   // plane-local, == world XZ
        varying float vDist; // distance from the camera, in world units

        void main(){
          vPos = position.xy;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDist = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;

        uniform float uTime;
        uniform float uOpacity;
        uniform float uScroll;
        uniform vec3 uColor;
        uniform vec3 uHot;

        varying vec2 vPos;
        varying float vDist;

        // Anti-aliased line every "cell" world units.
        float grid(vec2 p, float cell, float weight){
          vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
          vec2 d = fwidth(p) * weight;
          vec2 l = 1.0 - smoothstep(vec2(0.0), d, g);
          return clamp(max(l.x, l.y), 0.0, 1.0);
        }

        void main(){
          // Drift with scroll so movement is felt, not just seen.
          vec2 p = vPos + vec2(0.0, uScroll * 1.6 + uTime * 0.06);

          float fine = grid(p, 1.0, 1.0) * 0.30;
          float bold = grid(p, 5.0, 1.4) * 0.80;
          float g = max(fine, bold);

          // Two falloffs: the grid dissolves far away and also right under the
          // camera, so there's no hard edge anywhere.
          float far  = 1.0 - smoothstep(12.0, 40.0, vDist);
          float near = smoothstep(3.0, 7.0, vDist);
          float radial = 1.0 - smoothstep(10.0, 34.0, length(vPos));

          // A slow pulse travelling outward from the origin.
          float ping = sin(length(vPos) * 0.55 - uTime * 0.7) * 0.5 + 0.5;
          ping = pow(ping, 6.0);
          vec3 col = mix(uColor, uHot, ping * 0.35);

          float a = g * far * near * radial * uOpacity * 0.5;
          if (a < 0.002) discard;
          gl_FragColor = vec4(col, a);
        }
      `,
    });

    super(geo, mat);

    this.rotation.x = -Math.PI / 2;
    this.position.y = -3.2;
    this.frustumCulled = false;
    this.uOpacity = mat.uniforms.uOpacity;
    this._mat = mat;
    this._scroll = 0;
  }

  update(t, dt, scroll) {
    this._scroll = damp(this._scroll, scroll, 0.06, dt);
    this._mat.uniforms.uTime.value = t;
    this._mat.uniforms.uScroll.value = this._scroll;
    this.visible = this.uOpacity.value > 0.002;
  }

  dispose() {
    this.geometry.dispose();
    this._mat.dispose();
  }
}
