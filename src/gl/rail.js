import {
  Color,
  Group,
  Mesh,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Vector2,
} from 'three';
import { SIMPLEX3, FBM, GRAIN, SD_ROUND_BOX } from './glsl.js';
import { clamp, damp } from '../utils/math.js';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uBend;
  uniform float uEnter;

  varying vec2 vUv;
  varying float vShade;

  void main(){
    vUv = uv;
    vec3 p = position;
    float cx = uv.x - 0.5;

    // Cylindrical curve: the card is a slice of a barrel, not a flat plane.
    p.z -= cx * cx * uBend;

    // Breathing ripple while hovered.
    p.z += sin(uv.y * 3.4 + uTime * 0.9) * 0.026 * uHover;

    // Entry: cards unfold from a slight fold.
    p.z -= (1.0 - uEnter) * cx * cx * 1.6;
    p.y *= mix(0.88, 1.0, uEnter);

    vShade = 1.0 - cx * cx * 0.75;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSeed;
  uniform float uHue;      // 0 = teal, 1 = amber
  uniform float uHover;
  uniform float uFocus;
  uniform float uOpacity;
  uniform float uVel;
  uniform float uAspect;
  uniform float uEnter;

  varying vec2 vUv;
  varying float vShade;

  ${SIMPLEX3}
  ${FBM}
  ${GRAIN}
  ${SD_ROUND_BOX}

  const vec3 C_DEEP  = vec3(0.030, 0.048, 0.045);
  const vec3 C_MID   = vec3(0.082, 0.158, 0.146);
  const vec3 C_TEAL  = vec3(0.255, 0.430, 0.392);
  const vec3 C_PALE  = vec3(0.700, 0.800, 0.772);
  const vec3 C_AMBER = vec3(1.000, 0.541, 0.239);

  // Colour ramp — sampled three times at tiny offsets to fake prism fringing.
  // Weighted dark: highlights are rare, which is what reads as "photographic".
  vec3 ramp(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(C_DEEP, C_MID, smoothstep(0.0, 0.38, t));
    c = mix(c, C_TEAL, smoothstep(0.36, 0.78, t));
    c = mix(c, C_PALE, smoothstep(0.84, 1.0, t));
    return c;
  }

  void main(){
    vec2 uv = vUv;

    // Horizontal tear that only shows up when the rail is moving fast.
    float rowNoise = hash12(vec2(floor(uv.y * 140.0), floor(uTime * 12.0)));
    uv.x += (rowNoise - 0.5) * 0.05 * smoothstep(0.15, 1.4, abs(uVel));

    vec2 p = vec2(uv.x * uAspect, uv.y);

    // Domain-warped fbm — reads as an aerial photograph nobody can place.
    float t = uTime * 0.03 + uSeed;
    float w1 = fbm(vec3(p * 1.9, t), 3);
    float w2 = fbm(vec3(p * 3.3 + w1 * 0.85, t * 1.3 + 4.0), 3);
    float f  = fbm(vec3(p * 2.6 + vec2(w2 * 0.7, w1 * 0.55), t * 0.7 + 11.0), 5);

    // Sharp crests over a centred base, then crushed so the mids sit low —
    // an even exposure here is what made this look like marble instead of film.
    float base  = f * 0.9 + 0.5;
    float ridge = 1.0 - abs(f) * 1.9;
    float field = clamp(base * 0.74 + ridge * 0.2, 0.0, 1.0);

    // Fine grit, so it holds up at full-card size.
    field += fbm(vec3(p * 9.5, t * 2.1 + 30.0), 3) * 0.11;
    field = pow(clamp(field, 0.0, 1.0), 1.75);

    // Contour terracing, like a topographic plate.
    float terr = smoothstep(0.46, 0.5, fract(f * 5.0));
    field = mix(field, field * 1.1, terr * 0.45);

    // Vertical light fall — haze at the top, ground in shadow at the bottom.
    field *= mix(0.4, 1.08, smoothstep(0.0, 0.95, uv.y));

    // Raking light from the upper left.
    field *= 1.0 + 0.18 * smoothstep(1.2, 0.0, length(uv - vec2(0.2, 0.95)));

    // Prism split scales with rail velocity and hover.
    float sh = abs(uVel) * 0.035 + uHover * 0.012;
    vec3 col = vec3(
      ramp(field + sh).r,
      ramp(field).g,
      ramp(field - sh).b
    );

    // Radar arcs. The origin sits off the left edge so only segments cross the
    // frame — centred rings read as a bullseye, which is not the reference.
    vec2 rc = (uv - vec2(-0.22, 0.46)) * vec2(uAspect, 1.0);
    float rd = length(rc);
    float rings = smoothstep(0.972, 1.0, sin(rd * 26.0 - uTime * 0.4) * 0.5 + 0.5);
    rings *= smoothstep(1.5, 0.35, rd) * 0.05;
    col += vec3(rings) * mix(C_TEAL, C_AMBER, uHue * 0.5);

    // Amber only where the project's hue asks for it, plus a hover push.
    col = mix(col, mix(col, C_AMBER, 0.38), uHue * smoothstep(0.5, 1.0, field));
    col = mix(col, col * vec3(1.16, 1.0, 0.84), uHover * 0.6);

    // Scanlines + grain: this is what sells "still frame" over "gradient".
    col *= 1.0 - 0.07 * step(0.5, fract(uv.y * 260.0));
    col += (hash12(uv * 720.0 + uTime) - 0.5) * 0.05;

    // Interior vignette.
    vec2 vg = (uv - 0.5) * vec2(1.15, 1.0);
    col *= 1.0 - dot(vg, vg) * 0.95;
    col *= vShade;

    // Unfocused cards fall most of the way back into the dark.
    col = mix(col * 0.14, col, 0.16 + uFocus * 0.84);

    // Rounded-rect mask + hairline border.
    vec2 cp = (vUv - 0.5) * vec2(uAspect, 1.0);
    float sd = sdRoundBox(cp, vec2(uAspect * 0.5, 0.5) - 0.004, 0.03);
    float mask = smoothstep(0.006, -0.002, sd);
    float border = smoothstep(0.0045, 0.0, abs(sd + 0.0032));

    vec3 borderCol = mix(vec3(0.17, 0.24, 0.22), C_AMBER, uFocus * 0.9);
    col = mix(col, borderCol, border * (0.45 + uFocus * 0.55));

    float a = mask * uOpacity * uEnter;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`;

/**
 * Cover-flow style project rail. Index is a float driven by scroll (+ a
 * transient drag offset), so everything in between is interpolated.
 */
export class Rail extends Group {
  constructor({ projects, tier }) {
    super();

    this.projects = projects;
    this.count = projects.length;
    this.tier = tier;

    this.index = 0; // rendered (smoothed) float index
    this.target = 0; // desired float index
    this.velocity = 0;
    this.uOpacity = { value: 0 };
    this.hovered = -1;
    this.enabled = false;

    this.spacing = 6.4;
    this.depth = 2.6;
    this.tilt = 0.34;

    this._ray = new Raycaster();
    this._ndc = new Vector2(-2, -2);

    this.cards = [];
    this._build();
  }

  _build() {
    const seg = this.tier === 0 ? 8 : 20;
    const w = 5.6;
    const h = 3.5;
    const geo = new PlaneGeometry(w, h, seg, Math.round(seg * 0.6));

    this.cardW = w;
    this.cardH = h;

    for (let i = 0; i < this.count; i++) {
      const p = this.projects[i];

      const mat = new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: p.seed ?? i * 13.7 },
          uHue: { value: p.hue ?? 0 },
          uHover: { value: 0 },
          uFocus: { value: 0 },
          uOpacity: this.uOpacity,
          uVel: { value: 0 },
          uAspect: { value: w / h },
          uBend: { value: 0.55 },
          uEnter: { value: 0 },
          uAccent: { value: new Color('#ff8a3d') },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      });

      const mesh = new Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.userData.index = i;
      mesh.renderOrder = 10;
      this.add(mesh);
      this.cards.push(mesh);
    }

    this._geo = geo;
  }

  /** Layout is pure: given a float index, every card's transform follows. */
  _layout(dt) {
    for (let i = 0; i < this.count; i++) {
      const card = this.cards[i];
      const o = i - this.index; // signed offset from focus
      const a = Math.abs(o);
      const s = Math.sign(o);

      card.position.x = o * this.spacing;
      card.position.z = -Math.pow(a, 1.35) * this.depth;
      card.position.y = -Math.pow(a, 1.5) * 0.12;

      card.rotation.y = -clamp(o * this.tilt, -0.62, 0.62);
      card.rotation.z = -s * Math.min(a, 1) * 0.018;

      const sc = 1 - Math.min(a, 2) * 0.055;
      card.scale.setScalar(sc);

      const u = card.material.uniforms;
      const focus = clamp(1 - a, 0, 1);
      u.uFocus.value = damp(u.uFocus.value, focus, 0.16, dt);
      u.uHover.value = damp(u.uHover.value, this.hovered === i ? 1 : 0, 0.12, dt);
      u.uVel.value = this.velocity;

      // Cull far cards outright — at 6+ projects this matters on mobile.
      card.visible = a < 3.2 && this.uOpacity.value > 0.003;
    }
  }

  setTarget(i) {
    this.target = clamp(i, 0, this.count - 1);
  }

  setPointer(ndcX, ndcY) {
    this._ndc.set(ndcX, ndcY);
  }

  /** @returns {number} index under the pointer, or -1 */
  pick(camera) {
    if (!this.enabled || this.uOpacity.value < 0.5) return -1;
    this._ray.setFromCamera(this._ndc, camera);
    const hits = this._ray.intersectObjects(this.cards, false);
    return hits.length ? hits[0].object.userData.index : -1;
  }

  update(t, dt, camera) {
    const prev = this.index;
    this.index = damp(this.index, this.target, 0.14, dt);

    // Velocity in "cards per second", used by the shaders for smear + tear.
    const inst = dt > 0 ? (this.index - prev) / dt : 0;
    this.velocity = damp(this.velocity, inst, 0.2, dt);

    this.hovered = this.pick(camera);

    for (const c of this.cards) {
      c.material.uniforms.uTime.value = t;
      c.material.uniforms.uEnter.value = damp(
        c.material.uniforms.uEnter.value,
        this.enabled ? 1 : 0,
        0.07,
        dt
      );
    }

    this._layout(dt);
    this.visible = this.uOpacity.value > 0.003;
  }

  /**
   * @param {number} aspect viewport aspect ratio
   * @param {number} vw     world units visible across the card plane
   * @param {number} vh     world units visible down the card plane
   */
  resize(aspect, vw, vh) {
    const narrow = aspect < 1.1;

    // Always wider than the card, or neighbours would intersect the focused one.
    this.spacing = this.cardW * 1.14;
    this.tilt = narrow ? 0.28 : 0.34;

    // Fit the focused card to the frame rather than guessing a scale — a fixed
    // 0.62 overflowed portrait phones badly.
    const fitW = (vw * (narrow ? 0.88 : 0.68)) / this.cardW;
    const fitH = (vh * (narrow ? 0.62 : 0.7)) / this.cardH;
    this.scale.setScalar(Math.min(fitW, fitH));

    // Offset right on desktop so the overlay copy has clean space to sit on.
    this.position.x = narrow ? 0 : vw * 0.09;
    this.position.y = narrow ? vh * 0.08 : vh * 0.045;
  }

  dispose() {
    this._geo.dispose();
    for (const c of this.cards) c.material.dispose();
  }
}
