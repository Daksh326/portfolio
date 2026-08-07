/**
 * Minimal text splitters.
 *
 * Accessibility contract: the generated spans are hidden from assistive tech
 * and the host element carries the original string as its accessible name, so
 * the animation costs a screen-reader user nothing.
 */

/** Splits into per-character spans, one masked row per `.line` (or the whole element). */
export function splitChars(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.char')];

  const full = el.textContent.replace(/\s+/g, ' ').trim();
  const rows = [...el.querySelectorAll('.line')];
  const chars = [];

  if (rows.length) {
    for (const row of rows) {
      const text = row.textContent;
      row.textContent = '';
      row.classList.add('lineMask');
      row.setAttribute('aria-hidden', 'true');
      chars.push(...fill(row, text));
    }
  } else {
    const text = el.textContent;
    el.textContent = '';
    const row = document.createElement('span');
    row.className = 'lineMask';
    row.setAttribute('aria-hidden', 'true');
    el.appendChild(row);
    chars.push(...fill(row, text));
  }

  el.setAttribute('aria-label', full);
  el.dataset.split = 'chars';
  return chars;
}

function fill(row, text) {
  const out = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    row.appendChild(span);
    out.push(span);
  }
  return out;
}

/** Splits into visual lines (measured after layout), each in its own mask. */
export function splitLines(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.wordline')];

  const original = el.textContent.replace(/\s+/g, ' ').trim();
  if (!original) return [];

  // Pass 1: lay every word out and read which line box it landed on.
  el.textContent = '';
  const probes = original.split(' ').map((word) => {
    const s = document.createElement('span');
    s.textContent = word;
    el.append(s, document.createTextNode(' '));
    return s;
  });

  const groups = [];
  let top = null;
  for (const p of probes) {
    const t = Math.round(p.offsetTop);
    if (t !== top) {
      top = t;
      groups.push([]);
    }
    groups[groups.length - 1].push(p.textContent);
  }

  // Pass 2: rebuild as masked rows.
  el.textContent = '';
  const inners = groups.map((words) => {
    const mask = document.createElement('span');
    mask.className = 'lineMask';
    mask.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.className = 'wordline';
    inner.textContent = words.join(' ');

    mask.appendChild(inner);
    el.appendChild(mask);
    return inner;
  });

  el.setAttribute('aria-label', original);
  el.dataset.split = 'lines';
  return inners;
}
