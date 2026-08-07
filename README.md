# Daksh Chaudhary — Portfolio

A dark, cinematic single-page portfolio. Real WebGL 3D on one persistent canvas,
smooth-scroll choreography, and a drag-and-scroll project rail.

Built with **Vite + Three.js + GSAP (ScrollTrigger) + Lenis**. No images ship
with the site — every visual is generated procedurally in a shader.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the build locally
```

---

## Edit your content first

**Everything you need to change lives in one file: [`src/content.js`](src/content.js).**

The copy currently in there is realistic **placeholder** content — plausible
projects for a final-year CS student, not your real ones. Replace:

| Key | What it drives |
| --- | --- |
| `profile` | Name, role, bio, stats, social links, email |
| `projects` | The 3D rail: title, blurb, tags, role, year, links |
| `stack` | The four-column tech grid |
| `timeline` | The "Path" section |
| `sections` | The right-edge section index (keep in sync with `index.html`) |

Each project has a `seed` (number) and `hue` (`0` = teal → `1` = amber). Those
two values deterministically generate that project's artwork, in both the 3D
card and its thumbnail. Change `seed` to get a completely different image;
change `hue` to warm it up. There is nothing to upload.

Placeholders you'll definitely want to replace: the `href: '#'` project links,
`Add your company` in the timeline, and the GitHub/LinkedIn/résumé URLs.

---

## How it works

### One canvas, three objects

`src/gl/index.js` owns a single `WebGLRenderer`, camera and post-processing
chain for the whole page. Sections don't get their own scenes — they raise and
lower opacity targets on three shared objects, which is why moving between
them never costs a context switch or a frame drop.

| Object | File | Role |
| --- | --- | --- |
| `Core` | `gl/core.js` | Particle mass + instrument rings + haze (hero, contact) |
| `Rail` | `gl/rail.js` | The cover-flow project carousel (work) |
| `Grid` | `gl/grid.js` | Floor grid receding into haze (everywhere) |

Post chain: `RenderPass → UnrealBloom (high tier only) → OutputPass → film pass`.
The film pass (`gl/post.js`) adds radial chromatic aberration, grain and
vignette, and its strength is driven by scroll velocity.

### One clock

GSAP's ticker drives Lenis, Lenis drives ScrollTrigger, and the WebGL loop is
another ticker callback. Nothing runs on its own `requestAnimationFrame`, so
nothing can tear against anything else. All interpolation goes through
`damp()` in `utils/math.js`, which is frame-rate independent — identical feel
at 60Hz and 144Hz.

### The project rail

Scroll is the single source of truth for which project is focused. Drag,
arrow keys, prev/next and thumbnail clicks all resolve to a scroll position
via `goTo()`, so the input models can never disagree about where you are.
Dragging adds a transient offset that decays over the same window as the
scroll animation, keeping the sum continuous.

### Performance

`utils/device.js` probes cores, memory, DPR and pixel count into a `tier`:

| Tier | Particles | Bloom | Antialias | Max DPR |
| --- | --- | --- | --- | --- |
| 2 (desktop) | 38k | yes | yes | 2 |
| 1 (mid / large phone) | 18k | no | no | 1.5 |
| 0 (low / reduced-motion) | 7k | no | no | 1 |

Rendering pauses when the tab is hidden, the delta is clamped so returning to
a backgrounded tab can't fire one enormous frame, and WebGL context loss is
handled. If WebGL is unavailable the canvas is removed and a CSS gradient
fallback takes over — the page stays fully readable and navigable.

### Accessibility

- `prefers-reduced-motion` disables smooth scroll, the grain/scanline overlays
  and all reveal animation; content renders in its final state.
- Split text keeps the original string as the element's accessible name and
  hides the generated spans, so screen readers read normal sentences.
- The custom cursor only hides the native one after it has actually
  initialised, and never on touch or coarse pointers.
- Focus-visible outlines, keyboard-operable thumbnails, and Escape closes the menu.

---

## Deploying

The build is fully static and `base` is `./`, so it works from any subpath.

```bash
npm run build
```

Then drop `dist/` on Vercel, Netlify, Cloudflare Pages or GitHub Pages. For
Netlify/Vercel the build command is `npm run build` and the publish directory
is `dist`.

---

## Project layout

```
src/
  content.js         ← all copy, projects, links   (edit this)
  main.js            boot sequence
  styles/main.css    design tokens + every component
  gl/
    index.js         renderer, camera, composer, frame loop
    core.js          hero particle core
    rail.js          3D project carousel
    grid.js          floor grid
    post.js          film grade pass
    glsl.js          shared shader chunks (noise, fbm, sdf)
  ui/
    scroll.js        Lenis + GSAP wiring
    work.js          rail controller (scroll / drag / keys)
    nav.js           nav, fullscreen menu, section index
    reveal.js        scroll reveals + hero intro
    split.js         char / line splitting
    preloader.js     boot progress
    cursor.js        custom cursor
    magnetic.js      magnetic buttons
    build.js         renders content.js into the DOM
  utils/
    math.js          damp, lerp, clamp, seeded rng
    device.js        capability tiers
    thumb.js         canvas-2D thumbnail generator
```
