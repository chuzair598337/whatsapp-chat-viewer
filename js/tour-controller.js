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
      // The "You are" card, plus the first group when the tour card fits beside the sheet; otherwise
      // the tour card sits below "You are" and would cover the group.
      beside: () => document.querySelector('#setModal .sheet'),
      target: () => { const sh = document.querySelector('#setModal .sheet'); return [visEl(document.querySelector('#setModal .set-prof')), roomBeside(sh) && visEl(document.querySelector('#setModal .set-grp'))]; }
    },
    {
      sec: 'finding', key: 'keys', settings: true,
      hide: touchOnly, // Settings hides these rows on touch-only devices (css/settings.css), so the step goes too
      // Settings › Help › Keyboard shortcuts and the Single-key shortcuts switch under it (js/components/shortcuts.js).
      prep: () => { closeDrawer(); Settings.open(); const r = keysRows()[1]; if (r) r.scrollIntoView({ block: innerHeight <= 520 ? 'end' : 'center' }); }, // short screens: room above for the card
      beside: () => document.querySelector('#setModal .sheet'),
      target: () => keysRows().map(visEl)
    },
    chatStep({
      sec: 'messages', key: 'whatsapp_formatting',
      rows: () => [rowOf(m => m.message.startsWith('- Meet at'))]
    }),
    chatStep({
      sec: 'messages', key: 'read_more',
      rows: () => [rowOf(m => m.message.startsWith('Trip report'))],
      sel: () => innerHeight <= 520 ? '.rm-tail' : '.bubble' // short screens: just the Read more link, so the card fits beside it
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
      rows: () => voiceAndMusicRows()
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
    this.list = this.steps.filter(st => !st.hide || !st.hide());
    this.go(0);
  },
  go(i) {
    this.i = Math.max(0, Math.min(this.list.length - 1, i));
    const st = this.list[this.i], last = this.i === this.list.length - 1, n = this.list.length;
    if (!st.settings) Settings.close(true); // only the Settings step shows the Settings screen
    if (st.prep) st.prep();
    const w = f => t('tour_steps.' + st.key + '.' + f), narrow = I18N.look('en-US', 'tour_steps.' + st.key + '.textNarrow');
    $('tourStep').textContent = t('tour.progress', { sec: t('tour_sec.' + st.sec), i: nf(this.i + 1), n: nf(n) });
    $('tourTitle').textContent = w('title');
    // Trusted text from the dictionaries, no chat content; ltrKeys keeps keys like ⌘F the right way round.
    $('tourText').innerHTML = ltrKeys(st.html ? w('html') : esc(isNarrow() && narrow ? w('textNarrow') : w('text')));
    $('tourPop').classList.toggle('wide', !!st.html);
    $('tourBack').hidden = this.i === 0;
    $('tourNext').textContent = last ? t('tour.finish') : t('tour.next');
    $('tourDots').innerHTML = '<b style="width:' + Math.round((this.i + 1) / n * 100) + '%"></b>';
    $('tourText').scrollTop = 0;
    resetPageScroll(); // a step's scrollIntoView must never leave the page itself scrolled
    // Let the virtual list render the scrolled-to row before measuring it.
    requestAnimationFrame(() => requestAnimationFrame(() => { this.place(); $('tourNext').focus({ preventScroll: true }); }));
  },
  next() { if (this.i === this.list.length - 1) this.end(true); else this.go(this.i + 1); },
  back() { if (this.i > 0) this.go(this.i - 1); },
  end() {
    this.i = -1;
    $('tour').hidden = true;
    closeDrawer(); Settings.close(true);
    const sb = document.querySelector('#sidebar .sb-scroll'); if (sb) sb.scrollTop = 0; // undo the scrolling done for sidebar steps
    document.body.classList.remove('touring');
    resetPageScroll();
    this.complete();
    const f = this.prevFocus; this.prevFocus = null;
    if (f && f.focus && document.contains(f) && f.offsetParent !== null) f.focus(); else $('moreBtn').focus();
  },

  /* ---------- Spotlight and popover placement ---------- */
  schedule() { if (this.active() && !this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.place(); }); },
  place() {
    if (!this.active()) return;
    const st = this.list[this.i];
    let t = st.target();
    t = (Array.isArray(t) ? t : [t]).filter(Boolean);
    // The visual viewport is what the reader actually sees (it excludes on-screen keyboards and app bars on phones).
    const vv = window.visualViewport, vw = vv ? vv.width : innerWidth, vh = vv ? vv.height : innerHeight, vt = vv ? vv.offsetTop : 0;
    const spot = $('tourSpot'), pop = $('tourPop'), pad = 6, gap = 12, m = 12;
    let r = null;
    for (const el of t) {
      const b = clipBox(el); // only the part its scrolling box shows (a Settings card cut off at the bottom of the sheet)
      if (b) r = r ? { l: Math.min(r.l, b.l), t: Math.min(r.t, b.t), r: Math.max(r.r, b.r), b: Math.max(r.b, b.b) } : b;
    }
    if (r) { r = { l: Math.max(2, r.l - pad), t: Math.max(2, r.t - pad), r: Math.min(innerWidth - 2, r.r + pad), b: Math.min(innerHeight - 2, r.b + pad) }; }
    $('tour').classList.toggle('nospot', !r);
    if (r) Object.assign(spot.style, { left: r.l + 'px', top: r.t + 'px', width: (r.r - r.l) + 'px', height: (r.b - r.t) + 'px' });
    // Dim everything except a rounded hole over the target (even-odd fill).
    const k = 10, hole = r ? 'M' + (r.l + k) + ' ' + r.t + 'H' + (r.r - k) + 'Q' + r.r + ' ' + r.t + ' ' + r.r + ' ' + (r.t + k) + 'V' + (r.b - k) + 'Q' + r.r + ' ' + r.b + ' ' + (r.r - k) + ' ' + r.b +
      'H' + (r.l + k) + 'Q' + r.l + ' ' + r.b + ' ' + r.l + ' ' + (r.b - k) + 'V' + (r.t + k) + 'Q' + r.l + ' ' + r.t + ' ' + (r.l + k) + ' ' + r.t + 'Z' : '';
    $('tourDimPath').setAttribute('d', 'M0 0H' + innerWidth + 'V' + innerHeight + 'H0Z' + hole);
    /* Popover. The card is never taller than the screen: its text scrolls and the buttons stay put (css: .tour-pop).
       size(w) gives the card's full height at width w. */
    const full = Math.min(pop.classList.contains('wide') ? 440 : 360, vw - 2 * m), maxH = vh - 2 * m, minW = Math.min(260, full), minH = vh <= 520 ? 120 : 170;
    const size = w => { pop.style.maxHeight = 'none'; pop.style.width = w + 'px'; pop.classList.toggle('narrow', w < 320); return pop.offsetHeight; };
    let pw = full, ph = size(full), x, y, capH = maxH;
    const at = (w, h, px, py) => { pw = w; ph = Math.min(h, maxH); x = px; y = py; return true; };
    if (!r) { x = (vw - pw) / 2; y = vt + (vh - Math.min(ph, maxH)) / 2; } // no highlight: centred in what is visible
    else if (vw <= 640 && vh > 520) {
      // Phones: the card sits at the bottom of the screen, where it is easiest to reach and never
      // under a browser or app bar at the top. It only moves up when the highlight is in the lower half.
      x = (vw - pw) / 2;
      const low = (r.t + r.b) / 2 > vt + vh * 0.55 && r.b - r.t < vh * 0.5;
      y = !low ? vt + vh - ph - m : Math.max(vt + 70, r.t - gap - ph);
      // A short phone screen (Safari's bars take a lot of it): shorten the card, text scrolling, rather than cover the highlight.
      const fit = !low ? vt + vh - m - r.b - gap : r.t - gap - vt - 70, need = Math.max(minH, ph - $('tourText').offsetHeight + 44);
      if (ph > fit && fit >= need) { capH = fit; y = !low ? vt + vh - m - fit : r.t - gap - fit; }
    } else {
      /* Wider or short screens (a phone on its side): beside the open drawer or the Settings sheet when there is
         room; else below, above, right or left of the highlight; else narrower (down to 260 px) at its side;
         else at the top or bottom edge with the text scrolling. Only when nothing fits does it cover the target. */
      const cx = (r.l + r.r) / 2, cy = (r.t + r.b) / 2, rtl = I18N.rtl();
      const room = { below: vt + vh - r.b - gap - m, above: r.t - vt - gap - m, right: vw - r.r - gap - m, left: r.l - gap - m };
      const side = (w, s, edge) => { const h = size(w); return h <= maxH && at(w, h, s === 'right' ? edge + gap : edge - gap - w, cy - h / 2); };
      const ob = st.beside && st.beside(), o = ob && ob.getBoundingClientRect();
      const order = rtl ? ['left', 'right'] : ['right', 'left'];
      let done = false;
      if (o && o.width) {
        const orm = { right: vw - o.right - gap - m, left: o.left - gap - m };
        const s = Math.abs(orm.right - orm.left) < 2 ? order[0] : orm.right > orm.left ? 'right' : 'left'; // a centred sheet: the reading side
        if (orm[s] >= minW) done = side(Math.min(full, orm[s]), s, s === 'right' ? o.right : o.left);
      }
      if (!done && room.below >= ph) done = at(full, ph, cx - full / 2, r.b + gap);
      if (!done && room.above >= ph) done = at(full, ph, cx - full / 2, r.t - gap - ph);
      for (const s of order) if (!done && room[s] >= full && ph <= maxH) done = side(full, s, s === 'right' ? r.r : r.l);
      for (const s of order) if (!done && room[s] >= minW) done = side(Math.min(full, room[s]), s, s === 'right' ? r.r : r.l);
      if (!done) {
        // At the top or bottom edge, as tall as the room there, with the text scrolling. It needs space for its
        // title, its buttons and two lines of text; a short screen accepts a little overlap to get that.
        ph = size(full);
        const s = room.below >= room.above ? 'below' : 'above', need = Math.max(minH, ph - $('tourText').offsetHeight + 44);
        const h = Math.min(ph, room[s] >= need ? room[s] : vh <= 520 ? need : 0);
        if (h) { capH = h; done = at(full, h, cx - full / 2, s === 'below' ? Math.min(r.b + gap, vt + vh - m - h) : Math.max(r.t - gap - h, vt + m)); }
      }
      if (!done) { pw = full; ph = Math.min(size(full), maxH); x = cx - pw / 2; y = r.b - ph - 24; } // a big target (the timeline): sit inside it, near the bottom
    }
    pop.style.width = pw + 'px'; pop.classList.toggle('narrow', pw < 320); pop.style.maxHeight = Math.min(capH, maxH) + 'px';
    ph = pop.offsetHeight;
    x = Math.max(m, Math.min(vw - pw - m, x)); y = Math.max(vt + m, Math.min(vt + vh - ph - m, y));
    pop.style.left = Math.round(x) + 'px'; pop.style.top = Math.round(y) + 'px';
    const tt = $('tourText'); if (tt.scrollHeight > tt.clientHeight + 1) tt.tabIndex = 0; else tt.removeAttribute('tabindex'); // text that scrolls can be scrolled from the keyboard
  }
};
function vis(id) { return visEl($(id)); }
// A phone or tablet with no mouse or trackpad (same test as css/settings.css uses for the keyboard rows).
function touchOnly() { return matchMedia('(hover: none) and (pointer: coarse)').matches; }

// el's box, cut to the boxes of the scrolling or clipping containers around it, or null when none of it shows.
function clipBox(el) {
  const b = el.getBoundingClientRect();
  let l = b.left, t = b.top, r = b.right, bo = b.bottom;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflowY === 'visible' && cs.overflowX === 'visible') continue;
    const c = p.getBoundingClientRect();
    l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); bo = Math.min(bo, c.bottom);
  }
  return r > l && bo > t ? { l, t, r, b: bo } : null;
}
// Room for a tour card (at least 260 px wide) beside an element: the Settings sheet on wide screens.
function roomBeside(el) { const b = el && el.getBoundingClientRect(); return !!b && Math.max(innerWidth - b.right, b.left) - 24 >= 260; }
// Settings › Keyboard shortcuts and the Single-key shortcuts switch under it.
function keysRows() { const r = document.querySelector('#setModal [data-set="keys"]'), sw = $('singleKeys'); return [r, sw && sw.closest('.set-row')].filter(Boolean); }
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
// The music file and the voice note closest before it, so the two sit together under one small spotlight.
function voiceAndMusicRows() {
  const voice = m => hasAtt(m, a => a.type === 'audio' && isVoice(a.name));
  const song = S.msgs.findIndex(m => hasAtt(m, a => a.type === 'audio' && !isVoice(a.name)));
  let v = -1;
  for (let j = song - 1; j >= 0 && v < 0; j--) if (voice(S.msgs[j])) v = j;
  if (v < 0) v = S.msgs.findIndex(voice);
  return [v, song].map(i => i < 0 ? -1 : S.m2i[i]);
}
// A step about a message in the sample chat: scroll the timeline to it, then spotlight its bubble.
function chatStep(o) {
  return Object.assign({
    prep() {
      closeDrawer();
      Tour.rows = o.rows().filter(k => k >= 0);
      if (Tour.rows.length) VL.scrollTo(Tour.rows[0], innerWidth <= 640 || innerHeight <= 520 ? undefined : 'center'); // phones and short screens: near the top, clear of the card
    },
    target: () => { const sel = (typeof o.sel === 'function' ? o.sel() : o.sel) || '.bubble'; return Tour.rows.map(k => { const el = VL.nodes.get(k); return el && (el.querySelector(sel) || el.querySelector('.bubble') || el); }).filter(Boolean); }
  }, o);
}
// A step about part of the sidebar. On narrow screens the sidebar is a drawer, so it opens for the step.
function sideStep(o) {
  const el = () => { const e = $(o.id); return e && o.field ? e.closest('.field') : e; };
  return Object.assign({
    prep() { if (isNarrow()) openDrawer(); const e = el(); if (e) e.scrollIntoView({ block: 'nearest' }); },
    beside: () => isNarrow() ? $('sidebar') : null, // tablets: the card sits next to the open drawer, not over it
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

// Captured first, so the app's own shortcuts (js/components/shortcuts.js) stay quiet while the tour or welcome is up.
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
  else if (!welcome && /^(ArrowUp|ArrowDown|PageUp|PageDown)$/.test(e.key)) { // scroll the card's text when it is cut short
    e.preventDefault(); const tx = $('tourText'); tx.scrollTop += (/Up$/.test(e.key) ? -1 : 1) * (/^Page/.test(e.key) ? tx.clientHeight - 20 : 40);
  }
  else if (e.key !== 'Enter' && e.key !== ' ') e.preventDefault();
  e.stopImmediatePropagation();
}, true);

Tour.boot();
