"use strict";
/* =====================================================================
   Selecting messages, like WhatsApp's Select: ⋮ → Select messages (or
   Select in a message's menu) puts the chat in selection mode. Each tap
   or click on a message selects or unselects the whole message; scroll
   and pick as many as you like. The header turns into a bar with the
   count and the actions: Star, Copy and Share (where the device can
   share). ✕ or Esc leaves selection mode.

   Only messages can be picked (not dates or system notices). Nothing is
   stored: the selection lives in S.sel while the mode is on.
   ===================================================================== */
// Dates in shared text are written like the chat's own date rows, in English, whatever the interface language.
const selDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const Sel = {
  on: false,
  start(first) {
    if (!S.msgs.length) return;
    if (!$('sstrip').hidden) closeSearch();
    closeDrawer(); MsgMenu.close(false);
    S.sel = new Set(); this.on = S.selecting = true;
    if (first >= 0 && S.msgs[first] && !S.msgs[first].isSystem) S.sel.add(first);
    document.body.classList.add('selecting');
    $('selbar').hidden = false;
    VL.relayout(); this.paint();
    $('selClose').focus();
  },
  stop(quiet) {
    if (!this.on) return;
    this.on = S.selecting = false; S.sel = new Set();
    document.body.classList.remove('selecting');
    $('selbar').hidden = true;
    if (quiet) return; // a new chat is being shown, which lays itself out
    VL.relayout();
    $('moreBtn').focus();
  },
  toggle(i) {
    if (!this.on || i < 0 || !S.msgs[i] || S.msgs[i].isSystem) return;
    if (S.sel.has(i)) S.sel.delete(i); else S.sel.add(i);
    const row = layer.querySelector('.row[data-i="' + S.m2i[i] + '"]');
    if (row) { const on = S.sel.has(i); row.classList.toggle('sel', on); const b = row.querySelector('.selbox'); if (b) b.setAttribute('aria-checked', on); }
    this.paint();
  },
  // The bar: the count, and actions that only work with something picked.
  paint() {
    const n = S.sel ? S.sel.size : 0;
    $('selCount').textContent = t('sel.n_selected', { n, count: nf(n) });
    const all = n && [...S.sel].every(i => S.starred && S.starred.has(i));
    $('selStar').innerHTML = ICON[all ? 'unstar' : 'star'];
    $('selStar').setAttribute('aria-label', t(all ? 'sel.unstar' : 'sel.star')); $('selStar').title = t(all ? 'sel.unstar' : 'sel.star');
    $('selShare').hidden = !canShare();
    for (const id of ['selStar', 'selCopy', 'selShare']) $(id).disabled = !n;
  },
  picked() { return [...S.sel].sort((a, b) => a - b).map(i => S.msgs[i]); },
  // The picked messages as text, oldest first, one per message: "[3 Apr 2026, 8:02 AM] Ayesha Khan: …".
  text() {
    return this.picked().map(m => {
      const who = nick(m.isOutgoing && S.me ? S.me : (m.sender || '')); // a nickname replaces the exported name here too
      const body = [copyable(m)].concat(m.attachments.map(a => a.name ? '<' + (a.title || baseName(a.name)) + '>' : '')).filter(Boolean).join('\n');
      return '[' + selDate.format(dkToT(m.dateKey)) + ', ' + m.formattedTime + '] ' + (who ? who + ': ' : '') + body;
    }).join('\n');
  },
  star() {
    const ids = [...S.sel]; if (!ids.length) return;
    if (!S.starred) S.starred = new Set();
    const all = ids.every(i => S.starred.has(i));
    for (const i of ids) if (all) S.starred.delete(i); else S.starred.add(i);
    VL.refresh(); renderStars(); this.paint();
    if (all) toast.info(t('sel.unstarred_n', { n: ids.length, count: nf(ids.length) })); else toast.success(t('sel.starred_n', { n: ids.length, count: nf(ids.length) }));
  },
  copy() { if (S.sel.size) copyText(this.text(), t('sel.messages_n', { n: S.sel.size, count: nf(S.sel.size) })); },
  async share() {
    if (!S.sel.size) return;
    const text = this.text();
    const files = this.picked().flatMap(m => m.attachments.map(a => a.url && Media.get(a.name)).filter(Boolean)).map(e => new File([e.blob], e.name, { type: e.mime }));
    const data = files.length && navigator.canShare && navigator.canShare({ files, text }) ? { files, text } : { text };
    try { await navigator.share(data); this.stop(); }
    catch (err) {
      if (err && err.name === 'AbortError') return;
      copyText(text, t('sel.messages_n', { n: S.sel.size, count: nf(S.sel.size) })); // refused after all: copy instead
    }
  }
};
$('selectBtn').onclick = () => Sel.start(-1);
$('selClose').onclick = () => Sel.stop();
$('selStar').onclick = () => Sel.star();
$('selCopy').onclick = () => Sel.copy();
$('selShare').onclick = () => Sel.share();
$('selClose').innerHTML = ICON.close; $('selCopy').innerHTML = ICON.copy; $('selShare').innerHTML = ICON.share; $('miSelect').innerHTML = ICON.check;
// In selection mode a tap or click anywhere on a message picks it, instead of opening its photo, link or player.
layer.addEventListener('click', e => {
  if (!Sel.on) return;
  const i = rowMsg(e.target); if (i < 0) return;
  e.preventDefault(); e.stopImmediatePropagation();
  Sel.toggle(i);
}, true);
layer.addEventListener('keydown', e => {
  if (!Sel.on || (e.key !== ' ' && e.key !== 'Enter')) return;
  const i = rowMsg(e.target); if (i < 0) return;
  e.preventDefault(); Sel.toggle(i);
}, true);
document.addEventListener('keydown', e => { if (Sel.on && e.key === 'Escape' && !Dialogs.any()) { e.preventDefault(); e.stopImmediatePropagation(); Sel.stop(); } }, true);
document.addEventListener('langchange', () => { if (Sel.on) Sel.paint(); });
