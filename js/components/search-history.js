"use strict";
/* =====================================================================
   Recent searches: a list under the search bar with the last 7 searches,
   newest first. It opens when the search field gets focus and narrows to
   the searches that contain what is typed.

   - A search is saved when it is submitted: Enter, the ↑ ↓ match buttons,
     or picking it from the list. Searching for it again moves it to the top
     instead of adding a copy.
   - Picking one fills the search bar and runs it. Its ✕ (or Delete on a
     focused search) removes only that one.
   - Clear all (in the list's heading) removes every search, after a
     confirmation dialog so a stray tap can't wipe them.
   - Esc, a click outside or leaving the field closes the list. ↓ from the
     field moves into the list, ↑ ↓ move through it.
   - Kept in localStorage as chat_search_history (a JSON array), shared by
     every chat, because the maintainer asked for it (PROJECT_RULES.md,
     "Storage").
   ===================================================================== */
const SHist = {
  KEY: 'chat_search_history', MAX: 7,
  list() {
    let a = null;
    try { a = JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (e) { a = null; }
    return Array.isArray(a) ? a.filter(x => typeof x === 'string' && x.trim()).slice(0, this.MAX) : [];
  },
  write(a) {
    try { if (a.length) localStorage.setItem(this.KEY, JSON.stringify(a.slice(0, this.MAX))); else localStorage.removeItem(this.KEY); } catch (e) { /* private mode */ }
  },
  add(q) {
    q = (q || '').replace(/\s+/g, ' ').trim().slice(0, 100);
    if (!q) return;
    const f = fold(q);
    this.write([q].concat(this.list().filter(x => fold(x) !== f)));
  },
  remove(q) { this.write(this.list().filter(x => x !== q)); },

  shown: [],
  isOpen() { return !$('shist').hidden; },
  // Opens (or redraws) the list for what is in the search field; closes it when nothing fits.
  show() {
    const v = fold(q2.value.trim());
    this.shown = this.list().filter(x => !v || (fold(x).includes(v) && fold(x) !== v));
    if (!this.shown.length) { this.close(); return; }
    $('shistList').innerHTML = this.shown.map((x, k) =>
      '<li class="shi"><button class="shq" data-k="' + k + '">' + ICON.clock + '<span dir="auto">' + esc(x) + '</span></button>' +
      '<button class="shx" data-x="' + k + '" aria-label="' + esc(t('shist.remove', { q: x })) + '" title="' + esc(t('shist.remove_short')) + '">' + ICON.close + '</button></li>').join('');
    $('shist').hidden = false;
    q2.setAttribute('aria-expanded', 'true');
  },
  close() {
    if ($('shist').hidden) return;
    $('shist').hidden = true;
    q2.setAttribute('aria-expanded', 'false');
  },
  pick(k) {
    const q = this.shown[k]; if (q === undefined) return;
    this.close();
    q2.value = q; clearTimeout(searchTimer);
    this.add(q); runSearch(q);
    this.mute = true; q2.focus(); this.mute = false;
  },
  drop(k) {
    const q = this.shown[k]; if (q === undefined) return;
    const fromList = $('shist').contains(document.activeElement);
    this.remove(q);
    this.show();
    if (!fromList) return;
    const btns = $('shistList').querySelectorAll('.shq');
    if (this.isOpen() && btns.length) btns[Math.min(k, btns.length - 1)].focus(); else { this.mute = true; q2.focus(); this.mute = false; }
  },
  clearAll() {
    this.close();
    confirmDialog(t('shist.clear_title'), t('shist.clear_text'), t('shist.clear'), () => {
      this.write([]);
      toast.success(t('shist.cleared'));
    });
  },
  move(from, d) {
    const btns = [...$('shistList').querySelectorAll('.shq')], k = btns.indexOf(from) + d;
    if (k < 0) q2.focus(); else if (k < btns.length) btns[k].focus();
  }
};
Object.assign(ICON, { clock: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>') });
q2.setAttribute('aria-controls', 'shist'); q2.setAttribute('aria-expanded', 'false');
q2.addEventListener('focus', () => { if (!SHist.mute) SHist.show(); });
q2.addEventListener('click', () => { if (!SHist.isOpen()) SHist.show(); });
q2.addEventListener('input', () => SHist.show());
// Esc in the field is handled in app.js, so it closes this list before the search bar.
q2.addEventListener('keydown', e => {
  if (e.key === 'Enter') { SHist.add(q2.value); SHist.close(); }
  else if (e.key === 'ArrowDown' && SHist.isOpen()) { e.preventDefault(); const b = $('shistList').querySelector('.shq'); if (b) b.focus(); }
});
for (const id of ['prev2', 'next2']) $(id).addEventListener('click', () => SHist.add(q2.value));
// Mouse and touch: keep focus in the field while the list is used, so it doesn't close underneath the click.
$('shist').addEventListener('mousedown', e => e.preventDefault());
$('shist').addEventListener('click', e => {
  if (e.target.closest('#shistClear')) { SHist.clearAll(); return; }
  const x = e.target.closest('[data-x]'); if (x) { SHist.drop(+x.dataset.x); return; }
  const b = e.target.closest('[data-k]'); if (b) SHist.pick(+b.dataset.k);
});
$('shist').addEventListener('keydown', e => {
  const b = e.target.closest('.shq'), x = e.target.closest('.shx');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (b || x) { e.preventDefault(); SHist.move(b || x.previousElementSibling, e.key === 'ArrowDown' ? 1 : -1); } }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && b) { e.preventDefault(); SHist.drop(+b.dataset.k); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); SHist.close(); SHist.mute = true; q2.focus(); SHist.mute = false; }
});
// Closes when focus leaves both the field and the list (Tab away, a click elsewhere).
for (const el of [q2, $('shist')]) el.addEventListener('focusout', e => {
  const to = e.relatedTarget;
  if (!to || (to !== q2 && !$('shist').contains(to))) SHist.close();
});
document.addEventListener('pointerdown', e => { if (SHist.isOpen() && e.target !== q2 && !$('shist').contains(e.target)) SHist.close(); });
