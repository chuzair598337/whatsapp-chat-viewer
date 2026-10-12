"use strict";
/* =====================================================================
   Phone header of the photo viewer (#lb) and the PDF viewer (#pdfv).
   On screens 640 px and narrower the header shows only Back (it does
   what ✕ does), the title and a ⋮ button; ⋮ opens a sheet from the
   bottom with no title that lists the viewer's other actions. Larger
   screens keep the full header with ✕ and never show this menu.

   The sheet is the same menu as the message and gallery menus (role
   menu, .menu.ctxmenu rows, arrow keys, Esc, a press outside closes it)
   and each row runs the same code as the header button or the gallery
   item's option it stands for, so shortcuts and behaviour don't change.
   Loaded after gallery-menu.js (galShare) and message-menu.js.
   ===================================================================== */
ICON.arrowBack = ic('<path d="M19.5 12h-15M11 5.5L4.5 12l6.5 6.5"/>');

const VMenu = {
  el: null, btn: null, run: [],
  isOpen() { return !!this.el && !this.el.hidden; },
  // Photo viewer: [icon, label, run, shortcut id]. Rotate and Fit only for a photo, Fit only while zoomed in, as in the header.
  lbActions() {
    const x = LB.list[LB.k]; if (!x) return [];
    const m = S.msgs[x.i], e = Media.get(x.name), vid = $('lb').classList.contains('isvid'), out = [];
    out.push(['chat', t('media_gallery.go_to_message'), () => $('lbGo').click(), 'lbGo']);
    if (!vid) {
      out.push(['rotate', t('viewer.rotate_photo'), zRotate, 'rotate']);
      if (!$('lbFit').disabled) out.push(['fit', t('viewer.fit_to_screen'), () => $('lbFit').click(), 'fit']);
    }
    const starred = !!(S.starred && S.starred.has(x.i));
    out.push([starred ? 'unstar' : 'star', t(starred ? 'msg.unstar_short' : 'msg.star_short'), () => { toggleStar(x.i); Gallery.markStar(x.i); }]);
    if (m.message) out.push(['copy', t('media_gallery.copy_caption'), () => copyText(m.message, t('media_gallery.caption'))]);
    out.push(['download', t('doc.download'), () => $('lbDl').click(), 'viewerDownload']);
    if (e && canShare()) out.push(['share', t('mm.share'), () => galShare({ cat: vid ? 'videos' : 'photos', e, i: x.i })]);
    return out;
  },
  // PDF viewer: the zoom buttons, Fit (named for what it will do next) and Download.
  pdfActions() {
    return [
      ['minus', t('common.zoom_out'), () => pdfZoom(-1), 'zoomOut'],
      ['plus', t('common.zoom_in'), () => pdfZoom(1), 'zoomIn'],
      ['fit', $('pdfFit').getAttribute('aria-label'), pdfFit, 'fit'],
      ['download', t('doc.download'), () => $('pdfDl').click(), 'viewerDownload']
    ];
  },
  open(which) {
    this.close(false);
    const pdf = which === 'pdf';
    this.el = $(pdf ? 'pdfMenu' : 'lbMenu'); this.btn = $(pdf ? 'pdfMore' : 'lbMore');
    const acts = pdf ? this.pdfActions() : this.lbActions();
    this.run = acts.map(a => a[2]);
    this.el.innerHTML = acts.map(([icon, label, , key], k) => '<button role="menuitem" data-vm="' + k + '"><span class="mi">' + (ICON[icon] || '') + '</span><span class="ml">' + esc(label) + '</span>' + (key ? '<span class="mk" data-key="' + key + '" aria-hidden="true"></span>' : '') + '</button>').join('');
    Keys.decorate(this.el);
    this.el.hidden = false; this.btn.setAttribute('aria-expanded', 'true');
    const f = this.el.querySelector('[role="menuitem"]'); if (f) f.focus({ preventScroll: true });
  },
  close(focusBack) {
    if (!this.isOpen()) return;
    this.el.hidden = true; this.el.innerHTML = ''; this.btn.setAttribute('aria-expanded', 'false');
    if (focusBack && document.contains(this.btn) && this.btn.offsetParent) this.btn.focus({ preventScroll: true });
  }
};

$('lbBack').innerHTML = $('pdfBack').innerHTML = ICON.arrowBack;
$('lbMore').innerHTML = $('pdfMore').innerHTML = ICON.more;
$('lbBack').onclick = () => closeLightbox();
$('pdfBack').onclick = () => closePdf();
$('lbMore').onclick = () => { if (VMenu.isOpen() && VMenu.btn === $('lbMore')) VMenu.close(true); else VMenu.open('lb'); };
$('pdfMore').onclick = () => { if (VMenu.isOpen() && VMenu.btn === $('pdfMore')) VMenu.close(true); else VMenu.open('pdf'); };
for (const id of ['lbMenu', 'pdfMenu']) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('[data-vm]'); if (!b) return;
    const run = VMenu.run[+b.dataset.vm];
    VMenu.close(true); if (run) run();
  });
  $(id).addEventListener('keydown', e => {
    const items = [...VMenu.el.querySelectorAll('[role="menuitem"]')], k = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(k + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); VMenu.close(true); }
    else if (e.key === 'Tab') VMenu.close(false);
  });
}
// A press outside (on the dimmed viewer), resizing (the header may switch back to its full form) or a new language closes it.
// That press only closes the sheet: its click is swallowed, so a tap on the photo's background doesn't also close the viewer.
let vSwallow = false;
document.addEventListener('pointerdown', e => {
  vSwallow = false;
  if (VMenu.isOpen() && !VMenu.el.contains(e.target) && !VMenu.btn.contains(e.target)) { VMenu.close(false); vSwallow = true; }
}, true);
document.addEventListener('click', e => { if (vSwallow) { vSwallow = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
window.addEventListener('resize', () => VMenu.close(false));
document.addEventListener('langchange', () => VMenu.close(false));
