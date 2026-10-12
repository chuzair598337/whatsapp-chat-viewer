"use strict";
/* =====================================================================
   Starred messages panel, export and import.

   The panel looks like the chat: each starred message is a bubble, yours
   on the right in green and everyone else's on the left, under a line
   with the sender, who it went to and the date. Tapping a bubble jumps to
   the message in the chat; the star on its side unstars it.

   Stars live in memory only (nothing is stored), so the panel offers two
   ways to keep them:
   - Export: a small .json file with the chat's fingerprint and, for each
     starred message, its time, sender, text and file names. Import reads
     it back and stars the same messages when that chat is open again.
     A starred file can also be dropped on the chat, or opened together
     with the chat export.
   - Save as text: the starred messages as readable lines.
   Closing the tab with stars that were never exported asks first, and
   switching between chats in the library keeps each chat's stars in
   memory until the tab closes.
   ===================================================================== */
Object.assign(ICON, {
  upload: ic('<path d="M12 15.5V4.5M7 9l5-5 5 5M5 19.5h14"/>'),
  textFile: ic('<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5"/>')
});
const STAR_FORMAT = 'whatsapp-chat-viewer-starred';

const Stars = {
  stash: new Map(), // fingerprint of a chat in this tab → its stars, while another chat is open
  pending: null, // a starred file opened before its chat
  list() { return [...(S.starred || [])].sort((a, b) => a - b); },
  sig() { return this.list().join(','); },
  // Starred since the last export or import.
  dirty() { return !!(S.starred && S.starred.size) && this.sig() !== S.starSaved; },
  cur: '', // the open chat's fingerprint, taken when it opened (S.source already names the next chat by the time it leaves)
  fp() { const ms = S.msgs; return ms.length ? [S.source && S.source.name, ms[0].timestamp, ms[ms.length - 1].timestamp, ms.length].join('|') : ''; },

  /* ---------- Chats opening and closing ---------- */
  // Called by applyResult before another chat replaces this one.
  leave() {
    if (this.cur && S.starred && S.starred.size) this.stash.set(this.cur, { set: S.starred, saved: S.starSaved });
    S.starred = new Set(); S.starSaved = '';
  },
  // Called once the new chat is shown: its stars from earlier in this tab, then a starred file opened with it.
  arrive() {
    this.cur = this.fp();
    const st = this.stash.get(this.cur);
    if (st) { S.starred = st.set; S.starSaved = st.saved; this.stash.delete(this.cur); }
    if (this.pending) { const d = this.pending; this.pending = null; this.apply(d); }
  },

  /* ---------- Panel ---------- */
  render() {
    const list = this.list(), n = list.length;
    $('starBadge').hidden = !n; $('starBadge').textContent = n > 99 ? '99+' : n;
    $('starTitle').textContent = n ? t('stars.title_n', { n: nf(n) }) : t('common.starred_messages');
    $('starExport').disabled = $('starText').disabled = !n;
    const note = $('starNote'), dirty = this.dirty();
    note.hidden = !n;
    note.classList.toggle('ok', !dirty);
    note.innerHTML = (dirty ? ICON.timer : ICON.check).replace('width="22" height="22"', 'width="16" height="16"') + '<span>' + esc(dirty ? t('stars.note_unsaved', { n, count: nf(n) }) : t('stars.note_saved')) + '</span>';
    if (n) $('starList').setAttribute('role', 'list'); else $('starList').removeAttribute('role');
    $('starList').innerHTML = n ? list.map(i => this.item(i)).join('')
      : '<div class="star-empty">' + ICON.star + '<p>' + esc(t('stars.empty')) + '</p><p class="star-empty-im">' + esc(t('stars.empty_import')) + '</p><button class="star-chip" id="starImport2">' + ICON.upload + '<span>' + esc(t('stars.import')) + '</span></button></div>';
  },
  // One starred message: who and when above a bubble shaped like the chat's.
  item(i) {
    const m = S.msgs[i], out = m.isOutgoing, who = out ? t('common.you') : nick(m.sender);
    const to = S.isGroup || !S.me ? S.title : out ? S.title : t('common.you');
    const date = shortFmt.format(dkToT(m.dateKey));
    const text = m.kind === 'poll' || m.kind === 'call' || m.kind === 'deleted' || m.kind === 'location' || m.kind === 'waiting' ? '' : m.message;
    const label = t('stars.go_to', { name: who, date, time: m.formattedTime });
    return '<div class="sit ' + (out ? 'out' : 'in') + '" role="listitem">' +
      '<div class="shd"><span class="av c' + colorIdx(m.sender) + '" aria-hidden="true">' + esc(initials(nick(m.sender))) + '</span>' +
      '<span class="sfrom"><b><bdi>' + esc(who) + '</bdi></b><span class="sarr" aria-hidden="true"></span><span class="sto"><bdi>' + esc(to) + '</bdi></span></span><time>' + esc(date) + '</time></div>' +
      '<div class="sbw"><button class="sbub" data-i="' + i + '" aria-label="' + esc(label) + '">' + this.media(m) +
      (text ? '<span class="stxt" dir="auto">' + scriptHTML(text) + '</span>' : '') +
      '<span class="smeta">' + ICON.starFill + '<span dir="ltr">' + m.formattedTime + '</span></span></button>' +
      '<button class="sun ibtn" data-unstar="' + i + '" aria-label="' + esc(t('msg.unstar')) + '" title="' + esc(t('msg.unstar')) + '">' + ICON.unstar + '</button></div></div>';
  },
  // A thumbnail of a photo, GIF, sticker or video in the export; otherwise an icon and what it is.
  media(m) {
    const chip = (icon, text) => '<span class="satt">' + (ICON[icon] || ICON.document) + '<span dir="auto">' + esc(text) + '</span></span>';
    if (m.kind === 'poll' && m.extra) return chip('poll', t('common.poll_prefix', { q: m.extra.q }));
    if (m.kind === 'call' && m.extra) return chip(m.extra.video ? 'video' : 'phone', capFirst(m.extra.label) + (m.extra.detail ? ' · ' + m.extra.detail : ''));
    if (m.kind === 'location') return chip('pin', t('stars.location'));
    if (m.kind === 'deleted') return chip('ban', m.message);
    if (m.kind === 'waiting') return chip('timer', t('msg.waiting_title'));
    return m.attachments.map(a => {
      const e = a.url ? Media.get(a.name) : null, ok = e && !Media.cantShow(e.name), src = ok && (e.view || (isHeic(e.name) ? '' : e.url));
      const vid = ok && (a.type === 'video' || (a.type === 'gif' && VIDEO_EXT.test(extOf(e.name))));
      if (vid) return '<span class="sthumb vid"><video src="' + e.url + '#t=0.1" preload="metadata" muted playsinline tabindex="-1" aria-hidden="true"></video><i>' + ICON.play + '</i></span>';
      if (src && (a.type === 'image' || a.type === 'gif')) return '<span class="sthumb"><img src="' + src + '" alt="" loading="lazy" decoding="async"></span>';
      if (src && a.type === 'sticker' && !isWas(e.name)) return '<span class="sthumb stk"><img src="' + src + '" alt="" loading="lazy" decoding="async"></span>';
      const kind = a.note ? t('type.video_note') : a.type === 'audio' && a.name && isVoice(a.name) ? t('type.voice') : TYPE_LABEL[a.type] ? typeLabel(a.type) : t('common.file');
      const name = a.title || (a.name ? baseName(a.name) : a.raw ? a.raw.replace(/^<|>$/g, '') : '');
      return chip(ICON[a.type] ? a.type : 'document', kind + (name && name !== kind ? ': ' + name : ''));
    }).join('');
  },
  open() { this.render(); $('starPanel').hidden = false; document.body.classList.add('stars-open'); $('starClose').focus(); },
  close() { $('starPanel').hidden = true; document.body.classList.remove('stars-open'); },

  /* ---------- Export ---------- */
  fileName(ext) {
    const day = new Date(), d = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
    const chat = String(S.title || 'Chat').replace(/[\\/:*?"<>|\u0000-\u001f⁨⁩]+/g, ' ').trim().slice(0, 60) || 'Chat';
    return 'Starred - ' + chat + ' - ' + d + '.' + ext;
  },
  save(text, name, type) {
    const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
    a.href = url; a.download = name; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
  data() {
    const ms = S.msgs;
    return {
      format: STAR_FORMAT, version: 1, exported: new Date().toISOString(), app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '',
      chat: { title: S.title, first: ms[0].timestamp, last: ms[ms.length - 1].timestamp, messages: ms.length },
      starred: this.list().map(i => { const m = S.msgs[i]; return { time: m.timestamp, sender: m.sender, text: m.message, files: m.attachments.map(a => baseName(a.name)).filter(Boolean) }; })
    };
  },
  exportFile() {
    if (!S.msgs.length || !S.starred || !S.starred.size) { toast.info(t('stars.nothing')); return; }
    this.save(JSON.stringify(this.data(), null, 1), this.fileName('json'), 'application/json');
    S.starSaved = this.sig(); this.render();
    toast.success(t('stars.exported', { n: S.starred.size, count: nf(S.starred.size) }));
  },
  exportText() {
    if (!S.msgs.length || !S.starred || !S.starred.size) { toast.info(t('stars.nothing')); return; }
    const lines = this.list().map(i => {
      const m = S.msgs[i], files = m.attachments.map(a => '<attached: ' + baseName(a.name) + '>');
      const body = m.kind === 'poll' && m.extra ? 'POLL: ' + m.extra.q + '\n' + m.extra.options.map(o => 'OPTION: ' + o.label + ' (' + o.votes + ')').join('\n') : [m.message].concat(files).filter(Boolean).join('\n');
      return '[' + shortFmt.format(dkToT(m.dateKey)) + ', ' + m.formattedTime + '] ' + nick(m.sender) + ': ' + body;
    });
    this.save(t('stars.text_head', { chat: S.title, count: nf(lines.length), n: lines.length }).replace(/[\u2068\u2069]/g, '') + '\n\n' + lines.join('\n') + '\n', this.fileName('txt'), 'text/plain;charset=utf-8');
    toast.success(t('stars.saved_text'));
  },

  /* ---------- Import ---------- */
  pick() { $('starFile').click(); },
  // Opened or dropped .json files: read each and star its messages, or hold it until a chat opens (later: a chat export came with it).
  async importFiles(files, later) {
    for (const f of files) {
      let d = null;
      try { d = JSON.parse(await f.text()); } catch (e) { d = null; }
      if (!d || d.format !== STAR_FORMAT || !Array.isArray(d.starred)) { toast.error(t('stars.bad_file', { name: f.name })); continue; }
      if (later || !S.msgs.length) { this.pending = d; if (!later) toast.info(t('stars.import_later')); continue; }
      this.apply(d);
    }
  },
  // Stars the file's messages: same time, sender and text first; then same time and sender, or same sender and text, when only one message fits.
  apply(d) {
    const norm = s => String(s == null ? '' : s).replace(/\r\n?/g, '\n').normalize('NFC').trim();
    const ms = S.msgs, byFull = new Map(), byTime = new Map(), byText = new Map();
    const add = (map, k, i) => { const l = map.get(k); if (l) l.push(i); else map.set(k, [i]); };
    for (let i = 0; i < ms.length; i++) {
      const m = ms[i]; if (m.isSystem) continue;
      const files = m.attachments.map(a => baseName(a.name)).filter(Boolean).join('|');
      add(byFull, m.timestamp + '\u0001' + m.sender + '\u0001' + norm(m.message) + '\u0001' + files, i);
      add(byTime, m.timestamp + '\u0001' + m.sender, i);
      add(byText, m.sender + '\u0001' + norm(m.message) + '\u0001' + files, i);
    }
    if (!S.starred) S.starred = new Set();
    const wasClean = !this.dirty(), used = new Set();
    let added = 0, had = 0, miss = 0;
    for (const e of d.starred) {
      if (!e || typeof e !== 'object') { miss++; continue; }
      const files = (Array.isArray(e.files) ? e.files : []).map(String).join('|'), text = norm(e.text);
      let i = (byFull.get(e.time + '\u0001' + e.sender + '\u0001' + text + '\u0001' + files) || []).find(k => !used.has(k));
      if (i === undefined) { const l = (byTime.get(e.time + '\u0001' + e.sender) || []).filter(k => !used.has(k)); if (l.length === 1) i = l[0]; }
      if (i === undefined) { const l = (byText.get(e.sender + '\u0001' + text + '\u0001' + files) || []).filter(k => !used.has(k)); if (l.length === 1 && (text || files)) i = l[0]; }
      if (i === undefined) { miss++; continue; }
      used.add(i);
      if (S.starred.has(i)) had++; else { S.starred.add(i); added++; }
    }
    if (wasClean) S.starSaved = this.sig();
    if (added) { VL.refresh(); if (typeof Gallery !== 'undefined' && !$('galModal').hidden) Gallery.show(Gallery.cat); }
    this.render();
    const from = d.chat && d.chat.title ? String(d.chat.title) : '';
    if (!added && !had) { toast.error(from ? t('stars.import_none_from', { chat: from }) : t('stars.import_none')); return; }
    if (!added) { toast.info(t('stars.import_had', { n: had, count: nf(had) })); return; }
    if (miss) toast.warning(t('stars.import_some', { n: added, count: nf(added), missing: nf(miss) }));
    else toast.success(t('stars.imported', { n: added, count: nf(added) }));
  }
};
// Kept as functions: the message menu, the gallery, selection, the tour and Esc call these.
function renderStars() { Stars.render(); }
function openStars() { Stars.open(); }
function closeStars() { Stars.close(); }

$('starBtn').onclick = () => { if ($('starPanel').hidden) Stars.open(); else Stars.close(); };
$('starClose').onclick = () => Stars.close();
$('starExport').onclick = () => Stars.exportFile();
$('starText').onclick = () => Stars.exportText();
$('starImport').onclick = () => Stars.pick();
$('starFile').onchange = () => { const f = [...$('starFile').files]; $('starFile').value = ''; Stars.importFiles(f); };
$('starList').addEventListener('click', e => {
  if (e.target.closest('#starImport2')) { Stars.pick(); return; }
  const u = e.target.closest('[data-unstar]');
  if (u) {
    const i = +u.dataset.unstar, k = [...$('starList').querySelectorAll('[data-unstar]')].indexOf(u);
    toggleStar(i);
    if (typeof Gallery !== 'undefined') Gallery.markStar(i);
    // Focus stays in the list: on the next star button, or the close button when the list is empty.
    const next = $('starList').querySelectorAll('[data-unstar]');
    (next[Math.min(k, next.length - 1)] || $('starClose')).focus();
    return;
  }
  const b = e.target.closest('.sbub'); if (!b) return;
  // From 1200 px the panel is a column beside the chat and stays open; narrower, it covers the chat, so it closes (css/styles.css).
  jumpToMsg(+b.dataset.i); if (window.matchMedia('(max-width: 1199px)').matches) Stars.close();
});
// Stars that were never exported are lost when the tab closes, so the browser asks first.
window.addEventListener('beforeunload', e => { if (S.msgs.length && Stars.dirty()) { e.preventDefault(); e.returnValue = ''; } });
$('starClose').innerHTML = ICON.close;
$('starExport').insertAdjacentHTML('afterbegin', ICON.download);
$('starImport').insertAdjacentHTML('afterbegin', ICON.upload);
$('starText').insertAdjacentHTML('afterbegin', ICON.textFile);
