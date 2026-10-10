"use strict";
/* =====================================================================
   Loading a chat
   ===================================================================== */
// Export file names in WhatsApp's languages: "WhatsApp Chat with X", "WhatsApp-Chat mit X", "Chat de WhatsApp con X"…
const CHAT_NAME = [
  /^WhatsApp[ -]Chat (?:with |mit |met |med |z |s |- |– )(.+)$/i, /^(?:Chat de WhatsApp|Chat WhatsApp|Conversa do WhatsApp|Discussion WhatsApp) (?:con |com |avec |dengan |cu |- )(.+)$/i,
  /^Чат WhatsApp с (.+)$/i, /^دردشة واتساب مع (.+)$/, /^(.+) ile WhatsApp Sohbeti$/i, /^WhatsApp(?:-| )?(?:Chat|chat|Sohbeti|Чат)?\s*[-–]\s*(.+)$/i
];
function hintFrom(name) {
  const base = (name || '').split('/').pop().replace(/\.(txt|zip)$/i, '').trim();
  for (const re of CHAT_NAME) { const m = re.exec(base); if (m) return m[1].trim(); }
  return null;
}
const isChatName = n => /WhatsApp|واتساب/i.test(baseName(n)) && !!hintFrom(n);
function showLoading(title) { $('loadTitle').textContent = title; $('loadNote').textContent = t('load.working'); setProgress(0); $('loading').hidden = false; }
function setProgress(p) { const bar = $('progBar'); bar.parentNode.classList.toggle('indet', p < 0); bar.style.width = p < 0 ? '' : Math.round(p * 100) + '%'; }

const setNote = t => { $('loadNote').textContent = t; };
async function detectKind(file) {
  // Magic bytes first ("PK\x03\x04" = ZIP), then extension and MIME type.
  try {
    const b = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5) ) return 'zip';
  } catch (e) { /* fall through */ }
  const n = file.name.toLowerCase(), t = (file.type || '').toLowerCase();
  if (n.endsWith('.zip') || /zip|compressed/.test(t)) return 'zip';
  return 'txt';
}
/* ---------- Opening files: one or more exports, or a ZIP holding several chats ----------
   Every chat found goes into S.library; the sidebar lists them when there is more than one. */
/* Every load (files, a chat from the list, the sample) takes a ticket. A newer load makes older ones
   stale: they stop at their next step, throw away what they staged, and never touch the screen. */
let loadSeq = 0;
const guard = my => { if (my !== loadSeq) throw new Error(SUPERSEDED); };
const isStale = e => e && e.message === SUPERSEDED;
const isChatTxt = n => /(^|\/)_chat\.txt$/i.test(n) || (/\.txt$/i.test(n) && isChatName(n));
async function openFiles(list) {
  if (typeof Tour !== 'undefined') Tour.dismiss();
  Gallery.close();
  const files = [...(list || [])].filter(Boolean);
  if (!files.length) return;
  closeDrawer();
  const my = ++loadSeq;
  if (files.length === 1) { // one file: open it straight away; a ZIP with several chats fills the library as it opens
    const entry = { file: files[0], label: hintFrom(files[0].name) || files[0].name.replace(/\.(txt|zip)$/i, ''), discover: true };
    S.found = null;
    const ok = await openEntry(entry, my);
    if (ok) { S.library = S.found || [entry]; S.libIdx = S.foundIdx || 0; S.found = null; renderLibrary(); }
    return;
  }
  const lib = [];
  showLoading(t('load.opening_files', { n: nf(files.length) }));
  try {
    for (const file of files) {
      const kind = await detectKind(file);
      guard(my);
      if (kind !== 'zip') { lib.push({ file, kind, path: null, label: hintFrom(file.name) || file.name.replace(/\.txt$/i, '') }); continue; }
      setNote(t('load.looking_in', { name: file.name })); setProgress(-1);
      let arc = null;
      try { arc = await openArchive(file); guard(my); } catch (e) { if (isStale(e)) throw e; lib.push({ file, kind, path: null, label: hintFrom(file.name) || file.name }); continue; }
      const chats = arc.names.filter(isChatTxt), inner = arc.names.filter(n => /\.zip$/i.test(n) && isChatName(n));
      if (chats.length > 1 || (inner.length && !chats.length)) {
        for (const c of chats) lib.push({ file, kind, path: c, label: hintFrom(c) || hintFrom(c.split('/').slice(-2, -1)[0] || '') || c.replace(/\/?_chat\.txt$/i, '') || file.name });
        for (const z of inner) lib.push({ file, kind, inner: z, label: hintFrom(z) || baseName(z) });
      } else lib.push({ file, kind, path: null, label: hintFrom(file.name) || file.name.replace(/\.zip$/i, '') });
      if (arc.close) arc.close();
    }
  } catch (e) { if (isStale(e)) return; toast.error(e && e.message ? e.message : t('load.read_failed_many')); $('loading').hidden = true; return; }
  $('loading').hidden = true;
  if (!lib.length) return;
  // The first file that opens is shown; ones that fail (each with its own message) are skipped.
  for (let k = 0; k < lib.length && my === loadSeq; k++) {
    if (await openEntry(lib[k], my)) { S.library = lib; S.libIdx = k; renderLibrary(); return; }
  }
}
/* The chat shows as soon as its text is read; its media is extracted afterwards, a few files at a time,
   and the rows, the media section and the gallery fill in as files arrive. Opening another chat stops it. */
async function loadMedia(arc, list, my) {
  let next = 0, failed = 0, last = Date.now();
  const work = async () => {
    while (next < list.length && my === loadSeq) {
      const p = list[next++];
      try { const b = await arc.extract(p); if (my !== loadSeq) break; Media.stage(Media.map, p, b); } catch (e) { failed++; console.warn('Could not extract', p, e); }
      Media.pending.delete(Media.key(p));
      if (Media.loading) Media.loading.done++;
      if (Date.now() - last > 700) { last = Date.now(); refreshMedia(); }
    }
  };
  try { await Promise.all(Array.from({ length: Math.min(4, list.length) }, work)); }
  finally { if (arc.close) arc.close(); }
  if (my !== loadSeq) return;
  Media.pending.clear(); Media.loading = null;
  refreshMedia();
  if (failed) toast.warning(t('load.extract_failed', { n: failed, count: nf(failed) }));
}
async function openFile(file) { return openFiles([file]); }
async function openEntry(entry, my) {
  if (my === undefined) my = ++loadSeq;
  let { file } = entry;
  showLoading(t('load.opening', { name: entry.label }));
  const staged = new Map();
  let arc = null;
  try {
    let kind = entry.kind || await detectKind(file);
    guard(my);
    if (entry.inner) { // an export ZIP stored inside another ZIP
      setNote(t('load.unpacking', { name: baseName(entry.inner) })); setProgress(-1);
      const outer = await openArchive(file);
      let blob;
      try { blob = await outer.extract(entry.inner); } finally { if (outer.close) outer.close(); }
      guard(my);
      file = new File([blob], baseName(entry.inner), { type: 'application/zip' }); kind = 'zip';
    }
    let blob = file, hint = entry.label || hintFrom(file.name), chatPath = null, mediaList = [];
    if (kind === 'zip') {
      setNote(t('load.reading_zip', { size: fmtSize(file.size) })); setProgress(-1);
      arc = await openArchive(file);
      guard(my);
      const txts = arc.names.filter(n => /\.txt$/i.test(n)).sort((a, b) => a.split('/').length - b.split('/').length);
      if (entry.discover) {
        const chats = arc.names.filter(isChatTxt), inner = arc.names.filter(n => /\.zip$/i.test(n) && isChatName(n));
        if (chats.length > 1 || (inner.length && !chats.length)) {
          const lib = chats.map(c => ({ file, kind, path: c, label: hintFrom(c) || hintFrom(c.split('/').slice(-2, -1)[0] || '') || c.replace(/\/?_chat\.txt$/i, '') || file.name }))
            .concat(inner.map(z => ({ file, kind, inner: z, label: hintFrom(z) || baseName(z) })));
          if (!chats.length) { if (arc.close) arc.close(); arc = null; const ok = await openEntry(lib[0], my); if (ok) { S.found = lib; S.foundIdx = 0; } return ok; }
          S.found = lib; S.foundIdx = 0; entry.path = chats[0]; entry.label = lib[0].label;
        }
      }
      chatPath = entry.path || txts.find(n => baseName(n) === '_chat.txt') || txts.find(isChatName) || txts[0];
      if (!chatPath) throw new Error(t('load.no_chat_in_zip'));
      blob = await arc.extract(chatPath);
      guard(my);
      hint = hintFrom(chatPath) || entry.label || hint; // entry.label is the chat's own name once discovery has run
      // With several chats in one ZIP, only take the media stored next to this chat's text file.
      const dir = chatPath.includes('/') ? chatPath.slice(0, chatPath.lastIndexOf('/') + 1) : '';
      mediaList = arc.names.filter(n => n !== chatPath && !isChatTxt(n) && !/\.zip$/i.test(n) && (!entry.path || (n.startsWith(dir) && !n.slice(dir.length).includes('/'))));
    }
    setNote(t('load.reading_messages')); setProgress(0);
    const res = await runParse(blob, { order: 'auto' }, setProgress);
    guard(my);
    if (!res.messages.length) throw new Error(t('load.not_whatsapp'));
    // Success: swap in the new media (revoking the previous chat's URLs) and show the chat.
    Media.adopt(staged);
    S.source = { blob, name: entry.path ? file.name + ' › ' + entry.label : file.name, size: file.size, hint, sample: false, zip: kind === 'zip' };
    S.order = 'auto';
    if (mediaList.length) { Media.pending = new Set(mediaList.map(p => Media.key(p))); Media.loading = { done: 0, total: mediaList.length }; }
    applyResult(res, false);
    if (S.res.participants.length > 1) openMeModal();
    if (mediaList.length) { loadMedia(arc, mediaList, my); arc = null; } // the archive stays open for it
    return true;
  } catch (e) {
    Media.discard(staged);
    if (!isStale(e)) toast.error(e && /NotReadable|NotFound/.test(e.name) ? t('load.folder') : e && e.message ? e.message : t('load.read_failed')); // a dropped folder can't be read
    return false;
  } finally { if (arc && arc.close) arc.close(); if (my === loadSeq) $('loading').hidden = true; }
}
function renderLibrary() {
  const lib = S.library || [], sec = $('chatsSec');
  sec.hidden = lib.length < 2;
  if (lib.length < 2) return;
  $('chatsCount').textContent = nf(lib.length);
  $('chatList').innerHTML = lib.map((c, k) => '<button class="chatrow' + (k === S.libIdx ? ' cur' : '') + '" data-k="' + k + '"' + (k === S.libIdx ? ' aria-current="true"' : '') + '><span class="av c' + colorIdx(c.label) + '">' + esc(initials(c.label)) + '</span><span class="cr-t"><b>' + esc(c.label) + '</b><small>' + esc(c.inner ? t('chats.zip_inside', { name: c.file.name }) : c.path ? c.file.name : c.file.name + ' · ' + fmtSize(c.file.size)) + '</small></span></button>').join('');
}
$('chatList').addEventListener('click', async e => {
  const b = e.target.closest('.chatrow'); if (!b) return;
  const k = +b.dataset.k; if (k === S.libIdx) { if (isNarrow()) closeDrawer(); return; }
  if (await openEntry(S.library[k])) { S.libIdx = k; renderLibrary(); }
});
async function parseAndShow(keepMe, my) {
  const res = await runParse(S.source.blob, { order: S.order }, setProgress);
  if (my !== undefined) guard(my);
  if (!res.messages.length) throw new Error(t('load.not_whatsapp'));
  applyResult(res, keepMe);
}
function guessMe(res, hint) {
  const names = res.participants.map(p => p.name);
  if (names.includes('You')) return 'You';
  const other = hint || res.chatName;
  if (names.length === 2 && other && names.includes(other)) return names.find(n => n !== other);
  if (names.length === 1) return null;
  return names[0] || null;
}
/* Reactions: WhatsApp's own exports leave them out, but some exports and tools write them as
   messages like 'Reacted ❤️ to "message text"'. Those are folded onto the message they react to. */
const RE_REACT = /^(?:reacted|reaction)\s*:?\s*(\S{1,16}?)\s+to\s+["“'‘](.+?)["”'’]?\s*$/i;
const RE_REACT_SYS = /^(.+?)\s+reacted\s+(\S{1,16}?)\s+to\s+["“'‘](.+?)["”'’]?\s*$/i;
function foldReactions(msgs) {
  const out = [];
  for (const m of msgs) {
    let by = null, emoji = null, snip = null, r;
    if (!m.isSystem && m.kind === 'text' && (r = RE_REACT.exec(m.message))) { by = m.sender; emoji = r[1]; snip = r[2]; }
    else if (m.isSystem && (r = RE_REACT_SYS.exec(m.message))) { by = r[1]; emoji = r[2]; snip = r[3]; }
    if (emoji && /\p{Extended_Pictographic}/u.test(emoji)) {
      const key = snip.replace(/(…|\.\.\.)\s*$/, '').trim().toLowerCase();
      let target = null;
      for (let k = out.length - 1, n = 0; key && k >= 0 && n < 3000; k--, n++) if (!out[k].isSystem && out[k].message.toLowerCase().startsWith(key)) { target = out[k]; break; }
      if (target) { (target.reactions || (target.reactions = [])).push({ emoji, by }); continue; }
    }
    out.push(m);
  }
  return out;
}
function applyResult(res, keepMe) {
  if (!res.folded) { res.messages = foldReactions(res.messages); res.folded = true; }
  if (!keepMe) { S.starred = new Set(); S.filter = { from: '', to: '', sender: '' }; }
  if (typeof Sel !== 'undefined') Sel.stop(true); // a selection belongs to the chat it was made in
  S.res = res; S.msgs = res.messages; S.lc = null; S.stats = null;
  setScriptDefault(S.msgs);
  Nick.load(); // js/components/nicknames.js
  linkMedia();
  const names = res.participants.map(p => p.name);
  const hint = S.source.hint;
  S.isGroup = names.length > 2 || !!res.subject || (!!res.chatName && names.length > 0 && !names.includes(res.chatName));
  // In a group the export can't tell who saved it, so nobody is "You" until you pick yourself; the guess is only suggested.
  S.meGuess = S.source.sample ? 'Bilal Ahmed' : guessMe(res, hint);
  if (!(keepMe && (S.me === null || names.includes(S.me)))) S.me = S.source.sample || !S.isGroup || S.meGuess === 'You' ? S.meGuess : null;
  setMe(S.me, true);
  buildItems();
  VL.set(S.items, { i: 0, off: 0 });
  renderChrome();
  clearSearch();
  $('samplebar').hidden = !S.source.sample;
  hideStart();
}
/* ---------- Start screen: shown on every launch, since nothing is kept between visits ---------- */
function hideStart() {
  if ($('start').hidden) return;
  $('start').hidden = true;
  $('app').inert = false; $('app').removeAttribute('aria-hidden');
}
function linkMedia() {
  // Match attachment references (<attached: x>, "x (file attached)", or a bare file name) to extracted files.
  const c = { image: 0, video: 0, audio: 0, sticker: 0, gif: 0, document: 0, contact: 0, media: 0 };
  let found = 0, missing = 0, omitted = 0;
  const imgs = [];
  for (let i = 0; i < S.msgs.length; i++) {
    const m = S.msgs[i];
    if (m.isSystem) continue;
    if (m.kind === 'text' && Media.map.size && m.message.length < 260 && m.message.indexOf('\n') < 0) {
      const e = Media.get(m.message);
      if (e) { m.kind = 'media'; m.attachments = [{ type: e.type, name: e.name, omitted: false, url: null }]; m.message = ''; }
    }
    for (const a of m.attachments) {
      const e = Media.get(a.name);
      a.url = e ? e.url : null;
      c[a.type] = (c[a.type] || 0) + 1;
      if (e) { found++; if (a.type === 'image' || a.type === 'gif') imgs.push({ i, name: e.name }); }
      else if (a.name && !a.omitted) { if (!Media.pending.has(Media.key(a.name))) missing++; }
      else omitted++;
    }
  }
  S.images = imgs;
  S.media = { c, found, missing, omitted, files: Media.map.size };
}
function renderMediaSummary() {
  const md = S.media, c = md.c, sm = ic => ic.replace('width="22" height="22"', 'width="14" height="14"');
  // Each tile opens the media gallery on that category (js/components/media-gallery.js), so the counts come from it.
  $('mediaGrid').innerHTML = GAL_CATS.map(([k, label]) => '<button class="mt" data-gcat="' + k + '" aria-label="' + esc(t('media.tile_label', { label: t(label), n: nf(Gallery.count(k)) })) + '">' +
    '<i>' + sm(ICON[GAL_ICON[k]]) + '</i><b>' + nf(Gallery.count(k)) + '</b><span>' + esc(k === 'docs' ? t('media.docs_short') : t(label)) + '</span></button>').join('');
  const total = c.image + c.gif + c.video + c.audio + c.sticker + c.document + c.contact + c.media;
  $('mediaTotal').textContent = nf(Gallery.count('all'));
  Gallery.refresh();
  const note = $('mediaNote');
  note.classList.toggle('warn', md.missing > 0);
  if (Media.loading) note.textContent = t('load.loading_media', { done: nf(Media.loading.done), total: nf(Media.loading.total) });
  else if (md.files || md.found) note.textContent = [t('media.note_found', { found: nf(md.found) }), md.missing && t('media.note_missing', { n: nf(md.missing) }), md.omitted && t('media.note_omitted', { n: nf(md.omitted) })].filter(Boolean).join(' · ') + '.';
  else if (md.missing) note.textContent = t(S.source && S.source.zip ? 'media.note_zip_missing' : 'media.note_text_only', { n: md.missing, count: nf(md.missing) });
  else note.textContent = total ? t('media.note_no_media_export') : t('media.note_none');
}
function computeTitle() {
  const names = S.res.participants.map(p => p.name);
  const hint = S.source.hint || (S.res.chatName && S.res.chatName !== 'You' ? S.res.chatName : null);
  if (S.isGroup) return S.res.subject || hint || names.slice(0, 3).join(', ') || t('chat.group_chat');
  if (hint) return nick(hint); // a one-to-one export is named after the other person
  return nick(names.find(n => n !== S.me) || names[0]) || t('chat.chat');
}
function setMe(name, silent) {
  S.me = name || null;
  for (const m of S.msgs) m.isOutgoing = !m.isSystem && S.me !== null && m.sender === S.me;
  S.title = computeTitle();
  if (!silent) { buildItems(); VL.items = S.items; VL.refresh(); renderChrome(); }
}
const filterOn = () => !!(S.filter && (S.filter.from || S.filter.to || S.filter.sender));
function passes(m) {
  const f = S.filter;
  if (!f) return true;
  if (f.from && m.dateKey < f.from) return false;
  if (f.to && m.dateKey > f.to) return false;
  if (f.sender && (m.isSystem || m.sender !== f.sender)) return false;
  return true;
}
function buildItems() {
  const msgs = S.msgs, items = [], m2i = new Int32Array(msgs.length).fill(-1), dIdx = [];
  let prevKey = null, prev = null, curDate = -1, shown = 0;
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!passes(m)) continue;
    if (!m.isSystem) shown++;
    if (m.dateKey !== prevKey) { curDate = items.length; items.push({ type: 'date', dateKey: m.dateKey }); dIdx.push(curDate); prevKey = m.dateKey; prev = null; }
    const first = m.isSystem || !prev || prev.isSystem || prev.sender !== m.sender;
    const it = { type: m.isSystem ? 'sys' : 'msg', m, i, first };
    if (!m.isSystem) {
      it.showName = first && S.isGroup && !m.isOutgoing;
      it.jumbo = m.kind === 'text' && isJumbo(m.message);
      it.hasLink = (m.kind === 'text' || m.kind === 'media') && !!m.message && /\b(https?:\/\/|www\.)/i.test(m.message);
    }
    m2i[i] = items.length; items.push(it); dIdx.push(curDate); prev = m;
  }
  S.items = items; S.m2i = m2i; S.dateIdx = Int32Array.from(dIdx); S.shown = shown;
  renderFilterBar();
}

/* ---------- Chrome: header, sidebar ---------- */
function fmtSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB'; }
function renderChrome() {
  const res = S.res, msgs = S.msgs;
  const real = msgs.length - msgs.filter(m => m.isSystem).length;
  const first = msgs[0], last = msgs[msgs.length - 1];
  const range = shortFmt.format(dkToT(first.dateKey)) + ' – ' + shortFmt.format(dkToT(last.dateKey));
  const mediaN = msgs.reduce((a, m) => a + m.attachments.length, 0);
  avatar($('headAv'), S.title); avatar($('cardAv'), S.title);
  $('headTitle').innerHTML = scriptHTML(S.title); $('cardTitle').innerHTML = scriptHTML(S.title);
  const pN = res.participants.length;
  $('headSub').textContent = (S.isGroup ? t('chat.participants_sub', { n: nf(pN) }) + ' · ' : '') + t('chat.messages_sub', { n: nf(real) }) + ' · ' + range;
  $('cardSub').textContent = S.isGroup ? t('chat.group_sub', { n: nf(pN) }) : pN === 2 ? t('chat.between', { a: nick(res.participants[0].name), b: nick(res.participants[1].name) }) : t('chat.chat');
  const srcName = S.source.sample ? t('facts.sample_chat') : S.source.name;
  $('facts').innerHTML =
    '<div><dt>' + t('facts.messages') + '</dt><dd>' + nf(real) + '</dd></div>' +
    '<div><dt>' + t('facts.media') + '</dt><dd>' + nf(mediaN) + '</dd></div>' +
    '<div><dt>' + t('facts.first') + '</dt><dd>' + esc(shortFmt.format(dkToT(first.dateKey))) + '</dd></div>' +
    '<div><dt>' + t('facts.last') + '</dt><dd>' + esc(shortFmt.format(dkToT(last.dateKey))) + '</dd></div>' +
    '<div class="wide"><dt>' + t('facts.file') + '</dt><dd title="' + esc(srcName) + '"><bdi>' + esc(srcName) + '</bdi> · <bdi dir="ltr">' + fmtSize(S.source.size) + '</bdi> · ' + t(res.format === 'ios' ? 'facts.format_ios' : 'facts.format_android') + '</dd></div>';
  // Who you are and the date format are shown in Settings (js/components/settings.js).
  if (typeof Settings !== 'undefined' && Settings.isOpen()) Settings.render();
  // jump date
  const jd = $('jumpDate'); jd.min = first.dateKey; jd.max = last.dateKey; jd.value = '';
  // participants
  const maxC = res.participants[0] ? res.participants[0].count : 1;
  $('pCount').textContent = nf(pN);
  $('people').innerHTML = res.participants.slice(0, 80).map(p =>
    '<div class="person"><span class="av c' + colorIdx(p.name) + '">' + esc(initials(nick(p.name))) + '</span><div style="min-width:0"><div class="nm"' + (Nick.has(p.name) ? ' title="' + esc(p.name) + '"' : '') + '>' + esc(nick(p.name)) + (p.name === S.me ? '<em>' + t('common.you') + '</em>' : '') + '</div><div class="bar"><i style="width:' + (p.count / maxC * 100).toFixed(1) + '%"></i></div></div><span class="ct">' + nf(p.count) + '<br>' + Math.round(p.count / Math.max(1, real) * 100) + '%</span></div>').join('') +
    (pN > 80 ? '<div class="res-more">' + t('sidebar.and_more', { n: nf(pN - 80) }) + '</div>' : '');
  renderMediaSummary();
  renderFilterUI(); renderStars();
  document.title = S.source.sample ? t('app.title') : t('app.title_chat', { chat: S.title });
}

/* ---------- Filters: date range and sender ---------- */
function renderFilterUI() {
  const f = S.filter || (S.filter = { from: '', to: '', sender: '' }), first = S.msgs[0].dateKey, last = S.msgs[S.msgs.length - 1].dateKey;
  for (const id of ['fFrom', 'fTo']) { $(id).min = first; $(id).max = last; }
  $('fFrom').value = f.from; $('fTo').value = f.to;
  $('fSender').innerHTML = '<option value="">' + t('filter.everyone') + '</option>' + S.res.participants.slice(0, 300).map(p => '<option value="' + esc(p.name) + '">' + esc(p.name === S.me ? t('filter.name_you', { name: nick(p.name) }) : nick(p.name)) + '</option>').join('');
  $('fSender').value = f.sender;
}
function renderFilterBar() {
  const on = filterOn(), f = S.filter || {};
  $('filterbar').hidden = !on; $('fClear').hidden = !on;
  if (!on) return;
  const parts = [];
  if (f.sender) parts.push(t('filter.from', { name: nick(f.sender) }));
  if (f.from && f.to) parts.push(shortFmt.format(dkToT(f.from)) + ' – ' + shortFmt.format(dkToT(f.to)));
  else if (f.from) parts.push(t('filter.since', { date: shortFmt.format(dkToT(f.from)) }));
  else if (f.to) parts.push(t('filter.until', { date: shortFmt.format(dkToT(f.to)) }));
  $('fText').textContent = S.shown ? t('filter.showing', { shown: nf(S.shown), total: nf(S.msgs.length - S.msgs.filter(m => m.isSystem).length), what: parts.join(' · ') }) : t('filter.none', { what: parts.join(' · ') });
}
function applyFilter() {
  let from = $('fFrom').value, to = $('fTo').value;
  if (from && to && from > to) { [from, to] = [to, from]; $('fFrom').value = from; $('fTo').value = to; }
  S.filter = { from, to, sender: $('fSender').value };
  buildItems(); VL.set(S.items, { i: 0, off: 0 });
  if (S.q && S.q.trim()) runSearch(S.q); else updateCounts();
}
function clearFilters() { S.filter = { from: '', to: '', sender: '' }; renderFilterUI(); applyFilter(); }
for (const id of ['fFrom', 'fTo', 'fSender']) $(id).addEventListener('change', applyFilter);
$('fClear').onclick = clearFilters; $('fbClear').onclick = clearFilters;

/* ---------- Starred messages (this session only; nothing is saved) ---------- */
function toggleStar(i) {
  if (!S.starred) S.starred = new Set();
  if (S.starred.has(i)) S.starred.delete(i); else S.starred.add(i);
  rerenderRow(S.m2i[i]);
  renderStars();
  if (S.starred.has(i)) toast.success(t('stars.starred')); else toast.info(t('stars.removed'));
}
// Date and time of a search or starred result, each isolated so they keep their order in Urdu.
function resTime(m) { return '<time><bdi>' + esc(shortFmt.format(dkToT(m.dateKey))) + '</bdi>' + t('common.list_sep') + '<bdi dir="ltr">' + m.formattedTime + '</bdi></time>'; }
function msgSnippet(m) {
  if (m.message) return m.message.replace(/\s+/g, ' ').slice(0, 160);
  const a = m.attachments[0];
  return a ? (TYPE_LABEL[a.type] ? typeLabel(a.type) : t('common.file')) + (a.title || a.name ? ': ' + (a.title || a.name) : '') : m.kind === 'poll' && m.extra ? t('common.poll_prefix', { q: m.extra.q }) : '';
}
function renderStars() {
  const list = [...(S.starred || [])].sort((a, b) => a - b), n = list.length;
  $('starBadge').hidden = !n; $('starBadge').textContent = n > 99 ? '99+' : n;
  $('starTitle').textContent = n ? t('stars.title_n', { n: nf(n) }) : t('common.starred_messages');
  $('starList').innerHTML = n ? list.map(i => {
    const m = S.msgs[i];
    return '<button class="res" data-i="' + i + '"><span class="rh"><b dir="auto">' + esc(m.isOutgoing ? t('common.you') : nick(m.sender)) + '</b>' + resTime(m) + '</span><span class="rs" dir="auto">' + esc(msgSnippet(m)) + '</span></button>';
  }).join('') : '<p class="star-empty">' + ICON.star + '<span>' + t('stars.empty') + '</span></p>';
}
function openStars() { renderStars(); $('starPanel').hidden = false; document.body.classList.add('stars-open'); $('starClose').focus(); }
function closeStars() { $('starPanel').hidden = true; document.body.classList.remove('stars-open'); }
function jumpToMsg(i) {
  if (S.m2i[i] < 0) clearFilters();
  VL.clear(); VL.scrollTo(S.m2i[i], 'center');
  const el = VL.nodes.get(S.m2i[i]); if (el) el.classList.add('flash');
}
$('starBtn').onclick = () => { if ($('starPanel').hidden) openStars(); else closeStars(); };
$('starClose').onclick = closeStars;
$('starList').addEventListener('click', e => { const b = e.target.closest('.res'); if (!b) return; jumpToMsg(+b.dataset.i); if (isNarrow()) closeStars(); });

/* =====================================================================
   Search
   ===================================================================== */
const q2 = $('q2');
let searchTimer = 0;
function onSearchInput(e) {
  const v = e.target.value;
  clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(v), 140);
}
function runSearch(q) {
  S.q = q; const ql = fold(q.trim());
  S.matches = []; S.matchSet = new Set(); S.cur = -1; S.fq = '';
  if (ql) {
    if (!S.lc) S.lc = S.msgs.map(m => fold(m.message + (m.sender ? '\u0002' + m.sender + (Nick.has(m.sender) ? '\u0002' + nick(m.sender) : '') : '') + (m.extra && m.extra.options ? ' ' + m.extra.q + ' ' + m.extra.options.map(o => o.label).join(' ') : '') + m.attachments.map(a => ' ' + (a.name || '')).join('')));
    for (let i = 0; i < S.lc.length; i++) if (S.m2i[i] >= 0 && S.lc[i].includes(ql)) S.matches.push(i);
    S.matchSet = new Set(S.matches); S.fq = ql;
    if (S.matches.length) {
      // start from the first match at or below the top of the screen
      const topItem = VL.fw ? VL.fw.find(scroller.scrollTop) : 0;
      let k = S.matches.findIndex(i => S.m2i[i] >= topItem);
      S.cur = k < 0 ? S.matches.length - 1 : k;
    }
  }
  VL.refresh();
  if (S.cur >= 0) jumpToMatch(S.cur);
  updateCounts();
}
function clearSearch() { q2.value = ''; runSearch(''); }
function updateCounts() {
  const n = S.matches.length, txt = !S.q.trim() ? '' : n ? t('search.n_of_m', { i: nf(S.cur + 1), n: nf(n) }) : t('search.no_matches');
  $('count2').textContent = txt;
  for (const id of ['prev2', 'next2']) $(id).disabled = n === 0;
}
function step(d) {
  if (!S.matches.length) return;
  S.cur = (S.cur + d + S.matches.length) % S.matches.length;
  jumpToMatch(S.cur);
}
function jumpToMatch(k) {
  S.cur = k;
  const i = S.matches[k];
  VL.clear();
  VL.scrollTo(S.m2i[i], 'center');
  const el = VL.nodes.get(S.m2i[i]);
  if (el) el.classList.add('flash');
  updateCounts();
}
q2.addEventListener('input', onSearchInput);
q2.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchTimer); if (S.q !== q2.value) runSearch(q2.value); else step(e.shiftKey ? -1 : 1); }
  if (e.key === 'Escape') { e.stopPropagation(); if (SHist.isOpen()) SHist.close(); else if (q2.value) clearSearch(); else closeSearch(); }
});
$('prev2').onclick = () => step(-1);
$('next2').onclick = () => step(1);
const isNarrow = () => window.matchMedia('(max-width: 1024px)').matches;
// Search is a bar under the chat header on every screen size, like WhatsApp.
function openSearch() { $('sstrip').hidden = false; q2.focus(); q2.select(); VL.schedule(); }
function closeSearch() { SHist.close(); $('sstrip').hidden = true; clearSearch(); VL.schedule(); }
$('searchBtn').onclick = openSearch;
$('sClose').onclick = closeSearch;

/* =====================================================================
   Stats
   ===================================================================== */
// Short weekday names in the interface language (1 Jan 2023 was a Sunday).
const WD = () => [0, 1, 2, 3, 4, 5, 6].map(i => new Intl.DateTimeFormat(I18N.locale(), { weekday: 'short', timeZone: 'UTC' }).format(Date.UTC(2023, 0, 1 + i)));
function computeStats() {
  const per = new Map(), days = new Map(), wd = new Array(7).fill(0), hr = new Array(24).fill(0);
  let words = 0, media = 0, n = 0, links = 0, emojis = new Map();
  for (const m of S.msgs) {
    if (m.isSystem) continue;
    n++;
    let p = per.get(m.sender); if (!p) per.set(m.sender, p = { name: m.sender, n: 0, words: 0, media: 0 });
    p.n++;
    const w = m.kind === 'text' || m.kind === 'media' ? (m.message.match(/\S+/g) || []).length : 0;
    p.words += w; words += w;
    if (m.attachments.length) { p.media++; media++; }
    if (/https?:\/\//.test(m.message)) links++;
    days.set(m.dateKey, (days.get(m.dateKey) || 0) + 1);
    const d = new Date(m.t); wd[d.getUTCDay()]++; hr[d.getUTCHours()]++;
  }
  const topDays = [...days].sort((a, b) => b[1] - a[1]).slice(0, 7);
  return { per: [...per.values()].sort((a, b) => b.n - a.n), days, topDays, wd, hr, words, media, n, links };
}
function renderStats() {
  const st = S.stats || (S.stats = computeStats());
  const first = S.msgs[0].dateKey, last = S.msgs[S.msgs.length - 1].dateKey;
  const span = Math.round((dkToT(last) - dkToT(first)) / 864e5) + 1;
  const maxD = st.topDays[0] ? st.topDays[0][1] : 1;
  const maxW = Math.max(1, ...st.wd), maxH = Math.max(1, ...st.hr), wd = WD();
  const tile = (k, v, s) => '<div class="tile"><dt>' + k + '</dt><dd>' + v + (s ? ' <small>' + s + '</small>' : '') + '</dd></div>';
  $('statsBody').innerHTML =
    '<dl class="tiles" style="margin:0">' +
      tile(t('facts.messages'), nf(st.n)) + tile(t('stats.words'), nf(st.words)) + tile(t('facts.media'), nf(st.media)) +
      tile(t('stats.active_days'), nf(st.days.size), t('stats.of', { n: nf(span) })) + tile(t('stats.per_active_day'), nf(+(st.n / Math.max(1, st.days.size)).toFixed(1))) + tile(t('stats.words_per_message'), nf(+(st.words / Math.max(1, st.n)).toFixed(1))) +
    '</dl>' +
    '<div class="sgrid">' +
      '<div class="stat"><h3>' + t('stats.busiest_days') + '<span>' + t('stats.tap_to_jump') + '</span></h3><div class="days">' +
        st.topDays.map(([dk, c]) => '<button class="day" data-dk="' + dk + '"><span>' + esc(dayFmt.format(dkToT(dk))) + '</span><span class="dbar"><i style="width:' + (c / maxD * 100).toFixed(1) + '%"></i></span><span class="dn">' + nf(c) + '</span></button>').join('') +
      '</div></div>' +
      '<div class="stat"><h3>' + t('stats.by_weekday') + '</h3><div class="vbars">' +
        st.wd.map((c, i) => '<div class="vbar" data-tip="' + esc(t('stats.n_messages_tip', { day: wd[i], n: nf(c) })) + '"><i style="height:' + (c / maxW * 100).toFixed(1) + '%"></i></div>').join('') +
      '</div><div class="vlabels">' + wd.map(d => '<span>' + d + '</span>').join('') + '</div></div>' +
    '</div>' +
    '<div class="stat"><h3>' + t('stats.by_hour') + '<span>' + t('stats.local_time') + '</span></h3><div class="vbars">' +
      st.hr.map((c, i) => '<div class="vbar" data-tip="' + String(i).padStart(2, '0') + ':00 – ' + String(i).padStart(2, '0') + ':59: ' + nf(c) + '"><i style="height:' + (c / maxH * 100).toFixed(1) + '%"></i></div>').join('') +
    '</div><div class="vlabels">' + st.hr.map((c, i) => '<span>' + (i % 3 === 0 ? i : '') + '</span>').join('') + '</div></div>' +
    '<div class="stat"><h3>' + t('stats.by_person') + '<span>' + t('stats.people', { n: nf(st.per.length) }) + '</span></h3><div class="tbl-wrap"><table class="ptable" id="pTable"></table></div></div>';
  renderPeople();
}
// Messages by person: every column header sorts the table; a second press reverses it.
const P_COLS = [['name', 'stats.person'], ['n', 'facts.messages'], ['share', 'stats.share'], ['words', 'stats.words'], ['media', 'facts.media']];
let pSort = { key: 'n', dir: -1 };
function renderPeople() {
  const st = S.stats, tb = $('pTable'); if (!st || !tb) return;
  const maxP = st.per[0] ? st.per[0].n : 1, coll = new Intl.Collator(I18N.locale(), { sensitivity: 'base', numeric: true });
  const k = pSort.key === 'share' ? 'n' : pSort.key; // share is messages / total, so it sorts like messages
  const byName = (a, b) => coll.compare(nick(a.name), nick(b.name));
  const rows = st.per.slice().sort((a, b) => k === 'name' ? byName(a, b) * pSort.dir : (a[k] - b[k]) * pSort.dir || byName(a, b));
  tb.innerHTML = '<thead><tr>' + P_COLS.map(([key, label]) => {
    const on = pSort.key === key, sort = on ? (pSort.dir > 0 ? 'ascending' : 'descending') : 'none';
    return '<th aria-sort="' + sort + '"><button class="psort' + (on ? ' on' : '') + '" data-psort="' + key + '">' + t(label) + '<span class="parr" aria-hidden="true">' + (on ? (pSort.dir > 0 ? '▲' : '▼') : '') + '</span></button></th>';
  }).join('') + '</tr></thead><tbody>' +
    rows.map(p => '<tr><td><span class="pn">' + scriptHTML(nick(p.name)) + (p.name === S.me ? ' <span style="color:var(--ink-3)">' + t('stats.you_paren') + '</span>' : '') + '</span><div class="hbar" style="width:' + (p.n / maxP * 100).toFixed(1) + '%"></div></td><td>' + nf(p.n) + '</td><td>' + (p.n / Math.max(1, st.n) * 100).toFixed(1) + '%</td><td>' + nf(p.words) + '</td><td>' + nf(p.media) + '</td></tr>').join('') + '</tbody>';
}
$('statsBody').addEventListener('click', e => {
  const b = e.target.closest('[data-psort]'); if (!b) return;
  const key = b.dataset.psort;
  pSort = pSort.key === key ? { key, dir: -pSort.dir } : { key, dir: key === 'name' ? 1 : -1 };
  renderPeople();
  const nb = $('pTable').querySelector('[data-psort="' + key + '"]'); if (nb) nb.focus();
});
function openStats() { if (!S.msgs.length) return; renderStats(); openModal('statsModal'); }
$('statsBody').addEventListener('click', e => { const b = e.target.closest('.day'); if (b) { closeModal('statsModal'); jumpToDate(b.dataset.dk); } });
$('statsBtn').onclick = openStats; $('cardStats').onclick = () => { closeDrawer(); openStats(); };

/* ---------- Modals ---------- */
// Each modal remembers what had focus, so one opened from another (a contact from the media gallery) returns to the right place.
function openModal(id) { const m = $(id); if (m.hidden) m.ret = document.activeElement; m.hidden = false; Dialogs.open(m); const f = m.querySelector('[data-close], button'); if (f) f.focus(); }
function closeModal(id) { const m = $(id); m.hidden = true; Dialogs.close(m); if (m.ret && m.ret.focus && document.contains(m.ret)) m.ret.focus(); }
for (const m of document.querySelectorAll('.modal')) {
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m.id); });
}
// Asks before something that can't be undone. Cancel has focus first, so Enter or a stray tap does nothing harmful;
// Cancel, Esc or a tap outside closes it without a change.
let cfDone = null;
function confirmDialog(title, text, ok, done) {
  cfDone = done;
  $('cfTitle').textContent = title; $('cfText').textContent = text; $('cfOk').textContent = ok;
  openModal('cfModal');
  $('cfCancel').focus();
}
$('cfCancel').onclick = () => { cfDone = null; closeModal('cfModal'); };
$('cfOk').onclick = () => { const d = cfDone; cfDone = null; if (d) d(); closeModal('cfModal'); }; // done first: focus goes back to a page that already shows the result
// Everyone who wrote is listed. Big groups get a name filter; the choice in progress survives a redraw (a language change).
function openMeModal() {
  const ps = S.res.participants, many = ps.length > 12, open = !$('meModal').hidden;
  const r = open && document.querySelector('input[name="me"]:checked'), sel = r ? r.value : S.me || '';
  const sug = !S.me && S.meGuess && S.meGuess !== 'You' ? S.meGuess : null;
  $('meList').innerHTML = ps.map(p =>
    '<label class="meopt' + (p.name === sug ? ' sug' : '') + '" data-f="' + esc(fold(p.name + (Nick.has(p.name) ? ' ' + nick(p.name) : ''))) + '"><input type="radio" name="me" value="' + esc(p.name) + '"' + (p.name === sel ? ' checked' : '') + '><span class="av c' + colorIdx(p.name) + '">' + esc(initials(nick(p.name))) + '</span><span dir="auto">' + esc(nick(p.name)) + '<small>' + (Nick.has(p.name) ? '<bdi>' + esc(p.name) + '</bdi> · ' : '') + t('me.n_messages', { n: nf(p.count) }) +
    (p.name === sug ? ' · <b>' + t('me.suggested') + '</b>' : p.name === S.me && p.name === S.meGuess ? ' · ' + t('me.best_guess') : '') + '</small></span></label>').join('') +
    '<label class="meopt"><input type="radio" name="me" value=""' + (!sel ? ' checked' : '') + '><span class="av" style="background:var(--bar-track);color:var(--ink-2)">–</span><span>' + t('me.none_of_these') + '<small>' + t('me.everyone_left') + '</small></span></label>';
  $('meFilterW').hidden = !many;
  if (!many) $('meFilter').value = '';
  if (!open) $('meFilter').value = '';
  filterMe();
  openModal('meModal');
  if (many && !open) $('meFilter').focus();
}
function filterMe() {
  const q = fold($('meFilter').value.trim());
  let n = 0;
  for (const l of $('meList').querySelectorAll('.meopt[data-f]')) { const show = !q || l.dataset.f.includes(q); l.hidden = !show; if (show) n++; }
  $('meNone').hidden = !q || n > 0;
}
$('meFilter').addEventListener('input', filterMe);
$('meFilterIcon').innerHTML = ICON.search.replace('width="22" height="22"', 'width="18" height="18"');
$('meDone').onclick = () => { const r = document.querySelector('input[name="me"]:checked'); closeModal('meModal'); setMe(r ? r.value : null); };

/* ---------- Date order, jump to date, doodles (the controls are in Settings) ---------- */
async function setOrder(v) {
  if (v === S.order) return;
  S.order = v;
  showLoading(t('load.rereading_dates'));
  const my = ++loadSeq; // a file opened meanwhile takes over, and its progress screen stays up
  try {
    await parseAndShow(true, my);
    if (S.res.rejected) { S.order = 'auto'; toast.warning(t('load.order_rejected')); if (Settings.isOpen()) Settings.render(); }
  } catch (err) { if (!isStale(err)) toast.error(err.message); } finally { if (my === loadSeq) $('loading').hidden = true; }
};
function jumpToDate(dk) {
  let k = S.msgs.findIndex((m, i) => m.dateKey >= dk && S.m2i[i] >= 0);
  if (k < 0) { for (k = S.msgs.length - 1; k > 0 && S.m2i[k] < 0; k--); }
  if (S.m2i[k] < 0) return;
  const it = S.m2i[k] - (S.items[S.m2i[k] - 1] && S.items[S.m2i[k] - 1].type === 'date' ? 1 : 0);
  VL.scrollTo(it);
}
$('jumpDate').onchange = e => { if (e.target.value) { jumpToDate(e.target.value); if (isNarrow()) closeDrawer(); } };
let doodleOn = store('cv-doodle') !== '0';
function applyDoodle() { $('app').classList.toggle('no-doodle', !doodleOn); }
function setDoodle(on) { doodleOn = on; store('cv-doodle', on ? '1' : '0'); applyDoodle(); }
applyDoodle();
(function makeDoodle() {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
    "<path d='M24 40c0-11 10-19 22-19s22 8 22 19-10 19-22 19c-3 0-6 0-8-1l-10 6 2-10c-4-4-6-8-6-14z'/>" +
    "<circle cx='200' cy='46' r='13'/><path d='M200 24v-6M200 74v-6M178 46h-6M228 46h-6M184 30l-4-4M220 66l-4-4M184 62l-4 4M220 26l-4 4'/>" +
    "<path d='M120 120l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z'/>" +
    "<path d='M38 196c0-10 14-14 20 0 6-14 20-10 20 0 0 12-20 24-20 24s-20-12-20-24z'/>" +
    "<rect x='196' y='170' width='30' height='50' rx='6'/><path d='M206 210h10'/>" +
    "<path d='M90 252l14-14 14 14 14-14 14 14'/><circle cx='252' cy='130' r='6'/><circle cx='150' cy='234' r='4'/>" +
    "<path d='M106 38q12-16 24 0t24 0'/><path d='M248 252a14 14 0 1 1-20-14 11 11 0 0 0 20 14z'/>" +
    "<path d='M20 120h22M31 109v22'/></svg>";
  root.style.setProperty('--doodle-url', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
})();

/* ---------- Theme ---------- */
const hostTheme = root.getAttribute('data-theme');
let theme = store('cv-theme') || 'system';
function applyTheme() {
  if (theme === 'system') { if (hostTheme) root.setAttribute('data-theme', hostTheme); else root.removeAttribute('data-theme'); }
  else root.setAttribute('data-theme', theme);
}
function setTheme(v) { theme = v; store('cv-theme', v); applyTheme(); }
applyTheme();

/* ---------- Interface language (js/i18n) ---------- */
// The picker sits in Settings and on the start screen. Switching redraws everything the app built
// in JavaScript; the chat itself (messages, names, file names, system notices, call logs, deleted and
// omitted placeholders and the date rows) is never translated.
function markLang() {
  for (const b of document.querySelectorAll('[data-lang-opt]')) b.setAttribute(b.closest('.start-lang') ? 'aria-pressed' : 'aria-checked', b.dataset.langOpt === I18N.lang);
}
markLang();
$('start').addEventListener('click', e => { const l = e.target.closest('[data-lang-opt]'); if (l) I18N.set(l.dataset.langOpt); });
document.addEventListener('langchange', () => {
  markLang(); makeFormats(); Tour.boot();
  if (!S.msgs.length) return;
  renderLibrary(); renderChrome(); renderMediaSummary(); renderFilterUI(); renderFilterBar();
  if (S.q.trim()) updateCounts();
  if (!$('starPanel').hidden) renderStars();
  if (!$('statsModal').hidden) renderStats();
  if (!$('galModal').hidden) Gallery.show(Gallery.cat);
  if (!$('meModal').hidden) openMeModal();
  if (!$('pickModal').hidden) closeModal('pickModal');
  if (Settings.isOpen()) Settings.render();
  VL.relayout();
  if (Tour.active()) Tour.go(Tour.i);
});

/* ---------- Header ⋮ menu (WhatsApp style): chat actions, Settings and help. No preferences here (PROJECT_RULES.md). ---------- */
const moreBtn = $('moreBtn'), moreMenu = $('moreMenu');
const menuItems = () => [...moreMenu.querySelectorAll('[role^="menuitem"]')];
function openMenu() {
  moreMenu.hidden = false; moreBtn.setAttribute('aria-expanded', 'true');
  menuItems()[0].focus();
}
function closeMenu(focusBtn) {
  if (moreMenu.hidden) return;
  moreMenu.hidden = true; moreBtn.setAttribute('aria-expanded', 'false');
  if (focusBtn) moreBtn.focus();
}
moreBtn.onclick = () => { if (moreMenu.hidden) openMenu(); else closeMenu(); };
// Capture: the menu closes (focus back on ⋮) before the item's own action runs, so dialogs it opens return focus to ⋮.
moreMenu.addEventListener('click', e => { if (e.target.closest('[role^="menuitem"]')) closeMenu(true); }, true);
document.addEventListener('pointerdown', e => { if (!moreMenu.hidden && !moreMenu.contains(e.target) && !moreBtn.contains(e.target)) closeMenu(); });
moreMenu.addEventListener('keydown', e => {
  const items = menuItems(), i = items.indexOf(document.activeElement);
  let n = null;
  if (e.key === 'ArrowDown') n = (i + 1) % items.length;
  else if (e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
  else if (e.key === 'Home') n = 0;
  else if (e.key === 'End') n = items.length - 1;
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); return; }
  else if (e.key === 'Tab') { closeMenu(); return; }
  else return;
  e.preventDefault(); e.stopPropagation(); items[n].focus();
});
moreBtn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' && moreMenu.hidden) { e.preventDefault(); openMenu(); } });

/* ---------- Drawer ---------- */
function openDrawer() { if (!isNarrow()) return; document.body.classList.add('drawer-open'); $('scrim').hidden = false; }
function closeDrawer() { document.body.classList.remove('drawer-open'); $('scrim').hidden = true; }
// Wide screens: the side panel can be hidden for a wider chat (not remembered: it is back next time).
function toggleSide() {
  const hide = document.body.classList.toggle('side-hidden');
  syncMenuBtn();
  if (hide && $('sidebar') && $('sidebar').contains(document.activeElement)) $('menuBtn').focus();
}
// Dragging the side panel's edge (its grip sits at the middle) sets its width, from 280 px up to half the
// window (at most 640 px). Arrow keys on the grip move it 16 px at a time, Home and End go to the limits,
// and a double-click puts it back. The width lasts until the page is closed; it isn't stored.
const sbHandle = $('sbResize'), SBW = { min: 280, def: 380, max: () => Math.max(280, Math.min(640, Math.round(innerWidth * 0.5))) };
function sideWidth() { return $('sidebar').getBoundingClientRect().width; }
function setSideW(w) {
  if (w == null) document.documentElement.style.removeProperty('--sb-w');
  else document.documentElement.style.setProperty('--sb-w', Math.round(Math.max(SBW.min, Math.min(SBW.max(), w))) + 'px');
  sideAria();
}
function sideAria() {
  sbHandle.setAttribute('aria-valuemin', SBW.min); sbHandle.setAttribute('aria-valuemax', SBW.max()); sbHandle.setAttribute('aria-valuenow', Math.round(sideWidth()));
}
sbHandle.addEventListener('pointerdown', e => {
  if (e.button !== 0 || isNarrow()) return;
  e.preventDefault();
  const x0 = e.clientX, w0 = sideWidth(), dir = I18N.rtl() ? -1 : 1; // in right-to-left the panel is on the right
  sbHandle.setPointerCapture(e.pointerId); document.body.classList.add('sb-resizing');
  const move = ev => setSideW(w0 + (ev.clientX - x0) * dir);
  const up = () => { sbHandle.removeEventListener('pointermove', move); sbHandle.removeEventListener('pointerup', up); sbHandle.removeEventListener('pointercancel', up); document.body.classList.remove('sb-resizing'); };
  sbHandle.addEventListener('pointermove', move); sbHandle.addEventListener('pointerup', up); sbHandle.addEventListener('pointercancel', up);
});
sbHandle.addEventListener('dblclick', () => setSideW(null));
sbHandle.addEventListener('keydown', e => {
  const grow = I18N.rtl() ? 'ArrowLeft' : 'ArrowRight', shrink = I18N.rtl() ? 'ArrowRight' : 'ArrowLeft';
  const w = sideWidth(), to = e.key === grow ? w + 16 : e.key === shrink ? w - 16 : e.key === 'Home' ? SBW.min : e.key === 'End' ? SBW.max() : e.key === 'Enter' ? null : undefined;
  if (to === undefined) return;
  e.preventDefault(); setSideW(to);
});
window.addEventListener('resize', () => { if (document.documentElement.style.getPropertyValue('--sb-w')) setSideW(sideWidth()); });
sbHandle.addEventListener('focus', sideAria);
function syncMenuBtn() {
  const wide = !isNarrow(), open = wide ? !document.body.classList.contains('side-hidden') : document.body.classList.contains('drawer-open');
  $('menuBtn').setAttribute('aria-expanded', open);
  $('menuBtn').setAttribute('aria-label', t(open && wide ? 'chat.hide_chat_details' : 'chat.show_chat_details'));
  $('menuBtn').title = $('menuBtn').getAttribute('aria-label');
}
$('menuBtn').onclick = () => isNarrow() ? openDrawer() : toggleSide();
window.matchMedia('(max-width: 1024px)').addEventListener('change', syncMenuBtn);
document.addEventListener('langchange', syncMenuBtn); $('whoBtn').onclick = () => isNarrow() ? openDrawer() : openStats();
$('scrim').onclick = closeDrawer; $('sbClose').onclick = closeDrawer;

/* ---------- File input + drag and drop ---------- */
const fileInput = $('file');
const pick = () => fileInput.click();
$('openBtn').onclick = $('sbOpen').onclick = $('cardOpen').onclick = $('sampleOpen').onclick = $('startBrowse').onclick = pick;
$('startDrop').addEventListener('click', e => { if (e.target === e.currentTarget || !e.target.closest('button')) pick(); });
fileInput.onchange = () => { const f = [...fileInput.files]; fileInput.value = ''; openFiles(f); };
let dragDepth = 0;
const hasFiles = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
window.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; $('drop').hidden = false; });
window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('drop').hidden = true; });
window.addEventListener('drop', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; $('drop').hidden = true; openFiles(e.dataTransfer.files); });

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', e => {
  if (!$('start').hidden) return; // nothing to search or navigate yet
  if (!$('pdfv').hidden) {
    if (e.key === 'Escape') closePdf();
    else if (e.key === '+' || e.key === '=') pdfZoom(1);
    else if (e.key === '-') pdfZoom(-1);
    else if (e.key === '0') pdfZoom(0);
    return;
  }
  if (!$('lb').hidden) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lbStep(I18N.rtl() ? 1 : -1); // the next photo is on the left in right-to-left
    else if (e.key === 'ArrowRight') lbStep(I18N.rtl() ? -1 : 1);
    else if (e.key === '+' || e.key === '=') zTo(Z.s * 1.5, undefined, undefined, true);
    else if (e.key === '-') zTo(Z.s / 1.5, undefined, undefined, true);
    else if (e.key === '0') zTo(1, undefined, undefined, true);
    else if (e.key === 'r' || e.key === 'R') zRotate();
    return;
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  if (Dialogs.any() && e.key !== 'Escape') return; // no search shortcuts behind an open dialog
  if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && S.msgs.length) { e.preventDefault(); openSearch(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && S.msgs.length) { e.preventDefault(); openSearch(); }
  else if (e.key === 'Escape') {
    // The dialog on top closes first (the sort sheet before the gallery, a contact before the gallery).
    const ids = ['cfModal', 'vcModal', 'galModal', 'statsModal', 'pickModal', 'meModal', 'nickModal', 'setModal'];
    const top = Dialogs.stack.filter(d => ids.includes(d.id) && !d.hidden).pop() || ids.map($).find(d => !d.hidden);
    if (top) { closeModal(top.id); return; }
    if (!$('starPanel').hidden) { closeStars(); return; }
    if (!$('sstrip').hidden) { closeSearch(); return; }
    if (document.body.classList.contains('drawer-open')) closeDrawer();
  }
});

/* ---------- Static icons ---------- */
$('logo').innerHTML = $('startLogo').innerHTML = ICON.chat; $('startDropIc').innerHTML = ICON.open; $('startDemoIc').innerHTML = ICON.chat;
for (const [id, ic] of [['startT1', 'lock'], ['startT2', 'ban'], ['startT3', 'check']]) $(id).insertAdjacentHTML('afterbegin', ICON[ic]); $('sbOpen').innerHTML = ICON.open; $('sbClose').innerHTML = ICON.close;
$('menuBtn').innerHTML = ICON.menu; $('searchBtn').innerHTML = ICON.search; $('moreBtn').innerHTML = ICON.more;
for (const [id, ic] of [['miStar', 'star'], ['miStats', 'stats'], ['miOpen', 'open'], ['miHelp', 'help']]) $(id).innerHTML = ICON[ic];
$('sClose').innerHTML = ICON.close; $('prev2').innerHTML = ICON.up; $('next2').innerHTML = ICON.down
$('fab').innerHTML = ICON.down; $('fabTop').innerHTML = ICON.up; $('lockIc').innerHTML = ICON.lock.replace('width="22" height="22"', 'width="16" height="16"');
$('cardStats').innerHTML = ICON.stats.replace('width="22" height="22"', 'width="18" height="18"') + '<span data-i18n="sidebar.statistics">' + t('sidebar.statistics') + '</span>';
$('cardOpen').innerHTML = ICON.open.replace('width="22" height="22"', 'width="18" height="18"') + '<span data-i18n="sidebar.open_chat">' + t('sidebar.open_chat') + '</span>';
for (const b of document.querySelectorAll('[data-close]')) b.innerHTML = ICON.close;
$('pdfClose').innerHTML = ICON.close; $('pdfDl').innerHTML = ICON.download; $('pdfIn').innerHTML = ICON.plus; $('pdfOut').innerHTML = ICON.minus; $('pdfFit').innerHTML = ICON.fit;
$('pdfClose').onclick = closePdf; $('pdfIn').onclick = () => pdfZoom(1); $('pdfOut').onclick = () => pdfZoom(-1); $('pdfFit').onclick = () => pdfZoom(0);
$('vcModal').querySelector('[data-close-text]').onclick = () => closeModal('vcModal');
$('vcBody').addEventListener('click', e => { const b = e.target.closest('.vc-copy'); if (b) copyText(b.dataset.copy, b.dataset.what); });
$('starClose').innerHTML = ICON.close; $('lbRot').innerHTML = ICON.rotate;
$('lbClose').innerHTML = ICON.close; $('lbDl').innerHTML = ICON.download; $('lbPrev').innerHTML = ICON.back; $('lbNext').innerHTML = ICON.next; $('lbIn').innerHTML = ICON.plus; $('lbOut').innerHTML = ICON.minus; $('lbFit').innerHTML = ICON.fit;

function refreshMedia() {
  linkMedia(); S.lc = null; buildItems(); VL.items = S.items; renderMediaSummary(); VL.refresh(); // message text may have changed, so search re-reads it
}
/* Loads the made-up sample chat (js/demo-data.js). Used at start-up and by the guided tour. */
let sampleVideo = null;
async function loadSample() {
  const my = ++loadSeq;
  showLoading(t('load.preparing_sample')); setProgress(-1);
  let staged = new Map();
  try { staged = await makeSampleMedia(); } catch (e) { console.warn('Sample media could not be generated', e); }
  if (my !== loadSeq) { Media.discard(staged); return false; }
  if (sampleVideo) for (const n of ['00000017-VIDEO-2026-03-15-11-48-22.mp4', '00000016-GIF-2026-03-15-11-47-50.mp4']) Media.stage(staged, n, sampleVideo);
  Media.adopt(staged);
  S.library = []; renderLibrary();
  S.source = { blob: new Blob([SAMPLE], { type: 'text/plain' }), name: 'Sample chat', size: SAMPLE.length, hint: 'Weekend Hiking Crew', sample: true, zip: true };
  try { await parseAndShow(false, my); } catch (e) { if (!isStale(e)) toast.error(e.message); return false; }
  finally { if (my === loadSeq) $('loading').hidden = true; }
  if (!sampleVideo) recordSampleVideo(); // in the background: the chat is already usable
  return true;
}
async function recordSampleVideo() {
  try {
    const vid = await makeSampleVideo();
    if (vid) sampleVideo = vid;
    if (vid && S.source.sample) {
      Media.stage(Media.map, '00000017-VIDEO-2026-03-15-11-48-22.mp4', vid);
      Media.stage(Media.map, '00000016-GIF-2026-03-15-11-47-50.mp4', vid);
      refreshMedia();
    }
  } catch (e) { console.warn('Sample video could not be recorded', e); }
}
let sampleReady = null; // the sample loads only when asked for, from the start screen or the tour
