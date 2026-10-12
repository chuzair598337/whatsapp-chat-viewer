"use strict";
/* =====================================================================
   "What's new": after a new version is released, a popup lists what's
   new, improved and fixed (js/release-notes.js), once per version on
   each device.

   - cv-seen-version (localStorage) holds the last version this device
     has seen. It's saved when the popup closes, however it closes.
   - Nothing saved and no other key of this app: a brand-new user. They
     get the start screen and tour, and the version is saved silently.
   - Nothing saved but other keys of this app: they used a version from
     before this popup, so they see the current version's notes.
   - An older version saved: every version they missed, up to MAX.
   - Storage that can't be written (private mode): never shown, or it
     would come back on every visit.
   - It waits until no other dialog, the tour or its welcome card is open.
   - Settings › About › What's new shows every version at any time.
   ===================================================================== */
const WhatsNew = {
  KEY: 'cv-seen-version',
  MAX: 3,
  list: [], // the versions shown in the open popup
  pending: null,
  timer: 0,

  // Compares versions number by number: 1.10.0 is newer than 1.9.0.
  cmp(a, b) {
    const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
    return 0;
  },
  canStore() {
    try { localStorage.setItem('cv-probe', '1'); localStorage.removeItem('cv-probe'); return true; } catch (e) { return false; }
  },
  // app_language is saved on every visit, so only a language saved before this one counts (I18N.stored).
  usedBefore() {
    if (I18N.stored) return true;
    try {
      for (let i = 0; i < localStorage.length; i++) if (/^(cv-(?!probe$)|chat_|has_completed_walkthrough$)/.test(localStorage.key(i) || '')) return true;
    } catch (e) { /* no storage */ }
    return false;
  },
  // The versions this device hasn't seen yet, newest first; [] when there is nothing to show.
  missed() {
    if (!this.canStore()) return [];
    const seen = store(this.KEY);
    if (!seen) {
      if (!this.usedBefore()) { this.markSeen(); return []; }
      return RELEASE_NOTES.filter(r => r.v === APP_VERSION);
    }
    if (this.cmp(seen, APP_VERSION) >= 0) { if (seen !== APP_VERSION) this.markSeen(); return []; }
    return RELEASE_NOTES.filter(r => this.cmp(r.v, seen) > 0 && this.cmp(r.v, APP_VERSION) <= 0).slice(0, this.MAX);
  },
  markSeen() { store(this.KEY, APP_VERSION); },

  boot() {
    const l = this.missed();
    if (!l.length) return;
    this.pending = l;
    this.tryShow();
  },
  busy() { return Dialogs.any() || Tour.active() || !$('tourWelcome').hidden || !$('loading').hidden; },
  // Waits for the dialog, tour or loading on screen to finish, then shows.
  tryShow() {
    clearTimeout(this.timer);
    if (!this.pending) return;
    if (this.busy()) { this.timer = setTimeout(() => this.tryShow(), 800); return; }
    const l = this.pending; this.pending = null;
    this.show(l);
  },
  // l: the versions to list (Settings › About passes every version).
  show(l) {
    this.list = l || RELEASE_NOTES;
    this.render();
    openModal('wnModal');
    $('wnBody').scrollTop = 0;
    $('wnOk').focus();
  },
  render() {
    const lang = (I18N.lang || 'en').slice(0, 2), loc = I18N.info().locale;
    const groups = [['new', 'whats_new.new'], ['improved', 'whats_new.improved'], ['fixed', 'whats_new.fixed']];
    const date = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
    $('wnBody').innerHTML = this.list.map(r =>
      '<section class="wn-ver" aria-label="' + esc(t('settings.version', { v: r.v })) + '">' +
        '<h3><bdi>' + esc(t('settings.version', { v: r.v })) + '</bdi>' + (r.date ? '<small>' + esc(date(r.date)) + '</small>' : '') + '</h3>' +
        groups.map(([k, label]) => {
          const items = r.items.filter(it => it.kind === k);
          if (!items.length) return '';
          return '<div class="wn-grp"><span class="wn-badge wn-' + k + '">' + esc(t(label)) + '</span><ul>' +
            items.map(it => '<li>' + ltrKeys(esc(it[lang] || it.en)) + '</li>').join('') + '</ul></div>';
        }).join('') +
      '</section>').join('');
  }
};

$('wnModal').addEventListener('modalclose', () => WhatsNew.markSeen());
$('wnOk').onclick = () => closeModal('wnModal');
// Esc: app.js closes it over a chat; on the start screen app.js ignores keys, so it's done here.
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('start').hidden && !$('wnModal').hidden && Dialogs.stack[Dialogs.stack.length - 1] === $('wnModal')) closeModal('wnModal'); });
document.addEventListener('langchange', () => { if (!$('wnModal').hidden) WhatsNew.render(); });
WhatsNew.boot();
