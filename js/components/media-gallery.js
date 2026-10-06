"use strict";
/* =====================================================================
   Media, links and docs: a gallery of everything shared in the open chat,
   like WhatsApp's screen of the same name. A row of filter chips picks a
   category; photos, videos and stickers show as a square grid, the rest as
   rows. Items are newest first and grouped by month.

   It reuses the chat's own pieces: the photo viewer (stepping through the
   filtered items), the voice-note players, the PDF viewer and contact cards.
   Only files that are in the export are listed. Loaded after app.js.
   ===================================================================== */
// Each category with the dictionary key of its name (js/i18n).
const GAL_CATS = [['all', 'media_gallery.all'], ['photos', 'media_gallery.photos'], ['videos', 'media_gallery.videos'], ['audio', 'media_gallery.audio'], ['docs', 'media_gallery.documents'], ['stickers', 'media_gallery.stickers'], ['links', 'media_gallery.links'], ['contacts', 'media_gallery.contacts']];
const GAL_OF = { image: 'photos', gif: 'photos', video: 'videos', audio: 'audio', document: 'docs', sticker: 'stickers', contact: 'contacts' };
const GAL_ICON = { photos: 'image', videos: 'video', audio: 'audio', docs: 'document', stickers: 'sticker', links: 'link', contacts: 'contact', all: 'image' };
const GAL_GRID = new Set(['photos', 'videos', 'stickers']);
const GAL_PAGE = 120; // items added to the page at a time, so very media-heavy chats stay smooth
const galBody = $('galBody'), galSm = ic => ICON[ic].replace('width="22" height="22"', 'width="16" height="16"');

// Sort orders: by date (with month headings), by name, or by size (files only; links go last).
const GAL_SORTS = [['new', 'gallery.newest'], ['old', 'gallery.oldest'], ['az', 'gallery.name_az'], ['za', 'gallery.name_za'], ['big', 'gallery.largest'], ['small', 'gallery.smallest']];
const galName = it => it.cat === 'links' ? it.x.href.replace(/^https?:\/\/(www\.)?/i, '') : it.cat === 'contacts' && Media.cards.get(it.e.name) && Media.cards.get(it.e.name)[0] ? Media.cards.get(it.e.name)[0].name : (it.a.title || it.e.name);
const galCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function galSorted(list, sort) {
  if (sort === 'new') return list; // the index is newest first
  if (sort === 'old') return list.slice().reverse();
  const out = list.slice();
  if (sort === 'az' || sort === 'za') { const d = sort === 'az' ? 1 : -1; out.sort((a, b) => d * galCollator.compare(galName(a), galName(b)) || b.i - a.i); }
  else { const d = sort === 'big' ? -1 : 1, size = it => it.e ? it.e.size : null; out.sort((a, b) => (size(a) === null) - (size(b) === null) || d * (size(a) - size(b)) || b.i - a.i); }
  return out;
}
const Gallery = {
  key: null, items: [], counts: {}, cat: 'all', sort: 'new', list: [], n: 0, sec: null, io: null, durs: new Map(),

  /* ---------- Index: one entry per attachment or link, newest first ---------- */
  index() {
    if (this.key === S.media) return;
    this.key = S.media; this.durs.clear();
    const items = [], counts = { all: 0 };
    for (const [c] of GAL_CATS) counts[c] = 0;
    for (let i = S.msgs.length - 1; i >= 0; i--) {
      const m = S.msgs[i];
      if (m.isSystem) continue;
      for (const a of m.attachments) {
        const cat = GAL_OF[a.type], e = a.url ? Media.get(a.name) : null;
        if (cat && e) items.push({ i, cat, a, e });
      }
      if (m.message && m.kind !== 'location') {
        const seen = new Set();
        for (const u of urlsIn(m.message)) {
          const x = safeUrl(u);
          if (x && !seen.has(x.href)) { seen.add(x.href); items.push({ i, cat: 'links', x }); }
        }
      }
    }
    for (const it of items) counts[it.cat]++;
    counts.all = items.length;
    this.items = items; this.counts = counts;
  },
  count(cat) { this.index(); return this.counts[cat] || 0; },

  /* ---------- Opening and filtering ---------- */
  open(cat) {
    if (!S.msgs.length) return;
    this.index();
    closeDrawer();
    openModal('galModal');
    this.show(cat || 'all');
  },
  close() { if (!$('galModal').hidden) closeModal('galModal'); },
  // The chat's media changed while the gallery is open (the sample's video finished recording): redraw it.
  refresh() { // keeps the scroll position, since media arrives a few files at a time after a ZIP opens
    if ($('galModal').hidden || this.shownKey === S.media) return;
    const st = galBody.scrollTop; this.show(this.cat); while (galBody.scrollHeight - galBody.clientHeight < st && this.n < this.list.length) this.more(); galBody.scrollTop = st;
  },
  show(cat) {
    this.index();
    this.cat = cat; this.shownKey = S.media;
    $('galChips').innerHTML = GAL_CATS.map(([c, label]) => '<button class="chip' + (c === cat ? ' on' : '') + '" role="tab" aria-selected="' + (c === cat) + '" data-cat="' + c + '">' +
      t(label) + ' <span class="cc">' + nf(this.counts[c]) + '</span></button>').join('');
    const on = $('galChips').querySelector('.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    this.list = galSorted(cat === 'all' ? this.items : this.items.filter(x => x.cat === cat), this.sort);
    $('galSort').classList.toggle('on', this.sort !== 'new');
    this.n = 0; this.sec = null;
    galBody.scrollTop = 0;
    galBody.innerHTML = '';
    if (!this.list.length) {
      const none = cat === 'all' ? 'media_gallery.no_items' : GAL_CATS.find(c => c[0] === cat)[1].replace('.', '.no_');
      const txtOnly = cat !== 'links' && !S.media.files && (S.media.missing || S.media.omitted);
      galBody.innerHTML = '<div class="gempty">' + ICON[GAL_ICON[cat]] + '<b>' + t(none) + '</b><small>' +
        t(cat === 'links' ? 'media_gallery.links_hint' : txtOnly ? 'media_gallery.text_only_hint' : 'media_gallery.files_hint') + '</small></div>';
      return;
    }
    this.more();
  },
  // Adds the next page of items. A month that continues from the previous page keeps its section.
  more() {
    const end = Math.min(this.list.length, this.n + GAL_PAGE);
    for (let k = this.n; k < end; k++) {
      const it = this.list[k], m = S.msgs[it.i], byDate = this.sort === 'new' || this.sort === 'old', mk = byDate ? m.dateKey.slice(0, 7) : '';
      if (!this.sec || this.sec.mk !== mk) {
        const el = document.createElement('section');
        el.className = 'gsec';
        el.innerHTML = (byDate ? '<h3>' + esc(monthLabel(mk)) + '</h3>' : '') + '<div class="ggrid"></div><div class="glist"></div>';
        galBody.appendChild(el);
        this.sec = { mk, grid: el.querySelector('.ggrid'), list: el.querySelector('.glist') };
      }
      const grid = GAL_GRID.has(it.cat);
      (grid ? this.sec.grid : this.sec.list).insertAdjacentHTML('beforeend', grid ? tileHTML(it, k) : rowHTML(it, k));
    }
    this.n = end;
    Was.mount(galBody);
    for (const ap of galBody.querySelectorAll('.aplayer:not([data-painted])')) {
      ap.dataset.painted = '1';
      AudioCtl.paintNode(ap); AudioCtl.probe(ap.dataset.audio);
      if (ap.classList.contains('voice')) Waves.request(ap.dataset.audio);
    }
    let s = $('galMore');
    if (s) s.remove();
    if (this.n < this.list.length) {
      galBody.insertAdjacentHTML('beforeend', '<div id="galMore" class="gmore">' + t('media_gallery.loading_more') + '</div>');
      s = $('galMore');
      if (!this.io) this.io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) this.more(); }, { root: galBody, rootMargin: '600px' });
      this.io.disconnect(); this.io.observe(s);
    }
  },
  // The photo viewer steps through what is showing: the photos, GIFs, videos and stickers in this filter.
  view(k) {
    const it = this.list[k];
    if (!it) return;
    if (isWas(it.e.name)) { this.jump(it.i); return; } // an animated sticker plays in the chat, not in the photo viewer
    const list = this.list.filter(x => x.e && GAL_GRID.has(x.cat)).map(x => ({ i: x.i, name: x.e.name, type: x.a.type }));
    openLightbox(it.e.name, list);
  },
  jump(i) { this.close(); jumpToMsg(i); }
};

function monthLabel(mk) {
  const now = new Date(), [y, mo] = mk.split('-').map(Number);
  if (y === now.getFullYear() && mo === now.getMonth() + 1) return t('media_gallery.this_month');
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString(I18N.locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
function galWhen(m) { return t('media_gallery.when', { who: m.isOutgoing ? t('common.you') : m.sender, date: dateLabel(m.dateKey), time: m.formattedTime }); }

function tileHTML(it, k) {
  const m = S.msgs[it.i], e = it.e, label = typeLabel(it.a.type) + ', ' + galWhen(m);
  if (Media.cantShow(e.name)) { // a download link instead of a broken picture
    const ext = (extOf(e.name) || 'file').toUpperCase().slice(0, 4);
    return '<a class="gtile gbad" href="' + e.url + '" download="' + esc(e.name) + '" title="' + esc(t('att.cant_show')) + '" aria-label="' + esc(t('doc.download_name', { name: e.name })) + '"><span class="dext dx-other">' + esc(ext) + '</span><small>' + esc(t('att.cant_show')) + '</small></a>';
  }
  const vid = VIDEO_EXT.test(extOf(e.name));
  let inner;
  if (it.a.type === 'gif' && vid) inner = '<video src="' + e.url + '" muted loop' + (reducedMotion() ? '' : ' autoplay') + ' playsinline preload="metadata"></video><span class="gbadge">GIF</span>';
  else if (vid) {
    const poster = Media.posters.get(e.name);
    if (poster === undefined) Posters.request(e.name);
    inner = '<video src="' + e.url + '" muted playsinline preload="metadata" data-vid="' + esc(e.name) + '" data-bad="' + esc(e.name) + '"' + (poster ? ' poster="' + poster + '"' : '') + '></video>' +
      '<span class="gdur">' + ICON.play + '<span>' + (Gallery.durs.has(e.name) ? fmtDur(Gallery.durs.get(e.name)) : '') + '</span></span>';
  } else if (isWas(e.name)) inner = '<span class="lottie" data-was="' + esc(e.name) + '"></span>';
  else inner = '<img src="' + e.url + '" alt="" loading="lazy" decoding="async" data-bad="' + esc(e.name) + '">' + (it.a.type === 'gif' ? '<span class="gbadge">GIF</span>' : '');
  return '<button class="gtile' + (it.cat === 'stickers' ? ' stk' : '') + '" data-gk="' + k + '" aria-label="' + esc(t('media_gallery.open_item', { label })) + '">' + inner + '</button>';
}
const jumpBtn = i => '<button class="ibtn sm gjump" data-jump="' + i + '" aria-label="' + t('media_gallery.show_in_chat') + '" title="' + t('media_gallery.show_in_chat') + '">' + galSm('chat') + '</button>';
function rowHTML(it, k) {
  const m = S.msgs[it.i], when = '<small class="gwhen">' + esc(galWhen(m)) + '</small>';
  if (it.cat === 'links') {
    const s = siteOf(it.x), ctx = m.message.replace(RE_URL, ' ').replace(/\s+/g, ' ').trim();
    return '<div class="grow glink"><span class="lbadge" style="background:' + s.color + '">' + esc((s.name[0] || '?').toUpperCase()) + '</span>' +
      '<span class="gtxt"><b>' + esc(s.name) + '</b><a href="' + esc(it.x.href) + '" target="_blank" rel="noopener noreferrer" title="' + esc(it.x.href) + '">' + esc(s.shown) + '</a>' +
      (ctx ? '<small dir="auto" class="gctx">' + esc(ctx.length > 120 ? ctx.slice(0, 118) + '…' : ctx) + '</small>' : '') + when + '</span>' +
      '<span class="gacts"><button class="ibtn sm lcopy" data-url="' + esc(it.x.href) + '" aria-label="' + t('link.copy') + '" title="' + t('link.copy') + '">' + galSm('copy') + '</button>' +
      '<a class="ibtn sm" href="' + esc(it.x.href) + '" target="_blank" rel="noopener noreferrer" aria-label="' + t('media_gallery.open_link') + '" title="' + t('media_gallery.open_link') + '">' + galSm('next') + '</a>' + jumpBtn(it.i) + '</span></div>';
  }
  const e = it.e;
  if (it.cat === 'audio') return '<div class="grow gaud">' + audioHTML(e, m) + '<span class="gfoot">' + when + jumpBtn(it.i) + '</span></div>';
  if (it.cat === 'contacts') return '<div class="grow gvc">' + contactHTML(e) + '<span class="gfoot">' + when + jumpBtn(it.i) + '</span></div>';
  // Documents: type badge, title, size and date. PDFs open in the viewer, other files open in a new tab.
  const ext = extOf(e.name), label = (ext || 'file').toUpperCase().slice(0, 4), title = it.a.title || e.name, pdf = ext === 'pdf';
  const pages = pdf ? PdfView.pages.get(e.name) : 0, detail = pages ? t('doc.pages', { n: pages }) : it.a.detail || '';
  const main = pdf ? '<button class="gmain" data-pdf="' + esc(e.name) + '" data-title="' + esc(title) + '" aria-label="' + esc(t('doc.open', { name: title })) + '">'
    : '<a class="gmain" href="' + e.url + '" target="_blank" rel="noopener" aria-label="' + esc(t('doc.open', { name: title })) + '">';
  return '<div class="grow gdoc">' + main + '<span class="dext dx-' + (DX[ext] || 'other') + '">' + esc(label) + '</span>' +
    '<span class="gtxt"><b dir="auto" title="' + esc(title) + '">' + esc(title) + '</b><small>' + (detail ? esc(detail) + ' · ' : '') + esc(label) + ' · ' + fmtSize(e.size) + '</small>' + when + '</span>' + (pdf ? '</button>' : '</a>') +
    '<span class="gacts"><a class="ibtn sm" href="' + e.url + '" download="' + esc(e.name) + '" aria-label="' + esc(t('doc.download_name', { name: title })) + '" title="' + t('doc.download') + '">' + galSm('download') + '</a>' + jumpBtn(it.i) + '</span></div>';
}

/* ---------- Events ---------- */
$('galChips').addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (c && c.dataset.cat !== Gallery.cat) Gallery.show(c.dataset.cat); });
$('galChips').addEventListener('keydown', e => { // arrow keys move between chips, like tabs
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const cs = [...$('galChips').children], i = cs.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  const n = cs[(i + ((e.key === 'ArrowRight') !== I18N.rtl() ? 1 : cs.length - 1)) % cs.length]; // reversed in right-to-left
  Gallery.show(n.dataset.cat); $('galChips').querySelector('.on').focus();
});
// A tile the browser can't decode turns into a download link (see the chat's own listener in viewer.js).
galBody.addEventListener('error', e => {
  const el = e.target, n = el.dataset && el.dataset.bad, tile = el.closest && el.closest('[data-gk]');
  if (!n || !tile || Media.cantShow(n)) return;
  const f = Media.get(n); if (!f || el.getAttribute('src') !== f.url) return; // a late error from a closed chat
  Media.bad.add(Media.key(n));
  const it = Gallery.list[+tile.dataset.gk];
  if (it) tile.outerHTML = tileHTML(it, +tile.dataset.gk);
}, true);
galBody.addEventListener('media-bad', e => {
  const tile = e.target.closest('[data-gk]'), it = tile && Gallery.list[+tile.dataset.gk];
  if (it) tile.outerHTML = tileHTML(it, +tile.dataset.gk);
});
galBody.addEventListener('click', e => {
  const tg = e.target;
  const j = tg.closest('[data-jump]'); if (j) { Gallery.jump(+j.dataset.jump); return; }
  const g = tg.closest('[data-gk]'); if (g) { Gallery.view(+g.dataset.gk); return; }
  const lc = tg.closest('.lcopy'); if (lc) { copyText(lc.dataset.url); return; }
  const ap = tg.closest('.aplay'); if (ap) { AudioCtl.toggle(ap.closest('.aplayer').dataset.audio); return; }
  if (tg.closest('.aspeed')) { AudioCtl.speed(); return; }
  const pd = tg.closest('[data-pdf]'); if (pd) { openPdf(pd.dataset.pdf, pd.dataset.title || ''); return; }
  const vc = tg.closest('[data-vcard]'); if (vc) openContact(vc.dataset.vcard);
});
galBody.addEventListener('input', e => { const sk = e.target.closest('.aseek'); if (sk) AudioCtl.toggle(sk.closest('.aplayer').dataset.audio, sk.value / 1000); });
galBody.addEventListener('pointerdown', e => { // tap or drag a waveform to seek
  const w = e.target.closest('.wave');
  if (!w) return;
  e.preventDefault();
  const name = w.closest('.aplayer').dataset.audio;
  const seek = ev => { const r = w.getBoundingClientRect(); AudioCtl.toggle(name, Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width))); };
  seek(e);
  const mv = ev => { if (ev.buttons) seek(ev); }, up = () => { w.removeEventListener('pointermove', mv); w.removeEventListener('pointerup', up); };
  try { w.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  w.addEventListener('pointermove', mv); w.addEventListener('pointerup', up);
});
// Video tiles: show the length once it is known. Recorder-made WebM files only report it after a seek to the end.
function galDur(v) {
  if (!isFinite(v.duration)) return;
  Gallery.durs.set(v.dataset.vid, v.duration);
  const d = v.parentNode.querySelector('.gdur span'); if (d) d.textContent = fmtDur(v.duration);
}
galBody.addEventListener('loadedmetadata', e => {
  const v = e.target;
  if (v.tagName !== 'VIDEO' || !v.dataset.vid) return;
  if (v.duration === Infinity) { v.addEventListener('durationchange', () => { galDur(v); v.currentTime = 0; }, { once: true }); v.currentTime = 1e101; }
  else galDur(v);
}, true);

$('galBtn').onclick = () => Gallery.open('all');
$('miGal').innerHTML = ICON.image;
ICON.sort = ic('<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/>');
$('galSort').innerHTML = ICON.sort;
$('galSort').onclick = () => {
  const links = Gallery.cat === 'links';
  pickSheet(t('gallery.sort_by'), GAL_SORTS.filter(([v]) => !(links && (v === 'big' || v === 'small'))).map(([v, k]) => [v, esc(t(k))]), Gallery.sort, v => { Gallery.sort = v; Gallery.show(Gallery.cat); });
};
$('mediaGrid').addEventListener('click', e => { const t = e.target.closest('[data-gcat]'); if (t) Gallery.open(t.dataset.gcat); });
$('mediaAll').onclick = () => Gallery.open('all');
