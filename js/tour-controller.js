"use strict";
/* =====================================================================
   Welcome screen and guided tour. Written without a tour library so the
   app keeps zero dependencies and stays offline.

   - Every launch opens on the start screen (index.html #start, wired in
     app.js). Its "Try the sample chat" loads the demo, and on the first
     visit starts the five-step tour.
   - The only thing stored is the localStorage flag below, set when the
     tour is finished or skipped. It holds no chat data.
   - "Help and guided tour" in the header's ⋮ menu opens a small dialog to take the tour again
     or open your own chat. It closes on Esc, ✕ or a click outside.
   ===================================================================== */
const TOUR_KEY = 'has_completed_walkthrough';

const Tour = {
  i: -1, raf: 0, prevFocus: null,
  steps: [
    {
      title: 'Import your WhatsApp chat',
      text: 'Drag and drop an exported .zip or .txt file anywhere on this page, or use this link. Later, "Open another chat" in the ⋮ menu does the same. All parsing happens locally in your browser, and nothing is ever sent to a server.',
      target: () => vis('sampleOpen') || vis('moreBtn')
    },
    {
      title: 'High-performance timeline',
      text: 'Scroll through tens of thousands of messages. Only the messages on screen are drawn, so even very long chats stay smooth.',
      target: () => vis('scroller')
    },
    {
      title: 'Search and filter',
      text: 'Search for any word, or narrow the chat to a date range or a single person. Press / to jump to search from anywhere.',
      textNarrow: 'Tap here to search for any word. The date and sender filters are in the side panel, behind the menu button. Search highlights every match in the chat.',
      target: () => isNarrow() ? vis('searchBtn') : [vis('searchSec'), vis('filterSec')].filter(Boolean)
    },
    {
      title: 'Built-in media viewer',
      text: 'Click a photo, document or voice note to open it right here: zoom and rotate photos, page through PDFs, and play voice notes at 1×, 1.5× or 2×.',
      prep: () => {
        const i = S.msgs.findIndex(m => m.attachments.some(a => a.type === 'image' && a.url));
        if (i < 0 || S.m2i[i] < 0) return;
        Tour.mediaRow = S.m2i[i];
        VL.scrollTo(Tour.mediaRow, innerWidth <= 640 ? undefined : 'center'); // phones: near the top, clear of the card
      },
      target: () => { const el = VL.nodes.get(Tour.mediaRow); return el ? el.querySelector('.bubble') : null; }
    },
    {
      title: 'Everything else is in the menu',
      text: 'The ⋮ menu has your starred messages, chat statistics, light and dark themes, and this tour if you want it again. You\'re ready to open your own chats!',
      target: () => vis('moreBtn')
    }
  ],

  boot() {
    $('startDemoSub').textContent = store(TOUR_KEY) === 'true' ? 'A made-up group chat to look around in' : 'A made-up group chat with a short guided tour';
  },
  async fromStart() {
    sampleReady = loadSample();
    const ok = await sampleReady;
    if (ok && store(TOUR_KEY) !== 'true') this.start();
  },
  complete() { store(TOUR_KEY, 'true'); },

  /* ---------- Welcome dialog ---------- */
  welcome() {
    if (!this.active() && $('tourWelcome').hidden) this.prevFocus = document.activeElement;
    $('twNote').hidden = !(S.source && !S.source.sample);
    $('tourWelcome').hidden = false;
    $('twDemo').focus({ preventScroll: true });
  },
  closeWelcome(restore) {
    if ($('tourWelcome').hidden) return;
    $('tourWelcome').hidden = true;
    this.complete();
    if (restore && this.prevFocus && this.prevFocus.focus) this.prevFocus.focus();
  },
  async demo() {
    this.closeWelcome(false);
    if (!S.source || !S.source.sample || !sampleReady) sampleReady = loadSample();
    if (await sampleReady) this.start();
  },
  own() { this.closeWelcome(false); pick(); },
  // A file was opened: the welcome dialog and the tour step aside.
  dismiss() { this.closeWelcome(false); if (this.active()) this.end(); },

  /* ---------- Tour ---------- */
  active() { return this.i >= 0; },
  start() {
    if (!S.msgs.length) return;
    closeDrawer(); closeStars(); closeSearch();
    if (!this.prevFocus) this.prevFocus = document.activeElement;
    $('tour').hidden = false;
    document.body.classList.add('touring');
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    this.go(0);
  },
  go(i) {
    this.i = Math.max(0, Math.min(this.steps.length - 1, i));
    const st = this.steps[this.i], last = this.i === this.steps.length - 1, n = this.steps.length;
    if (st.prep) st.prep();
    $('tourStep').textContent = 'Step ' + (this.i + 1) + ' of ' + n;
    $('tourTitle').textContent = st.title;
    $('tourText').textContent = isNarrow() && st.textNarrow ? st.textNarrow : st.text;
    $('tourBack').hidden = this.i === 0;
    $('tourNext').textContent = last ? 'Finish' : 'Next';
    $('tourDots').innerHTML = this.steps.map((_, k) => '<i' + (k === this.i ? ' class="on"' : '') + '></i>').join('');
    // Let the virtual list render the scrolled-to row before measuring it.
    requestAnimationFrame(() => requestAnimationFrame(() => { this.place(); $('tourNext').focus({ preventScroll: true }); }));
  },
  next() { if (this.i === this.steps.length - 1) this.end(true); else this.go(this.i + 1); },
  back() { if (this.i > 0) this.go(this.i - 1); },
  end() {
    this.i = -1;
    $('tour').hidden = true;
    document.body.classList.remove('touring');
    this.complete();
    const f = this.prevFocus; this.prevFocus = null;
    if (f && f.focus && document.contains(f) && f.offsetParent !== null) f.focus(); else $('moreBtn').focus();
  },

  /* ---------- Spotlight and popover placement ---------- */
  schedule() { if (this.active() && !this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.place(); }); },
  place() {
    if (!this.active()) return;
    const st = this.steps[this.i];
    let t = st.target();
    t = (Array.isArray(t) ? t : [t]).filter(Boolean);
    // The visual viewport is what the reader actually sees (it excludes on-screen keyboards and app bars on phones).
    const vv = window.visualViewport, vw = vv ? vv.width : innerWidth, vh = vv ? vv.height : innerHeight, vt = vv ? vv.offsetTop : 0;
    const spot = $('tourSpot'), pop = $('tourPop'), pad = 6, gap = 12, m = 12;
    let r = null;
    for (const el of t) {
      const b = el.getBoundingClientRect();
      r = r ? { l: Math.min(r.l, b.left), t: Math.min(r.t, b.top), r: Math.max(r.r, b.right), b: Math.max(r.b, b.bottom) } : { l: b.left, t: b.top, r: b.right, b: b.bottom };
    }
    if (r) { r = { l: Math.max(2, r.l - pad), t: Math.max(2, r.t - pad), r: Math.min(innerWidth - 2, r.r + pad), b: Math.min(innerHeight - 2, r.b + pad) }; }
    $('tour').classList.toggle('nospot', !r);
    if (r) Object.assign(spot.style, { left: r.l + 'px', top: r.t + 'px', width: (r.r - r.l) + 'px', height: (r.b - r.t) + 'px' });
    // Dim everything except a rounded hole over the target (even-odd fill).
    const k = 10, hole = r ? 'M' + (r.l + k) + ' ' + r.t + 'H' + (r.r - k) + 'Q' + r.r + ' ' + r.t + ' ' + r.r + ' ' + (r.t + k) + 'V' + (r.b - k) + 'Q' + r.r + ' ' + r.b + ' ' + (r.r - k) + ' ' + r.b +
      'H' + (r.l + k) + 'Q' + r.l + ' ' + r.b + ' ' + r.l + ' ' + (r.b - k) + 'V' + (r.t + k) + 'Q' + r.l + ' ' + r.t + ' ' + (r.l + k) + ' ' + r.t + 'Z' : '';
    $('tourDimPath').setAttribute('d', 'M0 0H' + innerWidth + 'V' + innerHeight + 'H0Z' + hole);
    // Popover: phones get a full-width card at the top or bottom, away from the spotlight.
    const pw = Math.min(360, vw - 2 * m);
    pop.style.width = pw + 'px';
    const ph = pop.offsetHeight;
    let x, y;
    if (!r) { x = (vw - pw) / 2; y = (vh - ph) / 2; }
    else if (vw <= 640) {
      // Phones: the card sits at the bottom of the screen, where it is easiest to reach and never
      // under a browser or app bar at the top. It only moves up when the highlight is in the lower half.
      x = (vw - pw) / 2;
      const low = (r.t + r.b) / 2 > vt + vh * 0.55 && r.b - r.t < vh * 0.5;
      y = !low ? vt + vh - ph - m : Math.max(vt + 70, r.t - gap - ph);
    } else {
      const cx = (r.l + r.r) / 2;
      if (vh - r.b >= ph + gap + m) { y = r.b + gap; x = cx - pw / 2; }
      else if (r.t >= ph + gap + m) { y = r.t - gap - ph; x = cx - pw / 2; }
      else if (vw - r.r >= pw + gap + m) { x = r.r + gap; y = (r.t + r.b - ph) / 2; }
      else if (r.l >= pw + gap + m) { x = r.l - gap - pw; y = (r.t + r.b - ph) / 2; }
      else { x = cx - pw / 2; y = r.b - ph - 24; } // a big target (the timeline): sit inside it, near the bottom
    }
    x = Math.max(m, Math.min(vw - pw - m, x)); y = Math.max(vt + m, Math.min(vt + vh - ph - m, y));
    pop.style.left = Math.round(x) + 'px'; pop.style.top = Math.round(y) + 'px';
  }
};
function vis(id) {
  const el = $(id);
  if (!el || el.hidden || !el.getClientRects().length) return null;
  const b = el.getBoundingClientRect();
  return b.width && b.height && b.right > 0 && b.left < innerWidth && b.bottom > 0 && b.top < innerHeight ? el : null;
}

$('twClose').innerHTML = ICON.close;
$('twDemoIc').innerHTML = ICON.chat; $('twOwnIc').innerHTML = ICON.open;
$('tourBtn').onclick = () => Tour.welcome();
$('twDemo').onclick = () => Tour.demo();
$('twOwn').onclick = () => Tour.own();
$('twClose').onclick = () => Tour.closeWelcome(true);
$('tourWelcome').addEventListener('click', e => { if (e.target === e.currentTarget) Tour.closeWelcome(true); });
$('tourNext').onclick = () => Tour.next();
$('tourBack').onclick = () => Tour.back();
$('tourSkip').onclick = () => Tour.end();
window.addEventListener('resize', () => Tour.schedule());
if (window.visualViewport) { visualViewport.addEventListener('resize', () => Tour.schedule()); visualViewport.addEventListener('scroll', () => Tour.schedule()); }
$('startDemo').onclick = () => Tour.fromStart();
$('scroller').addEventListener('scroll', () => Tour.schedule(), { passive: true });

// Captured first, so the app's own shortcuts (/, Ctrl+F, Esc) stay quiet while the tour or welcome is up.
document.addEventListener('keydown', e => {
  const welcome = !$('tourWelcome').hidden;
  if (!welcome && !Tour.active()) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
  const box = welcome ? $('tourWelcome') : $('tourPop');
  if (e.key === 'Tab') { // keep focus inside the dialog
    const f = [...box.querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null);
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    else if (i < 0) { e.preventDefault(); f[0].focus(); }
  } else if (e.key === 'Escape') { e.preventDefault(); if (welcome) Tour.closeWelcome(true); else Tour.end(); }
  else if (!welcome && e.key === 'ArrowRight') { e.preventDefault(); Tour.next(); }
  else if (!welcome && e.key === 'ArrowLeft') { e.preventDefault(); Tour.back(); }
  else if (e.key !== 'Enter' && e.key !== ' ') e.preventDefault();
  e.stopImmediatePropagation();
}, true);

Tour.boot();
