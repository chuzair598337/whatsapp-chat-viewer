"use strict";
/* =====================================================================
   Participant nicknames: Settings › Participants and nicknames lists
   everyone who wrote in the open chat, with a field to give each one a
   nickname and a Reset button that brings the exported name back.

   - nick(name) is the name to show. Every place that shows a sender (the
     name above a message, avatars, reactions, the side panel, filters,
     starred messages, statistics, the photo viewer, the gallery, copied
     messages, the chat title of a one-to-one chat) goes through it.
     Messages keep their exported sender, so "who you are", filters and
     avatar colours don't change when someone is renamed.
   - Search finds a message by the sender's exported name and nickname.
   - Kept in localStorage per chat, as chat_nicknames_<id>. The id is a
     hash of everyone's exported name and the first message, so the same
     export opens with the same nicknames and other chats never share them.
     This is the one place a name is stored, because the maintainer asked
     for nicknames to be remembered (PROJECT_RULES.md, "Storage").
   ===================================================================== */
const NICK_MAX = 40;
const Nick = {
  key: '', map: Object.create(null),
  // Called by applyResult() whenever a chat is shown (also after re-reading its dates, which keeps the same id).
  load() {
    const res = S.res, m0 = S.msgs.find(m => !m.isSystem) || S.msgs[0];
    const id = res.participants.map(p => p.name).sort().join('\u0001') + '\u0002' + (m0 ? m0.formattedTime + '\u0001' + m0.message.slice(0, 80) : '');
    this.key = 'chat_nicknames_' + hash(id).toString(36) + hash(id.split('').reverse().join('')).toString(36);
    this.map = Object.create(null);
    let o = null;
    try { o = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { o = null; }
    if (o && typeof o === 'object') {
      const names = new Set(res.participants.map(p => p.name));
      for (const k of Object.keys(o)) if (names.has(k) && typeof o[k] === 'string' && o[k].trim()) this.map[k] = o[k].trim().slice(0, NICK_MAX);
    }
  },
  count() { return Object.keys(this.map).length; },
  has(name) { return !!name && name in this.map; },
  save() {
    try { if (this.count()) localStorage.setItem(this.key, JSON.stringify(this.map)); else localStorage.removeItem(this.key); } catch (e) { /* private mode: works until the tab closes */ }
  },
  // Returns true when something changed. An empty nickname clears it.
  set(name, value) {
    const v = (value || '').replace(/\s+/g, ' ').trim().slice(0, NICK_MAX);
    if (v === (this.map[name] || '')) return false;
    if (v && v !== name) this.map[name] = v; else if (this.has(name)) delete this.map[name]; else return false;
    this.save();
    this.apply();
    return true;
  },
  // Redraws everything that shows a name.
  apply() {
    S.lc = null; S.stats = null;
    S.title = computeTitle();
    VL.refresh();
    renderChrome();
    if (S.q && S.q.trim()) runSearch(S.q);
  }
};
const nick = name => name && name in Nick.map ? Nick.map[name] : name;

/* ---------- The Participants and nicknames sheet ---------- */
const NickUI = {
  open() {
    if (!S.res) return;
    $('nickFilter').value = '';
    this.render();
    openModal('nickModal');
    if (!$('nickFilterW').hidden) $('nickFilter').focus();
    else { const f = $('nickList').querySelector('input'); if (f) f.focus(); }
  },
  isOpen() { return !$('nickModal').hidden; },
  render() {
    const ps = S.res.participants;
    $('nickFilterW').hidden = ps.length <= 12;
    $('nickList').innerHTML = ps.map((p, k) => this.rowHTML(p, k)).join('');
    this.filter();
  },
  rowHTML(p, k) {
    const nk = Nick.map[p.name] || '', shown = nk || p.name;
    return '<div class="nickrow" data-k="' + k + '" data-f="' + esc(fold(p.name + ' ' + nk)) + '">' +
      '<span class="av c' + colorIdx(p.name) + '" aria-hidden="true">' + esc(initials(shown)) + '</span>' +
      '<div class="nk"><label for="nk' + k + '"><bdi>' + esc(p.name) + '</bdi>' + (p.name === S.me ? ' <em>' + t('common.you') + '</em>' : '') + '<small>' + t('me.n_messages', { n: nf(p.count) }) + '</small></label>' +
      '<div class="nkline"><input id="nk' + k + '" type="text" dir="auto" maxlength="' + NICK_MAX + '" autocomplete="off" enterkeyhint="done" placeholder="' + esc(t('nick.placeholder')) + '" value="' + esc(nk) + '">' +
      '<button class="btn nkreset" data-reset="' + k + '"' + (nk ? '' : ' hidden') + ' aria-label="' + esc(t('nick.reset_label', { name: p.name })) + '">' + t('nick.reset') + '</button></div></div></div>';
  },
  // Redraws one row after a change, keeping focus where it was.
  update(k) {
    const row = $('nickList').querySelector('.nickrow[data-k="' + k + '"]'); if (!row) return;
    const focusIn = row.contains(document.activeElement);
    row.outerHTML = this.rowHTML(S.res.participants[k], k);
    this.filter();
    if (focusIn) $('nk' + k).focus();
  },
  commit(input) {
    const k = +input.id.slice(2), p = S.res.participants[k]; if (!p) return;
    if (!Nick.set(p.name, input.value)) { input.value = Nick.map[p.name] || ''; return; }
    this.update(k);
    if (Nick.has(p.name)) toast.success(t('nick.saved', { name: p.name, nick: Nick.map[p.name] }));
    else toast.info(t('nick.restored', { name: p.name }));
  },
  reset(k) {
    const p = S.res.participants[k]; if (!p || !Nick.has(p.name)) return;
    Nick.set(p.name, '');
    this.update(k);
    $('nk' + k).focus();
    toast.info(t('nick.restored', { name: p.name }));
  },
  filter() {
    const q = fold($('nickFilter').value.trim());
    let n = 0;
    for (const r of $('nickList').querySelectorAll('.nickrow')) { const show = !q || r.dataset.f.includes(q); r.hidden = !show; if (show) n++; }
    $('nickNone').hidden = !q || n > 0;
  }
};
$('nickList').addEventListener('change', e => { if (e.target.tagName === 'INPUT') NickUI.commit(e.target); });
$('nickList').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); NickUI.commit(e.target); } });
$('nickList').addEventListener('click', e => { const b = e.target.closest('[data-reset]'); if (b) NickUI.reset(+b.dataset.reset); });
$('nickFilter').addEventListener('input', () => NickUI.filter());
$('nickFilterIcon').innerHTML = ICON.search.replace('width="22" height="22"', 'width="18" height="18"');
document.addEventListener('langchange', () => { if (S.res && NickUI.isOpen()) NickUI.render(); });
