import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
} from 'three';
import { SIMPLEX3, FBM } from './glsl.js';
import { damp } from '../utils/math.js';

/**
 * The "core": a turbulent particle mass wrapped in thin instrument rings and
 * sitting in its own haze. Present in the hero and again behind the contact
 * section. Deliberately not a tidy sphere — the reference frames are
 * photographic and hazy, not wireframe.
 */
export class Core extends Group {
  constructor({ tier }) {
    super();

    this.count = tier === 0 ? 7000 : tier === 1 ? 18000 : 38000;
    this.uOpacity = { value: 0 };
    this._pointer = { x: 0, y: 0 };
    this._energy = 0;

    // Right of centre, so the hero headline reads against empty space.
    this.position.set(1.35, 0.1, -0.6);

    this._buildHaze();
    this._buildPoints();
    this._buildRings();
  }

  /* ── soft volumetric glow behind everything ────────────────────────── */
  _buildHaze() {
    this.hazeMat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: this.uOpacity,
        uEnergy: { value: 0 },
        uColor: { value: new Color('#2f6e63') },
        uHot: { value: new Color('#7a3f16') },
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
        uniform float uTime;
        uniform float uOpacity;
        uniform float uEnergy;
        uniform vec3 uColor;
        uniform vec3 uHot;
        varying vec2 vUv;

        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float halo = pow(max(1.0 - d, 0.0), 3.2);
          float core = pow(max(1.0 - d * 2.6, 0.0), 2.4);
          float breathe = 0.85 + 0.15 * sin(uTime * 0.42);

          vec3 col = uColor * halo + uHot * core * (0.5 + uEnergy);
          gl_FragColor = vec4(col, (halo * 0.42 + core * 0.5) * uOpacity * breathe);
        }
      `,
    });

    this.haze = new Mesh(new PlaneGeometry(9, 9), this.hazeMat);
    this.haze.position.z = -1.4;
    this.haze.renderOrder = -1;
    this.haze.frustumCulled = false;
    this.add(this.haze);
  }

  /* ── particle mass ─────────────────────────────────────────────────── */
  _buildPoints() {
    const n = this.count;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const shell = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      // Three populations: hot nucleus, body, and a thin scattered halo.
      const band = i % 5;
      const inner = band === 0;
      const halo = band === 4;

      const r = inner
        ? 0.18 + Math.random() * 0.5
        : halo
          ? 1.35 + Math.pow(Math.random(), 1.4) * 1.35
          : 0.55 + Math.pow(Math.random(), 0.7) * 0.95;

      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);

      pos[i * 3] = s * Math.cos(th) * r;
      pos[i * 3 + 1] = s * Math.sin(th) * r * 0.88;
      pos[i * 3 + 2] = u * r;

      seed[i] = Math.random();
      shell[i] = halo ? 1 : inner ? 0 : 0.5;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    geo.setAttribute('aShell', new BufferAttribute(shell, 1));

    this.mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: this.uOpacity,
        uEnergy: { value: 0 },
        uSize: { value: 20 },
        uColorA: { value: new Color('#4f8f80') }, // teal body
        uColorB: { value: new Color('#ff8a3d') }, // amber nucleus
        uColorC: { value: new Color('#bcd6ce') }, // pale rim
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute float aShell;

        uniform float uTime;
        uniform float uEnergy;
        uniform float uSize;

        varying float vSeed;
        varying float vShell;
        varying float vDepth;
        varying float vRad;

        ${SIMPLEX3}
        ${FBM}

        void main(){
          vec3 p = position;
          float r = length(p);

          // Turbulence, so the mass never resolves into a sphere.
          float t = uTime * 0.075;
          vec3 q = p * 1.15 + vec3(0.0, t * 0.6, t);
          float n = fbm(q, 4);
          vec3 dir = normalize(p + 1e-5);

          p += dir * n * (0.42 + 0.6 * aShell);
          p += vec3(n, fbm(q + 5.2, 3), fbm(q + 11.7, 3)) * 0.22;

          float pulse = sin(uTime * 0.5 + r * 2.4 + aSeed * 6.28) * 0.5 + 0.5;
          p *= 1.0 + pulse * 0.03 + uEnergy * 0.06;

          vSeed = aSeed;
          vShell = aShell;
          vRad = clamp(length(p) / 2.6, 0.0, 1.0);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vDepth = clamp((-mv.z - 3.0) / 9.0, 0.0, 1.0);

          gl_Position = projectionMatrix * mv;

          // uSize is device px per world unit at unit depth, so this is a real
          // world-space radius rather than a magic pixel number.
          gl_PointSize = uSize * (0.4 + aSeed * 0.85) / max(-mv.z, 0.001);
          gl_PointSize = clamp(gl_PointSize, 0.7, 7.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;

        uniform float uTime;
        uniform float uOpacity;
        uniform float uEnergy;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;

        varying float vSeed;
        varying float vShell;
        varying float vDepth;
        varying float vRad;

        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = dot(c, c);
          if (d > 0.25) discard;
          float a = smoothstep(0.25, 0.005, d);

          // Amber nucleus → pale shoulder → teal body → dim rim.
          vec3 col = mix(uColorB, uColorC, smoothstep(0.02, 0.24, vRad));
          col = mix(col, uColorA, smoothstep(0.2, 0.62, vRad));
          col *= mix(1.25, 0.55, smoothstep(0.45, 1.0, vRad));

          float tw = 0.6 + 0.4 * sin(uTime * (1.1 + vSeed * 2.4) + vSeed * 40.0);
          float fade = mix(1.0, 0.28, vDepth) * mix(1.0, 0.62, vShell);

          gl_FragColor = vec4(col, a * tw * fade * uOpacity * (0.72 + uEnergy * 0.3));
        }
      `,
    });

    this.points = new Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.add(this.points);
  }

  /* ── instrument rings ──────────────────────────────────────────────── */
  _buildRings() {
    this.rings = new Group();
    this.ringMats = [];

    const specs = [
      { r: 1.62, tilt: [0.42, 0.1, 0.0], c: '#4e8478', o: 0.5 },
      { r: 2.05, tilt: [-0.28, 0.55, 0.2], c: '#3d6a61', o: 0.34 },
      { r: 2.52, tilt: [1.15, -0.2, 0.35], c: '#7a4a24', o: 0.26 },
    ];

    for (const s of specs) {
      const pts = [];
      const N = 180;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        pts.push(Math.cos(a) * s.r, Math.sin(a) * s.r, 0);
      }
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));

      const m = new LineBasicMaterial({
        color: new Color(s.c),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      m.userData.base = s.o;
      this.ringMats.push(m);

      const loop = new LineLoop(g, m);
      loop.rotation.set(...s.tilt);
      loop.userData.spin = (Math.random() - 0.5) * 0.08 - 0.03;
      this.rings.add(loop);
    }

    this.add(this.rings);
  }

  setPointer(x, y) {
    this._pointer.x = x;
    this._pointer.y = y;
  }

  /** @param {number} energy 0..1 — driven by scroll velocity */
  update(t, dt, energy = 0) {
    this._energy = damp(this._energy, energy, 0.08, dt);

    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uEnergy.value = this._energy;
    this.hazeMat.uniforms.uTime.value = t;
    this.hazeMat.uniforms.uEnergy.value = this._energy;

    // Ease toward the pointer instead of snapping — this is most of the "smooth".
    this.rotation.y = damp(this.rotation.y, this._pointer.x * 0.3 + t * 0.035, 0.045, dt);
    this.rotation.x = damp(this.rotation.x, -this._pointer.y * 0.2, 0.045, dt);

    for (let i = 0; i < this.rings.children.length; i++) {
      const ring = this.rings.children[i];
      ring.rotation.z += dt * ring.userData.spin;
      this.ringMats[i].opacity = this.uOpacity.value * this.ringMats[i].userData.base;
    }

    this.visible = this.uOpacity.value > 0.002;
  }

  /** @param {number} projScale device px per world unit at unit depth */
  resize(projScale) {
    this.mat.uniforms.uSize.value = 0.014 * projScale;
  }

  dispose() {
    this.points.geometry.dispose();
    this.mat.dispose();
    this.haze.geometry.dispose();
    this.hazeMat.dispose();
    for (const r of this.rings.children) r.geometry.dispose();
    for (const m of this.ringMats) m.dispose();
  }
}
