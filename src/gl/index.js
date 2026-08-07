import {
  ACESFilmicToneMapping,
  Color,
  FogExp2,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { Core } from './core.js';
import { Grid } from './grid.js';
import { Rail } from './rail.js';
import { makeFilmPass } from './post.js';
import { clamp, damp } from '../utils/math.js';
import { maxDPR, tier } from '../utils/device.js';

/**
 * One canvas, one renderer, one loop. Sections don't own scenes — they raise
 * and lower opacity targets on shared objects, which is why moving between
 * them never costs a context switch or a stutter.
 */
export class Stage {
  constructor(canvas, { projects }) {
    this.canvas = canvas;
    this.tier = tier;
    this.running = document.visibilityState === 'visible';
    this.lost = false;

    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.ndc = new Vector2(-2, -2);
    this.energy = 0;
    this.scroll = 0;

    this.targets = { core: 1, rail: 0, grid: 1 };

    this._initRenderer();
    this._initScene(projects);
    this._initComposer();
    this._initEvents();

    this.resize();
  }

  /* ── setup ───────────────────────────────────────────────────────────── */

  _initRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: this.tier === 2,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setClearColor(0x070908, 1);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _initScene(projects) {
    this.scene = new Scene();
    this.scene.background = new Color(0x070908);
    this.scene.fog = new FogExp2(0x070908, 0.022);

    this.camera = new PerspectiveCamera(40, 1, 0.1, 120);
    this.camera.position.set(0, 0, 7.2);

    this.grid = new Grid();
    this.core = new Core({ tier: this.tier });
    this.rail = new Rail({ projects, tier: this.tier });

    this.scene.add(this.grid, this.core, this.rail);
  }

  _initComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    if (this.tier === 2) {
      this.bloom = new UnrealBloomPass(new Vector2(1, 1), 0.42, 0.8, 0.78);
      this.composer.addPass(this.bloom);
    }

    this.composer.addPass(new OutputPass());

    this.film = makeFilmPass();
    this.film.renderToScreen = true;
    this.composer.addPass(this.film);
  }

  _initEvents() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize, { passive: true });

    this._onVisibility = () => {
      this.running = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', this._onVisibility);

    this._onLost = (e) => {
      e.preventDefault();
      this.lost = true;
    };
    this._onRestored = () => {
      this.lost = false;
      this.resize();
    };
    this.canvas.addEventListener('webglcontextlost', this._onLost, false);
    this.canvas.addEventListener('webglcontextrestored', this._onRestored, false);
  }

  /* ── input ───────────────────────────────────────────────────────────── */

  /** @param {number} x,y client pixel coords */
  setPointer(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.pointer.tx = (x / w) * 2 - 1;
    this.pointer.ty = (y / h) * 2 - 1;
    this.ndc.set(this.pointer.tx, -this.pointer.ty);
  }

  /** @param {number} v absolute scroll velocity, roughly px/frame */
  setEnergy(v) {
    this.energy = clamp(Math.abs(v) / 60, 0, 1.6);
  }

  setScroll(v) {
    this.scroll = v;
  }

  /* ── frame ───────────────────────────────────────────────────────────── */

  render(t, dt) {
    if (!this.running || this.lost) return;

    // Pointer easing — every downstream parallax inherits this smoothing.
    this.pointer.x = damp(this.pointer.x, this.pointer.tx, 0.06, dt);
    this.pointer.y = damp(this.pointer.y, this.pointer.ty, 0.06, dt);

    // Lateral camera drift. No lookAt, so the parallax stays linear and calm.
    this.camera.position.x = damp(this.camera.position.x, this.pointer.x * 0.42, 0.05, dt);
    this.camera.position.y = damp(this.camera.position.y, -this.pointer.y * 0.26, 0.05, dt);
    this.camera.updateMatrixWorld();

    // Cross-fade the three objects toward whatever the current section wants.
    this.core.uOpacity.value = damp(this.core.uOpacity.value, this.targets.core, 0.05, dt);
    this.rail.uOpacity.value = damp(this.rail.uOpacity.value, this.targets.rail, 0.07, dt);
    this.grid.uOpacity.value = damp(this.grid.uOpacity.value, this.targets.grid, 0.05, dt);

    this.core.setPointer(this.pointer.x, this.pointer.y);
    this.core.update(t, dt, this.energy);

    this.grid.update(t, dt, this.scroll);

    this.rail.setPointer(this.ndc.x, this.ndc.y);
    this.rail.update(t, dt, this.camera);

    // Film grade reacts to how hard the page is moving.
    const f = this.film.uniforms;
    f.uTime.value = t;
    f.uAmount.value = damp(
      f.uAmount.value,
      0.35 + this.energy * 2.6 + Math.abs(this.rail.velocity) * 0.6,
      0.1,
      dt
    );

    this.composer.render();
  }

  /* ── layout ──────────────────────────────────────────────────────────── */

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    const halfFov = Math.tan((this.camera.fov * Math.PI) / 360);

    // Device px per world unit at unit depth — lets the point cloud size
    // itself correctly on any DPR or viewport.
    this.core.resize((h * dpr) / (2 * halfFov));

    // World units visible at the card plane (z ≈ 0), so the rail can fit
    // itself to the frame instead of assuming a breakpoint scale.
    const visH = 2 * this.camera.position.z * halfFov;
    this.rail.resize(w / h, visH * (w / h), visH);
    this.bloom?.setSize(w, h);
    this.film.uniforms.uRes.value.set(w * dpr, h * dpr);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onRestored);
    this.core.dispose();
    this.grid.dispose();
    this.rail.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
