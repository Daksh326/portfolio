/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EVERYTHING YOU EDIT LIVES HERE.
 *
 * Anything marked PLACEHOLDER is invented and must be replaced or deleted
 * before this goes in front of anyone. That especially means `testimonials`
 * and `recognition` — fabricated quotes from named people and awards you
 * didn't win are the fastest way to lose a reader who checks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const profile = {
  name: 'Daksh Chaudhary',
  initials: 'DC',
  /** Giant display word(s) in the hero. Short reads best — it's set ~260px. */
  display: 'Daksh Chaudhary',
  location: 'india',
  role: 'computer science',
  year: '2026',
  email: 'dakshjawla326@gmail.com',

  /** Stacked one-word assertions under the hero. Four works best. */
  assertions: ['Structured.', 'Scalable.', 'Precise.', 'Fast.'],

  about: [
    `I build the unglamorous half of software — the packet that never arrives, the query that scans a million rows, the frame that drops at 58fps. Most of what I make starts as a question I couldn't answer by reading.`,
    `I work across C and C++ close to the metal, Java and Python for services, and the browser when something needs to be felt rather than described. I care about latency budgets, honest error messages, and interfaces that tell you the truth about what the system is doing.`,
  ],

  stats: [
    { k: '06', v: 'Shipped projects' },
    { k: '04', v: 'Languages, daily' },
    { k: '2026', v: 'Graduating' },
    { k: '01', v: 'Rewrite, always' },
  ],

  socials: [
    { label: 'GitHub', href: 'https://github.com/Daksh326' },
    { label: 'LinkedIn', href: '#' }, // PLACEHOLDER
    { label: 'Email', href: 'mailto:dakshjawla326@gmail.com' },
  ],
};

/** •02 — reverse chronological. */
export const experience = [
  { org: 'B.Tech, Computer Science', period: '2022 — Present', role: 'Final year · Networks & distributed systems' },
  { org: 'Software Engineering Intern', period: '2025', role: 'PLACEHOLDER — add your company' },
  { org: 'CCNA, Routing & Switching', period: '2024', role: 'Cisco · Certification' },
  { org: 'First public deployment', period: '2023', role: 'Relay · Shipped, fell over, learned' },
];

/**
 * •03 — the template has "Our Team" with three founders here. That makes no
 * sense for one person, so this is the same three-column layout used for what
 * you actually do.
 */
export const focus = [
  { title: 'Systems', body: 'C and C++ close to the metal. Packet capture, stream reassembly, memory that behaves.', seed: 61 },
  { title: 'Backend', body: 'Java, Python and Go services. Locking that survives contention, queries that stay sublinear.', seed: 92 },
  { title: 'Interface', body: 'TypeScript and GLSL. Instanced draw calls, honest loading states, motion with weight.', seed: 138 },
];

/**
 * Image slots. Ratios match where the reference puts its photography.
 *
 * Each is a PLACEHOLDER, drawn procedurally at runtime — nothing is shipped or
 * downloaded. To use a real photo, drop it in `public/` and set `src`:
 *
 *   hero: { src: '/hero.jpg', ratio: 1.76 }
 *
 * When `src` is set the generator is skipped and the placeholder ribbon
 * disappears automatically.
 */
export const media = {
  hero: { seed: 7, ratio: 1.76, src: null },
  about: { seed: 34, ratio: 1.76, src: null },
  cta: { seed: 55, ratio: 1.85, src: null },
  focusRatio: 0.84,
};

/** •04 — selected work. */
export const work = [
  { title: 'Netwatch', tag: 'C++ · libpcap', year: '2025', body: 'Live packet capture that reassembles TCP streams and flags anomalies against a rolling baseline.', href: '#' },
  { title: 'Orbit', tag: 'Java · Spring', year: '2025', body: 'Ticketing for 40+ societies. Optimistic locking, so two people tapping the last seat get an honest answer.', href: '#' },
  { title: 'Vector', tag: 'Python · FAISS', year: '2024', body: 'Hybrid keyword and embedding search over 200k documents, answering under 40ms p95.', href: '#' },
  { title: 'Atlas', tag: 'TypeScript · Three.js', year: '2024', body: '500k geospatial points as one instanced draw call, filtered entirely on the GPU.', href: '#' },
];

/**
 * •05 — PLACEHOLDER, ALL OF IT.
 * Real quotes from real people, or delete the section. `sections` in this file
 * controls whether it renders at all.
 */
export const testimonials = [
  { quote: 'Replace this with something a real person actually said about working with you.', name: 'Placeholder name', role: 'Placeholder role', tag: 'Tech', year: '2025' },
  { quote: 'A short, specific quote beats a long, generic one. Ask for the specific version.', name: 'Placeholder name', role: 'Placeholder role', tag: 'SaaS', year: '2025' },
  { quote: 'If nobody has said anything quotable yet, delete this section entirely.', name: 'Placeholder name', role: 'Placeholder role', tag: 'Design', year: '2024' },
];

/** •06 — PLACEHOLDER. Delete unless these are real. */
export const recognition = [
  { title: 'Placeholder — replace or delete', org: 'Awarding body', year: '2025' },
  { title: 'Placeholder — replace or delete', org: 'Awarding body', year: '2024' },
];

/**
 * Section registry. Order here is the order on the page, and the numbering
 * (•01, •02 …) is generated from it — so deleting a section renumbers the rest
 * automatically. Set `on: false` to drop one.
 */
export const sections = [
  { id: 'about', label: 'About me', on: true },
  { id: 'experience', label: 'Experience', on: true },
  { id: 'focus', label: 'Focus', on: true },
  { id: 'work', label: 'Selected work', on: true },
  { id: 'testimonials', label: 'Testimonials', on: true },
  { id: 'recognition', label: 'Recognition', on: true },
];
