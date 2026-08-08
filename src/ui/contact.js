import { profile } from '../content.js';

/**
 * A bare `mailto:` CTA silently does nothing on any machine without a default
 * mail client registered — which is most Windows installs. The link still
 * fires for people who do have one; this adds a copy-to-clipboard fallback and
 * visible confirmation so the button always produces a result.
 */
export function initContact() {
  const btn = document.querySelector('[data-contact-mail]');
  if (!btn) return;

  const label = btn.querySelector('span');
  const original = label ? label.textContent : '';
  let resetTimer = 0;

  const flash = (msg, ok = true) => {
    if (!label) return;
    label.textContent = msg;
    btn.classList.toggle('is-copied', ok);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      label.textContent = original;
      btn.classList.remove('is-copied');
    }, 2400);
  };

  async function copy(text) {
    try {
      // Needs a secure context; localhost and https both qualify.
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Older browsers, or clipboard permission denied.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  btn.addEventListener('click', async () => {
    // Deliberately not preventing default: if a mail client exists it should
    // still open. This just guarantees something happens when one doesn't.
    const ok = await copy(profile.email);
    flash(ok ? `Copied — ${profile.email}` : profile.email, ok);
  });
}

/**
 * Placeholder hrefs (`#`) otherwise scroll the page to the top, which reads as
 * a broken button. Neutralise them and mark them instead.
 */
export function guardDeadLinks(root = document) {
  for (const a of root.querySelectorAll('a[href="#"]')) {
    a.dataset.nolink = '1';
    a.setAttribute('aria-disabled', 'true');
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href="#"]');
    if (a) e.preventDefault();
  });
}
