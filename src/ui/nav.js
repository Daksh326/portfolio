import { gsap, ScrollTrigger, lenis, scrollToId } from './scroll.js';
import { sections } from '../content.js';
import { reducedMotion } from '../utils/device.js';

/** Nav bar, fullscreen menu, and the right-edge section index. */
export function initNav() {
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');
  const railEl = document.getElementById('sectionRail');
  const railItems = [...railEl.querySelectorAll('.rail__list li')];
  const railFill = railEl.querySelector('.rail__line i');
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];

  /* ── scroll chrome ─────────────────────────────────────────────────── */
  let lastY = 0;
  let menuOpen = false;

  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-stuck', scroll > 40);

    const down = scroll > lastY;
    if (!menuOpen) nav.classList.toggle('is-hidden', down && scroll > 260);
    lastY = scroll;

    railEl.classList.toggle('is-on', scroll > 120);
  });

  /* ── overall progress bar on the index rail ────────────────────────── */
  gsap.to(railFill, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
  });

  /* ── active section ────────────────────────────────────────────────── */
  function setActive(id) {
    for (const li of railItems) li.classList.toggle('is-active', li.dataset.target === id);
    for (const a of navLinks) a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
  }

  for (const s of sections) {
    const target = document.getElementById(s.id);
    if (!target) continue;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(s.id),
    });
  }
  setActive(sections[0].id);

  for (const li of railItems) {
    li.addEventListener('click', () => scrollToId(`#${li.dataset.target}`));
  }

  /* ── fullscreen menu ───────────────────────────────────────────────── */
  const items = [...menu.querySelectorAll('.menu__list a')];

  const tl = gsap
    .timeline({
      paused: true,
      onStart: () => {
        menu.hidden = false;
      },
      onReverseComplete: () => {
        menu.hidden = true;
      },
    })
    .fromTo(
      menu,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.85, ease: 'expo.inOut' }
    )
    .fromTo(
      items,
      { yPercent: 118, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.055, ease: 'expo.out' },
      '-=0.5'
    )
    .fromTo('.menu__foot', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.4');

  if (reducedMotion) tl.timeScale(6);

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    lenis.stop();
    tl.play();
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    lenis.start();
    tl.reverse();
  }

  menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });

  /* ── anchor routing (everything goes through Lenis) ────────────────── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    if (menuOpen) {
      closeMenu();
      // Let the menu clear before the page moves under it.
      gsap.delayedCall(0.35, () => scrollToId(target));
    } else {
      scrollToId(target);
    }
  });

  return { closeMenu };
}
