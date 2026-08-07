/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EVERYTHING YOU EDIT LIVES HERE.
 *
 * The copy below is realistic PLACEHOLDER content — swap it for your real
 * projects, dates and links. Nothing else in the codebase needs to change.
 *
 * Each project's `seed` and `hue` deterministically generate its 3D artwork,
 * so changing a number gives that card a completely different visual.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const profile = {
  name: 'Daksh Chaudhary',
  initials: 'DC',
  role: 'B.Tech CSE',
  place: 'India',
  year: '2026',
  email: 'dakshjawla326@gmail.com',

  lead: `I'm a computer science student who likes the unglamorous half of software — the packet that never arrives, the query that scans a million rows, the frame that drops at 58fps.`,

  body: `Most of what I build starts as a question I couldn't answer by reading. I work across C and C++ for anything close to the metal, Java and Python for services, and the browser when something needs to be felt rather than described. I care about latency budgets, honest error messages, and interfaces that tell you the truth about what the system is doing.`,

  stats: [
    { k: '06', v: 'Shipped projects' },
    { k: '04', v: 'Languages, daily' },
    { k: '2026', v: 'Graduating' },
    { k: '∞', v: 'Rewrites' },
  ],

  // Scrolling marquee under the About heading
  marquee: [
    'Systems',
    'Networking',
    'Backend',
    'Graphics',
    'Distributed',
    'Low latency',
    'Open source',
  ],

  links: [
    { label: 'GitHub', href: 'https://github.com/', handle: '@daksh' },
    { label: 'LinkedIn', href: 'https://linkedin.com/', handle: '/in/daksh' },
    { label: 'Email', href: 'mailto:dakshjawla326@gmail.com', handle: 'dakshjawla326@gmail.com' },
    { label: 'Résumé', href: '#', handle: 'PDF, 1 page' },
  ],
};

export const projects = [
  {
    id: 'netwatch',
    title: 'Netwatch',
    subtitle: 'Network traffic analyser',
    year: '2025',
    role: 'Solo — C++ / libpcap / Qt',
    blurb:
      'A live packet capture tool that reassembles TCP streams and flags anomalies against a rolling baseline. Handles a saturated gigabit link on one core without dropping frames.',
    tags: ['C++17', 'libpcap', 'Qt', 'Multithreading'],
    links: [
      { label: 'Source', href: '#' },
      { label: 'Write-up', href: '#' },
    ],
    seed: 12.4,
    hue: 0.06, // 0 = teal, 1 = amber
  },
  {
    id: 'orbit',
    title: 'Orbit',
    subtitle: 'Campus event platform',
    year: '2025',
    role: 'Backend lead — Java / Spring Boot',
    blurb:
      'Ticketing and scheduling for 40+ student societies. Optimistic locking on seat allocation, so two people tapping the last ticket at once get an honest answer instead of a duplicate.',
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
    links: [
      { label: 'Source', href: '#' },
      { label: 'Live', href: '#' },
    ],
    seed: 47.1,
    hue: 0.55,
  },
  {
    id: 'vector',
    title: 'Vector',
    subtitle: 'Semantic search engine',
    year: '2024',
    role: 'Solo — Python / FastAPI / FAISS',
    blurb:
      'Indexes a 200k-document corpus into a FAISS shard set and answers hybrid keyword + embedding queries in under 40ms p95. Built to understand ANN indexes properly, not to use one.',
    tags: ['Python', 'FastAPI', 'FAISS', 'Redis'],
    links: [
      { label: 'Source', href: '#' },
      { label: 'Demo', href: '#' },
    ],
    seed: 88.9,
    hue: 0.22,
  },
  {
    id: 'cipher',
    title: 'Cipher',
    subtitle: 'File encryption utility',
    year: '2024',
    role: 'Solo — C / OpenSSL',
    blurb:
      'AES-256-GCM with Argon2id key derivation, streaming so it never loads the file into memory. Written to learn where crypto libraries let you shoot yourself, and to stop doing it.',
    tags: ['C', 'OpenSSL', 'Argon2', 'CLI'],
    links: [{ label: 'Source', href: '#' }],
    seed: 3.7,
    hue: 0.78,
  },
  {
    id: 'atlas',
    title: 'Atlas',
    subtitle: '3D data visualiser',
    year: '2024',
    role: 'Solo — TypeScript / Three.js',
    blurb:
      'Renders 500k geospatial points as a single instanced draw call with GPU-side filtering. Pan, brush and drill without ever touching the CPU-side buffer.',
    tags: ['TypeScript', 'Three.js', 'GLSL', 'D3'],
    links: [
      { label: 'Source', href: '#' },
      { label: 'Live', href: '#' },
    ],
    seed: 61.3,
    hue: 0.34,
  },
  {
    id: 'relay',
    title: 'Relay',
    subtitle: 'Realtime chat infrastructure',
    year: '2023',
    role: 'Solo — Go / WebSockets',
    blurb:
      'A fan-out message broker holding 10k concurrent sockets per node, with Redis-backed presence and at-least-once delivery. My first real lesson in backpressure.',
    tags: ['Go', 'WebSockets', 'Redis', 'NGINX'],
    links: [{ label: 'Source', href: '#' }],
    seed: 25.8,
    hue: 0.45,
  },
];

export const stack = [
  {
    group: 'Languages',
    items: ['C', 'C++', 'Java', 'Python', 'Go', 'TypeScript', 'SQL', 'Bash'],
  },
  {
    group: 'Backend & data',
    items: ['Spring Boot', 'FastAPI', 'Node', 'PostgreSQL', 'Redis', 'FAISS'],
  },
  {
    group: 'Frontend & graphics',
    items: ['React', 'Three.js', 'GLSL', 'GSAP', 'Vite', 'Tailwind'],
  },
  {
    group: 'Systems & infra',
    items: ['Linux', 'Docker', 'Git', 'Nginx', 'Wireshark', 'Cisco IOS'],
  },
];

export const timeline = [
  {
    year: '2026',
    title: 'B.Tech, Computer Science',
    org: 'Final year',
    text: 'Specialising in networks and distributed systems. Thesis on adaptive congestion control for lossy links.',
  },
  {
    year: '2025',
    title: 'Software Engineering Intern',
    org: 'Add your company',
    text: 'Shipped internal tooling used daily by the platform team; cut a nightly batch job from 90 minutes to 11.',
  },
  {
    year: '2024',
    title: 'CCNA — Routing & Switching',
    org: 'Cisco',
    text: 'Formalised what packet captures had already taught me the hard way.',
  },
  {
    year: '2023',
    title: 'First real deployment',
    org: 'Relay',
    text: 'Put something on the public internet, watched it fall over, and learned more that week than the semester.',
  },
];

/** Right-edge section index. Order must match the sections in index.html. */
export const sections = [
  { id: 'hero', label: 'Index' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'stack', label: 'Stack' },
  { id: 'path', label: 'Path' },
  { id: 'contact', label: 'Contact' },
];
