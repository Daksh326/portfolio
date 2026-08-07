import { gsap, ScrollTrigger, lenis } from './scroll.js';
import { projects } from '../content.js';
import { clamp, damp, pad2 } from '../utils/math.js';
import { reducedMotion } from '../utils/device.js';

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

/**
 * Drives the 3D project rail.
 *
 * Scroll is the single source of truth for which project is focused. Drag,
 * arrows, buttons and thumbnail clicks all resolve to a scroll position, so
 * the two input models can never disagree about where you are.
 */
export function initWork(stage, cursor) {
  const rail = stage.rail;
  const n = rail.count;

  const section = document.getElementById('work');
  const pin = document.getElementById('workPin');
  const thumbs = [...document.querySelectorAll('#thumbs li')];
  const bar = document.querySelector('[data-rail-progress]');

  const out = {
    num: document.querySelector('[data-proj-num]'),
    title: document.querySelector('[data-proj-title]'),
    blurb: document.querySelector('[data-proj-blurb]'),
    tags: document.querySelector('[data-proj-tags]'),
    meta: document.querySelector('.proj__meta'),
    role: document.querySelector('[data-proj-role]'),
    year: document.querySelector('[data-proj-year]'),
    links: document.querySelector('[data-proj-links]'),
  };

  const swapEls = [out.num, out.title, out.blurb, out.tags, out.meta, out.links];

  let scrollIndex = 0;
  let focused = -1;
  let swapTl = null;
  const drag = { offset: 0, target: 0 };

  /* ── pinned scroll section ─────────────────────────────────────────── */
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * Math.max(1, n - 1) * 0.85)}`,
    pin,
    pinSpacing: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      scrollIndex = self.progress * (n - 1);
    },
    onToggle: (self) => {
      rail.enabled = self.isActive;
      if (!self.isActive) cursor.leave();
    },
  });

  /* ── content swap ──────────────────────────────────────────────────── */
  function write(i) {
    const p = projects[i];
    out.num.textContent = pad2(i + 1);
    out.title.textContent = p.title;
    out.blurb.textContent = p.blurb;
    out.role.textContent = p.role;
    out.year.textContent = p.year;
    out.tags.innerHTML = p.tags.map((t) => `<li>${esc(t)}</li>`).join('');
    out.links.innerHTML = (p.links || [])
      .map((l) => {
        const ext = /^https?:/.test(l.href);
        return `<a href="${esc(l.href)}" ${ext ? 'target="_blank" rel="noopener noreferrer"' : ''} data-cursor="link">${esc(l.label)} ↗</a>`;
      })
      .join('');
  }

  function setFocus(i) {
    if (i === focused) return;
    const first = focused === -1;
    focused = i;

    thumbs.forEach((t, k) => t.classList.toggle('is-active', k === i));

    if (first || reducedMotion) {
      write(i);
      gsap.set(swapEls, { yPercent: 0, opacity: 1 });
      return;
    }

    swapTl?.kill();
    swapTl = gsap
      .timeline()
      .to(swapEls, {
        yPercent: -26,
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in',
        stagger: 0.018,
      })
      .add(() => write(i))
      .fromTo(
        swapEls,
        { yPercent: 30, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.04 }
      );
  }

  /* ── navigation ────────────────────────────────────────────────────── */
  function currentIndex() {
    return clamp(scrollIndex + drag.offset, 0, n - 1);
  }

  function goTo(i) {
    const target = clamp(Math.round(i), 0, n - 1);
    const span = st.end - st.start;
    const y = st.start + (n > 1 ? (target / (n - 1)) * span : 0);

    lenis.scrollTo(y, {
      duration: reducedMotion ? 0 : 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });

    // Decay the drag offset over the same window so the sum stays continuous.
    gsap.to(drag, { target: 0, duration: 0.9, ease: 'power3.out', overwrite: true });
  }

  function step(dir) {
    goTo(Math.round(currentIndex()) + dir);
  }

  document.querySelector('[data-rail-prev]').addEventListener('click', () => step(-1));
  document.querySelector('[data-rail-next]').addEventListener('click', () => step(1));

  thumbs.forEach((li, i) => {
    li.addEventListener('click', () => goTo(i));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goTo(i);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (!st.isActive) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });

  /* ── drag ──────────────────────────────────────────────────────────── */
  let dragging = false;
  let startX = 0;
  let moved = 0;
  let pid = null;

  pin.addEventListener('pointerdown', (e) => {
    if (!st.isActive || e.button !== 0) return;
    if (e.target.closest('a, button, .thumbs li')) return;

    dragging = true;
    startX = e.clientX;
    moved = 0;
    pid = e.pointerId;
    pin.setPointerCapture?.(pid);
    gsap.killTweensOf(drag);
  });

  pin.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    // A full-width drag moves roughly three projects.
    drag.target = -dx / (window.innerWidth * 0.3);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (pid != null) pin.releasePointerCapture?.(pid);
    pid = null;

    if (moved < 6) {
      // A tap, not a drag: focus the card under the pointer, or open the
      // focused card's first link.
      const hit = rail.hovered;
      if (hit >= 0 && hit !== Math.round(currentIndex())) {
        goTo(hit);
        return;
      }
      if (hit >= 0) {
        const link = projects[hit]?.links?.[0];
        if (link && link.href !== '#') window.open(link.href, '_blank', 'noopener');
      }
      gsap.to(drag, { target: 0, duration: 0.5, ease: 'power3.out', overwrite: true });
      return;
    }

    goTo(currentIndex() + drag.target * 0.35);
  }

  pin.addEventListener('pointerup', endDrag);
  pin.addEventListener('pointercancel', endDrag);
  pin.addEventListener('lostpointercapture', endDrag);

  /* ── per-frame ─────────────────────────────────────────────────────── */
  function tick(dt) {
    drag.offset = damp(drag.offset, drag.target, 0.18, dt);

    const idx = currentIndex();
    rail.setTarget(idx);

    if (bar) bar.style.width = `${n > 1 ? (idx / (n - 1)) * 100 : 100}%`;

    setFocus(Math.round(idx));

    if (rail.enabled && rail.hovered >= 0) cursor.enter('view');
    else cursor.leave();
  }

  setFocus(0);

  return { tick, goTo, st };
}
