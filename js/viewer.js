"use strict";
/* =====================================================================
   Helpers
   ===================================================================== */
const $ = id => document.getElementById(id);
const root = document.documentElement;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = n => n.toLocaleString();
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
const colorIdx = name => hash(name || '') % 10;
function initials(name) {
  const clean = (name || '?').replace(/[^\p{L}\p{N}\s+]/gu, '').trim();
  if (/^\+?[\d\s]+$/.test(clean)) return '#';
  const w = clean.split(/\s+/).filter(Boolean);
  return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
}
function avatar(el, name) { el.className = el.className.replace(/\bc\d\b/g, '').trim() + ' c' + colorIdx(name); el.textContent = initials(name); }

const ic = d => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ICON = {
  menu: ic('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  search: ic('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  stats: ic('<path d="M5 20V11M12 20V5M19 20v-6"/>'),
  sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
  moon: ic('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  auto: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>'),
  open: ic('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 16.5v-5M9.5 14L12 11.5l2.5 2.5"/>'),
  close: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  up: ic('<path d="M6 15l6-6 6 6"/>'),
  down: ic('<path d="M6 9l6 6 6-6"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  list: ic('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  lock: ic('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  image: ic('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>'),
  video: ic('<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3z"/>'),
  audio: ic('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>'),
  sticker: ic('<path d="M20.5 12.5V7a3.5 3.5 0 0 0-3.5-3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h5.5z"/><path d="M12.5 20.5v-4a4 4 0 0 1 4-4h4"/>'),
  gif: ic('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M9 10H7.5a1.5 1.5 0 0 0 0 4H9v-2M12 10v4M15 14v-4h2.5M15 12h2"/>'),
  document: ic('<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z"/><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5"/>'),
  contact: ic('<circle cx="12" cy="9" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  pin: ic('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  phone: ic('<path d="M5 4.5h3l1.5 4-2 1.3a10 10 0 0 0 6.7 6.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6.5a2 2 0 0 1 2-2z"/>'),
  ban: ic('<circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/>'),
  poll: ic('<path d="M5 19V9M12 19V5M19 19v-7"/>'),
  chat: ic('<path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z"/>'),
  download: ic('<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>'),
  play: ic('<path d="M8.5 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>'),
  pause: ic('<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3.2"/>'),
  mail: ic('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>'),
  link: ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  check: ic('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>'),
  star: ic('<path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/>'),
  starFill: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg>',
  rotate: ic('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.5"/>'),
  shield: ic('<path d="M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
  timer: ic('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M10 2.5h4"/>'),
  group: ic('<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 6.2a3 3 0 0 1 0 5.6M17 13.6a5.5 5.5 0 0 1 3.5 5.4"/>'),
  help: ic('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>'),
  event: ic('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h3"/>'),
  warn: ic('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'),
  next: ic('<path d="M9 5l7 7-7 7"/>'),
  volume: ic('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  mute: ic('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  full: ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  copy: ic('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'),
  music: ic('<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
  plus: ic('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M11 8v6M8 11h6"/>'),
  minus: ic('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M8 11h6"/>'),
  fit: ic('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8v6H8z"/>'),
};
ICON.media = ICON.image;

/* WhatsApp text formatting: ```mono```, `code`, *bold*, _italic_, ~strike~, > quotes, - lists, links */
const PRE = '(^|[\\s([{\'".,!?:;>\\-])';
const POST = '(?=$|[\\s)\\]}\'".,!?:;<\\-])';
const mk = ch => new RegExp(PRE + '\\' + ch + '(?=\\S)([^\\n]*?\\S)\\' + ch + POST, 'g');
const RE_B = mk('*'), RE_I = mk('_'), RE_S = mk('~');
const RE_URL = /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?*_~])/gi;
function formatText(raw) {
  const keep = [];
  const hold = html => '\u0000' + (keep.push(html) - 1) + '\u0001';
  let s = esc(raw);
  s = s.replace(/```([\s\S]+?)```/g, (_, c) => hold('<code class="blk">' + c.replace(/^\n|\n$/g, '') + '</code>'));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => hold('<code>' + c + '</code>'));
  s = s.replace(RE_URL, u => hold('<a href="' + (u.startsWith('www.') ? 'https://' + u : u) + '" target="_blank" rel="noopener noreferrer">' + u + '</a>'));
  const inline = l => l.replace(RE_B, '$1<strong>$2</strong>').replace(RE_I, '$1<em>$2</em>').replace(RE_S, '$1<del>$2</del>');
  const lines = s.split('\n');
  let html = '', list = null;
  const closeList = () => { if (list) { html += '</' + list + '>'; list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = /^&gt; ?(.*)$/.exec(l))) {
      closeList();
      let q = [m[1]];
      while (i + 1 < lines.length && (m = /^&gt; ?(.*)$/.exec(lines[i + 1]))) { q.push(m[1]); i++; }
      html += '<blockquote>' + q.map(inline).join('<br>') + '</blockquote>';
    } else if ((m = /^[-*•] (.*)$/.exec(l))) {
      if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; }
      html += '<li>' + inline(m[1]) + '</li>';
    } else if ((m = /^(\d{1,3})\. (.*)$/.exec(l))) {
      if (list !== 'ol') { closeList(); html += '<ol start="' + m[1] + '">'; list = 'ol'; }
      html += '<li>' + inline(m[2]) + '</li>';
    } else {
      closeList();
      html += inline(l) + (i < lines.length - 1 ? '<br>' : '');
    }
  }
  closeList();
  return html.replace(/\u0000(\d+)\u0001/g, (_, n) => keep[+n]).replace(/\u0000(\d+)\u0001/g, (_, n) => keep[+n]);
}
const RE_JUMBO = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️|\p{Regional_Indicator}|\s)+$/u;
function isJumbo(t) {
  if (t.length > 24 || !RE_JUMBO.test(t)) return false;
  const n = (t.match(/\p{Extended_Pictographic}|\p{Regional_Indicator}{2}/gu) || []).length;
  return n >= 1 && n <= 3;
}

/* =====================================================================
   App state
   ===================================================================== */
const S = {
  source: null, res: null, msgs: [], items: [], m2i: null, dateIdx: null,
  me: null, title: '', isGroup: false, order: 'auto',
  q: '', re: null, matches: [], matchSet: new Set(), cur: -1, lc: null, stats: null,
};
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateCache = new Map();
function dateLabel(dk) {
  let v = dateCache.get(dk);
  if (!v) { const [y, m, d] = dk.split('-').map(Number); v = dateFmt.format(Date.UTC(y, m - 1, d)); dateCache.set(dk, v); }
  return v;
}
const dkToT = dk => { const [y, m, d] = dk.split('-').map(Number); return Date.UTC(y, m - 1, d); };

/* =====================================================================
   Virtual list: variable heights, Fenwick tree offsets, DOM recycling
   ===================================================================== */
class Fenwick {
  constructor(arr) {
    const n = arr.length; this.n = n; const t = this.t = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) { t[i + 1] += arr[i]; const j = (i + 1) + ((i + 1) & -(i + 1)); if (j <= n) t[j] += t[i + 1]; }
    this.top = 1; while (this.top * 2 <= n) this.top *= 2;
  }
  add(i, d) { for (i++; i <= this.n; i += i & -i) this.t[i] += d; }
  sum(i) { let s = 0; for (; i > 0; i -= i & -i) s += this.t[i]; return s; }
  find(x) { // index of the item containing offset x
    let pos = 0;
    for (let k = this.top; k; k >>= 1) if (pos + k <= this.n && this.t[pos + k] <= x) { pos += k; x -= this.t[pos]; }
    return Math.min(pos, this.n - 1);
  }
}
const scroller = $('scroller'), layer = $('layer'), spacer = $('spacer');
const VL = {
  items: [], h: null, fw: null, nodes: new Map(), raf: 0, target: null, width: 0,
  set(items, target) {
    this.items = items; this.clear();
    this.width = layer.clientWidth;
    this.h = new Float64Array(items.length);
    for (let i = 0; i < items.length; i++) this.h[i] = estimate(items[i], this.width);
    this.fw = new Fenwick(this.h);
    this.target = target || { i: 0, off: 0 };
    this.update();
  },
  clear() { for (const el of this.nodes.values()) el.remove(); this.nodes.clear(); },
  refresh() { // re-render visible rows in place (search highlight, "me" change)
    if (!this.fw) return;
    const st = scroller.scrollTop, a = this.fw.find(st);
    this.target = { i: a, off: st - this.fw.sum(a) };
    this.clear(); this.update();
  },
  relayout() { // width changed: re-estimate everything, keep the reading position
    if (!this.fw || !this.items.length) return;
    const st = scroller.scrollTop, a = this.fw.find(st), frac = (st - this.fw.sum(a)) / (this.h[a] || 1);
    this.width = layer.clientWidth;
    for (let i = 0; i < this.items.length; i++) this.h[i] = estimate(this.items[i], this.width);
    this.fw = new Fenwick(this.h);
    this.clear(); this.target = { i: a, frac }; this.update();
  },
  remeasure(i) { // a row changed height after render (a photo or video learned its size)
    const el = this.nodes.get(i);
    if (!el || !this.fw) return;
    const hh = el.offsetHeight;
    if (Math.abs(hh - this.h[i]) < 0.5) return;
    const st = scroller.scrollTop, a = this.fw.find(st), aOff = st - this.fw.sum(a);
    this.fw.add(i, hh - this.h[i]); this.h[i] = hh;
    for (const [k, n] of this.nodes) n.style.transform = 'translateY(' + this.fw.sum(k) + 'px)';
    spacer.style.height = this.fw.sum(this.items.length) + 'px';
    if (i < a) scroller.scrollTop = this.fw.sum(a) + aOff;
    this.schedule();
  },
  schedule() { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.update(); }); },
  scrollTo(i, how) { this.target = { i, center: how === 'center' }; this.update(); },
  bottom() { this.target = { bottom: true }; this.update(); },
  update() {
    const n = this.items.length, fw = this.fw, h = this.h;
    if (!n) { spacer.style.height = '0px'; this.clear(); afterRender(); return; }
    for (let pass = 0; pass < 6; pass++) {
      const vh = scroller.clientHeight;
      spacer.style.height = fw.sum(n) + 'px';
      const tg = this.target;
      if (tg) {
        let top;
        if (tg.bottom) top = fw.sum(n) - vh;
        else if (tg.center) top = fw.sum(tg.i) - (vh - h[tg.i]) / 2;
        else if (tg.frac !== undefined) top = fw.sum(tg.i) + tg.frac * h[tg.i];
        else top = fw.sum(tg.i) + (tg.off || 0);
        scroller.scrollTop = Math.max(0, top);
      }
      const st = scroller.scrollTop;
      const anchor = fw.find(st), aOff = st - fw.sum(anchor);
      const start = fw.find(Math.max(0, st - 800)), end = fw.find(st + vh + 800);
      for (const [i, el] of this.nodes) if (i < start || i > end) { el.remove(); this.nodes.delete(i); }
      const fresh = [];
      for (let i = start; i <= end; i++) if (!this.nodes.has(i)) { const el = makeRow(this.items[i], i); el.dataset.i = i; layer.appendChild(el); this.nodes.set(i, el); fresh.push(i); }
      let changed = false;
      for (const i of fresh) { const hh = this.nodes.get(i).offsetHeight; if (Math.abs(hh - h[i]) > 0.5) { fw.add(i, hh - h[i]); h[i] = hh; changed = true; } }
      for (const [i, el] of this.nodes) el.style.transform = 'translateY(' + fw.sum(i) + 'px)';
      spacer.style.height = fw.sum(n) + 'px';
      if (!tg && changed) { const want = fw.sum(anchor) + aOff; if (Math.abs(want - scroller.scrollTop) > 1) scroller.scrollTop = want; }
      if (!changed) break;
    }
    this.target = null;
    afterRender();
  }
};
function estimate(it, W) {
  const bw = Math.max(120, Math.min(W * (W < 600 ? 0.86 : 0.65), 620) - 18);
  const cw = 7.4;
  if (it.type === 'date') return 44;
  const m = it.m;
  if (it.type === 'sys') return 16 + 24 + Math.floor(m.message.length * 6.6 / Math.min(560, W * 0.9)) * 18;
  let h = (it.first ? 10 : 2) + 14 + (m.reactions && m.reactions.length ? 16 : 0);
  if (it.showName) h += 19;
  if (m.kind === 'media') {
    const a = m.attachments[0], w2 = Math.min(330, bw);
    if (a && a.url) {
      const d = Media.dims.get((Media.get(a.name) || a).name);
      if (a.type === 'image' || a.type === 'gif') h += w2 / (d ? clampR(d.w / d.h) : 4 / 3) - (m.message ? 0 : 14);
      else if (a.type === 'video') { const r = d ? clampV(d.w / d.h) : 16 / 9; h += Math.min(w2, 400 * r) / r; }
      else if (a.type === 'sticker') h += W <= 600 ? 150 : 190;
      else if (a.type === 'audio') h += isVoice(a.name) ? 58 : 72;
      else if (a.type === 'contact') h += 108;
      else h += extOf(a.name) === 'pdf' && !PdfView.failed.has(a.name) ? 66 + 146 : 66;
    } else h += 74;
  }
  if (it.hasLink) h += 70;
  else if (m.kind === 'poll') h += 50 + (m.extra.options.length * 33);
  else if (m.kind === 'call') h += 44;
  else if (m.kind === 'location') h += m.extra && m.extra.lat != null ? 186 : 60;
  else if (m.kind === 'unsupported') h += 64;
  else if (m.kind === 'deleted') return h + 19;
  if (m.message) {
    if (it.jumbo) return h + 46;
    const ls = m.message.split('\n');
    for (let k = 0; k < ls.length; k++) h += 19 * Math.max(1, Math.ceil((ls[k].length * cw + (k === ls.length - 1 ? 64 : 0)) / bw));
  } else if (m.kind !== 'text') h += 8;
  return h;
}

/* ---------- Row rendering ---------- */
function hl(html, i) {
  if (!S.re || !S.matchSet.has(i)) return html;
  const cur = S.matches[S.cur] === i;
  return html.split(/(<[^>]+>)/).map((part, k) => k % 2 ? part : part.replace(S.re, (all, g1) => g1 ? '<mark' + (cur ? ' class="cur"' : '') + '>' + g1 + '</mark>' : all)).join('');
}
const TYPE_LABEL = { image: 'Photo', video: 'Video', audio: 'Audio', sticker: 'Sticker', gif: 'GIF', document: 'Document', contact: 'Contact card', media: 'Media' };
const VIDEO_EXT = /^(mp4|mov|3gp|webm|mkv|avi)$/;
// Voice notes: Android PTT-*, iOS *-AUDIO-*, or any .opus that isn't an Android AUD-* audio file.
const isVoice = n => { const b = baseName(n); return /^PTT-/i.test(b) || /-AUDIO-/i.test(b) || (extOf(b) === 'opus' && !/^AUD-/i.test(b)); };
const fmtDur = s => { if (!isFinite(s)) return '–:––'; s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/* Waveforms: decoded from the voice note itself with Web Audio; a stable pseudo-waveform stands in until then
   (or when the browser can't decode the format). */
const WAVE_N = 36;
function pseudoWave(name) { let h = hash(name) || 1; const out = []; for (let i = 0; i < WAVE_N; i++) { h = (h * 1103515245 + 12345) & 0x7fffffff; out.push(0.18 + (h % 1000) / 1000 * 0.62); } return out; }
function waveSVG(name) {
  const w = Media.waves.get(name) || pseudoWave(name), bw = 160 / WAVE_N;
  let r = '';
  for (let i = 0; i < WAVE_N; i++) { const h = Math.max(2.5, w[i] * 28); r += '<rect x="' + (i * bw + 0.6).toFixed(2) + '" y="' + ((30 - h) / 2).toFixed(2) + '" width="' + (bw - 1.6).toFixed(2) + '" height="' + h.toFixed(2) + '" rx="1.3"/>'; }
  return '<svg class="wave" viewBox="0 0 160 30" preserveAspectRatio="none" aria-hidden="true">' + r + '</svg>';
}
const Waves = {
  ctx: null, q: [], busy: false, tried: new Set(),
  request(name) { if (Media.waves.has(name) || this.tried.has(name)) return; this.tried.add(name); this.q.push(name); this.pump(); },
  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.q.length) {
      const name = this.q.shift(), e = Media.get(name);
      if (!e || e.size > 12e6) continue;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) break;
        this.ctx = this.ctx || new AC();
        const ab = await this.ctx.decodeAudioData(await e.blob.arrayBuffer());
        const d = ab.getChannelData(0), step = Math.max(1, Math.floor(d.length / WAVE_N)), peaks = [];
        for (let i = 0; i < WAVE_N; i++) { let sum = 0; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j += 4) sum += d[j] * d[j]; peaks.push(Math.sqrt(sum / (step / 4))); }
        const max = Math.max(...peaks) || 1;
        if (Media.get(name) !== e) continue; // a different chat was opened meanwhile
        Media.waves.set(name, peaks.map(p => 0.12 + 0.88 * p / max));
        layer.querySelectorAll('.aplayer[data-audio="' + CSS.escape(name) + '"] .atrack .wave').forEach(svg => { svg.outerHTML = waveSVG(name); });
        AudioCtl.paintFor(name);
      } catch (err) { /* keep the pseudo-waveform */ }
    }
    this.busy = false;
  }
};

/* Video poster frames: drawn from the first frame of each video, one at a time. */
const Posters = {
  q: [], busy: false,
  request(name) { if (Media.posters.has(name)) return; Media.posters.set(name, null); this.q.push(name); this.pump(); },
  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.q.length) {
      const name = this.q.shift(), e = Media.get(name);
      if (!e) continue;
      const url = await makePoster(e);
      if (!url) continue;
      if (Media.get(name) !== e) { URL.revokeObjectURL(url); continue; }
      Media.posters.set(name, url);
      layer.querySelectorAll('video[data-vid="' + CSS.escape(name) + '"]').forEach(v => { if (!v.getAttribute('poster')) v.setAttribute('poster', url); });
    }
    this.busy = false;
  }
};
function makePoster(e) {
  return new Promise(resolve => {
    const v = document.createElement('video');
    let done = false;
    const fin = u => { if (done) return; done = true; clearTimeout(timer); v.removeAttribute('src'); v.load(); resolve(u); };
    const timer = setTimeout(() => fin(null), 8000);
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadeddata = () => { const d = isFinite(v.duration) ? v.duration : 1; v.currentTime = Math.min(0.15, d / 10); };
    v.onseeked = () => {
      try {
        const w = v.videoWidth, h = v.videoHeight;
        if (!w || !h) return fin(null);
        const sc = Math.min(1, 640 / w), c = document.createElement('canvas');
        c.width = Math.round(w * sc); c.height = Math.round(h * sc);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b => fin(b ? URL.createObjectURL(b) : null), 'image/jpeg', 0.8);
      } catch (err) { fin(null); }
    };
    v.onerror = () => fin(null);
    v.src = e.url;
  });
}

function audioHTML(e, m) {
  const fail = '<div class="afail">This browser can\'t play .' + esc(extOf(e.name)) + ' audio. <a href="' + e.url + '" download="' + esc(e.name) + '">Download it</a></div>';
  const play = '<button class="aplay" aria-label="Play"></button>';
  if (isVoice(e.name)) {
    const who = m && m.sender ? m.sender : '';
    return '<div class="aplayer voice" data-audio="' + esc(e.name) + '">' + play +
      '<div class="atrack">' + waveSVG(e.name) + '<div class="arow"><span class="atime"></span><button class="aspeed" aria-label="Playback speed"></button></div>' + fail + '</div>' +
      '<span class="av vav c' + colorIdx(who) + '" title="' + esc(who) + '">' + esc(initials(who)) + '<span class="vmic">' + ICON.audio + '</span></span></div>';
  }
  return '<div class="aplayer file" data-audio="' + esc(e.name) + '">' + play +
    '<div class="atrack"><span class="afname" title="' + esc(e.name) + '">' + esc(e.name) + '</span><input class="aseek" type="range" min="0" max="1000" value="0" aria-label="Seek audio">' +
    '<div class="arow"><span class="atime"></span><button class="aspeed" aria-label="Playback speed"></button></div>' + fail + '</div>' +
    '<span class="afile-ic">' + ICON.music + '</span></div>';
}
// Videos keep their real shape (portrait phone videos down to 9:16), capped at 400px tall like WhatsApp.
const clampV = r => Math.min(1.9, Math.max(0.5625, r));
const vBox = r => 'aspect-ratio:' + r + ';width:' + Math.min(330, Math.round(400 * r)) + 'px';
function videoHTML(e, gif) {
  const d = Media.dims.get(e.name), r = d ? (gif ? clampR(d.w / d.h) : clampV(d.w / d.h)) : 16 / 9;
  if (gif) return '<div class="mvid gifv" data-r="' + r + '" style="aspect-ratio:' + r + '"><video src="' + e.url + '" autoplay muted loop playsinline preload="auto" data-dim="' + esc(e.name) + '"></video><span class="gifbadge">GIF</span></div>';
  const poster = Media.posters.get(e.name);
  if (poster === undefined) Posters.request(e.name);
  return '<div class="mvid" data-r="' + r + '" style="' + vBox(r) + '"><video src="' + e.url + '" preload="metadata" playsinline data-vid="' + esc(e.name) + '" data-dim="' + esc(e.name) + '"' + (poster ? ' poster="' + poster + '"' : '') + '></video>' +
    '<button class="vbig" aria-label="Play video">' + ICON.play + '</button>' +
    '<span class="vbadge">' + ICON.video + '<span class="vdur">' + fmtSize(e.size) + '</span></span>' +
    '<div class="vctl"><button class="vpp" aria-label="Play video">' + ICON.play + '</button><input class="vseek" type="range" min="0" max="1000" value="0" aria-label="Seek video"><span class="vtime">–:––</span>' +
    '<button class="vmute" aria-label="Mute">' + ICON.volume + '</button><button class="vfs" aria-label="Full screen">' + ICON.full + '</button></div></div>';
}
const DX = { pdf: 'pdf', doc: 'doc', docx: 'doc', rtf: 'doc', odt: 'doc', pages: 'doc', xls: 'xls', xlsx: 'xls', csv: 'xls', ods: 'xls', numbers: 'xls', ppt: 'ppt', pptx: 'ppt', key: 'ppt', odp: 'ppt', zip: 'zip', rar: 'zip', '7z': 'zip', gz: 'zip', txt: 'txt', md: 'txt', json: 'txt', log: 'txt' };
function docHTML(e, type, a) {
  if (type === 'contact') return contactHTML(e);
  const ext = extOf(e.name), label = (ext || 'file').toUpperCase().slice(0, 4), pdf = ext === 'pdf';
  const title = (a && a.title) || e.name;
  const pages = pdf ? PdfView.pages.get(e.name) : 0;
  const detail = pages ? pages + ' page' + (pages === 1 ? '' : 's') : (a && a.detail) || '';
  const info = (detail ? esc(detail) + ' · ' : '') + esc(label) + ' · ' + fmtSize(e.size);
  const main = pdf
    ? '<button class="mdoc-main" data-pdf="' + esc(e.name) + '" aria-label="Open ' + esc(title) + '">'
    : '<a class="mdoc-main" href="' + e.url + '" target="_blank" rel="noopener">';
  const row = '<div class="mdoc">' + main + '<span class="dext dx-' + (DX[ext] || 'other') + '">' + esc(label) + '</span>' +
    '<span class="attt"><b title="' + esc(title) + '">' + esc(title) + '</b><small class="dinfo">' + info + '</small></span>' + (pdf ? '</button>' : '</a>') +
    '<a class="dl" href="' + e.url + '" download="' + esc(e.name) + '" aria-label="Download ' + esc(title) + '" title="Download">' + ICON.download.replace('width="22" height="22"', 'width="20" height="20"') + '</a></div>';
  if (!pdf) return row;
  const thumb = Media.thumbs.get(e.name);
  if (thumb === undefined) PdfView.thumb(e.name);
  if (thumb === null && Media.thumbs.has(e.name) && PdfView.failed.has(e.name)) return '<div class="mdocw">' + row + '</div>';
  return '<div class="mdocw"><button class="pdfprev" data-pdf="' + esc(e.name) + '" aria-label="Open ' + esc(title) + '">' +
    (thumb ? '<img src="' + thumb + '" alt="">' : '<span class="pdfph">' + ICON.document + '</span>') + '</button>' + row + '</div>';
}

/* ---------- Contact cards (.vcf) ----------
   The vCard is read from the ZIP and parsed here. WhatsApp joins several contacts with
   "_$!<VCard-Separator>!$_" and writes multi-line values without folding, so the parser is lenient. */
const VC_PROP = /^(?:[A-Za-z0-9-]+\.)?(VERSION|N|FN|TEL|EMAIL|ORG|TITLE|ROLE|PHOTO|ADR|URL|NOTE|BDAY|NICKNAME|CATEGORIES|LABEL|REV|UID|PRODID|IMPP|GEO|TZ|SOUND|LOGO|KEY|SOURCE|KIND|X-[A-Za-z0-9-]+)((?:;[^:\n]*)?):(.*)$/i;
const VC_TEL = { CELL: 'Mobile', MOBILE: 'Mobile', IPHONE: 'iPhone', HOME: 'Home', WORK: 'Work', MAIN: 'Main', FAX: 'Fax', PAGER: 'Pager', OTHER: 'Other' };
function parseVCards(text) {
  const out = [];
  for (const chunk of text.replace(/\r\n?/g, '\n').split(/END:VCARD/i)) {
    const at = chunk.search(/BEGIN:VCARD/i);
    if (at < 0) continue;
    const props = [];
    for (const line of chunk.slice(at + 11).split('\n')) {
      const last = props[props.length - 1];
      if (last && /^[ \t]/.test(line)) { last.raw += line.slice(1); continue; } // folded line
      if (last && last.qp && last.raw.endsWith('=')) { last.raw = last.raw.slice(0, -1) + line; continue; } // quoted-printable soft break
      const m = VC_PROP.exec(line);
      if (m) {
        const g = /^([A-Za-z0-9-]+)\./.exec(line);
        props.push({ group: g ? g[1].toLowerCase() : '', name: m[1].toUpperCase(), params: m[2], raw: m[3], qp: /QUOTED-PRINTABLE/i.test(m[2]) });
      } else if (last) last.raw += '\n' + line; // WhatsApp's unescaped multi-line values
    }
    const val = p => {
      let v = p.raw;
      if (p.qp) {
        const bytes = []; v.replace(/=([0-9A-Fa-f]{2})|([\s\S])/g, (s, h, c) => { if (h) bytes.push(parseInt(h, 16)); else for (const b of new TextEncoder().encode(c)) bytes.push(b); return ''; });
        v = new TextDecoder().decode(new Uint8Array(bytes));
      }
      return v.replace(/\\n/gi, '\n').replace(/\\([,;:\\])/g, '$1').trim();
    };
    const labels = new Map();
    for (const p of props) if (p.name === 'X-ABLABEL' && p.group) labels.set(p.group, val(p).replace(/^_\$!<(.*)>!\$_$/, '$1'));
    const types = p => (p.params.match(/(?:TYPE=)?([A-Za-z-]+)(?=[;,]|$)/gi) || []).map(s => s.replace(/^TYPE=/i, '').toUpperCase());
    const c = { name: '', phones: [], emails: [], urls: [], org: '', title: '', biz: '', about: '', photo: '' };
    let n = '';
    for (const p of props) {
      const v = val(p);
      if (p.name === 'FN') c.name = c.name || v;
      else if (p.name === 'N') { const f = v.split(';'); n = [f[3], f[1], f[2], f[0], f[4]].filter(x => x && x.trim()).join(' '); }
      else if (p.name === 'TEL' && v) {
        const t = types(p), wa = /waid=(\d+)/i.exec(p.params);
        c.phones.push({ value: v, label: labels.get(p.group) || VC_TEL[t.find(x => VC_TEL[x])] || 'Phone', wa: !!wa });
      }
      else if (p.name === 'EMAIL' && v) c.emails.push(v);
      else if (p.name === 'URL' && v) c.urls.push(v);
      else if (p.name === 'ORG') c.org = v.split(';').filter(Boolean).join(' · ');
      else if (p.name === 'TITLE') c.title = v;
      else if (p.name === 'X-WA-BIZ-NAME') c.biz = v;
      else if (p.name === 'X-WA-BIZ-DESCRIPTION' || p.name === 'NOTE') c.about = c.about || v;
      else if (p.name === 'PHOTO') {
        const b64 = p.raw.replace(/\s+/g, ''), kind = (/TYPE=(JPE?G|PNG|GIF|WEBP)/i.exec(p.params) || [, 'JPEG'])[1].toLowerCase().replace('jpg', 'jpeg');
        if (/^[A-Za-z0-9+/]+=*$/.test(b64) && b64.length < 3e6) c.photo = 'data:image/' + kind + ';base64,' + b64;
      }
    }
    c.name = c.name || n || c.org || c.biz || (c.phones[0] && c.phones[0].value) || 'Contact';
    out.push(c);
  }
  return out;
}
const vcFileName = n => baseName(n).replace(/^\d+-/, '').replace(/\.vcf$/i, '').trim() || 'Contact';
const Cards = {
  q: [], busy: false,
  request(name) { if (Media.cards.has(name)) return; Media.cards.set(name, null); this.q.push(name); this.pump(); },
  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.q.length) {
      const name = this.q.shift(), e = Media.get(name);
      if (!e) continue;
      let list = [];
      try { if (e.size < 8e6) list = parseVCards(await e.blob.text()); } catch (err) { /* keep the file-name card */ }
      if (Media.get(name) !== e) continue; // a different chat was opened meanwhile
      Media.cards.set(name, list);
      layer.querySelectorAll('.vcard[data-vcf="' + CSS.escape(name) + '"]').forEach(el => {
        const row = el.closest('.row'); el.outerHTML = contactHTML(e); if (row) VL.remeasure(+row.dataset.i);
      });
    }
    this.busy = false;
  }
};
function vcAvatar(c, cls) {
  return '<span class="av vc-av ' + cls + ' c' + colorIdx(c.name) + '">' + (c.photo ? '<img src="' + c.photo + '" alt="">' : esc(initials(c.name))) + '</span>';
}
function contactHTML(e) {
  const list = Media.cards.get(e.name);
  if (list === undefined) Cards.request(e.name);
  let name, sub, av;
  if (list && list.length) {
    const c = list[0], more = list.length - 1;
    name = c.name; av = vcAvatar(c, '');
    sub = more ? 'and ' + more + ' other contact' + (more > 1 ? 's' : '') : c.phones.length ? c.phones[0].value : c.emails[0] || (c.biz ? 'Business account' : 'Contact card');
  } else {
    name = vcFileName(e.name); sub = 'Contact card'; av = '<span class="av vc-av c' + colorIdx(name) + '">' + ICON.contact + '</span>';
  }
  const many = list && list.length > 1;
  return '<div class="vcard" data-vcf="' + esc(e.name) + '"><button class="vc-main" data-vcard="' + esc(e.name) + '" aria-label="View contact">' + av +
    '<span class="attt"><b title="' + esc(name) + '">' + esc(name) + '</b><small>' + esc(sub) + '</small></span></button>' +
    '<div class="vc-acts"><button data-vcard="' + esc(e.name) + '">' + (many ? 'View all' : 'View contact') + '</button>' +
    '<a href="' + e.url + '" download="' + esc(e.name) + '">Save .vcf</a></div></div>';
}
function openContact(name) {
  const e = Media.get(name);
  if (!e) return;
  const list = Media.cards.get(name);
  if (!list) { Cards.request(name); setTimeout(() => { if (Media.cards.get(name)) openContact(name); }, 150); return; }
  $('vcTitle').textContent = list.length > 1 ? list.length + ' contacts' : 'Contact';
  $('vcBody').innerHTML = list.length ? list.map(c =>
    '<section class="vc-one">' + vcAvatar(c, 'big') + '<div class="vc-name"><b>' + esc(c.name) + '</b>' +
      (c.biz ? '<small>' + ICON.check + 'Business account' + (c.biz !== c.name ? ' · ' + esc(c.biz) : '') + '</small>' : '') +
      (c.org || c.title ? '<small>' + esc([c.title, c.org].filter(Boolean).join(' · ')) + '</small>' : '') + '</div>' +
      c.phones.map(p => '<div class="vc-row"><span class="vc-ic">' + ICON.phone + '</span><span class="vc-v"><a href="tel:' + esc(p.value.replace(/[^\d+*#]/g, '')) + '">' + esc(p.value) + '</a><small>' + esc(p.label) + (p.wa ? ' · on WhatsApp' : '') + '</small></span><button class="ibtn vc-copy" data-what="Number" data-copy="' + esc(p.value) + '" aria-label="Copy number" title="Copy number">' + ICON.copy + '</button></div>').join('') +
      c.emails.map(m => '<div class="vc-row"><span class="vc-ic">' + ICON.mail + '</span><span class="vc-v"><a href="mailto:' + esc(m) + '">' + esc(m) + '</a><small>Email</small></span><button class="ibtn vc-copy" data-what="Email" data-copy="' + esc(m) + '" aria-label="Copy email" title="Copy email">' + ICON.copy + '</button></div>').join('') +
      c.urls.map(u => { const s = safeUrl(u); return s ? '<div class="vc-row"><span class="vc-ic">' + ICON.link + '</span><span class="vc-v"><a href="' + esc(s) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + '</a><small>Website</small></span></div>' : ''; }).join('') +
      (c.about ? '<div class="vc-about txt">' + formatText(c.about) + '</div>' : '') +
    '</section>').join('') : '<p class="lead">This contact card has no readable details.</p>';
  const dl = $('vcSave'); dl.href = e.url; dl.setAttribute('download', e.name);
  openModal('vcModal');
}

/* ---------- PDF preview and viewer ----------
   pdf.js is vendored (js/vendor/pdfjs) and only loaded when a chat contains a PDF. It runs with
   eval disabled and with no font or CMap URLs, so it never fetches anything. */
const PdfView = {
  lib: null, docs: new Map(), pages: new Map(), failed: new Set(), q: [], busy: false,
  load() {
    if (!this.lib) this.lib = new Promise((res, rej) => {
      if (window.pdfjsLib) return res(window.pdfjsLib);
      const inline = document.getElementById('pdfjs-lib'), wk = document.getElementById('pdfjs-worker');
      const s = document.createElement('script');
      s.src = inline ? URL.createObjectURL(new Blob([inline.textContent], { type: 'text/javascript' })) : 'js/vendor/pdfjs/pdf.min.js';
      s.onload = () => {
        const L = window.pdfjsLib;
        if (!L) return rej(new Error('PDF reader missing'));
        L.GlobalWorkerOptions.workerSrc = wk ? URL.createObjectURL(new Blob([wk.textContent], { type: 'text/javascript' })) : 'js/vendor/pdfjs/pdf.worker.min.js';
        res(L);
      };
      s.onerror = () => { this.lib = null; rej(new Error('PDF reader could not load')); };
      document.head.appendChild(s);
    });
    return this.lib;
  },
  doc(name) {
    if (!this.docs.has(name)) {
      const e = Media.get(name);
      this.docs.set(name, this.load().then(async L => L.getDocument({ data: new Uint8Array(await e.blob.arrayBuffer()), isEvalSupported: false, enableXfa: false, useSystemFonts: true }).promise));
    }
    return this.docs.get(name);
  },
  thumb(name) { if (Media.thumbs.has(name)) return; Media.thumbs.set(name, null); this.q.push(name); this.pump(); },
  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.q.length) {
      const name = this.q.shift(), e = Media.get(name);
      if (!e) continue;
      let url = null;
      try {
        const doc = await this.doc(name), page = await doc.getPage(1);
        const v0 = page.getViewport({ scale: 1 }), scale = 640 / v0.width, vp = page.getViewport({ scale });
        const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.min(Math.ceil(vp.height), 400);
        const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
        await page.render({ canvasContext: g, viewport: vp }).promise;
        const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85));
        if (Media.get(name) !== e) continue;
        this.pages.set(name, doc.numPages);
        url = blob ? URL.createObjectURL(blob) : null;
      } catch (err) { if (Media.get(name) !== e) continue; this.failed.add(name); }
      Media.thumbs.set(name, url);
      layer.querySelectorAll('.pdfprev[data-pdf="' + CSS.escape(name) + '"]').forEach(el => {
        const w = el.closest('.mdocw'), row = el.closest('.row');
        const it = row && VL.items[+row.dataset.i], a = it && it.m.attachments.find(x => Media.get(x.name) === e);
        if (w) w.outerHTML = docHTML(e, 'document', a);
        if (row) VL.remeasure(+row.dataset.i);
      });
    }
    this.busy = false;
  },
  reset() {
    for (const p of this.docs.values()) p.then(d => d.destroy(), () => {});
    this.docs.clear(); this.pages.clear(); this.failed.clear(); this.q = [];
    if (!$('pdfv').hidden) closePdf();
  }
};
const PV = { name: '', z: 1, obs: null, gen: 0 };
async function openPdf(name, title) {
  const e = Media.get(name);
  if (!e) return;
  pauseVideos(); if (AudioCtl.el && !AudioCtl.el.paused) AudioCtl.el.pause();
  PV.name = name; PV.z = 1; PV.gen++;
  $('pdfTitle').textContent = title || e.name; $('pdfInfo').textContent = 'Opening…';
  const dl = $('pdfDl'); dl.href = e.url; dl.setAttribute('download', e.name);
  const box = $('pdfPages'); box.innerHTML = ''; box.scrollTop = 0;
  $('pdfv').hidden = false; $('pdfClose').focus();
  const gen = PV.gen;
  try {
    const doc = await PdfView.doc(name);
    if (gen !== PV.gen) return;
    const v1 = (await doc.getPage(1)).getViewport({ scale: 1 });
    $('pdfInfo').textContent = doc.numPages + ' page' + (doc.numPages === 1 ? '' : 's');
    PdfView.pages.set(name, doc.numPages);
    let html = '';
    for (let i = 1; i <= doc.numPages; i++) html += '<div class="pdfpage" data-p="' + i + '" style="aspect-ratio:' + (v1.width / v1.height).toFixed(4) + '"><span class="pdfpn">' + i + '</span></div>';
    box.innerHTML = html;
    pdfZoom(0);
  } catch (err) {
    if (gen !== PV.gen) return;
    const pw = err && err.name === 'PasswordException';
    $('pdfInfo').textContent = '';
    box.innerHTML = '<div class="pdferr">' + ICON.warn + '<b>' + (pw ? 'This PDF is password protected' : "This PDF couldn't be shown here") + '</b><small>You can still download it and open it in another app.</small></div>';
  }
}
function pdfZoom(d) {
  PV.z = d === 0 ? 1 : Math.min(3, Math.max(0.5, PV.z * (d > 0 ? 1.25 : 0.8)));
  const box = $('pdfPages');
  box.style.setProperty('--pz', PV.z);
  $('pdfZoom').textContent = Math.round(PV.z * 100) + '%';
  if (PV.obs) PV.obs.disconnect();
  PV.obs = new IntersectionObserver(ents => { for (const en of ents) if (en.isIntersecting) renderPdfPage(en.target); }, { root: box, rootMargin: '600px 0px' });
  box.querySelectorAll('.pdfpage').forEach(p => { p.dataset.z = ''; PV.obs.observe(p); });
}
async function renderPdfPage(el) {
  const z = String(PV.z), gen = PV.gen;
  if (el.dataset.z === z) return;
  el.dataset.z = z;
  try {
    const doc = await PdfView.doc(PV.name), page = await doc.getPage(+el.dataset.p);
    const v0 = page.getViewport({ scale: 1 }), w = el.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1);
    const vp = page.getViewport({ scale: w * dpr / v0.width });
    const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    if (gen !== PV.gen || el.dataset.z !== z) return;
    el.style.aspectRatio = (v0.width / v0.height).toFixed(4);
    el.querySelectorAll('canvas').forEach(c => c.remove());
    el.appendChild(cv);
  } catch (err) { el.dataset.z = ''; }
}
function closePdf() {
  PV.gen++; if (PV.obs) PV.obs.disconnect();
  $('pdfv').hidden = true; $('pdfPages').innerHTML = '';
}
function attHTML(a, m) {
  const e = a.url ? Media.get(a.name) : null;
  if (e) {
    const vid = VIDEO_EXT.test(extOf(e.name));
    if (a.type === 'gif' && vid) return videoHTML(e, true);
    if (a.type === 'image' || a.type === 'gif') {
      const d = Media.dims.get(e.name), r = d ? clampR(d.w / d.h) : 4 / 3;
      return '<button class="mimg" data-lb="' + esc(e.name) + '" data-r="' + r + '" style="aspect-ratio:' + r + '" aria-label="Open photo"><img src="' + e.url + '" alt="" loading="lazy" decoding="async" data-dim="' + esc(e.name) + '">' + (a.type === 'gif' ? '<span class="gifbadge">GIF</span>' : '') + '</button>';
    }
    if (a.type === 'sticker') return '<img class="sticker" src="' + e.url + '" alt="Sticker" loading="lazy">';
    if (a.type === 'video') return videoHTML(e, false);
    if (a.type === 'audio') return audioHTML(e, m);
    return docHTML(e, a.type, a);
  }
  const missing = !!a.name && !a.omitted;
  const kind = a.note || (a.type === 'audio' && a.name && isVoice(a.name) ? 'Voice message' : TYPE_LABEL[a.type]) || 'File';
  const title = a.name || (kind + (a.viewOnce ? ' · view once' : ''));
  const alert = S.source && S.source.zip ? 'Asset not included in ZIP' : missing ? 'Not included: opened as text only' : 'Asset not included in ZIP';
  const sub = a.detail ? kind + ' · ' + a.detail : a.name ? kind : '';
  return '<div class="att ' + (missing ? 'missing' : 'omit') + '" data-type="' + a.type + '"' + (a.name ? ' data-name="' + esc(a.name) + '"' : '') + '>' +
    '<span class="atti">' + (ICON[a.type] || ICON.document) + '</span><span class="attt"><b title="' + esc(title) + '">' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') +
    '<span class="alert">' + ICON.warn + esc(alert) + '</span></span></div>';
}

/* Link preview cards: built only from the URL itself (no fetching), with a local site badge. */
const SITES = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube', '#d4181f'], [/(^|\.)github\.com$/, 'GitHub', '#24292f'], [/(^|\.)(twitter\.com|x\.com)$/, 'X (Twitter)', '#14171a'],
  [/(^|\.)instagram\.com$/, 'Instagram', '#c13584'], [/(^|\.)(facebook\.com|fb\.watch|fb\.com)$/, 'Facebook', '#1877f2'], [/(^|\.)linkedin\.com$/, 'LinkedIn', '#0a66c2'],
  [/(^|\.)tiktok\.com$/, 'TikTok', '#111111'], [/(^|\.)wikipedia\.org$/, 'Wikipedia', '#54595d'], [/(^|\.)reddit\.com$/, 'Reddit', '#e0410b'],
  [/(^|\.)spotify\.com$/, 'Spotify', '#1a9e4b'], [/^chat\.whatsapp\.com$/, 'WhatsApp group invite', '#128c7e'], [/(^|\.)wa\.me$/, 'WhatsApp chat link', '#128c7e'],
  [/^(maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)$/, 'Google Maps', '#1e8e3e'], [/^(docs|drive)\.google\.com$/, 'Google Docs', '#1a73e8'],
  [/(^|\.)amazon\.[a-z.]+$/, 'Amazon', '#b86e00'], [/(^|\.)t\.me$/, 'Telegram', '#2481cc'], [/(^|\.)stackoverflow\.com$/, 'Stack Overflow', '#d16a14'],
];
function safeUrl(u) {
  try { const x = new URL(/^www\./i.test(u) ? 'https://' + u : u); return x.protocol === 'http:' || x.protocol === 'https:' ? x : null; } catch (e) { return null; }
}
function linkCards(text) {
  const urls = [];
  for (const mm of text.matchAll(RE_URL)) { const x = safeUrl(mm[1]); if (x && !urls.some(u => u.href === x.href)) urls.push(x); }
  if (!urls.length) return '';
  const x = urls[0], host = x.hostname.replace(/^www\./, '');
  const site = SITES.find(sv => sv[0].test(host));
  const name = site ? site[1] : host;
  const color = site ? site[2] : 'var(--n' + colorIdx(host) + ')';
  const shown = (host + x.pathname + x.search).replace(/\/$/, '');
  return '<div class="lcard"><a class="lmain" href="' + esc(x.href) + '" target="_blank" rel="noopener noreferrer"><span class="lbadge" style="background:' + color + '">' + esc((name[0] || '?').toUpperCase()) + '</span>' +
    '<span class="ltxt"><b>' + esc(name) + '</b><small title="' + esc(x.href) + '">' + esc(shown.length > 70 ? shown.slice(0, 68) + '…' : shown) + '</small></span></a>' +
    '<button class="lcopy" data-url="' + esc(x.href) + '" aria-label="Copy link" title="Copy link">' + ICON.copy + '</button></div>' +
    (urls.length > 1 ? '<div class="lmore">+ ' + (urls.length - 1) + ' more link' + (urls.length > 2 ? 's' : '') + ' in this message</div>' : '');
}
/* System notices are grouped like WhatsApp shows them: the encryption and business notices on yellow,
   security-code changes and disappearing-message timers with an icon, and group changes as plain pills. */
const SYS_KINDS = [
  ['enc', 'enc', 'lock', /end-to-end encrypted|this (chat|business) (is with|uses|works with)|official business account|this business (is|uses|works)/i],
  ['security', 'sec', 'shield', /security code (with .+ )?changed|security code (has )?changed|verified your security code/i],
  ['timer', 'sec', 'timer', /disappearing messages|message timer|kept message|default message timer/i],
  ['number', 'sec', 'phone', /changed (their|his|her|your) phone number|changed to \+?\d|changed their number|new number/i],
  ['block', 'sec', 'ban', /^you (un)?blocked this (contact|business)|blocked this contact/i],
  ['group', 'grp', 'group', /created (the )?group|created this group|\badded\b|\bremoved\b|\bleft\b|\bjoined\b|changed (the|this) group|changed the subject|changed this group's|changed the group (icon|description|name|settings)|deleted (this|the) group's icon|now an admin|no longer an admin|invite link|group settings|was added|were added|community|reset this group's invite link|turned (on|off) admin approval|requested to join/i]
];
function sysKind(text) {
  for (const [kind, cls, icon, re] of SYS_KINDS) if (re.test(text)) return { kind, cls, icon };
  return { kind: 'other', cls: '', icon: '' };
}
function locHTML(x) {
  const has = x.lat != null, coord = has ? x.lat.toFixed(5) + ', ' + x.lng.toFixed(5) : '';
  // Drawn locally: a grid with a pin, never map tiles, so nothing is fetched.
  const map = has ? '<span class="lmap" aria-hidden="true"><i class="lpin">' + ICON.pin + '</i></span>' : '';
  const info = '<span class="linfo"><span class="atti">' + ICON.pin + '</span><span class="ltx"><b>' + (x.live ? 'Live location' : 'Location') + '</b><small>' +
    (has ? esc(coord) : x.live ? 'Not included in exports' : 'Open in maps') + '</small></span></span>';
  if (!x.url) return '<div class="loc nolink">' + map + info + '</div>';
  return '<div class="locw"><a class="loc" href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer" title="Open in maps">' + map + info + '</a>' +
    (has ? '<button class="lcopy" data-copy="' + esc(coord) + '" aria-label="Copy coordinates" title="Copy coordinates">' + ICON.copy + '</button>' : '') + '</div>';
}
function makeRow(it, idx) {
  const el = document.createElement('div');
  if (it.type === 'date') { el.className = 'row daterow'; el.innerHTML = '<span class="pill">' + esc(dateLabel(it.dateKey)) + '</span>'; return el; }
  const m = it.m;
  if (it.type === 'sys') {
    const k = sysKind(m.message);
    el.className = 'row sysrow';
    el.innerHTML = '<span class="pill ' + k.cls + '" data-sys="' + k.kind + '">' + (k.icon ? ICON[k.icon] : '') + hl(esc(m.message), it.i) + '</span>';
    return el;
  }
  const grp = S.isGroup && !m.isOutgoing, starred = S.starred && S.starred.has(it.i), reacts = m.reactions && m.reactions.length;
  el.className = 'row ' + (m.isOutgoing ? 'out' : 'in') + (it.first ? ' first' : '') + (grp ? ' grp' : '') + (reacts ? ' hasr' : '');
  let body = '';
  if (it.showName) body += '<div class="name nc' + colorIdx(m.sender) + '">' + hl(esc(m.sender), it.i) + '</div>';
  const metaInner = (starred ? '<span class="stard" title="Starred">' + ICON.starFill + '</span>' : '') + (m.edited ? '<span class="edtag">Edited</span>' : '') + '<span>' + m.formattedTime + '</span>';
  const space = '<span class="mspace' + (m.edited ? ' e' : '') + '"></span>';
  let tailText = true, visual = false, overlay = false, stk = false;
  switch (m.kind) {
    case 'deleted':
      body += '<div class="txt del">' + ICON.ban + '<span>' + esc(m.isOutgoing ? 'You deleted this message' : 'This message was deleted') + space + '</span></div>'; tailText = false; break;
    case 'call': {
      const x = m.extra;
      body += '<div class="call' + (x.missed ? ' missed' : '') + '"><span class="ci">' + (x.video ? ICON.video : ICON.phone) + '</span><div><b>' + esc(x.label.charAt(0).toUpperCase() + x.label.slice(1)) + '</b><small>' + esc(x.detail || (x.missed ? 'No answer' : '')) + '</small></div></div>';
      break;
    }
    case 'poll': {
      const x = m.extra, total = x.options.reduce((a, o) => a + o.votes, 0);
      body += '<div class="poll"><div class="pq">' + ICON.poll + '<span>' + hl(formatText(x.q), it.i) + '</span></div>' + x.options.map(o =>
        '<div class="po"><div class="pol"><span>' + hl(esc(o.label), it.i) + '</span><span>' + o.votes + '</span></div><div class="pbar"><i style="width:' + (total ? Math.round(o.votes / total * 100) : 0) + '%"></i></div></div>').join('') +
        '<small>Poll · ' + total + ' vote' + (total === 1 ? '' : 's') + '</small></div>';
      break;
    }
    case 'unsupported':
      body += '<div class="unsup"><span class="atti">' + ICON.event + '</span><span class="attt"><b>Message not included in the export</b><small>Usually an event. WhatsApp leaves events out of exported chats, so the name, time and replies aren\'t available.</small></span></div>';
      break;
    case 'location':
      body += locHTML(m.extra);
      break;
    case 'media': {
      body += m.attachments.map(a => attHTML(a, m)).join('');
      const a0 = m.attachments[0];
      if (a0 && a0.url) {
        if (a0.type === 'sticker' && !m.message) { stk = true; tailText = false; }
        else if (a0.type === 'image' || a0.type === 'gif') { visual = true; if (!m.message) { overlay = true; tailText = false; } }
        else if (a0.type === 'video') { visual = true; if (!m.message) { overlay = true; tailText = false; } }
      }
      break;
    }
  }
  if (tailText) {
    if (m.message && m.kind !== 'poll' && m.kind !== 'call') body += '<div class="txt' + (it.jumbo ? ' jumbo' : '') + '">' + hl(formatText(m.message), it.i) + (it.hasLink ? '' : space) + '</div>' + (it.hasLink ? linkCards(m.message) + '<div class="mline"></div>' : '');
    else body += '<div class="mline"></div>';
  }
  if (stk) el.className += ' stk';
  const starBtn = '<button class="starbtn" data-star="' + it.i + '" aria-pressed="' + starred + '" aria-label="' + (starred ? 'Unstar message' : 'Star message') + '" title="' + (starred ? 'Unstar' : 'Star') + '">' + ICON.star + '</button>';
  let rx = '';
  if (reacts) {
    const g = new Map();
    for (const r of m.reactions) g.set(r.emoji, (g.get(r.emoji) || []).concat(r.by === S.me ? 'You' : r.by || ''));
    const tip = [...g].map(([e, who]) => e + ' ' + who.join(', ')).join('; ');
    rx = '<span class="reacts" title="' + esc(tip) + '" aria-label="Reactions: ' + esc(tip) + '">' + [...g.keys()].slice(0, 3).map(esc).join('') + (m.reactions.length > 1 ? '<b>' + m.reactions.length + '</b>' : '') + '</span>';
  }
  const av = grp && it.first ? '<span class="av rav c' + colorIdx(m.sender) + '" aria-hidden="true">' + esc(initials(m.sender)) + '</span>' : '';
  el.innerHTML = av + '<div class="bubble' + (visual ? ' mb' : '') + '">' + body + '<span class="meta' + (overlay ? ' ov' : '') + '">' + metaInner + '</span>' + starBtn + rx + '</div>';
  const ap = el.querySelector('.aplayer');
  if (ap) { AudioCtl.paintNode(ap); AudioCtl.probe(ap.dataset.audio); if (ap.classList.contains('voice')) Waves.request(ap.dataset.audio); }
  return el;
}

/* ---------- Sticky date + jump buttons ---------- */
const stickyEl = $('sticky'), stickyPill = $('stickyPill'), fab = $('fab'), fabTop = $('fabTop');
function afterRender() {
  const n = S.items.length;
  if (!n || !VL.fw) { stickyEl.hidden = true; fab.hidden = true; fabTop.hidden = true; return; }
  const st = scroller.scrollTop, vh = scroller.clientHeight, total = VL.fw.sum(n);
  const i = VL.fw.find(st + 6);
  const di = S.dateIdx[i];
  const atDateRow = S.items[i].type === 'date' || (i + 1 < n && S.items[i + 1].type === 'date' && VL.fw.sum(i + 1) - st < 40);
  if (st > 20 && !atDateRow && di >= 0) { stickyPill.textContent = dateLabel(S.items[di].dateKey); stickyEl.hidden = false; }
  else stickyEl.hidden = true;
  fab.hidden = total - (st + vh) < 400;
  fabTop.hidden = st < vh * 3;
}
scroller.addEventListener('scroll', () => VL.schedule(), { passive: true });
new ResizeObserver(() => { if (Math.abs(layer.clientWidth - VL.width) > 1) VL.relayout(); else VL.schedule(); }).observe(scroller);
fab.addEventListener('click', () => VL.bottom());
function noteDims(el, w, h) {
  const name = el.dataset.dim;
  if (!name || !w || !h) return;
  Media.dims.set(name, { w, h });
  const box = el.closest('.mimg, .mvid');
  if (!box) return;
  const vid = box.classList.contains('mvid') && !box.classList.contains('gifv');
  const r = vid ? clampV(w / h) : clampR(w / h);
  if (Math.abs(parseFloat(box.dataset.r) - r) > 0.01) {
    if (vid) box.style.cssText = vBox(r); else box.style.aspectRatio = String(r);
    box.dataset.r = r;
    const row = el.closest('.row');
    if (row) VL.remeasure(+row.dataset.i);
  }
}
layer.addEventListener('load', e => { if (e.target.tagName === 'IMG') noteDims(e.target, e.target.naturalWidth, e.target.naturalHeight); }, true);
layer.addEventListener('loadedmetadata', e => { if (e.target.tagName === 'VIDEO') noteDims(e.target, e.target.videoWidth, e.target.videoHeight); }, true);
function pauseVideos(except) { layer.querySelectorAll('.mvid:not(.gifv) video').forEach(v => { if (v !== except && !v.paused) v.pause(); }); }
function vUI(v) {
  const box = v.closest('.mvid');
  if (!box || box.classList.contains('gifv')) return;
  const d = v.duration;
  box.classList.toggle('playing', !v.paused);
  if (!v.paused || v.currentTime > 0) box.classList.add('started');
  const vd = box.querySelector('.vdur');
  if (vd && isFinite(d) && d > 0) vd.textContent = fmtDur(d);
  const pp = box.querySelector('.vpp');
  pp.innerHTML = v.paused ? ICON.play : ICON.pause; pp.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
  box.querySelector('.vtime').textContent = (v.currentTime > 0 || !v.paused ? fmtDur(v.currentTime) + ' / ' : '') + fmtDur(d);
  box.querySelector('.vseek').value = isFinite(d) && d ? Math.round(v.currentTime / d * 1000) : 0;
  const mu = box.querySelector('.vmute');
  mu.innerHTML = v.muted ? ICON.mute : ICON.volume; mu.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
}
for (const t of ['timeupdate', 'play', 'pause', 'loadedmetadata', 'durationchange', 'volumechange', 'ended']) {
  layer.addEventListener(t, e => {
    const v = e.target;
    if (v.tagName !== 'VIDEO') return;
    if (t === 'play' && !v.closest('.gifv')) { pauseVideos(v); if (AudioCtl.el) AudioCtl.el.pause(); }
    if (t === 'loadedmetadata' && v.duration === Infinity && !v.dataset.fixdur) {
      // Recorder-made WebM files report no duration until the end is seeked once.
      v.dataset.fixdur = '1';
      v.addEventListener('durationchange', () => { v.currentTime = 0; }, { once: true });
      v.currentTime = 1e101;
    }
    vUI(v);
  }, true);
}
function toggleFullscreen(box) {
  const v = box.querySelector('video');
  if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
  const req = box.requestFullscreen || box.webkitRequestFullscreen;
  if (req) { const pr = req.call(box); if (pr && pr.catch) pr.catch(() => {}); }
  else if (v && v.webkitEnterFullscreen) v.webkitEnterFullscreen();
}
async function copyText(text, what) {
  what = what || 'Link';
  try { await navigator.clipboard.writeText(text); toast(what + ' copied'); return; } catch (e) { /* fall back */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? what + ' copied' : "Couldn't copy here. Select the text and copy it instead.");
}
let waveDrag = null;
layer.addEventListener('pointerdown', e => {
  const w = e.target.closest('.wave');
  if (!w) return;
  e.preventDefault();
  const name = w.closest('.aplayer').dataset.audio;
  const seek = ev => { const r = w.getBoundingClientRect(); AudioCtl.toggle(name, Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width))); };
  seek(e);
  waveDrag = { w, seek };
  try { w.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
layer.addEventListener('pointermove', e => { if (waveDrag && e.buttons) waveDrag.seek(e); });
layer.addEventListener('pointerup', () => { waveDrag = null; });
layer.addEventListener('click', e => {
  const t = e.target;
  const lc = t.closest('.lcopy');
  if (lc) { if (lc.dataset.copy) copyText(lc.dataset.copy, 'Coordinates'); else copyText(lc.dataset.url); return; }
  const box = t.closest('.mvid:not(.gifv)');
  if (box) {
    const v = box.querySelector('video');
    if (t.closest('.vmute')) { v.muted = !v.muted; return; }
    if (t.closest('.vfs')) { toggleFullscreen(box); return; }
    if (t.closest('.vseek')) return;
    if (t.closest('.vbig, .vpp') || t === v) { if (v.paused) v.play().catch(() => {}); else v.pause(); return; }
  }
  const ap = t.closest('.aplay');
  if (ap) { AudioCtl.toggle(ap.closest('.aplayer').dataset.audio); return; }
  if (t.closest('.aspeed')) { AudioCtl.speed(); return; }
  const im = t.closest('[data-lb]');
  if (im) { openLightbox(im.dataset.lb); return; }
  const pd = t.closest('[data-pdf]');
  if (pd) { const w = pd.closest('.mdocw'); openPdf(pd.dataset.pdf, w && w.querySelector('.mdoc b') ? w.querySelector('.mdoc b').textContent : ''); return; }
  const vc = t.closest('[data-vcard]');
  if (vc) { openContact(vc.dataset.vcard); return; }
  const sb = t.closest('[data-star]');
  if (sb) { toggleStar(+sb.dataset.star); return; }
  // Phones have no hover: tapping a bubble's plain area reveals its star button.
  if (matchMedia('(hover: none)').matches) {
    const row = t.closest('.row'), on = row && !t.closest('a,button,input,video,img,audio') && !row.classList.contains('tapped');
    layer.querySelectorAll('.row.tapped').forEach(r => r.classList.remove('tapped'));
    if (on && row.querySelector('.starbtn')) row.classList.add('tapped');
  }
});
layer.addEventListener('input', e => {
  const vs = e.target.closest('.vseek');
  if (vs) { const v = vs.closest('.mvid').querySelector('video'); if (isFinite(v.duration)) v.currentTime = vs.value / 1000 * v.duration; return; }
  const sk = e.target.closest('.aseek'); if (sk) AudioCtl.toggle(sk.closest('.aplayer').dataset.audio, sk.value / 1000);
});

/* ---------- Downloads ----------
   In the standalone file a plain <a download> saves the file. Inside the published Artifact viewer,
   downloads go through the viewer's "downloads" capability, which asks the person to confirm. */
let DL = null;
try { if (window.claude && window.claude.use) window.claude.use('downloads').then(ns => { DL = ns; }, () => {}); } catch (e) { /* standalone */ }
document.addEventListener('click', async ev => {
  const a = ev.target.closest('a[download]');
  if (!a || !DL) return;
  const e = Media.get(a.getAttribute('download'));
  if (!e) return;
  ev.preventDefault();
  try { await DL.save({ filename: e.name, data: e.blob }); }
  catch (err) {
    const code = err && err.code;
    if (code === 'rejected_extension' || code === 'extension_not_enabled') toast('.' + extOf(e.name) + " files can't be saved from this page. Open the standalone index.html to download it.");
    else if (code && code !== 'declined') toast("The file couldn't be saved here.");
  }
});

/* ---------- Photo viewer ---------- */
const LB = { k: -1, start: -1 };
function openLightbox(name) {
  const k = (S.images || []).findIndex(x => x.name === name);
  if (k < 0) return;
  LB.k = LB.start = k; LB.focus = document.activeElement;
  $('lb').hidden = false; showLb(); $('lbClose').focus();
}
function showLb() {
  const x = S.images[LB.k], m = S.msgs[x.i], e = Media.get(x.name);
  if (!e) return;
  $('lbImg').src = e.url; $('lbImg').alt = m.message || 'Photo';
  $('lbWho').textContent = m.isOutgoing ? 'You' : m.sender;
  $('lbWhen').textContent = dateLabel(m.dateKey) + ', ' + m.formattedTime;
  $('lbPos').textContent = (LB.k + 1) + ' / ' + S.images.length;
  $('lbCap').innerHTML = m.message ? formatText(m.message) : ''; $('lbCap').hidden = !m.message;
  const dl = $('lbDl'); dl.href = e.url; dl.setAttribute('download', e.name);
  zReset();
  $('lbPrev').disabled = LB.k <= 0; $('lbNext').disabled = LB.k >= S.images.length - 1;
}
function lbStep(d) { const k = LB.k + d; if (k < 0 || k >= S.images.length) return; LB.k = k; showLb(); }
function closeLightbox(silent) {
  const lb = $('lb');
  if (!lb || lb.hidden) return;
  lb.hidden = true; $('lbImg').removeAttribute('src');
  if (silent) return;
  if (LB.k !== LB.start && S.images[LB.k]) VL.scrollTo(S.m2i[S.images[LB.k].i], 'center');
  if (LB.focus && LB.focus.focus && document.contains(LB.focus)) LB.focus.focus();
}
$('lbClose').onclick = () => closeLightbox();
$('lbPrev').onclick = () => lbStep(-1);
$('lbNext').onclick = () => lbStep(1);
const stage = $('lbStage'), lbImg = $('lbImg');
const Z = { s: 1, x: 0, y: 0, r: 0 };
// Rotating by 90° swaps the photo's sides, so it is scaled to still fit the stage.
const zFit = () => { if (!(Z.r % 2) || !lbImg.offsetWidth) return 1; const aw = stage.clientWidth - (stage.clientWidth > 640 ? 140 : 0), ah = stage.clientHeight - 16; return Math.min(1, aw / lbImg.offsetHeight, ah / lbImg.offsetWidth); };
function zApply(animate) {
  stage.classList.toggle('anim', !!animate);
  lbImg.style.transform = 'translate(' + Z.x + 'px,' + Z.y + 'px) rotate(' + Z.r * 90 + 'deg) scale(' + Z.s * zFit() + ')';
  $('lbZoom').textContent = Math.round(Z.s * 100) + '%';
  stage.classList.toggle('zoomed', Z.s > 1.001);
  $('lbOut').disabled = Z.s <= 1.001; $('lbFit').disabled = Z.s <= 1.001; $('lbIn').disabled = Z.s >= 5.999;
}
function zClamp() {
  const f = Z.s * zFit(), w = (Z.r % 2 ? lbImg.offsetHeight : lbImg.offsetWidth) * f, h = (Z.r % 2 ? lbImg.offsetWidth : lbImg.offsetHeight) * f;
  const mx = Math.max(0, (w - stage.clientWidth) / 2), my = Math.max(0, (h - stage.clientHeight) / 2);
  Z.x = Math.max(-mx, Math.min(mx, Z.x)); Z.y = Math.max(-my, Math.min(my, Z.y));
}
function zTo(s, cx, cy, animate) { // cx, cy: client point that stays put
  const r = stage.getBoundingClientRect();
  const px = (cx === undefined ? r.left + r.width / 2 : cx) - (r.left + r.width / 2), py = (cy === undefined ? r.top + r.height / 2 : cy) - (r.top + r.height / 2);
  s = Math.max(1, Math.min(6, s));
  const k = s / Z.s;
  Z.x = px - (px - Z.x) * k; Z.y = py - (py - Z.y) * k; Z.s = s;
  if (s <= 1.001) { Z.s = 1; Z.x = 0; Z.y = 0; }
  zClamp(); zApply(animate);
}
function zReset() { Z.s = 1; Z.x = 0; Z.y = 0; Z.r = 0; zApply(false); }
function zRotate() { Z.r = (Z.r + 1) % 4; Z.x = 0; Z.y = 0; zClamp(); zApply(true); }
$('lbRot').onclick = zRotate;
$('lbIn').onclick = () => zTo(Z.s * 1.5, undefined, undefined, true);
$('lbOut').onclick = () => zTo(Z.s / 1.5, undefined, undefined, true);
$('lbFit').onclick = () => zTo(1, undefined, undefined, true);
stage.addEventListener('wheel', e => { e.preventDefault(); zTo(Z.s * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY, false); }, { passive: false });
lbImg.addEventListener('dblclick', e => zTo(Z.s > 1.001 ? 1 : 2.5, e.clientX, e.clientY, true));
lbImg.addEventListener('dragstart', e => e.preventDefault());
const ptrs = new Map();
let gest = null, moved = false;
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('.lb-nav')) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  moved = false;
  const p = [...ptrs.values()];
  if (p.length === 1) gest = { type: 'pan', sx: e.clientX, sy: e.clientY, x: Z.x, y: Z.y };
  else if (p.length === 2) gest = { type: 'pinch', d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), s: Z.s };
});
stage.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId) || !gest) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const p = [...ptrs.values()];
  if (gest.type === 'pinch' && p.length === 2) {
    moved = true;
    zTo(gest.s * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / gest.d, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, false);
  } else if (gest.type === 'pan') {
    const dx = e.clientX - gest.sx, dy = e.clientY - gest.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    if (Z.s > 1.001) { stage.classList.add('dragging'); Z.x = gest.x + dx; Z.y = gest.y + dy; zClamp(); zApply(false); }
  }
});
function endPtr(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  stage.classList.remove('dragging');
  if (gest && gest.type === 'pan' && Z.s <= 1.001) {
    const dx = e.clientX - gest.sx;
    if (Math.abs(dx) > 60) { lbStep(dx < 0 ? 1 : -1); moved = true; }
  }
  gest = ptrs.size === 1 ? (() => { const q = [...ptrs.values()][0]; return { type: 'pan', sx: q.x, sy: q.y, x: Z.x, y: Z.y }; })() : null;
}
stage.addEventListener('pointerup', endPtr);
stage.addEventListener('pointercancel', endPtr);
stage.addEventListener('click', e => { if (!moved && e.target === stage) closeLightbox(); });

fabTop.addEventListener('click', () => VL.scrollTo(0));

