"use strict";
/* =====================================================================
   Options for one item in Media, links and docs, like the message menu
   in the chat: long-press an item on a phone, right-click it on a
   computer, press its ⋮ button, or use Shift+F10 / the menu key on a
   focused item.

   The menu starts with who sent the item and when, and the file's name
   and size. Then, depending on the item: Go to message (closes the
   gallery and jumps to the message in the chat), View, Open, Play or
   Pause, View contact, Open link, Star or Unstar the message, Copy
   caption, Copy contact details, Copy link, Download and Share.
   Loaded after media-gallery.js and message-menu.js.
   ===================================================================== */
const GalMenu = {
  el: $('galMenu'), k: -1, ret: null, run: [],
  isOpen() { return !this.el.hidden; },
  // The actions for gallery item k: [icon, label, run]
  actions(k) {
    const it = Gallery.list[k], m = S.msgs[it.i], e = it.e, out = [];
    out.push(['chat', t('media_gallery.go_to_message'), () => Gallery.jump(it.i)]);
    if (it.cat === 'links') {
      out.push(['next', t('media_gallery.open_link'), () => window.open(it.x.href, '_blank', 'noopener,noreferrer')]);
    } else if (GAL_GRID.has(it.cat)) {
      if (!Media.cantShow(e.name)) out.push([it.cat === 'videos' ? 'video' : it.cat === 'stickers' ? 'sticker' : 'image', t('media_gallery.view'), () => Gallery.view(k)]);
    } else if (it.cat === 'docs') {
      if (extOf(e.name) === 'pdf') out.push(['document', t('mm.open_document'), () => openPdf(e.name, it.a.title || '')]);
      else out.push(['document', t('media_gallery.open'), () => openBlank(e.url)]);
    } else if (it.cat === 'audio') {
      const playing = AudioCtl.name === e.name && AudioCtl.el && !AudioCtl.el.paused;
      out.push([playing ? 'pause' : 'play', t(playing ? 'media_gallery.pause' : 'media_gallery.play'), () => AudioCtl.toggle(e.name)]);
    } else if (it.cat === 'contacts') out.push(['contact', t('vc.view_contact'), () => openContact(e.name)]);
    const starred = galStarred(it);
    out.push([starred ? 'unstar' : 'star', t(starred ? 'msg.unstar_short' : 'msg.star_short'), () => { toggleStar(it.i); Gallery.markStar(it.i); }]);
    const caption = it.cat !== 'links' && m.message;
    if (caption) out.push(['copy', t('media_gallery.copy_caption'), () => copyText(m.message, t('media_gallery.caption'))]);
    if (it.cat === 'contacts') {
      const cs = Media.cards.get(e.name);
      if (cs && cs.length) out.push(['copy', t('mm.copy_contact'), () => copyText(cs.map(contactText).join('\n\n'), t('mm.contact'))]);
    }
    if (it.cat === 'links') out.push(['link', t('link.copy'), () => copyText(it.x.href)]);
    else out.push(['download', t('doc.download'), () => saveFile(e)]);
    if (canShare()) out.push(['share', t('mm.share'), () => galShare(it)]);
    return out;
  },
  // Who sent it, when and the file's size, then the file's name (or the link).
  info(it) {
    const m = S.msgs[it.i], what = it.cat === 'links' ? it.x.href : it.a.title || it.e.name;
    // Each part is isolated so the date, time and size keep their order in Urdu and Arabic.
    return '<div class="gm-info" role="presentation"><b><bdi>' + esc(m.isOutgoing ? t('common.you') : m.sender) + '</bdi></b>' +
      '<small><bdi>' + esc(dateLabel(m.dateKey)) + '</bdi>' + t('common.list_sep') + '<bdi dir="ltr">' + esc(m.formattedTime) + '</bdi>' +
      (it.e ? ' · <bdi dir="ltr">' + esc(fmtSize(it.e.size)) + '</bdi>' : '') + '</small>' +
      '<small class="gm-file" title="' + esc(what) + '"><bdi>' + esc(what) + '</bdi></small></div>';
  },
  open(k, x, y, anchor) {
    const it = Gallery.list[k];
    if (!it) return;
    this.close(false);
    this.k = k; this.ret = document.activeElement;
    const acts = this.actions(k);
    this.run = acts.map(a => a[2]);
    this.el.innerHTML = this.info(it) + acts.map(([icon, label], j) => '<button role="menuitem" data-gm="' + j + '"><span class="mi">' + (ICON[icon] || '') + '</span><span class="ml">' + esc(label) + '</span></button>').join('');
    this.el.hidden = false;
    const item = galBody.querySelector('[data-gi="' + k + '"]');
    if (item) item.classList.add('gm-on');
    this.place(anchor || item, x, y);
    const f = this.el.querySelector('[role="menuitem"]'); if (f) f.focus({ preventScroll: true });
  },
  toggle(k, anchor) { if (this.isOpen() && this.k === k) this.close(true); else this.open(k, 0, 0, anchor); },
  // Under the ⋮ button or the item; at the pointer for a right-click or long-press. Always inside the window.
  place(anchor, x, y) {
    const el = this.el, w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
    if (anchor && !x && !y) {
      const r = anchor.getBoundingClientRect();
      x = I18N.rtl() ? r.left : r.right - w;
      y = r.bottom + 4 + h > vh - 8 ? r.top - h - 4 : r.bottom + 4;
    }
    el.style.left = Math.max(8, Math.min(x, vw - w - 8)) + 'px';
    el.style.top = Math.max(8, Math.min(y, vh - h - 8)) + 'px';
  },
  close(focusBack) {
    if (this.el.hidden) return;
    this.el.hidden = true; this.el.innerHTML = '';
    galBody.querySelectorAll('.gm-on').forEach(n => n.classList.remove('gm-on'));
    if (focusBack && this.ret && document.contains(this.ret)) this.ret.focus({ preventScroll: true });
  }
};
function openBlank(url) {
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
}
// Shares the one file (with its caption) or the link. If the device refuses, the link or caption is copied instead.
async function galShare(it) {
  const m = S.msgs[it.i];
  let data;
  if (it.cat === 'links') data = { url: it.x.href };
  else {
    const f = new File([it.e.blob], it.e.name, { type: it.e.mime });
    data = navigator.canShare && navigator.canShare({ files: [f] }) ? { files: [f], text: m.message || undefined } : { text: m.message || it.e.name };
  }
  try { await navigator.share(data); }
  catch (err) {
    if (err && err.name === 'AbortError') return;
    if (it.cat === 'links') copyText(it.x.href); else toast.error(t('mm.share_failed'));
  }
}
const galItem = el => { const n = el && el.closest && el.closest('[data-gi]'); return n ? +n.dataset.gi : -1; };

GalMenu.el.addEventListener('click', e => {
  const b = e.target.closest('[data-gm]'); if (!b) return;
  const run = GalMenu.run[+b.dataset.gm];
  GalMenu.close(true); if (run) run();
});
GalMenu.el.addEventListener('keydown', e => {
  const items = [...GalMenu.el.querySelectorAll('[role="menuitem"]')], k = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(k + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
  else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1].focus(); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); GalMenu.close(true); }
  else if (e.key === 'Tab') GalMenu.close(false);
});
// Anything else closes it: a press outside, scrolling the gallery, resizing, a new filter or sort.
document.addEventListener('pointerdown', e => { if (GalMenu.isOpen() && !GalMenu.el.contains(e.target) && !e.target.closest('[data-gmenu]')) GalMenu.close(false); }, true);
galBody.addEventListener('scroll', () => GalMenu.close(false), { passive: true });
window.addEventListener('resize', () => GalMenu.close(false));
document.addEventListener('langchange', () => GalMenu.close(false));

// Right-click. A text selection keeps the browser's own menu.
galBody.addEventListener('contextmenu', e => {
  const k = galItem(e.target); if (k < 0) return;
  if (String(window.getSelection && window.getSelection() || '')) return;
  e.preventDefault(); gPress.done = true;
  GalMenu.open(k, e.clientX, e.clientY);
});
// Long-press on touch screens. The click that ends it is swallowed, so the item doesn't also open.
const gPress = { timer: 0, x: 0, y: 0, done: false };
galBody.addEventListener('pointerdown', e => {
  gPress.done = false;
  if (e.pointerType !== 'touch' || galItem(e.target) < 0 || e.target.closest('.wave, .aseek, [data-gmenu]')) return;
  gPress.x = e.clientX; gPress.y = e.clientY;
  clearTimeout(gPress.timer);
  gPress.timer = setTimeout(() => {
    const k = galItem(e.target); if (k < 0) return;
    gPress.done = true;
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (err) { /* ignore */ }
    GalMenu.open(k, gPress.x, gPress.y + 12);
  }, 480);
});
const gCancel = () => clearTimeout(gPress.timer);
galBody.addEventListener('pointermove', e => { if (Math.abs(e.clientX - gPress.x) > 10 || Math.abs(e.clientY - gPress.y) > 10) gCancel(); });
galBody.addEventListener('pointerup', gCancel);
galBody.addEventListener('pointercancel', gCancel);
galBody.addEventListener('click', e => { if (gPress.done) { gPress.done = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
galBody.addEventListener('keydown', e => {
  if (!(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return;
  const k = galItem(document.activeElement); if (k < 0) return;
  e.preventDefault();
  GalMenu.open(k, 0, 0, document.activeElement);
});

/* ---------- Go to message from the photo viewer ---------- */
$('lbGo').innerHTML = ICON.chat;
$('lbGo').onclick = () => {
  const x = LB.list[LB.k]; if (!x) return;
  closeLightbox(true);
  Gallery.jump(x.i);
};
