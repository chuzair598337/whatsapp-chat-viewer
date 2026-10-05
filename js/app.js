"use strict";
/* =====================================================================
   Loading a chat
   ===================================================================== */
function hintFrom(name) {
  const base = (name || '').split('/').pop().replace(/\.(txt|zip)$/i, '').trim();
  const m = /^WhatsApp Chat (?:with |- |– )(.+)$/i.exec(base);
  return m ? m[1].trim() : null;
}
function showLoading(title) { $('loadTitle').textContent = title; $('loadNote').textContent = 'Working on this device'; setProgress(0); $('loading').hidden = false; }
function setProgress(p) { const bar = $('progBar'); bar.parentNode.classList.toggle('indet', p < 0); bar.style.width = p < 0 ? '' : Math.round(p * 100) + '%'; }
let toastTimer = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000); }

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
async function openFile(file) {
  if (!file) return;
  closeDrawer();
  showLoading('Opening ' + file.name);
  const staged = new Map();
  try {
    const kind = await detectKind(file);
    let blob = file, hint = hintFrom(file.name), arc = null, chatPath = null;
    if (kind === 'zip') {
      setNote('Reading ZIP archive · ' + fmtSize(file.size)); setProgress(-1);
      arc = await openArchive(file);
      const txts = arc.names.filter(n => /\.txt$/i.test(n)).sort((a, b) => a.split('/').length - b.split('/').length);
      chatPath = txts.find(n => baseName(n) === '_chat.txt') || txts.find(n => /^WhatsApp Chat/i.test(baseName(n))) || txts[0];
      if (!chatPath) throw new Error("This ZIP doesn't contain a chat text file. Look for _chat.txt or 'WhatsApp Chat with ….txt' inside it.");
      blob = await arc.extract(chatPath);
      hint = hint || hintFrom(chatPath);
      const list = arc.names.filter(n => n !== chatPath);
      let next = 0, done = 0, failed = 0;
      setProgress(0); setNote(list.length ? 'Extracting media · 0 of ' + nf(list.length) : 'No media in this ZIP');
      const work = async () => {
        while (next < list.length) {
          const p = list[next++];
          try { Media.stage(staged, p, await arc.extract(p)); } catch (e) { failed++; console.warn('Could not extract', p, e); }
          done++;
          if (done % 4 === 0 || done === list.length) { setProgress(done / list.length); setNote('Extracting media · ' + nf(done) + ' of ' + nf(list.length)); }
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, list.length) }, work));
      if (failed) toast(nf(failed) + ' file' + (failed === 1 ? '' : 's') + ' in the ZIP could not be extracted.');
    }
    setNote('Reading messages'); setProgress(0);
    const res = await runParse(blob, { order: 'auto' }, setProgress);
    if (!res.messages.length) throw new Error("This doesn't look like a WhatsApp chat export: no dated message lines were found.");
    // Success: swap in the new media (revoking the previous chat's URLs) and show the chat.
    Media.adopt(staged);
    S.source = { blob, name: file.name, size: file.size, hint, sample: false, zip: kind === 'zip' };
    S.order = 'auto'; $('orderSel').value = 'auto';
    applyResult(res, false);
    if (S.res.participants.length > 1) openMeModal();
  } catch (e) {
    Media.discard(staged);
    toast(e && e.message ? e.message : 'Could not read this file.');
  } finally { $('loading').hidden = true; }
}
async function parseAndShow(keepMe) {
  const res = await runParse(S.source.blob, { order: S.order }, setProgress);
  if (!res.messages.length) throw new Error("This doesn't look like a WhatsApp chat export: no dated message lines were found.");
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
function applyResult(res, keepMe) {
  S.res = res; S.msgs = res.messages; S.lc = null; S.stats = null;
  linkMedia();
  const names = res.participants.map(p => p.name);
  const hint = S.source.hint;
  S.isGroup = names.length > 2 || !!res.subject || (!!res.chatName && names.length > 0 && !names.includes(res.chatName));
  if (!(keepMe && (S.me === null || names.includes(S.me)))) S.me = S.source.sample ? 'Bilal Ahmed' : guessMe(res, hint);
  setMe(S.me, true);
  buildItems();
  VL.set(S.items, { i: 0, off: 0 });
  renderChrome();
  clearSearch();
  $('samplebar').hidden = !S.source.sample;
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
      else if (a.name && !a.omitted) missing++;
      else omitted++;
    }
  }
  S.images = imgs;
  S.media = { c, found, missing, omitted, files: Media.map.size };
}
function renderMediaSummary() {
  const md = S.media, c = md.c, sm = ic => ic.replace('width="22" height="22"', 'width="14" height="14"');
  const tiles = [['Photos', c.image + c.gif, ICON.image], ['Videos', c.video, ICON.video], ['Audio', c.audio, ICON.audio],
    ['Stickers', c.sticker, ICON.sticker], ['Documents', c.document, ICON.document], ['Other', c.contact + c.media, ICON.contact]];
  $('mediaGrid').innerHTML = tiles.map(([k, v, i]) => '<div class="mt"><span>' + sm(i) + k + '</span><b>' + nf(v) + '</b></div>').join('');
  const total = tiles.reduce((a, t) => a + t[1], 0);
  $('mediaTotal').textContent = nf(total);
  const note = $('mediaNote');
  note.classList.toggle('warn', md.missing > 0);
  if (md.files || md.found) note.textContent = nf(md.found) + ' shown from the archive' + (md.missing ? ' · ' + nf(md.missing) + ' missing from it' : '') + (md.omitted ? ' · ' + nf(md.omitted) + ' omitted at export' : '') + '.';
  else if (md.missing) note.textContent = 'Opened as text only, so the ' + nf(md.missing) + ' attached file' + (md.missing === 1 ? '' : 's') + ' can\'t be shown. Open the ZIP export to see them.';
  else note.textContent = total ? 'This export was made without media, so media shows as placeholders.' : 'No media in this chat.';
}
function computeTitle() {
  const names = S.res.participants.map(p => p.name);
  const hint = S.source.hint || (S.res.chatName && S.res.chatName !== 'You' ? S.res.chatName : null);
  if (S.isGroup) return S.res.subject || hint || names.slice(0, 3).join(', ') || 'Group chat';
  if (hint) return hint;
  return names.find(n => n !== S.me) || names[0] || 'Chat';
}
function setMe(name, silent) {
  S.me = name || null;
  for (const m of S.msgs) m.isOutgoing = !m.isSystem && S.me !== null && m.sender === S.me;
  S.title = computeTitle();
  if (!silent) { buildItems(); VL.items = S.items; VL.refresh(); renderChrome(); }
}
function buildItems() {
  const msgs = S.msgs, items = [], m2i = new Int32Array(msgs.length), dIdx = [];
  let prevKey = null, prev = null, curDate = -1;
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
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
  S.items = items; S.m2i = m2i; S.dateIdx = Int32Array.from(dIdx);
}

/* ---------- Chrome: header, sidebar ---------- */
function fmtSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
function renderChrome() {
  const res = S.res, msgs = S.msgs;
  const real = msgs.length - msgs.filter(m => m.isSystem).length;
  const first = msgs[0], last = msgs[msgs.length - 1];
  const range = shortFmt.format(dkToT(first.dateKey)) + ' – ' + shortFmt.format(dkToT(last.dateKey));
  const mediaN = msgs.reduce((a, m) => a + m.attachments.length, 0);
  avatar($('headAv'), S.title); avatar($('cardAv'), S.title);
  $('headTitle').textContent = S.title; $('cardTitle').textContent = S.title;
  const pN = res.participants.length;
  $('headSub').textContent = (S.isGroup ? nf(pN) + ' participants · ' : '') + nf(real) + ' messages · ' + range;
  $('cardSub').textContent = S.isGroup ? 'Group · ' + nf(pN) + ' participants' : pN === 2 ? 'Chat between ' + res.participants.map(p => p.name).join(' and ') : 'Chat';
  const orderName = { dmy: 'DD/MM/YYYY', mdy: 'MM/DD/YYYY', ymd: 'YYYY-MM-DD' }[res.order];
  $('facts').innerHTML =
    '<div><dt>Messages</dt><dd>' + nf(real) + '</dd></div>' +
    '<div><dt>Media</dt><dd>' + nf(mediaN) + '</dd></div>' +
    '<div><dt>First</dt><dd>' + esc(shortFmt.format(dkToT(first.dateKey))) + '</dd></div>' +
    '<div><dt>Last</dt><dd>' + esc(shortFmt.format(dkToT(last.dateKey))) + '</dd></div>' +
    '<div class="wide"><dt>File</dt><dd title="' + esc(S.source.name) + '">' + esc(S.source.name) + ' · ' + fmtSize(S.source.size) + ' · ' + (res.format === 'ios' ? 'iPhone' : 'Android') + ' format</dd></div>';
  // me select
  const sel = $('meSel');
  sel.innerHTML = '<option value="">Nobody (all on the left)</option>' + res.participants.slice(0, 300).map(p => '<option value="' + esc(p.name) + '"' + (p.name === S.me ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('');
  sel.value = S.me || '';
  // date order
  $('orderSel').disabled = res.order === 'ymd';
  $('orderNote').innerHTML = 'Reading dates as ' + orderName + (res.ambiguous && S.order === 'auto' ? '<span class="chip">guessed</span>' : '');
  // jump date
  const jd = $('jumpDate'); jd.min = first.dateKey; jd.max = last.dateKey; jd.value = '';
  // participants
  const maxC = res.participants[0] ? res.participants[0].count : 1;
  $('pCount').textContent = nf(pN);
  $('people').innerHTML = res.participants.slice(0, 80).map(p =>
    '<div class="person"><span class="av c' + colorIdx(p.name) + '">' + esc(initials(p.name)) + '</span><div style="min-width:0"><div class="nm">' + esc(p.name) + (p.name === S.me ? '<em>You</em>' : '') + '</div><div class="bar"><i style="width:' + (p.count / maxC * 100).toFixed(1) + '%"></i></div></div><span class="ct">' + nf(p.count) + '<br>' + Math.round(p.count / Math.max(1, real) * 100) + '%</span></div>').join('') +
    (pN > 80 ? '<div class="res-more">and ' + nf(pN - 80) + ' more</div>' : '');
  renderMediaSummary();
  document.title = S.source.sample ? 'Offline Chat Viewer' : S.title + ' · Chat Viewer';
}

/* =====================================================================
   Search
   ===================================================================== */
const q1 = $('q1'), q2 = $('q2');
let searchTimer = 0;
function onSearchInput(e) {
  const v = e.target.value;
  if (e.target === q1) q2.value = v; else q1.value = v;
  clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(v), 140);
}
function runSearch(q) {
  S.q = q; const ql = q.trim().toLowerCase();
  S.matches = []; S.matchSet = new Set(); S.cur = -1; S.re = null;
  if (ql) {
    if (!S.lc) S.lc = S.msgs.map(m => (m.message + (m.sender ? '\u0002' + m.sender : '') + (m.extra && m.extra.options ? ' ' + m.extra.q + ' ' + m.extra.options.map(o => o.label).join(' ') : '') + m.attachments.map(a => ' ' + (a.name || '')).join('')).toLowerCase());
    for (let i = 0; i < S.lc.length; i++) if (S.lc[i].includes(ql)) S.matches.push(i);
    S.matchSet = new Set(S.matches);
    const qe = esc(q.trim()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    S.re = new RegExp('(' + qe + ')|&[#a-zA-Z0-9]+;', 'gi');
    if (S.matches.length) {
      // start from the first match at or below the top of the screen
      const topItem = VL.fw ? VL.fw.find(scroller.scrollTop) : 0;
      let k = S.matches.findIndex(i => S.m2i[i] >= topItem);
      S.cur = k < 0 ? S.matches.length - 1 : k;
    }
  }
  renderResults();
  VL.refresh();
  if (S.cur >= 0) jumpToMatch(S.cur);
  updateCounts();
}
function clearSearch() { q1.value = ''; q2.value = ''; runSearch(''); }
function updateCounts() {
  const n = S.matches.length, txt = !S.q.trim() ? '' : n ? (S.cur + 1) + ' of ' + nf(n) : 'No matches';
  $('count1').textContent = txt; $('count2').textContent = txt;
  for (const id of ['prev1', 'next1', 'prev2', 'next2']) $(id).disabled = n < 2 && !(n === 1);
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
  const rs = document.querySelectorAll('.res');
  rs.forEach(r => r.classList.toggle('cur', +r.dataset.k === k));
}
function snippet(m) {
  const t = m.message || (m.extra && m.extra.q) || (m.attachments[0] && m.attachments[0].name) || '', ql = S.q.trim().toLowerCase();
  const p = t.toLowerCase().indexOf(ql);
  const s = Math.max(0, p - 30);
  const raw = (s > 0 ? '…' : '') + t.slice(s, s + 140).replace(/\s+/g, ' ');
  return esc(raw).replace(S.re, (all, g1) => g1 ? '<mark>' + g1 + '</mark>' : all);
}
function renderResults() {
  const box = $('results');
  if (!S.q.trim() || !S.matches.length) { box.innerHTML = ''; return; }
  const LIM = 200;
  box.innerHTML = S.matches.slice(0, LIM).map((i, k) => {
    const m = S.msgs[i];
    return '<button class="res" data-k="' + k + '"><span class="rh"><b>' + esc(m.isSystem ? 'System' : m.isOutgoing ? 'You' : m.sender) + '</b><time>' + esc(shortFmt.format(dkToT(m.dateKey))) + ', ' + m.formattedTime + '</time></span><span class="rs">' + snippet(m) + '</span></button>';
  }).join('') + (S.matches.length > LIM ? '<div class="res-more">Showing the first ' + LIM + ' of ' + nf(S.matches.length) + '. Use the arrows to step through all of them.</div>' : '');
}
$('results').addEventListener('click', e => { const b = e.target.closest('.res'); if (b) { jumpToMatch(+b.dataset.k); if (isNarrow()) closeDrawer(); } });
for (const q of [q1, q2]) {
  q.addEventListener('input', onSearchInput);
  q.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchTimer); if (S.q !== q.value) runSearch(q.value); else step(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { if (q.value) clearSearch(); else closeSearch(); }
  });
}
$('prev1').onclick = $('prev2').onclick = () => step(-1);
$('next1').onclick = $('next2').onclick = () => step(1);
const isNarrow = () => window.matchMedia('(max-width: 1024px)').matches;
function openSearch() {
  if (isNarrow()) { $('sstrip').hidden = false; q2.focus(); q2.select(); VL.schedule(); }
  else { q1.focus(); q1.select(); }
}
function closeSearch() { $('sstrip').hidden = true; clearSearch(); VL.schedule(); }
$('searchBtn').onclick = openSearch;
$('sClose').onclick = closeSearch;
$('sList').onclick = () => { openDrawer(); setTimeout(() => $('searchSec').scrollIntoView({ block: 'start' }), 230); };

/* =====================================================================
   Stats
   ===================================================================== */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
  const maxP = st.per[0] ? st.per[0].n : 1;
  const maxD = st.topDays[0] ? st.topDays[0][1] : 1;
  const maxW = Math.max(1, ...st.wd), maxH = Math.max(1, ...st.hr);
  const tile = (k, v, s) => '<div class="tile"><dt>' + k + '</dt><dd>' + v + (s ? ' <small>' + s + '</small>' : '') + '</dd></div>';
  $('statsBody').innerHTML =
    '<dl class="tiles" style="margin:0">' +
      tile('Messages', nf(st.n)) + tile('Words', nf(st.words)) + tile('Media', nf(st.media)) +
      tile('Active days', nf(st.days.size), 'of ' + nf(span)) + tile('Per active day', (st.n / Math.max(1, st.days.size)).toFixed(1)) + tile('Words per message', (st.words / Math.max(1, st.n)).toFixed(1)) +
    '</dl>' +
    '<div class="stat"><h3>Messages by person<span>' + nf(st.per.length) + ' people</span></h3><div class="tbl-wrap"><table class="ptable"><thead><tr><th>Person</th><th>Messages</th><th>Share</th><th>Words</th><th>Media</th></tr></thead><tbody>' +
      st.per.slice(0, 50).map(p => '<tr><td><span class="pn">' + esc(p.name) + (p.name === S.me ? ' <span style="color:var(--ink-3)">(you)</span>' : '') + '</span><div class="hbar" style="width:' + (p.n / maxP * 100).toFixed(1) + '%"></div></td><td>' + nf(p.n) + '</td><td>' + (p.n / Math.max(1, st.n) * 100).toFixed(1) + '%</td><td>' + nf(p.words) + '</td><td>' + nf(p.media) + '</td></tr>').join('') +
    '</tbody></table></div></div>' +
    '<div class="sgrid">' +
      '<div class="stat"><h3>Busiest days<span>tap to jump</span></h3><div class="days">' +
        st.topDays.map(([dk, c]) => '<button class="day" data-dk="' + dk + '"><span>' + esc(dayFmt.format(dkToT(dk))) + '</span><span class="dbar"><i style="width:' + (c / maxD * 100).toFixed(1) + '%"></i></span><span class="dn">' + nf(c) + '</span></button>').join('') +
      '</div></div>' +
      '<div class="stat"><h3>By weekday</h3><div class="vbars">' +
        st.wd.map((c, i) => '<div class="vbar" data-tip="' + WD[i] + ': ' + nf(c) + ' messages"><i style="height:' + (c / maxW * 100).toFixed(1) + '%"></i></div>').join('') +
      '</div><div class="vlabels">' + WD.map(d => '<span>' + d + '</span>').join('') + '</div></div>' +
    '</div>' +
    '<div class="stat"><h3>By hour of day<span>local time from the export</span></h3><div class="vbars">' +
      st.hr.map((c, i) => '<div class="vbar" data-tip="' + String(i).padStart(2, '0') + ':00 – ' + String(i).padStart(2, '0') + ':59: ' + nf(c) + '"><i style="height:' + (c / maxH * 100).toFixed(1) + '%"></i></div>').join('') +
    '</div><div class="vlabels">' + st.hr.map((c, i) => '<span>' + (i % 3 === 0 ? i : '') + '</span>').join('') + '</div></div>';
}
function openStats() { if (!S.msgs.length) return; renderStats(); openModal('statsModal'); }
$('statsBody').addEventListener('click', e => { const b = e.target.closest('.day'); if (b) { closeModal('statsModal'); jumpToDate(b.dataset.dk); } });
$('statsBtn').onclick = openStats; $('cardStats').onclick = () => { closeDrawer(); openStats(); };

/* ---------- Modals ---------- */
let lastFocus = null;
function openModal(id) { lastFocus = document.activeElement; const m = $(id); m.hidden = false; const f = m.querySelector('[data-close], button'); if (f) f.focus(); }
function closeModal(id) { $(id).hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
for (const m of document.querySelectorAll('.modal')) {
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m.id); });
}
function openMeModal() {
  const ps = S.res.participants.slice(0, 40);
  $('meList').innerHTML = ps.map((p, k) =>
    '<label class="meopt"><input type="radio" name="me" value="' + esc(p.name) + '"' + (p.name === S.me ? ' checked' : '') + '><span class="av c' + colorIdx(p.name) + '">' + esc(initials(p.name)) + '</span><span>' + esc(p.name) + '<small>' + nf(p.count) + ' messages' + (p.name === S.me ? ' · best guess' : '') + '</small></span></label>').join('') +
    '<label class="meopt"><input type="radio" name="me" value=""' + (!S.me ? ' checked' : '') + '><span class="av" style="background:var(--bar-track);color:var(--ink-2)">–</span><span>None of these<small>Show everyone on the left</small></span></label>';
  openModal('meModal');
}
$('meDone').onclick = () => { const r = document.querySelector('input[name="me"]:checked'); closeModal('meModal'); setMe(r ? r.value : null); };
$('meSel').onchange = e => setMe(e.target.value || null);

/* ---------- Date order, jump to date, doodles ---------- */
$('orderSel').onchange = async e => {
  S.order = e.target.value;
  showLoading('Re-reading dates');
  try { await parseAndShow(true); } catch (err) { toast(err.message); } finally { $('loading').hidden = true; }
};
function jumpToDate(dk) {
  let k = S.msgs.findIndex(m => m.dateKey >= dk);
  if (k < 0) k = S.msgs.length - 1;
  const it = S.m2i[k] - (S.items[S.m2i[k] - 1] && S.items[S.m2i[k] - 1].type === 'date' ? 1 : 0);
  VL.scrollTo(it);
}
$('jumpDate').onchange = e => { if (e.target.value) { jumpToDate(e.target.value); if (isNarrow()) closeDrawer(); } };
const doodleBox = $('doodle');
function applyDoodle() { $('app').classList.toggle('no-doodle', !doodleBox.checked); }
doodleBox.checked = store('cv-doodle') !== '0'; applyDoodle();
doodleBox.onchange = () => { store('cv-doodle', doodleBox.checked ? '1' : '0'); applyDoodle(); };
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
  const b = $('themeBtn');
  b.innerHTML = theme === 'light' ? ICON.sun : theme === 'dark' ? ICON.moon : ICON.auto;
  const label = 'Theme: ' + (theme === 'system' ? 'match system' : theme) + '. Click to change.';
  b.setAttribute('aria-label', label); b.title = label;
}
$('themeBtn').onclick = () => { theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'; store('cv-theme', theme); applyTheme(); };
applyTheme();

/* ---------- Drawer ---------- */
function openDrawer() { if (!isNarrow()) return; document.body.classList.add('drawer-open'); $('scrim').hidden = false; }
function closeDrawer() { document.body.classList.remove('drawer-open'); $('scrim').hidden = true; }
$('menuBtn').onclick = openDrawer; $('whoBtn').onclick = () => isNarrow() ? openDrawer() : openStats();
$('scrim').onclick = closeDrawer; $('sbClose').onclick = closeDrawer;

/* ---------- File input + drag and drop ---------- */
const fileInput = $('file');
const pick = () => fileInput.click();
$('openBtn').onclick = $('sbOpen').onclick = $('cardOpen').onclick = $('sampleOpen').onclick = pick;
fileInput.onchange = () => { const f = fileInput.files[0]; fileInput.value = ''; openFile(f); };
let dragDepth = 0;
const hasFiles = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
window.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; $('drop').hidden = false; });
window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('drop').hidden = true; });
window.addEventListener('drop', e => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; $('drop').hidden = true; openFile(e.dataTransfer.files[0]); });

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', e => {
  if (!$('pdfv').hidden) {
    if (e.key === 'Escape') closePdf();
    else if (e.key === '+' || e.key === '=') pdfZoom(1);
    else if (e.key === '-') pdfZoom(-1);
    else if (e.key === '0') pdfZoom(0);
    return;
  }
  if (!$('lb').hidden) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lbStep(-1);
    else if (e.key === 'ArrowRight') lbStep(1);
    else if (e.key === '+' || e.key === '=') zTo(Z.s * 1.5, undefined, undefined, true);
    else if (e.key === '-') zTo(Z.s / 1.5, undefined, undefined, true);
    else if (e.key === '0') zTo(1, undefined, undefined, true);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && S.msgs.length) { e.preventDefault(); openSearch(); }
  else if (e.key === 'Escape') {
    for (const id of ['vcModal', 'statsModal', 'meModal']) if (!$(id).hidden) { closeModal(id); return; }
    if (document.body.classList.contains('drawer-open')) closeDrawer();
  }
});

/* ---------- Static icons ---------- */
$('logo').innerHTML = ICON.chat; $('sbOpen').innerHTML = ICON.open; $('sbClose').innerHTML = ICON.close;
$('menuBtn').innerHTML = ICON.menu; $('searchBtn').innerHTML = ICON.search; $('statsBtn').innerHTML = ICON.stats; $('openBtn').innerHTML = ICON.open;
$('sClose').innerHTML = ICON.back; $('prev1').innerHTML = $('prev2').innerHTML = ICON.up; $('next1').innerHTML = $('next2').innerHTML = ICON.down; $('sList').innerHTML = ICON.list;
$('sIcon1').innerHTML = ICON.search.replace('width="22" height="22"', 'width="18" height="18"');
$('fab').innerHTML = ICON.down; $('fabTop').innerHTML = ICON.up; $('lockIc').innerHTML = ICON.lock.replace('width="22" height="22"', 'width="16" height="16"');
$('cardStats').innerHTML = ICON.stats.replace('width="22" height="22"', 'width="18" height="18"') + 'Statistics';
$('cardOpen').innerHTML = ICON.open.replace('width="22" height="22"', 'width="18" height="18"') + 'Open chat';
for (const b of document.querySelectorAll('[data-close]')) b.innerHTML = ICON.close;
$('pdfClose').innerHTML = ICON.close; $('pdfDl').innerHTML = ICON.download; $('pdfIn').innerHTML = ICON.plus; $('pdfOut').innerHTML = ICON.minus; $('pdfFit').innerHTML = ICON.fit;
$('pdfClose').onclick = closePdf; $('pdfIn').onclick = () => pdfZoom(1); $('pdfOut').onclick = () => pdfZoom(-1); $('pdfFit').onclick = () => pdfZoom(0);
$('vcModal').querySelector('[data-close-text]').onclick = () => closeModal('vcModal');
$('vcBody').addEventListener('click', e => { const b = e.target.closest('.vc-copy'); if (b) copyText(b.dataset.copy, b.dataset.what); });
$('lbClose').innerHTML = ICON.close; $('lbDl').innerHTML = ICON.download; $('lbPrev').innerHTML = ICON.back; $('lbNext').innerHTML = ICON.next; $('lbIn').innerHTML = ICON.plus; $('lbOut').innerHTML = ICON.minus; $('lbFit').innerHTML = ICON.fit;

/* =====================================================================
   Sample chat (made up) so the viewer opens in a working state
   ===================================================================== */
const L = '‎', N = ' ';
const SAMPLE = [
  `[14/03/2026, 8:02:11${N}AM] Weekend Hiking Crew: ${L}Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.`,
  `[14/03/2026, 8:02:11${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan created group “Weekend Hiking Crew”`,
  `[14/03/2026, 8:02:15${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan added Bilal Ahmed, Sara Malik and Omar Farooq`,
  `[14/03/2026, 8:03:40${N}AM] Ayesha Khan: Morning all! Saturday plan for *Trail 5* 🥾`,
  `[14/03/2026, 8:04:02${N}AM] Ayesha Khan: - Meet at 6:30 at the trailhead`, `- Bring 2L water each`, `- Back by noon`,
  `[14/03/2026, 8:05:19${N}AM] Sara Malik: I'm in! _finally_ a cool morning`,
  `[14/03/2026, 8:05:51${N}AM] Omar Farooq: Count me in too 🙌`,
  `[14/03/2026, 8:06:30${N}AM] Bilal Ahmed: Same. I'll bring the first aid kit`,
  `[14/03/2026, 8:07:12${N}AM] Omar Farooq: ${L}<attached: 00000007-PHOTO-2026-03-14-08-07-12.jpg>`,
  `[14/03/2026, 8:07:30${N}AM] Omar Farooq: That's the route map from last time`,
  `[14/03/2026, 8:09:03${N}AM] Sara Malik: ${L}POLL:`, `${L}Breakfast after the hike?`, `${L}OPTION: Paratha place (3 votes)`, `${L}OPTION: Coffee only (1 vote)`, `${L}OPTION: Straight home (0 votes)`,
  `[14/03/2026, 8:15:44${N}AM] Ayesha Khan: ~Saturday~ Sunday actually, rain is forecast for Saturday ☔`,
  `[14/03/2026, 8:16:02${N}AM] Bilal Ahmed: Sunday works better for me anyway`,
  `${L}[14/03/2026, 8:16:40${N}AM] Omar Farooq: ${L}This message was deleted.`,
  `[14/03/2026, 9:20:13${N}PM] Bilal Ahmed: ${L}Missed voice call, ${L}Tap to call back`,
  `[14/03/2026, 9:21:55${N}PM] Ayesha Khan: sorry, was driving. Will call later`,
  `[15/03/2026, 6:12:08${N}AM] Bilal Ahmed: ${L}Location: https://maps.google.com/?q=33.7380,73.0750`,
  `[15/03/2026, 6:12:30${N}AM] Bilal Ahmed: Parking is full at the main gate, use this one`,
  `[15/03/2026, 6:14:02${N}AM] Sara Malik: GPX file for the route: https://github.com/trail-crew/trail-5-gpx`,
  `[15/03/2026, 6:15:40${N}AM] Ayesha Khan: And last year's video so you know the climb https://www.youtube.com/watch?v=trail5-2025 also the weather https://www.metoffice.gov.uk/weather/forecast`,
  `[15/03/2026, 6:20:41${N}AM] Sara Malik: 5 min away`,
  `[15/03/2026, 6:41:09${N}AM] Omar Farooq: Wifi code for the café later is \`\`\`TRAIL-2026\`\`\``,
  `[15/03/2026, 11:47:50${N}AM] Omar Farooq: ${L}<attached: 00000016-GIF-2026-03-15-11-47-50.mp4>`,
  `[15/03/2026, 11:48:22${N}AM] Ayesha Khan: ${L}<attached: 00000017-VIDEO-2026-03-15-11-48-22.mp4>`,
  `${L}[15/03/2026, 11:48:25${N}AM] Omar Farooq: ${L}video omitted`,
  `[15/03/2026, 11:48:31${N}AM] Ayesha Khan: ${L}<attached: 00000018-PHOTO-2026-03-15-11-48-31.jpg>`,
  `[15/03/2026, 11:48:40${N}AM] Ayesha Khan: Summit! 🏔️`,
  `[15/03/2026, 11:49:02${N}AM] Sara Malik: 😍😍`,
  `[15/03/2026, 11:49:30${N}AM] Sara Malik: ${L}<attached: 00000019-STICKER-2026-03-15-11-49-30.webp>`,
  `[15/03/2026, 11:52:03${N}AM] Omar Farooq: ${L}<attached: 00000021-PHOTO-2026-03-15-11-52-03.jpg>`,
  `[15/03/2026, 11:50:17${N}AM] Omar Farooq: > Back by noon`, `Not happening 😂 ${L}<This message was edited>`,
  `[15/03/2026, 7:30:55${N}PM] Bilal Ahmed: ${L}<attached: 00000026-Trail-notes.pdf>`,
  `[15/03/2026, 7:31:05${N}PM] Bilal Ahmed: ${L}<attached: 00000027-Gear-checklist.txt>`,
  `[15/03/2026, 7:31:20${N}PM] Bilal Ahmed: Notes and timings for next time. Total *11.4 km*, 3h 52m moving`,
  `[15/03/2026, 7:33:02${N}PM] Weekend Hiking Crew: ${L}Sara Malik changed the group description`,
  `[16/03/2026, 9:02:44${N}AM] Ayesha Khan: ${L}Voice call, ${L}12 min`,
  `[16/03/2026, 9:15:10${N}AM] Ayesha Khan: Same time next month? 🗓️`,
  `[16/03/2026, 9:16:03${N}AM] Sara Malik: ${L}<attached: 00000030-AUDIO-2026-03-16-09-16-03.opus>`,
  `[16/03/2026, 9:16:20${N}AM] Bilal Ahmed: ${L}<attached: 00000031-Trail-playlist.mp3>`,
  `[16/03/2026, 9:16:30${N}AM] Omar Farooq: 👍`,
].join('\r\n');
/* Generated stand-ins for the sample's media (nothing is fetched). */
const canvasBlob = (c, type, q) => new Promise(r => c.toBlob(b => r(b), type, q));
function makeWav(sec) {
  const sr = 16000, n = Math.floor(sr * sec), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const t = i / sr, env = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2.6)), 2) * Math.min(1, (sec - t) * 4);
    const f = 150 + 35 * Math.sin(t * 1.7);
    const x = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(4 * Math.PI * f * t) * 0.25 + Math.sin(6 * Math.PI * f * t) * 0.1) * env * 0.22;
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32767, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}
function makePdf(lines) {
  const content = 'BT /F1 20 Tf 72 730 Td (' + lines[0] + ') Tj /F1 12 Tf ' + lines.slice(1).map(l => '0 -24 Td (' + l + ') Tj').join(' ') + ' ET';
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'];
  let pdf = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const x = pdf.length;
  pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
  return new Blob([pdf], { type: 'application/pdf' });
}
async function makeSampleMedia() {
  const staged = new Map();
  // Route map
  let c = document.createElement('canvas'); c.width = 960; c.height = 720;
  let g = c.getContext('2d');
  g.fillStyle = '#dfe9d2'; g.fillRect(0, 0, 960, 720);
  g.strokeStyle = 'rgba(80,110,60,.35)'; g.lineWidth = 2;
  for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(620, 300, 70 + k * 46, 50 + k * 34, -0.4, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = '#6aa6d8'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 610); g.bezierCurveTo(260, 560, 380, 700, 960, 640); g.stroke();
  g.setLineDash([18, 12]); g.strokeStyle = '#d6452f'; g.lineWidth = 7; g.beginPath(); g.moveTo(110, 600); g.bezierCurveTo(260, 470, 300, 520, 420, 420); g.bezierCurveTo(520, 330, 520, 280, 620, 300); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#d6452f'; g.beginPath(); g.arc(110, 600, 14, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1d3a24'; g.beginPath(); g.moveTo(620, 268); g.lineTo(644, 312); g.lineTo(596, 312); g.closePath(); g.fill();
  g.font = '600 34px system-ui, sans-serif'; g.fillText('Trail 5  ·  11.4 km', 60, 80);
  g.font = '26px system-ui, sans-serif'; g.fillText('Start', 80, 650); g.fillText('Summit 1,604 m', 660, 330);
  staged.set('map', ['00000007-PHOTO-2026-03-14-08-07-12.jpg', await canvasBlob(c, 'image/jpeg', 0.86)]);
  // Summit photo (portrait)
  c = document.createElement('canvas'); c.width = 720; c.height = 960; g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, 960); gr.addColorStop(0, '#f7b267'); gr.addColorStop(0.5, '#f4845f'); gr.addColorStop(1, '#5b3758');
  g.fillStyle = gr; g.fillRect(0, 0, 720, 960);
  g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(520, 330, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3d2c4e'; g.beginPath(); g.moveTo(0, 760); g.lineTo(180, 520); g.lineTo(300, 640); g.lineTo(460, 430); g.lineTo(720, 720); g.lineTo(720, 960); g.lineTo(0, 960); g.fill();
  g.fillStyle = '#24182f'; g.beginPath(); g.moveTo(0, 860); g.lineTo(240, 700); g.lineTo(420, 820); g.lineTo(720, 760); g.lineTo(720, 960); g.lineTo(0, 960); g.fill();
  staged.set('summit', ['00000018-PHOTO-2026-03-15-11-48-31.jpg', await canvasBlob(c, 'image/jpeg', 0.86)]);
  // Sticker
  c = document.createElement('canvas'); c.width = 320; c.height = 320; g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(160, 150, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffd34e'; g.beginPath(); g.arc(160, 150, 108, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3b2a1a'; g.beginPath(); g.arc(120, 125, 13, 0, Math.PI * 2); g.arc(200, 125, 13, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3b2a1a'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(160, 160, 55, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = '#fff'; g.strokeStyle = '#1d6b4f'; g.lineWidth = 8; g.font = '800 46px system-ui, sans-serif'; g.textAlign = 'center';
  g.strokeText('Summit!', 160, 300); g.fillText('Summit!', 160, 300);
  const webp = await canvasBlob(c, 'image/webp', 0.9) || await canvasBlob(c, 'image/png');
  staged.set('stk', ['00000019-STICKER-2026-03-15-11-49-30.webp', webp]);
  staged.set('pdf', ['00000026-Trail-notes.pdf', makePdf(['Trail 5 notes', 'Distance: 11.4 km', 'Moving time: 3 h 52 min', 'Elevation gain: 720 m', 'Water used: about 1.6 L each', 'Next time: start 30 minutes earlier'])]);
  staged.set('voice', ['00000030-AUDIO-2026-03-16-09-16-03.opus', makeWav(6)]);
  staged.set('song', ['00000031-Trail-playlist.mp3', makeWav(9)]);
  staged.set('txt', ['00000027-Gear-checklist.txt', new Blob(['Gear checklist\n- 2 L water\n- Rain jacket\n- First aid kit\n- Head torch\n- Snacks\n'], { type: 'text/plain' })]);
  const out = new Map();
  for (const [, [name, blob]] of staged) if (blob) Media.stage(out, name, blob);
  return out;
}
/* The sample's video and GIF are recorded from a canvas animation after the chat is on screen. */
async function makeSampleVideo() {
  if (typeof MediaRecorder === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 640; c.height = 360;
  const g = c.getContext('2d');
  if (!c.captureStream) return null;
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  const type = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
  if (!type) return null;
  const rec = new MediaRecorder(c.captureStream(30), { mimeType: type, videoBitsPerSecond: 900000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const t0 = performance.now(), dur = 3000;
  const draw = () => {
    const t = Math.min(1, (performance.now() - t0) / dur);
    const gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, '#8fd3fe'); gr.addColorStop(1, '#f6e7c1');
    g.fillStyle = gr; g.fillRect(0, 0, 640, 360);
    g.fillStyle = '#ffd34e'; g.beginPath(); g.arc(520, 70 + 30 * t, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5b7f4f'; g.beginPath(); g.moveTo(0, 360); g.lineTo(0, 260); g.lineTo(200, 140); g.lineTo(330, 220); g.lineTo(470, 110); g.lineTo(640, 250); g.lineTo(640, 360); g.fill();
    const x = 40 + 420 * t, y = 300 - 190 * Math.sin(t * Math.PI / 2) - 6 * Math.abs(Math.sin(t * 40));
    g.fillStyle = '#d6452f'; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1d3a24'; g.font = '600 26px system-ui, sans-serif'; g.fillText('Trail 5 summit push', 24, 44);
    if (t < 1) requestAnimationFrame(draw);
  };
  const done = new Promise(r => { rec.onstop = r; });
  rec.start(250); draw();
  await new Promise(r => setTimeout(r, dur + 120));
  rec.stop(); await done;
  return chunks.length ? new Blob(chunks, { type: type.split(';')[0] }) : null;
}
function refreshMedia() {
  linkMedia(); buildItems(); VL.items = S.items; renderMediaSummary(); VL.refresh();
}
(async function boot() {
  let staged = new Map();
  try { staged = await makeSampleMedia(); } catch (e) { console.warn('Sample media could not be generated', e); }
  Media.adopt(staged);
  S.source = { blob: new Blob([SAMPLE], { type: 'text/plain' }), name: 'Sample chat', size: SAMPLE.length, hint: 'Weekend Hiking Crew', sample: true, zip: true };
  try { await parseAndShow(false); } catch (e) { toast(e.message); }
  try {
    const vid = await makeSampleVideo();
    if (vid && S.source.sample) {
      Media.stage(Media.map, '00000017-VIDEO-2026-03-15-11-48-22.mp4', vid);
      Media.stage(Media.map, '00000016-GIF-2026-03-15-11-47-50.mp4', vid);
      refreshMedia();
    }
  } catch (e) { console.warn('Sample video could not be recorded', e); }
})();
