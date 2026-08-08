import { gsap, ScrollTrigger, lenis, scrollToId } from './scroll.js';
import { sections } from '../content.js';
import { reducedMotion } from '../utils/device.js';

/** Nav bar, fullscreen menu, and scroll-linked chrome. */
export function initNav() {
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];

  let lastY = 0;
  let open = false;

  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-stuck', scroll > 40);
    if (!open) nav.classList.toggle('is-hidden', scroll > lastY && scroll > 280);
    lastY = scroll;
  });

  /* ── active section ────────────────────────────────────────────────── */
  const setActive = (id) => {
    for (const a of navLinks) a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
  };

  for (const s of sections.filter((x) => x.on !== false)) {
    const el = document.getElementById(s.id);
    if (!el) continue;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(s.id),
    });
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
      { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' }
    )
    .fromTo(
      items,
      { yPercent: 115, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.05, ease: 'expo.out' },
      '-=0.45'
    )
    .fromTo('.menu__foot', { opacity: 0 }, { opacity: 1, duration: 0.45 }, '-=0.35');

  if (reducedMotion) tl.timeScale(8);

  function openMenu() {
    if (open) return;
    open = true;
    menuBtn.setAttribute('aria-expanded', 'true');
    nav.classList.remove('is-hidden');
    lenis.stop();
    tl.play();
  }

  function closeMenu() {
    if (!open) return;
    open = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    lenis.start();
    tl.reverse();
  }

  menuBtn.addEventListener('click', () => (open ? closeMenu() : openMenu()));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) closeMenu();
  });

  /* ── anchor routing (everything goes through Lenis) ────────────────── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    if (open) {
      closeMenu();
      gsap.delayedCall(0.3, () => scrollToId(target));
    } else {
      scrollToId(target);
    }
  });

  return { closeMenu };
}
