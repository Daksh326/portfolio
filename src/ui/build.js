import { profile, projects, stack, timeline, sections } from '../content.js';
import { makeThumb } from '../utils/thumb.js';
import { pad2 } from '../utils/math.js';

const $ = (sel, root = document) => root.querySelector(sel);

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

/** Populates every content-driven region from `content.js`. */
export function buildDOM() {
  buildHero();
  buildMarquee();
  buildAbout();
  buildThumbs();
  buildStack();
  buildTimeline();
  buildContact();
  buildSectionRail();
  buildMenuFoot();
}

function buildHero() {
  $('[data-hero-role]').textContent = `${profile.role} — Class of ${profile.year}`;
  $('[data-hero-place]').textContent = profile.place;
  $('.nav__logo span').textContent = profile.initials;
  document.title = `${profile.name} — Computer Science / Engineer`;
}

function buildMarquee() {
  const track = $('[data-marquee]');
  const once = profile.marquee.map((w) => `<span>${esc(w)}</span>`).join('');
  // Two copies so the loop can translate by exactly -50% forever.
  track.innerHTML = once + once;
}

function buildAbout() {
  $('[data-about-lead]').textContent = profile.lead;
  $('[data-about-body]').textContent = profile.body;

  const ul = $('[data-stats]');
  ul.setAttribute('data-reveal', 'stagger');
  for (const s of profile.stats) {
    ul.appendChild(el('li', null, `<b>${esc(s.k)}</b><span>${esc(s.v)}</span>`));
  }
}

function buildThumbs() {
  const ol = $('#thumbs');
  projects.forEach((p, i) => {
    const li = el('li');
    li.dataset.index = String(i);
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `Show project ${i + 1}: ${p.title}`);
    li.innerHTML = `
      <span class="thumbs__txt">
        <span class="thumbs__num">${pad2(i + 1)}</span>
        <span class="thumbs__name">${esc(p.subtitle)}</span>
      </span>
      <img class="thumbs__img" alt="" aria-hidden="true" src="${makeThumb(p.seed ?? i * 13.7, p.hue ?? 0)}" />
    `;
    ol.appendChild(li);
  });
}

function buildStack() {
  const grid = $('[data-stack]');
  grid.setAttribute('data-reveal', 'stagger');

  stack.forEach((g, i) => {
    const card = el('div', 'stackCard');
    card.innerHTML = `
      <div class="stackCard__head">
        <b>${esc(g.group)}</b>
        <span class="mono">${pad2(i + 1)}</span>
      </div>
      <ul>${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
    `;

    // Cheap pointer-tracked glow; CSS does the actual rendering.
    card.addEventListener(
      'pointermove',
      (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      },
      { passive: true }
    );

    grid.appendChild(card);
  });
}

function buildTimeline() {
  const ol = $('[data-timeline]');
  for (const t of timeline) {
    const li = el('li', 'tlItem');
    li.setAttribute('data-reveal', 'fade');
    li.innerHTML = `
      <span class="tlItem__year">${esc(t.year)}</span>
      <div class="tlItem__body">
        <h3 class="tlItem__title">${esc(t.title)}</h3>
        <span class="tlItem__org">${esc(t.org)}</span>
        <p class="tlItem__text">${esc(t.text)}</p>
      </div>
    `;
    ol.appendChild(li);
  }
}

function buildContact() {
  const mail = $('[data-contact-mail]');
  mail.href = `mailto:${profile.email}`;
  mail.textContent = profile.email;

  const ul = $('[data-contact-links]');
  ul.setAttribute('data-reveal', 'stagger');
  for (const l of profile.links) {
    const li = el('li');
    const external = /^https?:/.test(l.href);
    li.innerHTML = `
      <a href="${esc(l.href)}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ''} data-cursor="link">
        <b>${esc(l.label)}</b>
        <span>${esc(l.handle)}</span>
      </a>
    `;
    ul.appendChild(li);
  }

  $('[data-foot-left]').textContent = `© ${new Date().getFullYear()} ${profile.name}`;
  $('[data-foot-right]').textContent = 'Built with Three.js · GSAP · Lenis';
}

function buildSectionRail() {
  const ol = $('.rail__list');
  sections.forEach((s, i) => {
    const li = el('li');
    li.dataset.target = s.id;
    li.innerHTML = `<s></s><b>${pad2(i + 1)}</b>`;
    li.title = s.label;
    li.setAttribute('aria-label', s.label);
    ol.appendChild(li);
  });
}

function buildMenuFoot() {
  $('[data-menu-foot]').innerHTML = `
    <span>${esc(profile.email)}</span> &nbsp;·&nbsp; <span>${esc(profile.place)}</span>
  `;
}

/** Infinite marquee — a single tween, no layout thrash. */
export function startMarquee(gsap) {
  const track = document.querySelector('[data-marquee]');
  if (!track) return;
  gsap.to(track, {
    xPercent: -50,
    duration: 34,
    ease: 'none',
    repeat: -1,
  });
}
