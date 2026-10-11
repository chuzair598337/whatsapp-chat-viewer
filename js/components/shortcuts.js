"use strict";
/* =====================================================================
   Keyboard shortcuts: the one keyboard handler for the app's shortcuts,
   the Keyboard shortcuts sheet (? or Mod+/, Settings › Help, ⋮ menu,
   start screen) and the hints that show a shortcut next to what it does.
   The shortcuts themselves are listed in js/components/shortcuts-list.js.

   - Mod is Cmd on a Mac and Ctrl elsewhere; on a Mac Ctrl never counts,
     so Ctrl+F stays the text fields' own "forward one letter".
   - Nothing runs while the guided tour or a menu is open, and a key that
     isn't marked field never runs while typing in a text field or while
     an input method is composing.
   - Single-key shortcuts (single) can be turned off in Settings; the
     choice is kept in localStorage as cv-single-keys.
   - Keys are written with Latin letters and symbols in every language:
     they name the keys printed on the keyboard.
   Loaded after the other components and before tour-controller.js.
   ===================================================================== */
const MAC = /Mac|iPhone|iPad|iPod/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent);
// Keys the browser reports differently on other layouts (e.key is then an Urdu or Arabic letter): matched by position.
const KEY_CODE = { ',': ['Comma', false], '/': ['Slash', false], '?': ['Slash', true], '[': ['BracketLeft', false], '*': ['Digit8', true], '+': ['Equal', true], '-': ['Minus', false] };
const KEY_ALIAS = { '+': ['+', '='], '*': ['*'], '-': ['-'] };
const KEY_NAME = { Escape: 'Esc', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', PageUp: 'Page Up', PageDown: 'Page Down', '+': '+', '-': '−' };
// Buttons whose tooltip names their shortcut: [element id, shortcut id, dictionary key of the tooltip (or null to keep it)].
const KEY_HINTS = [
  ['searchBtn', 'search', 'chat.search'], ['sCase', 'matchCase', 'search.match_case_tip'], ['sWord', 'wholeWord', 'search.whole_word_tip'], ['sRegex', 'regex', 'search.regex_tip'],
  ['next2', 'nextMatch', 'common.next_match_newer'], ['prev2', 'prevMatch', 'common.previous_match_older'],
  ['fab', 'latest', 'chat.jump_to_latest_message'], ['fabTop', 'first', 'chat.jump_to_first_message'],
  ['lbDl', 'viewerDownload', 'viewer.download_photo'], ['pdfDl', 'viewerDownload', 'pdf.download_pdf'], ['lbGo', 'lbGo', 'media_gallery.go_to_message'],
  ['startBrowse', 'open', null], ['sbOpen', 'open', 'sidebar.open_a_chat_export']
];

const Keys = {
  single: store('cv-single-keys') !== '0',
  list: KEY_LIST.map(k => Object.assign({}, k, { combos: (Array.isArray(k.keys) ? k.keys : MAC ? k.keys.mac : k.keys.other).map(parseKey) })),
  get(id) { return this.list.find(k => k.id === id); },
  setSingle(on) { this.single = on; store('cv-single-keys', on ? '1' : '0'); this.decorate(); },
  typing(e) { const el = e.target; return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable); },
  inLb() { return !$('lb').hidden; },

  /* ---------- Where the keyboard is: the places a shortcut can work ---------- */
  places() {
    const p = new Set();
    if (Tour.active() || !$('tourWelcome').hidden) return p; // the tour has its own keys (tour-controller.js)
    if (!moreMenu.hidden || MsgMenu.isOpen() || GalMenu.isOpen()) return p; // menus move with the arrow keys and close with Esc themselves
    const top = Dialogs.stack[Dialogs.stack.length - 1];
    if (top) { p.add(top.id === 'lb' ? 'lb' : top.id === 'pdfv' ? 'pdf' : top.id === 'galModal' ? 'gallery' : top.id === 'keysModal' ? 'keys' : 'dialog'); return p; }
    if (!$('start').hidden) { p.add('start'); return p; }
    if (!S.msgs.length) return p;
    p.add(Sel.on ? 'select' : 'chat');
    if (!Sel.on && this.row()) p.add('message');
    if (!$('sstrip').hidden) p.add('search');
    return p;
  },
  handle(e) {
    if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
    const places = this.places(); if (!places.size) return;
    const typing = this.typing(e);
    for (const k of this.list) {
      if (!k.run || !k.where.some(w => places.has(w))) continue;
      if (typing && !k.field) continue;
      const c = k.combos.find(c => this.live(k, c) && keyHit(e, c)); if (!c) continue;
      if (k.when && !k.when()) continue;
      if (k.run(e, c.spec) === false) continue;
      e.preventDefault(); e.stopPropagation();
      return;
    }
  },

  // A single-key shortcut is off while Settings › Single-key shortcuts is off.
  live(k, c) { return this.single || !(k.single === true || (Array.isArray(k.single) && k.single.includes(c.spec))); },

  /* ---------- Showing keys ---------- */
  // Plain text, for tooltips and menu hints: ⌘⇧S on a Mac, Ctrl+Shift+S elsewhere.
  // first: only the first key, for the narrow hints in menus.
  text(id, first) {
    const k = this.get(id); if (!k) return '';
    const all = k.combos.filter(c => this.live(k, c)).map(c => c.parts.join(MAC ? '' : '+'));
    return first ? all[0] || '' : all.join(' ' + t('keys.or') + ' ');
  },
  // Key caps for the sheet.
  caps(k) { return k.combos.filter(c => this.live(k, c)).map(c => '<span class="kc">' + c.parts.map(p => '<kbd>' + esc(p) + '</kbd>').join(MAC ? '' : '<i>+</i>') + '</span>').join('<i class="kor">' + esc(t('keys.or')) + '</i>'); },
  aria(id) { const k = this.get(id); return k ? k.combos.filter(c => this.live(k, c)).map(c => c.aria).join(' ') : ''; },
  // Tooltips and menu hints: run at start-up and after every language change, since those redraw the tooltips.
  // root: only the hints inside it (a menu just drawn).
  decorate(root) {
    if (!root) for (const [el, id, key] of KEY_HINTS) {
      const b = $(el); if (!b) continue;
      const base = key ? t(key) : b.textContent.trim();
      const k = this.text(id);
      b.title = k ? base + ' (' + k + ')' : base;
      if (k) b.setAttribute('aria-keyshortcuts', this.aria(id)); else b.removeAttribute('aria-keyshortcuts');
    }
    for (const s of (root || document).querySelectorAll('[data-key]')) {
      s.textContent = this.text(s.dataset.key, true);
      const b = s.closest('button'); if (b) { if (s.textContent) b.setAttribute('aria-keyshortcuts', this.aria(s.dataset.key)); else b.removeAttribute('aria-keyshortcuts'); }
    }
  },

  /* ---------- The Keyboard shortcuts sheet ---------- */
  open() {
    this.render();
    openModal('keysModal');
  },
  close() { if (!$('keysModal').hidden) closeModal('keysModal'); },
  toggle() { if ($('keysModal').hidden) this.open(); else this.close(); },
  // Grouped like the list. On the start screen only what works there; while selecting, the selection keys come first.
  // A single-key shortcut that Settings turned off stays listed, greyed out.
  render() {
    const start = !$('start').hidden, groups = Sel.on ? KEY_GROUPS.slice().sort((a, b) => (b[0] === 'select') - (a[0] === 'select')) : KEY_GROUPS;
    const row = k => {
      const caps = this.caps(k) || k.combos.map(c => '<span class="kc"><kbd>' + esc(c.parts.join(MAC ? '' : '+')) + '</kbd></span>').join('<i class="kor">' + esc(t('keys.or')) + '</i>');
      return '<div class="krow' + (this.text(k.id) ? '' : ' off') + '"><dt>' + esc(t(k.label)) + '</dt><dd dir="ltr">' + caps + '</dd></div>';
    };
    $('keysBody').innerHTML = '<p class="lead">' + esc(t(MAC ? 'keys.lead_mac' : 'keys.lead_other')) + (this.single ? '' : ' ' + esc(t('keys.single_off'))) + '</p>' +
      groups.map(([g, title]) => {
        const rows = this.list.filter(k => k.group === g && (!start || (k.where || []).includes('start')));
        return rows.length ? '<section class="kgrp"><h3>' + esc(t(title)) + '</h3><dl>' + rows.map(row).join('') + '</dl></section>' : '';
      }).join('');
  },

  /* ---------- What the shortcuts do ---------- */
  // The message row that itself has keyboard focus (J and K put it there), not a button inside it.
  row() { const a = document.activeElement; return a && a.classList && a.classList.contains('row') && layer.contains(a) && rowMsg(a) >= 0 ? a : null; },
  msg() { return rowMsg(document.activeElement); },
  // Moves keyboard focus to the next (1) or previous (-1) message, scrolling just enough to show it.
  move(d) {
    const items = S.items; if (!items.length || !VL.fw) return;
    const cur = this.msg();
    let k;
    if (cur >= 0 && S.m2i[cur] >= 0) k = S.m2i[cur] + d;
    else { // nothing focused yet: start from the first (or last) message on screen
      const st = scroller.scrollTop, vh = scroller.clientHeight;
      k = d > 0 ? VL.fw.find(st) : VL.fw.find(st + vh - 1);
      if (d > 0 && VL.fw.sum(k) < st) k++;
    }
    while (k >= 0 && k < items.length && items[k].type !== 'msg') k += d;
    if (k < 0 || k >= items.length) return;
    this.focusItem(k);
  },
  focusItem(k) {
    const st = scroller.scrollTop, vh = scroller.clientHeight, top = VL.fw.sum(k), h = VL.h[k], pad = 48;
    if (top < st + pad) { VL.target = { i: k, off: -pad }; VL.update(); }
    else if (top + h > st + vh - pad) { VL.target = { i: k, off: Math.min(h - vh + pad, -pad) }; VL.update(); }
    const el = VL.nodes.get(k); if (!el) return;
    el.tabIndex = -1; el.focus({ preventScroll: true });
  },
  refocus(i) { const k = S.m2i[i]; if (k >= 0) { const el = VL.nodes.get(k); if (el) { el.tabIndex = -1; el.focus({ preventScroll: true }); } } },
  // First (-1) or latest (1) message, like the jump buttons.
  edge(d) { if (d < 0) VL.scrollTo(0); else VL.bottom(); },
  // Runs the focused message's own menu action with one of these icons (message-menu.js), so the shortcut does exactly what the menu does.
  act(icons) {
    const i = this.msg(); if (i < 0) return false;
    const a = MsgMenu.actions(i).find(x => icons.includes(x[0])); if (!a) return false;
    a[2](); this.refocus(i);
  },
  audio() { const i = this.msg(), m = i >= 0 && S.msgs[i], a = m && m.attachments.find(x => x.type === 'audio' && x.url); return a ? Media.get(a.name) : null; },
  play() { const e = this.audio(); if (!e) return false; AudioCtl.toggle(e.name); },
  seek(sec) {
    const e = this.audio(); if (!e || !AudioCtl.isCurrent(e.name)) return false;
    const dur = AudioCtl.dur.get(e.name), now = AudioCtl.wa ? AudioCtl.waNow() : AudioCtl.el ? AudioCtl.el.currentTime : 0;
    if (!dur) return false;
    AudioCtl.toggle(e.name, Math.max(0, Math.min(0.999, (now + sec) / dur)));
  },
  async chat(d) {
    const lib = S.library, k = S.libIdx + d;
    if (!lib || k < 0 || k >= lib.length) return;
    if (await openEntry(lib[k])) { S.libIdx = k; renderLibrary(); }
  },
  // Esc closes, in order: the dialog on top, the starred panel, the search bar, the side drawer.
  escape() {
    // "Which one is you?": Esc first leaves its nickname editing. When a chat opens it is mandatory, so Esc never closes it
    // or what is under it; opened from Settings, Esc closes it without a change.
    if (!$('meModal').hidden && Dialogs.stack[Dialogs.stack.length - 1] === $('meModal')) { if (MeUI.editing) meMode(false); else if (MeUI.optional) closeModal('meModal'); return; }
    const ids = ['cfModal', 'vcModal', 'keysModal', 'galModal', 'statsModal', 'pickModal', 'nickModal', 'setModal'];
    const top = Dialogs.stack.filter(d => ids.includes(d.id) && !d.hidden).pop() || ids.map($).find(d => !d.hidden);
    if (top) { closeModal(top.id); return; }
    if (!$('starPanel').hidden) { closeStars(); return; }
    if (!$('sstrip').hidden) { closeSearch(); return; }
    if (document.body.classList.contains('drawer-open')) { closeDrawer(); return; }
    return false;
  }
};

// 'Mod+Shift+S' → what keyHit needs, the key caps and the aria-keyshortcuts value.
function parseKey(spec) {
  const bits = spec === '+' ? ['+'] : spec.split('+'), key = bits.pop();
  const c = { spec, key, mod: bits.includes('Mod'), shift: bits.includes('Shift'), alt: bits.includes('Alt') };
  const name = KEY_NAME[key] || key;
  c.parts = (MAC ? [c.alt && '⌥', c.shift && '⇧', c.mod && '⌘'] : [c.mod && 'Ctrl', c.alt && 'Alt', c.shift && 'Shift']).filter(Boolean).concat(name);
  c.aria = [c.mod && (MAC ? 'Meta' : 'Control'), c.alt && 'Alt', c.shift && 'Shift', key === 'Space' ? 'Space' : key === '+' ? 'Plus' : key].filter(Boolean).join('+');
  return c;
}
function keyHit(e, c) {
  const mod = MAC ? e.metaKey : e.ctrlKey, other = MAC ? e.ctrlKey : e.metaKey;
  if (c.mod !== mod || other || c.alt !== e.altKey) return false;
  const key = c.key, ascii = /^[\x21-\x7e]$/.test(e.key);
  if (key === 'Space') return e.key === ' ' && e.shiftKey === c.shift;
  if (key.length > 1) return e.key === key && e.shiftKey === c.shift; // Escape, Enter, ArrowUp, F3…
  if (/[A-Z]/.test(key)) return e.shiftKey === c.shift && (ascii ? e.key.toUpperCase() === key : e.code === 'Key' + key);
  if (/[0-9]/.test(key)) return ascii ? e.key === key : e.code === 'Digit' + key || e.code === 'Numpad' + key;
  if (ascii) return (KEY_ALIAS[key] || [key]).includes(e.key) || (key === '*' && e.code === 'NumpadMultiply');
  const pos = KEY_CODE[key]; // another layout: the key in the same place
  return !!pos && e.code === pos[0] && (c.mod || e.shiftKey === pos[1]);
}

document.addEventListener('keydown', e => Keys.handle(e));
document.addEventListener('langchange', () => { Keys.decorate(); if (!$('keysModal').hidden) Keys.render(); });
Object.assign(ICON, { keyboard: ic('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.1M10 10h.1M13.5 10h.1M17 10h.1M6.5 14h.1M17 14h.1M9.5 14h5"/>') });
$('miKeys').innerHTML = ICON.keyboard;
$('keysBtn').onclick = () => Keys.open();
$('startKeys').onclick = () => Keys.open();
$('keysModal').querySelector('[data-close]').innerHTML = ICON.close;
Keys.decorate();
