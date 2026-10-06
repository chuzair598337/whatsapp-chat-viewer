"use strict";
/* =====================================================================
   Notifications (toasts): one shared component for every message the app
   shows briefly. Built on Notyf (js/vendor/notyf, MIT), restyled to match
   the app.

     toast(text)                  an info note
     toast(text, 'success')       also 'error', 'warning', 'info'
     toast.success(text) / .error / .warning / .info

   They appear at the top right, stack (newest at the bottom), close on their own
   (errors stay longer) and have a ✕ to close them sooner. Screen readers
   hear them through our own live region (Notyf's would read its HTML). The text is always escaped, since
   it can carry file names from an export.
   ===================================================================== */
const Toast = {
  n: null,
  // How long each kind stays, in ms.
  ms: { success: 3000, info: 4500, warning: 6000, error: 8000 },
  icons: {
    success: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    error: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    warning: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.1"/>'
  },
  lib() {
    if (this.n) return this.n;
    this.n = new Notyf({ position: { x: 'right', y: 'top' }, ripple: false, dismissible: true, types: [] });
    // Dialogs make the rest of the page inert while open; these two must stay usable and audible.
    const box = document.querySelector('.notyf'), theirs = document.querySelector('.notyf-announcer');
    if (box) { box.id = 'toasts'; box.dir = 'ltr'; }
    if (theirs) { theirs.setAttribute('aria-live', 'off'); theirs.hidden = true; }
    this.live = document.createElement('div'); this.live.id = 'toastLive'; this.live.className = 'sr-only'; this.live.setAttribute('aria-live', 'polite'); this.live.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.live);
    return this.n;
  },
  show(text, type) {
    if (!this.ms[type]) type = 'info';
    const n = this.lib();
    const msg = '<span class="tst-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + this.icons[type] + '</svg></span>' +
      '<span class="sr-only">' + this.esc(t('toast.' + type)) + ': </span><span class="tst-tx" dir="auto">' + this.esc(String(text == null ? '' : text)) + '</span>';
    // The same text twice in a row (a double click) replaces the first one instead of stacking.
    if (this.last && this.last.text === text && this.last.type === type) n.dismiss(this.last.ref);
    const ref = n.open({ type: 'cv', className: 'tst tst-' + type, message: msg, duration: this.ms[type], icon: false, background: 'transparent' });
    this.last = { text, type, ref };
    // Errors interrupt; the rest wait their turn. Cleared first so the same words are read again.
    const live = this.live, said = t('toast.' + type) + ': ' + text;
    live.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite'); live.textContent = '';
    setTimeout(() => { live.textContent = said; }, 100);
    for (const b of document.querySelectorAll('#toasts .notyf__dismiss-btn:not([aria-label])')) { b.type = 'button'; b.setAttribute('aria-label', t('toast.dismiss')); b.title = t('toast.dismiss'); }
    return ref;
  },
  esc: s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
  clear() { if (this.n) this.n.dismissAll(); }
};
function toast(text, type) { return Toast.show(text, type); }
for (const k of ['success', 'error', 'warning', 'info']) toast[k] = text => Toast.show(text, k);
Toast.lib(); // ready before the first message, so the live region is in place when one arrives
