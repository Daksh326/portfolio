import {
  profile,
  experience,
  focus,
  work,
  testimonials,
  recognition,
  sections,
  media,
} from '../content.js';
import { pad2 } from '../utils/math.js';
import { makePlaceholder } from '../utils/placeholder.js';

const $ = (sel, root = document) => root.querySelector(sel);

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

const isExternal = (href) => /^https?:/.test(href);
const extAttrs = (href) => (isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : '');

/**
 * One image slot.
 *
 * Placeholders are NOT drawn here. Generating six plates synchronously cost
 * over a second of blocked main thread (303ms alone for a 1200px one), so this
 * only emits the box and `hydratePlaceholders()` fills it in afterwards, one
 * per idle slice. Render sizes are deliberately small — the art is abstract, so
 * object-fit upscaling is invisible, and 720px costs a third of 1200px.
 */
function media_(cfg, { w = 640, alt = '' } = {}) {
  const ratio = cfg.ratio || 1.76;
  const h = Math.round(w / ratio);

  if (cfg.src) {
    return `
      <span class="shot" style="--ratio:${ratio}">
        <img src="${esc(cfg.src)}" alt="${esc(alt)}" loading="lazy" decoding="async" />
      </span>
    `;
  }

  return `
    <span class="shot shot--ph" style="--ratio:${ratio}"
          data-seed="${cfg.seed ?? 1}" data-w="${w}" data-h="${h}">
      <img alt="" aria-hidden="true" decoding="async" />
    </span>
  `;
}

/**
 * Fills every generated slot after first paint, yielding between each so no
 * single task blocks for long.
 *
 * Deliberately setTimeout and not requestIdleCallback: idle callbacks are not
 * serviced at all in a hidden tab, so anyone opening this in a background tab
 * got permanently empty image slots. setTimeout is throttled there but still
 * runs, so the page is always complete by the time it's looked at.
 */
function hydratePlaceholders() {
  const slots = [...document.querySelectorAll('.shot--ph[data-seed]')];
  let i = 0;

  const step = () => {
    if (i >= slots.length) return;
    const el = slots[i++];
    const img = el.querySelector('img');
    if (img) {
      img.src = makePlaceholder(Number(el.dataset.seed), Number(el.dataset.w), Number(el.dataset.h));
      el.classList.add('is-filled');
    }
    setTimeout(step, 0);
  };

  setTimeout(step, 0);
}

/** Marks content that is still invented, visibly, in the page itself. */
const ph = (label = 'placeholder') => `<span class="ph">${esc(label)}</span>`;

/** Wraps a section body in the shared shell, with its generated •NN marker. */
function section({ id, label, index, body, reveal = true }) {
  return `
    <section class="sec" id="${id}" data-i="${index}">
      <header class="sec__head"${reveal ? ' data-reveal="fade"' : ''}>
        <span class="mono sec__num">•${pad2(index)}</span>
        <h2 class="sec__label">${esc(label)}</h2>
      </header>
      ${body}
    </section>
  `;
}

const BUILDERS = {
  about: () => `
    <div class="about__body" data-reveal="fade">
      ${profile.about.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    ${media_(media.about, { w: 640, alt: '' })}
    <ul class="stats" data-reveal="stagger">
      ${profile.stats
        .map((s) => `<li><b>${esc(s.k)}</b><span>${esc(s.v)}</span></li>`)
        .join('')}
    </ul>
  `,

  experience: () => `
    <ul class="xp" data-reveal="stagger">
      ${experience
        .map(
          (e) => `
        <li>
          <div class="xp__row">
            <span class="xp__org">${esc(e.org)}</span>
            <span class="xp__role">${
              e.role.startsWith('PLACEHOLDER') ? ph() + esc(e.role.replace(/^PLACEHOLDER\s*—\s*/, '')) : esc(e.role)
            }</span>
            <span class="xp__period">${esc(e.period)}</span>
          </div>
        </li>`
        )
        .join('')}
    </ul>
  `,

  focus: () => `
    <ul class="focus" data-reveal="stagger">
      ${focus
        .map(
          (f, i) => `<li>
            ${media_({ seed: f.seed ?? i * 31 + 5, ratio: media.focusRatio, src: f.src }, { w: 320, alt: f.title })}
            <h3>${esc(f.title)}</h3>
            <p>${esc(f.body)}</p>
          </li>`
        )
        .join('')}
    </ul>
  `,

  work: () => `
    <div class="work" data-reveal="stagger">
      ${work
        .map(
          (w) => `
        <a href="${esc(w.href)}"${extAttrs(w.href)} data-cursor="view">
          <div class="work__top mono">
            <span>${esc(w.tag)}</span>
            <span>${esc(w.year)}</span>
          </div>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.body)}</p>
          <span class="work__go" aria-hidden="true">↗</span>
        </a>`
        )
        .join('')}
    </div>
  `,

  testimonials: () => `
    <ul class="quotes" data-reveal="stagger">
      ${testimonials
        .map(
          (t) => `
        <li>
          <blockquote>${esc(t.quote)}</blockquote>
          <footer>
            <cite>${ph()}${esc(t.name)}</cite>
            <small>${esc(t.role)} · ${esc(t.tag)} · ${esc(t.year)}</small>
          </footer>
        </li>`
        )
        .join('')}
    </ul>
  `,

  recognition: () => `
    <ul class="awards" data-reveal="stagger">
      ${recognition
        .map(
          (r) => `
        <li>
          <div class="awards__row">
            <span class="awards__title">${ph()}${esc(r.title)}</span>
            <span class="awards__meta">${esc(r.org)} · ${esc(r.year)}</span>
          </div>
        </li>`
        )
        .join('')}
    </ul>
  `,
};

/** Populates every content-driven region from `content.js`. */
export function buildDOM() {
  buildHero();
  buildSections();
  buildMedia();
  buildMenu();
  buildContact();
  hydratePlaceholders();
}

function buildHero() {
  $('[data-hero-display]').textContent = profile.display;
  $('[data-hero-location]').textContent = `/${profile.location}`;
  $('[data-hero-role]').textContent = `/${profile.role}`;
  $('[data-nav-mark]').textContent = `${profile.name} © ${profile.year}`;
  $('[data-loader-name]').textContent = profile.name;

  $('[data-hero-stack]').innerHTML = profile.assertions
    .map((a) => `<span>${esc(a)}</span>`)
    .join('');

  startClock();
}

/** Local time in the nav, the way the reference carries a location marker. */
function startClock() {
  const el = $('[data-clock]');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  tick();
  setInterval(tick, 20_000);
}

function buildSections() {
  const live = sections.filter((s) => s.on !== false && BUILDERS[s.id]);
  $('#sections').innerHTML = live
    .map((s, i) => section({ id: s.id, label: s.label, index: i + 1, body: BUILDERS[s.id]() }))
    .join('');
}

function buildMenu() {
  const live = sections.filter((s) => s.on !== false);
  $('[data-menu-list]').innerHTML = live
    .map(
      (s, i) =>
        `<li><a href="#${s.id}" data-menu-link><em>${pad2(i + 1)}</em><span>${esc(s.label)}</span></a></li>`
    )
    .join('');

  const socials = profile.socials
    .map((s) => `<li><a href="${esc(s.href)}"${extAttrs(s.href)}>${esc(s.label)}</a></li>`)
    .join('');

  $('[data-menu-socials]').innerHTML = socials;
  $('[data-foot-socials]').innerHTML = socials;
  $('[data-menu-mail]').textContent = profile.email;
}

function buildMedia() {
  for (const el of document.querySelectorAll('[data-media]')) {
    const cfg = media[el.dataset.media];
    if (!cfg) continue;
    el.innerHTML = media_(cfg, { w: 720, alt: '' });
  }
}

function buildContact() {
  const mail = $('[data-contact-mail]');
  mail.href = `mailto:${profile.email}`;

  $('[data-foot-left]').textContent = `© ${new Date().getFullYear()} ${profile.name}`;
  document.title = `${profile.name} — Computer Science`;
}
