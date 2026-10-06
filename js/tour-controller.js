"use strict";
/* =====================================================================
   Welcome screen and guided tour. Written without a tour library so the
   app keeps zero dependencies and stays offline.

   - Every launch opens on the start screen (index.html #start, wired in
     app.js). Its "Try the sample chat" loads the demo and starts the guided tour
     every time (Skip ends it). Opening your own chat never starts it.
   - The only thing stored is the localStorage flag below, set when the
     tour is finished or skipped. It holds no chat data.
   - "Help and guided tour" in the header's ⋮ menu opens a small dialog to take the tour again
     or open your own chat. It closes on Esc, ✕ or a click outside.
   ===================================================================== */
const TOUR_KEY = 'has_completed_walkthrough';

const Tour = {
  i: -1, raf: 0, prevFocus: null, rows: [],
  /* Each step: sec (chapter) and key, which name its words in the dictionaries (tour_sec.<sec> and
     tour_steps.<key>.title / .text / .textNarrow for phones and tablets / .html), and target(), which
     returns the element(s) to spotlight, or nothing for a centred card. chatStep() scrolls the
     timeline to a message of the sample chat first; sideStep() highlights part of the sidebar,
     opening the drawer on narrow screens. */
  steps: [
    {
      sec: 'start', key: 'import_your_whatsapp',
      target: () => vis('sampleOpen') || vis('moreBtn')
    },
    chatStep({
      sec: 'start', key: 'timeline_and_date',
      rows: () => [0], sel: '.pill'
    }),
    {
      sec: 'finding', key: 'search',
      prep: () => closeDrawer(),
      target: () => vis('searchBtn')
    },
    sideStep({
      sec: 'finding', key: 'date_and_sender',
      id: 'filterSec'
    }),
    sideStep({
      sec: 'finding', key: 'jump_to_a',
      id: 'jumpDate', field: true
    }),
    sideStep({
      sec: 'finding', key: 'chat_statistics',
      id: 'cardStats'
    }),
    sideStep({
      sec: 'finding', key: 'media_links_and',
      id: 'mediaSec'
    }),
    {
      sec: 'finding', key: 'settings', settings: true,
      prep: () => { closeDrawer(); Settings.open(); },
      // Phones: only the "You are" card, so the tour card below doesn't cover the highlight.
      target: () => [visEl(document.querySelector('#setModal .set-prof')), innerWidth > 640 && visEl(document.querySelector('#setModal .set-grp'))]
    },
    chatStep({
      sec: 'messages', key: 'whatsapp_formatting',
      rows: () => [rowOf(m => m.message.startsWith('- Meet at'))]
    }),
    chatStep({
      sec: 'messages', key: 'read_more',
      rows: () => [rowOf(m => m.message.startsWith('Trip report'))]
    }),
    chatStep({
      sec: 'messages', key: 'edited_deleted_and',
      rows: () => [rowOf(m => m.edited)]
    }),
    chatStep({
      sec: 'messages', key: 'reactions',
      rows: () => [rowOf(m => m.reactions && m.reactions.length)]
    }),
    chatStep({
      sec: 'messages', key: 'system_notices',
      rows: () => [rowOf(m => m.kind === 'system' && /created group/.test(m.message))], sel: '.pill'
    }),
    chatStep({
      sec: 'messages', key: 'calls',
      rows: () => [rowOf(m => m.kind === 'call')]
    }),
    chatStep({
      sec: 'messages', key: 'polls',
      rows: () => [rowOf(m => m.kind === 'poll')]
    }),
    chatStep({
      sec: 'media', key: 'photos',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'image' && a.url))]
    }),
    chatStep({
      sec: 'media', key: 'videos_and_gifs',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'video' && a.url))]
    }),
    chatStep({
      sec: 'media', key: 'stickers',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'sticker' && a.url))], sel: '.sticker'
    }),
    chatStep({
      sec: 'media', key: 'voice_notes_and',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'audio' && isVoice(a.name))), rowOf(m => hasAtt(m, a => a.type === 'audio' && !isVoice(a.name)))]
    }),
    chatStep({
      sec: 'media', key: 'built_in_pdf',
      rows: () => [rowOf(m => hasAtt(m, a => /\.pdf$/i.test(a.name || '') && a.url))]
    }),
    chatStep({
      sec: 'media', key: 'contact_cards',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'contact' && a.url))]
    }),
    chatStep({
      sec: 'media', key: 'locations',
      rows: () => [rowOf(m => m.kind === 'location')]
    }),
    chatStep({
      sec: 'media', key: 'links',
      rows: () => [rowOf(m => /github\.com/.test(m.message))]
    }),
    {
      sec: 'start', key: 'menu',
      prep: () => closeDrawer(),
      target: () => vis('moreBtn')
    },
    {
      sec: 'abilities', key: 'all_set',
      html: true,
      prep: () => closeDrawer(),
      target: () => null
    }
  ],

  boot() { $('startDemoSub').textContent = t('welcome.demo_sub_new'); },
  async fromStart() {
    sampleReady = loadSample();
    const ok = await sampleReady;
    if (ok) this.start(); // the start screen's sample button always comes with the tour
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
    if (!st.settings) Settings.close(true); // only the Settings step shows the Settings screen
    if (st.prep) st.prep();
    const w = f => t('tour_steps.' + st.key + '.' + f), narrow = I18N.look('en-US', 'tour_steps.' + st.key + '.textNarrow');
    $('tourStep').textContent = t('tour.progress', { sec: t('tour_sec.' + st.sec), i: nf(this.i + 1), n: nf(n) });
    $('tourTitle').textContent = w('title');
    if (st.html) $('tourText').innerHTML = w('html'); // trusted text from the dictionaries, no chat content
    else $('tourText').textContent = isNarrow() && narrow ? w('textNarrow') : w('text');
    $('tourPop').classList.toggle('wide', !!st.html);
    $('tourBack').hidden = this.i === 0;
    $('tourNext').textContent = last ? t('tour.finish') : t('tour.next');
    $('tourDots').innerHTML = '<b style="width:' + Math.round((this.i + 1) / n * 100) + '%"></b>';
    // Let the virtual list render the scrolled-to row before measuring it.
    requestAnimationFrame(() => requestAnimationFrame(() => { this.place(); $('tourNext').focus({ preventScroll: true }); }));
  },
  next() { if (this.i === this.steps.length - 1) this.end(true); else this.go(this.i + 1); },
  back() { if (this.i > 0) this.go(this.i - 1); },
  end() {
    this.i = -1;
    $('tour').hidden = true;
    closeDrawer(); Settings.close(true);
    const sb = document.querySelector('#sidebar .sb-scroll'); if (sb) sb.scrollTop = 0; // undo the scrolling done for sidebar steps
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
    const pw = Math.min(pop.classList.contains('wide') ? 440 : 360, vw - 2 * m);
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
function vis(id) { return visEl($(id)); }
function visEl(el) {
  if (!el || el.hidden || !el.getClientRects().length) return null;
  const b = el.getBoundingClientRect();
  return b.width && b.height && b.right > 0 && b.left < innerWidth && b.bottom > 0 && b.top < innerHeight ? el : null;
}

$('twClose').innerHTML = ICON.close;
$('twDemoIc').innerHTML = ICON.chat; $('twOwnIc').innerHTML = ICON.open;
// Row of the first message matching pred in the current list, or -1 when it isn't shown.
function rowOf(pred) { const i = S.msgs.findIndex(pred); return i < 0 ? -1 : S.m2i[i]; }
const hasAtt = (m, test) => m.attachments.some(test);
// A step about a message in the sample chat: scroll the timeline to it, then spotlight its bubble.
function chatStep(o) {
  return Object.assign({
    prep() {
      closeDrawer();
      Tour.rows = o.rows().filter(k => k >= 0);
      if (Tour.rows.length) VL.scrollTo(Tour.rows[0], innerWidth <= 640 ? undefined : 'center'); // phones: near the top, clear of the card
    },
    target: () => Tour.rows.map(k => { const el = VL.nodes.get(k); return el && (el.querySelector(o.sel || '.bubble') || el); }).filter(Boolean)
  }, o);
}
// A step about part of the sidebar. On narrow screens the sidebar is a drawer, so it opens for the step.
function sideStep(o) {
  const el = () => { const e = $(o.id); return e && o.field ? e.closest('.field') : e; };
  return Object.assign({
    prep() { if (isNarrow()) openDrawer(); const e = el(); if (e) e.scrollIntoView({ block: 'nearest' }); },
    target: () => visEl(el())
  }, o);
}

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
$('sidebar').addEventListener('transitionend', () => Tour.schedule()); // the drawer finished sliding in or out
$('sidebar').addEventListener('scroll', () => Tour.schedule(), { capture: true, passive: true });

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
  else if (!welcome && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { // the forward arrow points left in right-to-left
    e.preventDefault(); if ((e.key === 'ArrowRight') !== I18N.rtl()) Tour.next(); else Tour.back();
  }
  else if (e.key !== 'Enter' && e.key !== ' ') e.preventDefault();
  e.stopImmediatePropagation();
}, true);

Tour.boot();
