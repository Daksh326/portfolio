# Daksh Jawla — Portfolio

A dark, minimal, type-led single-page portfolio. Near-black base, vermilion
accent, condensed display type, numbered sections.

Built with **Vite + GSAP (ScrollTrigger) + Lenis**. No framework, no images, no
WebGL — around 150 KB of JS total.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the build locally
```

---

## Edit your content first

**Everything is in one file: [`src/content.js`](src/content.js).**

> Anything marked **PLACEHOLDER** is invented. Replace it or delete it before
> this goes in front of anyone — the page renders a visible orange `PLACEHOLDER`
> badge on those items so you can't ship them by accident.

| Export | Drives |
| --- | --- |
| `profile` | Hero display name, location/role, the stacked assertions, about copy, stats, socials |
| `experience` | •02 — reverse-chronological list |
| `focus` | •03 — three-column "what I do" |
| `work` | •04 — selected work cards |
| `testimonials` | •05 — **all placeholder** |
| `recognition` | •06 — **all placeholder** |
| `sections` | Order, labels, and on/off for every numbered section |

Section numbering (`•01`, `•02` …) is generated from the `sections` array, so
setting `on: false` or deleting an entry renumbers everything else
automatically. Nothing is hard-coded.

### Sections you probably want to delete

The design this follows has *Testimonials* and *Awards*. If you don't have real
ones, set `on: false` on `testimonials` and `recognition` in `sections` — a
short honest page beats a long padded one, and fabricated endorsements are the
fastest way to lose a reader who checks.

---

## Design system

| Role | Value |
| --- | --- |
| Background | `#0c0c0c` |
| Surfaces | `rgba(255,255,255,.02)` |
| Ink / muted | `#ffffff` / `#8f8f8f` |
| Accent | `#fa4e3e` |
| Display | Bebas Neue, uppercase, `line-height: 0.9` |
| Headings | Inter 700, uppercase, `letter-spacing: -0.07em` |
| Labels | Fira Mono 14px, uppercase |
| Stats panel | white `#fff`, black text, 50px numerals |

Values were read off the reference's computed styles rather than eyeballed, and
verified back against it at its own 1265px width.

That `-0.07em` on every uppercase Inter run is doing most of the work — it's
what makes the headings, stats, experience rows and section labels read as one
system rather than four. It's the `--tight` token in
[main.css](src/styles/main.css).

The hero display is sized to the frame (`clamp(3.4rem, 15.8vw, 17rem)`) rather
than to a point size, so it stays edge-to-edge at any width.

The stats block is the one inverted panel — white with black text. It's the
design's single biggest contrast moment, so keep it.

## How it works

**One clock.** GSAP's ticker drives Lenis, Lenis drives ScrollTrigger, and the
cursor loop is another ticker callback. Nothing runs on its own
`requestAnimationFrame`, so nothing can tear against anything else.

**Text splitting.** `ui/split.js` splits headings into characters and body copy
into measured visual lines, each in a masked row. The original string is kept
as the element's accessible name and the generated spans are hidden from
assistive tech, so a screen reader hears normal sentences.

**Reveals.** Any element with `data-reveal="fade | chars | lines | stagger"`
gets a one-shot scroll animation. The hero is excluded — `playIntro()`
choreographs it so the same characters aren't animated twice.

**Accessibility.** `prefers-reduced-motion` disables smooth scroll, the grain
overlay and all reveal motion, rendering content in its final state. The custom
cursor only hides the native one after it has actually initialised, and never on
touch or coarse pointers. Escape closes the menu.

---

## Deploying

Static build, `base` is `./`, so it works from any path.

```bash
npm run build
```

Push to `main` and Vercel redeploys automatically. Framework preset **Vite**,
build command `npm run build`, output directory `dist` — all auto-detected.

---

## Project layout

```
src/
  content.js         ← all copy and sections   (edit this)
  main.js            boot sequence
  styles/main.css    tokens + every component
  ui/
    build.js         renders content.js into the DOM
    scroll.js        Lenis + GSAP wiring
    nav.js           nav, fullscreen menu, active section
    reveal.js        scroll reveals + hero intro
    split.js         char / line splitting
    preloader.js     boot progress
    cursor.js        custom cursor
    magnetic.js      magnetic buttons
  utils/
    math.js          damp, lerp, clamp, pad2
    device.js        reduced-motion / touch probes
```

### Boot safety

The preloader's exit runs on GSAP's rAF-backed ticker, so a tab backgrounded
mid-load can stall it. A 4s `setTimeout` failsafe in
[preloader.js](src/ui/preloader.js) guarantees the overlay is removed and the
scroll lock released regardless — without it, a stalled ticker left a
full-screen `pointer-events: auto` layer swallowing every click on the page.

### Earlier version

This replaced a cinematic build with a WebGL 3D project rail and a halftone
light theme. It's preserved in git — `git show 368c2d2` to read it, or
`git checkout 368c2d2 -- src index.html` to bring it back.
