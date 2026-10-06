"use strict";
/* =====================================================================
   Welcome screen and guided tour. Written without a tour library so the
   app keeps zero dependencies and stays offline.

   - Every launch opens on the start screen (index.html #start, wired in
     app.js). Its "Try the sample chat" loads the demo, and on the first
     visit starts the guided tour.
   - The only thing stored is the localStorage flag below, set when the
     tour is finished or skipped. It holds no chat data.
   - "Help and guided tour" in the header's ⋮ menu opens a small dialog to take the tour again
     or open your own chat. It closes on Esc, ✕ or a click outside.
   ===================================================================== */
const TOUR_KEY = 'has_completed_walkthrough';

const Tour = {
  i: -1, raf: 0, prevFocus: null, rows: [],
  /* Each step: sec (chapter), title, text (textNarrow for phones and tablets), and target(), which
     returns the element(s) to spotlight, or nothing for a centred card. chatStep() scrolls the
     timeline to a message of the sample chat first; sideStep() highlights part of the sidebar,
     opening the drawer on narrow screens. */
  steps: [
    {
      sec: 'Getting started',
      title: 'Import your WhatsApp chat',
      text: 'Drag and drop an exported .zip or .txt file anywhere on this page, or use this link. Later, "Open another chat" in the ⋮ menu does the same. All parsing happens locally in your browser, and nothing is ever sent to a server.',
      target: () => vis('sampleOpen') || vis('moreBtn')
    },
    chatStep({
      sec: 'Getting started',
      title: 'Timeline and date badges',
      text: 'Messages are grouped by day under a date badge, like in WhatsApp. While you scroll, the current day stays pinned at the top. Only the messages on screen are drawn, so even chats with tens of thousands of messages stay smooth.',
      rows: () => [0], sel: '.pill'
    }),
    {
      sec: 'Finding things',
      title: 'Search',
      text: 'Search for any word, sender name or poll option. Every match is highlighted in the chat, with an "n of N" counter, a list of results to jump to, and Enter or Shift+Enter to step through them. Press / to search from anywhere.',
      textNarrow: 'Tap here to search for any word, sender name or poll option. Every match is highlighted in the chat, and the arrows step through them.',
      prep: () => closeDrawer(),
      target: () => isNarrow() ? vis('searchBtn') : vis('searchSec')
    },
    sideStep({
      sec: 'Finding things',
      title: 'Date and sender filters',
      text: 'Show only the messages between two dates, from one person, or both. A bar above the chat says how many messages are showing, with a button to clear the filters.',
      id: 'filterSec'
    }),
    sideStep({
      sec: 'Finding things',
      title: 'Jump to a date',
      text: 'Pick a day and the chat scrolls straight to its first message. The busiest days in Statistics work the same way.',
      id: 'jumpDate', field: true
    }),
    sideStep({
      sec: 'Finding things',
      title: 'Chat statistics',
      text: 'See who talks the most, the busiest days, and activity by weekday and by hour, with totals for messages, words and media. It is also in the ⋮ menu.',
      id: 'cardStats'
    }),
    sideStep({
      sec: 'Finding things',
      title: 'Media, links and docs',
      text: 'Every photo, video, voice note, document, sticker, link and contact in the chat, newest first and grouped by month. Tap a tile to open the gallery on that kind, then use the chips at the top to switch. It is also in the ⋮ menu.',
      id: 'mediaSec'
    }),
    sideStep({
      sec: 'Finding things',
      title: 'Which one is you',
      text: 'Pick yourself here and your messages move to the right, in green. The viewer makes a good guess, and the date order (day/month or month/day) is detected for you too, with an override below it.',
      id: 'meSel', field: true
    }),
    chatStep({
      sec: 'Messages',
      title: 'WhatsApp formatting',
      text: '*Bold*, _italic_, ~strikethrough~ and `code` are shown the way WhatsApp shows them, along with bulleted and numbered lists, quotes and large emoji-only messages.',
      rows: () => [rowOf(m => m.message.startsWith('- Meet at'))]
    }),
    chatStep({
      sec: 'Messages',
      title: 'Read more',
      text: 'Long messages are shortened like in WhatsApp. Tap "Read more" to see the whole message and "Show less" to fold it again. A search match in the hidden part opens it for you.',
      rows: () => [rowOf(m => m.message.startsWith('Trip report'))]
    }),
    chatStep({
      sec: 'Messages',
      title: 'Edited, deleted and replies',
      text: 'Edited messages carry an "Edited" tag by the time, deleted ones show "This message was deleted", and quoted lines appear as a reply quote.',
      rows: () => [rowOf(m => m.edited)]
    }),
    chatStep({
      sec: 'Messages',
      title: 'Reactions',
      text: 'When an export includes reactions, they appear under the message they belong to, with a count. Hover over them to see who reacted.',
      rows: () => [rowOf(m => m.reactions && m.reactions.length)]
    }),
    chatStep({
      sec: 'Messages',
      title: 'System notices',
      text: 'Encryption notices, group changes, disappearing-message timers and security-code changes are shown as small centred notes, each with its own icon.',
      rows: () => [rowOf(m => m.kind === 'system' && /created group/.test(m.message))], sel: '.pill'
    }),
    chatStep({
      sec: 'Messages',
      title: 'Calls',
      text: 'Voice, video and group calls appear as call cards with their length. Missed calls are marked in red.',
      rows: () => [rowOf(m => m.kind === 'call')]
    }),
    chatStep({
      sec: 'Messages',
      title: 'Polls',
      text: 'Polls show the question and each option with its votes, as a bar.',
      rows: () => [rowOf(m => m.kind === 'poll')]
    }),
    chatStep({
      sec: 'Media',
      title: 'Photos',
      text: 'Tap a photo to open it full screen. Zoom with the wheel, a pinch or a double tap, drag to pan, rotate with R, and swipe or use the arrow keys to move between photos.',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'image' && a.url))]
    }),
    chatStep({
      sec: 'Media',
      title: 'Videos and GIFs',
      text: 'Videos show a thumbnail with their length and play right in the chat, with a seek bar, mute and full screen. GIFs loop silently with a GIF badge.',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'video' && a.url))]
    }),
    chatStep({
      sec: 'Media',
      title: 'Stickers',
      text: 'Stickers appear without a bubble at WhatsApp\'s size, and animated ones play.',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'sticker' && a.url))], sel: '.sticker'
    }),
    chatStep({
      sec: 'Media',
      title: 'Voice notes and audio',
      text: 'Voice notes get a waveform you can tap or drag to seek, and play at 1×, 1.5× or 2×. Music and other audio files get their own player. Only one plays at a time.',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'audio' && isVoice(a.name))), rowOf(m => hasAtt(m, a => a.type === 'audio' && !isVoice(a.name)))]
    }),
    chatStep({
      sec: 'Media',
      title: 'Built-in PDF viewer',
      text: 'PDFs show a preview of the first page and the page count. Tap one to read every page here, with zoom and a download button. Other documents get a card with their type and size.',
      rows: () => [rowOf(m => hasAtt(m, a => /\.pdf$/i.test(a.name || '') && a.url))]
    }),
    chatStep({
      sec: 'Media',
      title: 'Contact cards',
      text: 'Shared contacts show the name and number. "View contact" opens every detail, including business info, and "Save .vcf" adds it to your phone\'s contacts.',
      rows: () => [rowOf(m => hasAtt(m, a => a.type === 'contact' && a.url))]
    }),
    chatStep({
      sec: 'Media',
      title: 'Locations',
      text: 'Shared locations get a small map drawn on your device (no map service is contacted) with the coordinates. Tap it to open the place in your maps app.',
      rows: () => [rowOf(m => m.kind === 'location')]
    }),
    chatStep({
      sec: 'Media',
      title: 'Links',
      text: 'Links are clickable, and a card under the message shows the site with a copy button. No preview is fetched, so the page stays offline.',
      rows: () => [rowOf(m => /github\.com/.test(m.message))]
    }),
    {
      sec: 'Getting started',
      title: 'The ⋮ menu',
      text: 'Media, links and docs, your starred messages, chat statistics, light and dark themes, and this tour are all here. To star a message, hover over it (or tap it on a phone) and press the star.',
      prep: () => closeDrawer(),
      target: () => vis('moreBtn')
    },
    {
      sec: 'What this viewer can do',
      title: 'You\'re all set',
      html: '<ul>' +
        '<li><b>Private and offline.</b> Your chat is read inside this browser. Nothing is uploaded and the page makes no network requests.</li>' +
        '<li><b>iPhone and Android exports,</b> as a .zip with media or a .txt on its own, in any date and time format.</li>' +
        '<li><b>Big chats,</b> tens of thousands of messages, open in seconds and scroll smoothly.</li>' +
        '<li><b>Several chats at once:</b> pick or drop more than one and switch between them in the side panel.</li>' +
        '<li><b>Nothing is saved.</b> Close the tab and the chat is gone.</li>' +
        '<li><b>Shortcuts:</b> / to search, Esc to close, and + − 0 R and the arrow keys in the photo viewer.</li>' +
        '</ul><p class="tour-note">WhatsApp leaves forwarded labels, event details and live locations out of exports, so they can\'t be shown here.</p>',
      prep: () => closeDrawer(),
      target: () => null
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
    $('tourStep').textContent = st.sec + ' · ' + (this.i + 1) + ' of ' + n;
    $('tourTitle').textContent = st.title;
    if (st.html) $('tourText').innerHTML = st.html; // trusted text written above, no chat content
    else $('tourText').textContent = isNarrow() && st.textNarrow ? st.textNarrow : st.text;
    $('tourPop').classList.toggle('wide', !!st.html);
    $('tourBack').hidden = this.i === 0;
    $('tourNext').textContent = last ? 'Finish' : 'Next';
    $('tourDots').innerHTML = '<b style="width:' + Math.round((this.i + 1) / n * 100) + '%"></b>';
    // Let the virtual list render the scrolled-to row before measuring it.
    requestAnimationFrame(() => requestAnimationFrame(() => { this.place(); $('tourNext').focus({ preventScroll: true }); }));
  },
  next() { if (this.i === this.steps.length - 1) this.end(true); else this.go(this.i + 1); },
  back() { if (this.i > 0) this.go(this.i - 1); },
  end() {
    this.i = -1;
    $('tour').hidden = true;
    closeDrawer();
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
  else if (!welcome && e.key === 'ArrowRight') { e.preventDefault(); Tour.next(); }
  else if (!welcome && e.key === 'ArrowLeft') { e.preventDefault(); Tour.back(); }
  else if (e.key !== 'Enter' && e.key !== ' ') e.preventDefault();
  e.stopImmediatePropagation();
}, true);

Tour.boot();
