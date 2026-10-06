"use strict";
/* =====================================================================
   Helpers
   ===================================================================== */
const $ = id => document.getElementById(id);
const root = document.documentElement;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = n => n.toLocaleString(I18N.locale());
/* Search folding: the index, the query and the highlights all go through fold(), so spelling variants
   match. NFKC and lower case, then Arabic vowel marks (harakat), the superscript alef, the tatweel and
   zero-width joiners are dropped, and Arabic letters map to the Urdu ones (ي ى → ی, ك → ک, ه ة → ہ). */
const FOLD_DROP = /[\u064B-\u065F\u0670\u0640\u200C\u200D]/g, FOLD_SWAP = /[\u064A\u0649\u0643\u0647\u0629]/g;
const FOLD_TO = { '\u064A': '\u06CC', '\u0649': '\u06CC', '\u0643': '\u06A9', '\u0647': '\u06C1', '\u0629': '\u06C1' };
const fold = s => s.normalize('NFKC').toLowerCase().replace(FOLD_DROP, '').replace(FOLD_SWAP, c => FOLD_TO[c]);
// fold() with a map back to the original: at[j] is where folded character j came from in s, and
// at[f.length] is s.length. A letter and the marks after it fold as one piece.
const RE_CLUSTER = /\P{M}\p{M}*|\p{M}+/gsu;
function foldMap(s) {
  let f = '', m; const at = [];
  RE_CLUSTER.lastIndex = 0;
  while ((m = RE_CLUSTER.exec(s))) { const o = fold(m[0]); for (let k = 0; k < o.length; k++) at.push(m.index); f += o; }
  at.push(s.length);
  return { f, at };
}
// Original [start, end) ranges of each place the folded query fq appears in s.
function foldFind(s, fq) {
  const out = []; if (!fq || !s) return out;
  const { f, at } = foldMap(s);
  for (let p = f.indexOf(fq); p >= 0; p = f.indexOf(fq, p + fq.length)) out.push([at[p], at[p + fq.length]]);
  return out;
}
// Marks the folded query in escaped HTML. Tags are left alone; entities count as the character they stand for.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0' };
function markHTML(html, fq, cls) {
  if (!fq) return html;
  const open = '<mark' + (cls ? ' class="' + cls + '"' : '') + '>';
  return html.split(/(<[^>]+>)/).map((part, k) => {
    if (k % 2 || !part) return part;
    let raw = ''; const pos = []; const re = /&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi; let last = 0, e;
    const plain = to => { for (let j = last; j < to; j++) { raw += part[j]; pos.push(j); } };
    while ((e = re.exec(part))) {
      plain(e.index);
      const n = e[1], ch = n[0] === '#' ? String.fromCodePoint(parseInt(n[1] === 'x' || n[1] === 'X' ? n.slice(2) : n.slice(1), n[1] === 'x' || n[1] === 'X' ? 16 : 10) || 0xFFFD) : ENT[n.toLowerCase()] || '\uFFFC';
      for (let j = 0; j < ch.length; j++) { raw += ch[j]; pos.push(e.index); }
      last = e.index + e[0].length;
    }
    plain(part.length); pos.push(part.length);
    const hits = foldFind(raw, fq); if (!hits.length) return part;
    let out = '', p = 0;
    for (const [a, b] of hits) { const x = pos[a], y = pos[b]; if (y <= x) continue; out += part.slice(p, x) + open + part.slice(x, y) + '</mark>'; p = y; }
    return out + part.slice(p);
  }).join('');
}
/* Dialogs: while one is open, everything else on the page is inert, so Tab, the screen reader and
   clicks stay inside it. They stack: a contact card opened from the gallery sits on top of it. */
const Dialogs = {
  stack: [],
  SKIP: new Set(['toast', 'loading', 'drop', 'tour', 'tourWelcome']),
  open(el) { if (!this.stack.includes(el)) this.stack.push(el); this.apply(); },
  close(el) { const k = this.stack.indexOf(el); if (k >= 0) this.stack.splice(k, 1); this.apply(); },
  any() { return this.stack.length > 0; },
  apply() {
    const top = this.stack[this.stack.length - 1], start = document.getElementById('start');
    for (const c of document.body.children) {
      if (c.tagName === 'SCRIPT' || c.tagName === 'INPUT' || this.SKIP.has(c.id)) continue;
      // #app stays inert behind the start screen whatever the dialogs do.
      c.inert = (!!top && c !== top) || (c.id === 'app' && start && !start.hidden);
    }
  }
};
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
  more: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="5.5" r="1.9" fill="currentColor"/><circle cx="12" cy="12" r="1.9" fill="currentColor"/><circle cx="12" cy="18.5" r="1.9" fill="currentColor"/></svg>',
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
// Links in raw text (link cards, the gallery): urlsIn() trims them the same way formatText does.
const RE_URL = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
const urlsIn = text => [...text.matchAll(RE_URL)].map(mm => trimUrl(mm[0])[0]).filter(u => !/^(?:https?:\/\/|www\.)$/i.test(u));
// formatText finds links in text that is already escaped, so a link stops at an escaped quote or bracket
// (&quot; &gt; &lt;), and trailing punctuation is left out. A closing ")" stays when the link opened one.
const RE_URL_ESC = /\b(?:https?:\/\/|www\.)(?:(?!&(?:quot|gt|lt);)[^\s<])+/gi;
function trimUrl(u) {
  let tail = '';
  for (;;) {
    const m = /(?:&amp;|[.,:;'!?*_~\]])$/.exec(u) || (u.endsWith(')') && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length ? [')'] : null);
    if (!m) return [u, tail];
    tail = m[0] + tail; u = u.slice(0, -m[0].length);
  }
}
function formatText(raw) {
  const keep = [];
  const hold = html => '\u0000' + (keep.push(html) - 1) + '\u0001';
  let s = esc(raw);
  s = s.replace(/```([\s\S]+?)```/g, (_, c) => hold('<code class="blk">' + c.replace(/^\n|\n$/g, '') + '</code>'));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => hold('<code>' + c + '</code>'));
  s = s.replace(RE_URL_ESC, all => {
    const [u, tail] = trimUrl(all);
    if (/^(?:https?:\/\/|www\.)$/i.test(u)) return all;
    return hold('<a href="' + (/^www\./i.test(u) ? 'https://' + u : u) + '" target="_blank" rel="noopener noreferrer">' + u + '</a>') + tail;
  });
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
      html += '<li value="' + m[1] + '">' + inline(m[2]) + '</li>';
    } else {
      closeList();
      html += inline(l) + (i < lines.length - 1 ? '<br>' : '');
    }
  }
  closeList();
  return html.replace(/\u0000(\d+)\u0001/g, (_, n) => keep[+n]).replace(/\u0000(\d+)\u0001/g, (_, n) => keep[+n]);
}
// Direction of a message's text, from its first letter: Urdu or Arabic reads right to left. The time
// sits where the text ends, so it doesn't cover the last line (css: .bubble.tltr / .trtl).
const RE_STRONG = /[A-Za-z\u00C0-\u02AF\u0370-\u03FF\u0400-\u052F]|[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/;
function textDir(s) { const m = RE_STRONG.exec(s); return m && m[0] >= '\u0590' ? 'rtl' : 'ltr'; }
// Each line of a message takes its own direction (css: .txt uses unicode-bidi: plaintext), so an English
// line followed by Urdu ones reads right. The time goes by the last line that has letters.
function endDir(s) {
  const ls = s.split('\n');
  for (let k = ls.length - 1; k >= 0; k--) if (RE_STRONG.test(ls[k])) return textDir(ls[k]);
  return 'ltr';
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
// Date labels follow the interface language (js/i18n/i18n.js); makeFormats() runs again when it changes.
// The date rows in the chat are chat content, so they use streamFmt, which is always English.
I18N.set(I18N.saved, true);
let dateFmt, shortFmt, dayFmt;
const dateCache = new Map(), streamCache = new Map();
const streamFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
function makeFormats() {
  const loc = I18N.locale();
  dateFmt = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  shortFmt = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  dayFmt = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  dateCache.clear();
}
makeFormats();
function dateLabel(dk) {
  let v = dateCache.get(dk);
  if (!v) { const [y, m, d] = dk.split('-').map(Number); v = dateFmt.format(Date.UTC(y, m - 1, d)); dateCache.set(dk, v); }
  return v;
}
function streamDate(dk) {
  let v = streamCache.get(dk);
  if (!v) { const [y, m, d] = dk.split('-').map(Number); v = streamFmt.format(Date.UTC(y, m - 1, d)); streamCache.set(dk, v); }
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
      else { const e = Media.get(a.name); h += extOf(a.name) === 'pdf' && !PdfView.failed.has(e ? e.name : a.name) ? 66 + 146 : 66; } // failed is keyed by the ZIP's file name
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
    const sv = shownText(it), ls = sv.text.split('\n');
    if (sv.state === 'expanded') h += 21;
    for (let k = 0; k < ls.length; k++) h += 19 * Math.max(1, Math.ceil((ls[k].length * cw + (k === ls.length - 1 ? 64 : 0)) / bw));
  } else if (m.kind !== 'text') h += 8;
  return h;
}

/* ---------- Row rendering ---------- */
function hl(html, i) {
  if (!S.fq || !S.matchSet.has(i)) return html;
  return markHTML(html, S.fq, S.matches[S.cur] === i ? 'cur' : '');
}
const TYPE_LABEL = { image: 'Photo', video: 'Video', audio: 'Audio', sticker: 'Sticker', gif: 'GIF', document: 'Document', contact: 'Contact card', media: 'Media' };
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
const typeLabel = ty => t('type.' + (TYPE_LABEL[ty] ? ty : 'media'));
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
        document.querySelectorAll('.aplayer[data-audio="' + CSS.escape(name) + '"] .atrack .wave').forEach(svg => { svg.outerHTML = waveSVG(name); });
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
      if (!e) { this.settle(name, null); continue; }
      const url = await makePoster(e);
      if (!url) continue;
      if (Media.get(name) !== e) { URL.revokeObjectURL(url); continue; }
      Media.posters.set(name, url);
      document.querySelectorAll('video[data-vid="' + CSS.escape(name) + '"]').forEach(v => { if (!v.getAttribute('poster')) v.setAttribute('poster', url); });
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
  const fail = '<div class="afail">' + esc(t('audio.cant_play', { ext: extOf(e.name) })) + ' <a href="' + e.url + '" download="' + esc(e.name) + '">' + t('audio.download_it') + '</a></div>';
  const play = '<button class="aplay" aria-label="' + t('audio.play') + '"></button>';
  if (isVoice(e.name)) {
    const who = m && m.sender ? m.sender : '';
    return '<div class="aplayer voice" data-audio="' + esc(e.name) + '">' + play +
      '<div class="atrack">' + waveSVG(e.name) + '<div class="arow"><span class="atime"></span><button class="aspeed" aria-label="' + t('audio.speed') + '"></button></div>' + fail + '</div>' +
      '<span class="av vav c' + colorIdx(who) + '" title="' + esc(who) + '">' + esc(initials(who)) + '<span class="vmic">' + ICON.audio + '</span></span></div>';
  }
  return '<div class="aplayer file" data-audio="' + esc(e.name) + '">' + play +
    '<div class="atrack"><span class="afname" title="' + esc(e.name) + '">' + esc(e.name) + '</span><input class="aseek" type="range" min="0" max="1000" value="0" aria-label="' + t('audio.seek') + '">' +
    '<div class="arow"><span class="atime"></span><button class="aspeed" aria-label="' + t('audio.speed') + '"></button></div>' + fail + '</div>' +
    '<span class="afile-ic">' + ICON.music + '</span></div>';
}
// Videos keep their real shape (portrait phone videos down to 9:16), capped at 400px tall like WhatsApp.
// With reduced motion turned on, GIFs start paused: a tap plays them (in the chat) or the photo viewer does.
const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null, reducedMotion = () => !!(RM && RM.matches);
const clampV = r => Math.min(1.9, Math.max(0.5625, r));
const vBox = r => 'aspect-ratio:' + r + ';width:' + Math.min(330, Math.round(400 * r)) + 'px';
function videoHTML(e, gif) {
  const d = Media.dims.get(e.name), r = d ? (gif ? clampR(d.w / d.h) : clampV(d.w / d.h)) : 16 / 9;
  if (gif) return '<div class="mvid gifv" data-r="' + r + '" style="aspect-ratio:' + r + '"><video src="' + e.url + '"' + (reducedMotion() ? '' : ' autoplay') + ' muted loop playsinline preload="auto" data-dim="' + esc(e.name) + '" data-bad="' + esc(e.name) + '"></video><span class="gifbadge">GIF</span></div>';
  const poster = Media.posters.get(e.name);
  if (poster === undefined) Posters.request(e.name);
  return '<div class="mvid" data-r="' + r + '" style="' + vBox(r) + '"><video src="' + e.url + '" preload="metadata" playsinline data-vid="' + esc(e.name) + '" data-dim="' + esc(e.name) + '" data-bad="' + esc(e.name) + '"' + (poster ? ' poster="' + poster + '"' : '') + '></video>' +
    '<button class="vbig" aria-label="' + t('video.play') + '">' + ICON.play + '</button>' +
    '<span class="vbadge">' + ICON.video + '<span class="vdur">' + fmtSize(e.size) + '</span></span>' +
    '<div class="vctl"><button class="vpp" aria-label="' + t('video.play') + '">' + ICON.play + '</button><input class="vseek" type="range" min="0" max="1000" value="0" aria-label="' + t('video.seek') + '"><span class="vtime">–:––</span>' +
    '<button class="vmute" aria-label="' + t('video.mute') + '">' + ICON.volume + '</button><button class="vfs" aria-label="' + t('video.full') + '">' + ICON.full + '</button></div></div>';
}
const DX = { pdf: 'pdf', doc: 'doc', docx: 'doc', rtf: 'doc', odt: 'doc', pages: 'doc', xls: 'xls', xlsx: 'xls', csv: 'xls', ods: 'xls', numbers: 'xls', ppt: 'ppt', pptx: 'ppt', key: 'ppt', odp: 'ppt', zip: 'zip', rar: 'zip', '7z': 'zip', gz: 'zip', txt: 'txt', md: 'txt', json: 'txt', log: 'txt' };
function docHTML(e, type, a) {
  if (type === 'contact') return contactHTML(e);
  const ext = extOf(e.name), label = (ext || 'file').toUpperCase().slice(0, 4), pdf = ext === 'pdf';
  const title = (a && a.title) || e.name;
  const pages = pdf ? PdfView.pages.get(e.name) : 0;
  const detail = pages ? t('doc.pages', { n: pages }) : (a && a.detail) || '';
  const info = (detail ? esc(detail) + ' · ' : '') + esc(label) + ' · ' + fmtSize(e.size);
  const main = pdf
    ? '<button class="mdoc-main" data-pdf="' + esc(e.name) + '" aria-label="' + esc(t('doc.open', { name: title })) + '">'
    : '<a class="mdoc-main" href="' + e.url + '" target="_blank" rel="noopener">';
  const row = '<div class="mdoc">' + main + '<span class="dext dx-' + (DX[ext] || 'other') + '">' + esc(label) + '</span>' +
    '<span class="attt"><b dir="auto" title="' + esc(title) + '">' + esc(title) + '</b><small class="dinfo">' + info + '</small></span>' + (pdf ? '</button>' : '</a>') +
    '<a class="dl" href="' + e.url + '" download="' + esc(e.name) + '" aria-label="' + esc(t('doc.download_name', { name: title })) + '" title="' + t('doc.download') + '">' + ICON.download.replace('width="22" height="22"', 'width="20" height="20"') + '</a></div>';
  if (!pdf) return row;
  const thumb = Media.thumbs.get(e.name);
  if (thumb === undefined) PdfView.thumb(e.name);
  if (thumb === null && Media.thumbs.has(e.name) && PdfView.failed.has(e.name)) return '<div class="mdocw">' + row + '</div>';
  return '<div class="mdocw"><button class="pdfprev" data-pdf="' + esc(e.name) + '" aria-label="' + esc(t('doc.open', { name: title })) + '">' +
    (thumb ? '<img src="' + thumb + '" alt="">' : '<span class="pdfph">' + ICON.document + '</span>') + '</button>' + row + '</div>';
}

/* ---------- Contact cards (.vcf) ----------
   The vCard is read from the ZIP and parsed here. WhatsApp joins several contacts with
   "_$!<VCard-Separator>!$_" and writes multi-line values without folding, so the parser is lenient. */
const VC_PROP = /^(?:[A-Za-z0-9-]+\.)?(VERSION|N|FN|TEL|EMAIL|ORG|TITLE|ROLE|PHOTO|ADR|URL|NOTE|BDAY|NICKNAME|CATEGORIES|LABEL|REV|UID|PRODID|IMPP|GEO|TZ|SOUND|LOGO|KEY|SOURCE|KIND|X-[A-Za-z0-9-]+)((?:;[^:\n]*)?):(.*)$/i;
// Phone labels are stored as keys and translated when shown (custom labels from the card are shown as written).
const VC_TEL = { CELL: 'vc.mobile', MOBILE: 'vc.mobile', IPHONE: 'vc.iphone', HOME: 'vc.home', WORK: 'vc.work', MAIN: 'vc.main', FAX: 'vc.fax', PAGER: 'vc.pager', OTHER: 'vc.other' };
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
        c.phones.push({ value: v, label: labels.get(p.group) || VC_TEL[t.find(x => VC_TEL[x])] || 'vc.phone', wa: !!wa });
      }
      else if (p.name === 'EMAIL' && v) c.emails.push(v);
      else if (p.name === 'URL' && v) c.urls.push(v);
      else if (p.name === 'ORG') c.org = v.split(';').filter(Boolean).join(' · ');
      else if (p.name === 'TITLE') c.title = v;
      else if (p.name === 'X-WA-BIZ-NAME') c.biz = v;
      else if (p.name === 'X-WA-BIZ-DESCRIPTION' || p.name === 'NOTE') c.about = c.about || v;
      else if (p.name === 'PHOTO') {
        let b64 = p.raw.replace(/\s+/g, ''), kind = (/TYPE=(JPE?G|PNG|GIF|WEBP)/i.exec(p.params) || [, 'JPEG'])[1].toLowerCase().replace('jpg', 'jpeg');
        const uri = /^data:image\/(jpe?g|png|gif|webp);base64,(.*)$/i.exec(b64); // vCard 4 writes the photo as a data: URI
        if (uri) { kind = uri[1].toLowerCase().replace('jpg', 'jpeg'); b64 = uri[2]; }
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
  q: [], busy: false, waits: new Map(),
  request(name) { if (Media.cards.has(name)) return; Media.cards.set(name, null); this.q.push(name); this.pump(); },
  // Resolves with the parsed card once it is read (or null if it can't be), however busy the queue is.
  ready(name) {
    const got = Media.cards.get(name);
    if (got) return Promise.resolve(got);
    return new Promise(res => { (this.waits.get(name) || this.waits.set(name, []).get(name)).push(res); this.request(name); });
  },
  settle(name, list) { const w = this.waits.get(name); if (w) { this.waits.delete(name); w.forEach(f => f(list)); } },
  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.q.length) {
      const name = this.q.shift(), e = Media.get(name);
      if (!e) continue;
      let list = [];
      try { if (e.size < 8e6) list = parseVCards(await e.blob.text()); } catch (err) { /* keep the file-name card */ }
      if (Media.get(name) !== e) { this.settle(name, null); continue; } // a different chat was opened meanwhile
      Media.cards.set(name, list);
      this.settle(name, list);
      document.querySelectorAll('.vcard[data-vcf="' + CSS.escape(name) + '"]').forEach(el => {
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
    sub = more ? t('vc.more_contacts', { n: more }) : c.phones.length ? c.phones[0].value : c.emails[0] || (c.biz ? t('vc.business') : t('vc.contact_card'));
  } else {
    name = vcFileName(e.name); sub = t('vc.contact_card'); av = '<span class="av vc-av c' + colorIdx(name) + '">' + ICON.contact + '</span>';
  }
  const many = list && list.length > 1;
  return '<div class="vcard" data-vcf="' + esc(e.name) + '"><button class="vc-main" data-vcard="' + esc(e.name) + '" aria-label="' + t('vc.view_contact') + '">' + av +
    '<span class="attt"><b title="' + esc(name) + '" dir="auto">' + esc(name) + '</b><small><bdi>' + esc(sub) + '</bdi></small></span></button>' +
    '<div class="vc-acts"><button data-vcard="' + esc(e.name) + '">' + (many ? t('vc.view_all') : t('vc.view_contact')) + '</button>' +
    '<a href="' + e.url + '" download="' + esc(e.name) + '">' + t('vc.save') + '</a></div></div>';
}
function openContact(name) {
  const e = Media.get(name);
  if (!e) return;
  const list = Media.cards.get(name);
  if (!list) { Cards.ready(name).then(l => { if (l) openContact(name); }); return; }
  $('vcTitle').textContent = list.length > 1 ? t('vc.n_contacts', { n: nf(list.length) }) : t('vc.contact');
  $('vcBody').innerHTML = list.length ? list.map(c =>
    '<section class="vc-one">' + vcAvatar(c, 'big') + '<div class="vc-name"><b dir="auto">' + esc(c.name) + '</b>' +
      (c.biz ? '<small>' + ICON.check + t('vc.business') + (c.biz !== c.name ? ' · ' + esc(c.biz) : '') + '</small>' : '') +
      (c.org || c.title ? '<small>' + esc([c.title, c.org].filter(Boolean).join(' · ')) + '</small>' : '') + '</div>' +
      c.phones.map(p => '<div class="vc-row"><span class="vc-ic">' + ICON.phone + '</span><span class="vc-v"><a href="tel:' + esc(p.value.replace(/[^\d+*#]/g, '')) + '"><bdi>' + esc(p.value) + '</bdi></a><small>' + esc(/^vc\./.test(p.label) ? t(p.label) : p.label) + (p.wa ? ' · ' + t('vc.on_whatsapp') : '') + '</small></span><button class="ibtn vc-copy" data-what="' + t('vc.number') + '" data-copy="' + esc(p.value) + '" aria-label="' + t('vc.copy_number') + '" title="' + t('vc.copy_number') + '">' + ICON.copy + '</button></div>').join('') +
      c.emails.map(m => '<div class="vc-row"><span class="vc-ic">' + ICON.mail + '</span><span class="vc-v"><a href="mailto:' + esc(m) + '"><bdi>' + esc(m) + '</bdi></a><small>' + t('vc.email') + '</small></span><button class="ibtn vc-copy" data-what="' + t('vc.email') + '" data-copy="' + esc(m) + '" aria-label="' + t('vc.copy_email') + '" title="' + t('vc.copy_email') + '">' + ICON.copy + '</button></div>').join('') +
      c.urls.map(u => { const s = safeUrl(u); return s ? '<div class="vc-row"><span class="vc-ic">' + ICON.link + '</span><span class="vc-v"><a href="' + esc(s) + '" target="_blank" rel="noopener noreferrer"><bdi>' + esc(u) + '</bdi></a><small>' + t('vc.website') + '</small></span></div>' : ''; }).join('') +
      (c.about ? '<div class="vc-about txt">' + formatText(c.about) + '</div>' : '') +
    '</section>').join('') : '<p class="lead">' + t('vc.no_details') + '</p>';
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
  $('pdfTitle').textContent = title || e.name; $('pdfInfo').textContent = t('pdf.opening');
  const dl = $('pdfDl'); dl.href = e.url; dl.setAttribute('download', e.name);
  const box = $('pdfPages'); box.innerHTML = ''; box.scrollTop = 0;
  $('pdfv').hidden = false; Dialogs.open($('pdfv')); $('pdfClose').focus();
  const gen = PV.gen;
  try {
    const doc = await PdfView.doc(name);
    if (gen !== PV.gen) return;
    const v1 = (await doc.getPage(1)).getViewport({ scale: 1 });
    $('pdfInfo').textContent = t('doc.pages', { n: doc.numPages });
    PdfView.pages.set(name, doc.numPages);
    let html = '';
    for (let i = 1; i <= doc.numPages; i++) html += '<div class="pdfpage" data-p="' + i + '" style="aspect-ratio:' + (v1.width / v1.height).toFixed(4) + '"><span class="pdfpn">' + i + '</span></div>';
    box.innerHTML = html;
    pdfZoom(0);
  } catch (err) {
    if (gen !== PV.gen) return;
    const pw = err && err.name === 'PasswordException';
    $('pdfInfo').textContent = '';
    box.innerHTML = '<div class="pdferr">' + ICON.warn + '<b>' + (pw ? t('pdf.locked') : t('pdf.failed')) + '</b><small>' + t('pdf.still_download') + '</small></div>';
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
  $('pdfv').hidden = true; Dialogs.close($('pdfv')); $('pdfPages').innerHTML = '';
}
// A file card for media the browser can't show: what it is, its size and a download button.
function cantShowHTML(e, type) {
  const ext = extOf(e.name), label = (ext || 'file').toUpperCase().slice(0, 4);
  const kind = ext === 'was' ? t('type.animated_sticker') : TYPE_LABEL[type] ? typeLabel(type) : t('common.file');
  return '<div class="mdoc nosee"><a class="mdoc-main" href="' + e.url + '" download="' + esc(e.name) + '"><span class="dext dx-other">' + esc(label) + '</span>' +
    '<span class="attt"><b dir="auto" title="' + esc(e.name) + '">' + esc(kind) + '</b><small class="dinfo">' + esc(label) + ' · ' + fmtSize(e.size) + '</small>' +
    '<small class="alert" dir="auto">' + ICON.warn + esc(t('att.cant_show')) + '</small></span></a>' +
    '<a class="dl" href="' + e.url + '" download="' + esc(e.name) + '" aria-label="' + esc(t('doc.download_name', { name: e.name })) + '" title="' + t('doc.download') + '">' + ICON.download.replace('width="22" height="22"', 'width="20" height="20"') + '</a></div>';
}
function attHTML(a, m) {
  const e = a.url ? Media.get(a.name) : null;
  if (e && Media.cantShow(e.name) && /^(image|gif|sticker|video)$/.test(a.type)) return cantShowHTML(e, a.type);
  if (e && isWas(e.name)) return '<div class="sticker lottie" data-was="' + esc(e.name) + '" role="img" aria-label="' + esc(t('type.animated_sticker')) + '"></div>';
  if (e) {
    const vid = VIDEO_EXT.test(extOf(e.name));
    if (a.type === 'gif' && vid) return videoHTML(e, true);
    if (a.type === 'image' || a.type === 'gif') {
      const d = Media.dims.get(e.name), r = d ? clampR(d.w / d.h) : 4 / 3;
      return '<button class="mimg" data-lb="' + esc(e.name) + '" data-r="' + r + '" style="aspect-ratio:' + r + '" aria-label="' + t('media.open_photo') + '"><img src="' + e.url + '" alt="" loading="lazy" decoding="async" data-dim="' + esc(e.name) + '" data-bad="' + esc(e.name) + '">' + (a.type === 'gif' ? '<span class="gifbadge">GIF</span>' : '') + '</button>';
    }
    if (a.type === 'sticker') return '<img class="sticker" src="' + e.url + '" alt="' + t('type.sticker') + '" loading="lazy" data-bad="' + esc(e.name) + '">';
    if (a.type === 'video') return videoHTML(e, false);
    if (a.type === 'audio') return audioHTML(e, m);
    return docHTML(e, a.type, a);
  }
  const missing = !!a.name && !a.omitted;
  const kind = a.note ? t('type.video_note') : a.type === 'audio' && a.name && isVoice(a.name) ? t('type.voice') : TYPE_LABEL[a.type] ? typeLabel(a.type) : t('common.file');
  // An omitted file with no name shows WhatsApp's own words ("video omitted"), as exported.
  const title = a.name || (a.raw ? capFirst(a.raw.replace(/^<|>$/g, '')) : kind + (a.viewOnce ? ' · ' + t('type.view_once') : ''));
  const alert = t(!missing ? 'att.omitted' : Media.pending.has(Media.key(a.name)) ? 'att.loading' : S.source && S.source.zip ? 'att.not_in_zip' : 'att.text_only');
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
  [/(^|\.)spotify\.com$/, 'Spotify', '#1a9e4b'], [/^chat\.whatsapp\.com$/, 'site.wa_group', '#128c7e'], [/(^|\.)wa\.me$/, 'site.wa_chat', '#128c7e'],
  [/^(maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)$/, 'Google Maps', '#1e8e3e'], [/^(docs|drive)\.google\.com$/, 'Google Docs', '#1a73e8'],
  [/(^|\.)amazon\.[a-z.]+$/, 'Amazon', '#b86e00'], [/(^|\.)t\.me$/, 'Telegram', '#2481cc'], [/(^|\.)stackoverflow\.com$/, 'Stack Overflow', '#d16a14'],
];
function safeUrl(u) {
  try { const x = new URL(/^www\./i.test(u) ? 'https://' + u : u); return x.protocol === 'http:' || x.protocol === 'https:' ? x : null; } catch (e) { return null; }
}
// The site's name and badge colour, and a short address, all worked out from the URL itself.
function siteOf(x) {
  const host = x.hostname.replace(/^www\./, ''), site = SITES.find(sv => sv[0].test(host));
  const shown = (host + x.pathname + x.search).replace(/\/$/, '');
  return { name: site ? (/^site\./.test(site[1]) ? t(site[1]) : site[1]) : host, color: site ? site[2] : 'var(--n' + colorIdx(host) + ')', shown: shown.length > 70 ? shown.slice(0, 68) + '…' : shown };
}
function linkCards(text) {
  const urls = [];
  for (const u of urlsIn(text)) { const x = safeUrl(u); if (x && !urls.some(u => u.href === x.href)) urls.push(x); }
  if (!urls.length) return '';
  const x = urls[0], { name, color, shown } = siteOf(x);
  return '<div class="lcard"><a class="lmain" href="' + esc(x.href) + '" target="_blank" rel="noopener noreferrer"><span class="lbadge" style="background:' + color + '">' + esc((name[0] || '?').toUpperCase()) + '</span>' +
    '<span class="ltxt"><b>' + esc(name) + '</b><small title="' + esc(x.href) + '">' + esc(shown) + '</small></span></a>' +
    '<button class="lcopy" data-url="' + esc(x.href) + '" aria-label="' + t('link.copy') + '" title="' + t('link.copy') + '">' + ICON.copy + '</button></div>' +
    (urls.length > 1 ? '<div class="lmore">' + t('link.more', { n: urls.length - 1 }) + '</div>' : '');
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
  const info = '<span class="linfo"><span class="atti">' + ICON.pin + '</span><span class="ltx"><b>' + (x.live ? t('loc.live') : t('loc.location')) + '</b><small>' +
    (has ? '<bdi>' + esc(coord) + '</bdi>' : x.live ? t('loc.not_exported') : t('loc.open_maps')) + '</small></span></span>';
  if (!x.url) return '<div class="loc nolink">' + map + info + '</div>';
  return '<div class="locw"><a class="loc" href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer" title="' + t('loc.open_maps') + '">' + map + info + '</a>' +
    (has ? '<button class="lcopy" data-copy="' + esc(coord) + '" aria-label="' + t('loc.copy') + '" title="' + t('loc.copy') + '">' + ICON.copy + '</button>' : '') + '</div>';
}
/* Which text a bubble shows. state: '' (short message), 'collapsed', 'expanded' (by the reader),
   or 'search' (opened because a search match is in the hidden part). */
function shownText(it) {
  const m = it.m;
  if (it.jumbo || !m.message) return { text: m.message, state: '' };
  if (m.trunc === undefined) m.trunc = truncateText(m.message);
  const tr = m.trunc;
  if (!tr.truncated) return { text: m.message, state: '' };
  if (m.isExpanded) return { text: m.message, state: 'expanded' };
  // A match that runs past the cut shows the whole message.
  if (S.fq && S.matchSet.has(it.i) && foldFind(m.message, S.fq).some(([, b]) => b > tr.cut)) return { text: m.message, state: 'search' };
  return { text: tr.preview, state: 'collapsed' };
}
// A photo, sticker or video the browser can't decode is remembered and its row redrawn with a file card.
// error doesn't bubble, so one listener in the capture phase covers every row.
layer.addEventListener('error', e => {
  const el = e.target, n = el.dataset && el.dataset.bad;
  if (!n || !el.getAttribute('src') || Media.cantShow(n)) return;
  const f = Media.get(n); if (!f || el.getAttribute('src') !== f.url) return; // a late error from a closed chat
  Media.bad.add(Media.key(n));
  const row = el.closest('[data-i]');
  if (row) rerenderRow(+row.dataset.i);
}, true);
// An animated sticker that couldn't be played (see Was) is redrawn the same way.
layer.addEventListener('media-bad', e => { const row = e.target.closest('[data-i]'); if (row) rerenderRow(+row.dataset.i); });

/* ---------- iPhone animated stickers (.was) ----------
   A .was file is a ZIP holding a Lottie animation (JSON). It is played with the bundled lottie-web
   light build (js/vendor/lottie: SVG only, no expressions, so nothing in the file runs as code), loaded
   only when a chat has one. Image and font paths in the animation are dropped, so it never fetches
   anything. If it can't be read, the sticker falls back to the file card. */
const isWas = n => extOf(n) === 'was';
const Was = {
  lib: null, data: new Map(), live: new Set(),
  load() {
    if (!this.lib) this.lib = new Promise((res, rej) => {
      if (window.lottie) return res(window.lottie);
      const s = document.createElement('script');
      s.src = 'js/vendor/lottie/lottie_light.min.js';
      s.onload = () => window.lottie ? res(window.lottie) : rej(new Error('Sticker player missing'));
      s.onerror = () => { this.lib = null; rej(new Error('Sticker player could not load')); };
      document.head.appendChild(s);
    });
    return this.lib;
  },
  // The animation's JSON text, from the ZIP (or a bare or gzipped JSON file), cached per file.
  json(name) {
    const k = Media.key(name);
    if (!this.data.has(k)) this.data.set(k, (async () => {
      const e = Media.get(name); if (!e) throw new Error('missing');
      const head = new Uint8Array(await e.blob.slice(0, 2).arrayBuffer());
      let txt;
      if (head[0] === 0x50 && head[1] === 0x4B) {
        const zip = await JSZip.loadAsync(e.blob), files = Object.values(zip.files).filter(f => !f.dir && /\.json$/i.test(f.name) && !/metadata/i.test(f.name));
        files.sort((a, b) => (/(^|\/)animation\.json$/i.test(b.name) ? 1 : 0) - (/(^|\/)animation\.json$/i.test(a.name) ? 1 : 0));
        if (!files.length) throw new Error('no animation');
        txt = await files[0].async('string');
      } else if (head[0] === 0x1F && head[1] === 0x8B && window.DecompressionStream) {
        txt = await new Response(e.blob.stream().pipeThrough(new DecompressionStream('gzip'))).text();
      } else txt = await e.blob.text();
      const d = JSON.parse(txt);
      if (!d || !Array.isArray(d.layers) || !(d.w > 0) || !(d.h > 0)) throw new Error('not a Lottie animation');
      // Nothing may be fetched: keep only embedded images, and no font files.
      if (Array.isArray(d.assets)) for (const a of d.assets) if (a && typeof a.p === 'string' && !a.layers && !/^data:image\//.test(a.p)) { a.u = ''; a.p = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; a.e = 1; }
      if (d.fonts && Array.isArray(d.fonts.list)) d.fonts.list = d.fonts.list.map(f => ({ fName: f.fName, fFamily: f.fFamily, fStyle: f.fStyle, ascent: f.ascent }));
      return JSON.stringify(d);
    })());
    return this.data.get(k);
  },
  // Starts every sticker placeholder in root; stops the ones the virtual list has removed.
  mount(root) {
    for (const box of root.querySelectorAll('.lottie[data-was]')) {
      if (box.dataset.on) continue;
      box.dataset.on = '1';
      const n = box.dataset.was;
      Promise.all([this.load(), this.json(n)]).then(([L, txt]) => {
        if (!box.isConnected) return;
        box.anim = L.loadAnimation({ container: box, renderer: 'svg', loop: true, autoplay: !reducedMotion(), animationData: JSON.parse(txt), rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
        this.live.add(box); this.sweep();
      }).catch(() => {
        if (Media.cantShow(n) || !Media.get(n)) return;
        Media.bad.add(Media.key(n));
        if (box.isConnected) box.dispatchEvent(new CustomEvent('media-bad', { bubbles: true }));
      });
    }
  },
  sweep() { for (const b of this.live) if (!b.isConnected) { try { b.anim.destroy(); } catch (e) {} this.live.delete(b); } },
  reset() { for (const b of this.live) { try { b.anim.destroy(); } catch (e) {} } this.live.clear(); this.data.clear(); }
};
// Re-renders one visible row in place and lets the virtual list re-measure it.
function rerenderRow(k) {
  const old = VL.nodes.get(k);
  if (!old) return null;
  const el = makeRow(S.items[k], k);
  el.dataset.i = k; el.style.transform = old.style.transform;
  old.replaceWith(el); VL.nodes.set(k, el);
  el.dispatchEvent(new CustomEvent('message-resize', { bubbles: true, detail: { index: k } }));
  return el;
}
function toggleExpand(i) {
  const m = S.msgs[i], k = S.m2i[i];
  m.isExpanded = !m.isExpanded;
  const el = rerenderRow(k);
  if (!el) return;
  const b = el.querySelector('.read-more-btn');
  if (b) b.focus({ preventScroll: true });
  // After "Show less" on a very long message, bring the message's start back into view.
  if (!m.isExpanded && el.getBoundingClientRect().top < scroller.getBoundingClientRect().top) VL.scrollTo(k);
}
function makeRow(it, idx) {
  const el = document.createElement('div');
  if (it.type === 'date') { el.className = 'row daterow'; el.innerHTML = '<span class="pill">' + esc(streamDate(it.dateKey)) + '</span>'; return el; }
  const m = it.m;
  if (it.type === 'sys') {
    const k = sysKind(m.message);
    el.className = 'row sysrow';
    el.innerHTML = '<span dir="auto" class="pill ' + k.cls + '" data-sys="' + k.kind + '">' + (k.icon ? ICON[k.icon] : '') + hl(esc(m.message), it.i) + '</span>';
    return el;
  }
  const grp = S.isGroup && !m.isOutgoing, starred = S.starred && S.starred.has(it.i), reacts = m.reactions && m.reactions.length;
  el.className = 'row ' + (m.isOutgoing ? 'out' : 'in') + (it.first ? ' first' : '') + (grp ? ' grp' : '') + (reacts ? ' hasr' : '');
  let body = '';
  if (it.showName) body += '<div dir="auto" class="name nc' + colorIdx(m.sender) + '">' + hl(esc(m.sender), it.i) + '</div>';
  const metaInner = (starred ? '<span class="stard" title="' + t('msg.starred') + '">' + ICON.starFill + '</span>' : '') + (m.edited ? '<span class="edtag">' + t('msg.edited') + '</span>' : '') + '<span dir="ltr">' + m.formattedTime + '</span>';
  const space = '<span class="mspace' + (m.edited ? ' e' : '') + '"></span>';
  let tailText = true, visual = false, overlay = false, stk = false;
  switch (m.kind) {
    case 'deleted':
      body += '<div class="txt del">' + ICON.ban + '<span>' + esc(m.message) + space + '</span></div>'; tailText = false; break;
    case 'call': {
      const x = m.extra;
      body += '<div class="call' + (x.missed ? ' missed' : '') + '"><span class="ci">' + (x.video ? ICON.video : ICON.phone) + '</span><div><b>' + esc(capFirst(x.label)) + '</b>' + (x.detail ? '<small>' + esc(x.detail) + '</small>' : '') + '</div></div>';
      break;
    }
    case 'poll': {
      const x = m.extra, total = x.options.reduce((a, o) => a + o.votes, 0);
      body += '<div class="poll"><div class="pq">' + ICON.poll + '<span dir="auto">' + hl(formatText(x.q), it.i) + '</span></div>' + x.options.map(o =>
        '<div class="po"><div class="pol"><span dir="auto">' + hl(esc(o.label), it.i) + '</span><span>' + o.votes + '</span></div><div class="pbar"><i style="width:' + (total ? Math.round(o.votes / total * 100) : 0) + '%"></i></div></div>').join('') +
        '<small>' + t('msg.poll_votes', { n: total }) + '</small></div>';
      break;
    }
    case 'unsupported':
      body += '<div class="unsup"><span class="atti">' + ICON.event + '</span><span class="attt"><b>' + t('msg.event_title') + '</b><small>' + t('msg.event_note') + '</small></span></div>';
      break;
    case 'location':
      body += locHTML(m.extra);
      break;
    case 'media': {
      body += m.attachments.map(a => attHTML(a, m)).join('');
      const a0 = m.attachments[0];
      if (a0 && a0.url && !Media.cantShow(a0.name)) {
        if (a0.type === 'sticker' && !m.message) { stk = true; tailText = false; }
        else if (a0.type === 'image' || a0.type === 'gif') { visual = true; if (!m.message) { overlay = true; tailText = false; } }
        else if (a0.type === 'video') { visual = true; if (!m.message) { overlay = true; tailText = false; } }
      }
      break;
    }
  }
  let endTxt = m.message;
  if (tailText) {
    if (m.message && m.kind !== 'poll' && m.kind !== 'call') {
      const sv = shownText(it); endTxt = sv.text; const btn = (label, open) => '<button class="read-more-btn" data-more="' + it.i + '" aria-expanded="' + open + '">' + label + '</button>';
      const more = sv.state === 'collapsed' ? '<span class="rm-tail">…' + btn(t('message.read_more'), false) + '</span>' : sv.state === 'expanded' ? '<div class="rm-less">' + btn(t('message.show_less'), true) + '</div>' : '';
      body += '<div dir="auto" class="txt' + (it.jumbo ? ' jumbo' : '') + (sv.state ? ' trunc' : '') + '">' + hl(formatText(sv.text), it.i) + more + (it.hasLink ? '' : space) + '</div>' + (it.hasLink ? linkCards(m.message) + '<div class="mline"></div>' : '');
    }
    else body += '<div class="mline"></div>';
  }
  if (stk) el.className += ' stk';
  const starBtn = '<button class="starbtn" data-star="' + it.i + '" aria-pressed="' + starred + '" aria-label="' + (starred ? t('msg.unstar') : t('msg.star')) + '" title="' + (starred ? t('msg.unstar_short') : t('msg.star_short')) + '">' + ICON.star + '</button>';
  let rx = '';
  if (reacts) {
    const g = new Map();
    for (const r of m.reactions) g.set(r.emoji, (g.get(r.emoji) || []).concat(r.by === S.me ? t('common.you') : r.by || ''));
    const tip = [...g].map(([e, who]) => e + ' ' + who.join(', ')).join('; ');
    rx = '<span class="reacts" title="' + esc(tip) + '" aria-label="' + esc(t('msg.reactions', { list: tip })) + '">' + [...g.keys()].slice(0, 3).map(esc).join('') + (m.reactions.length > 1 ? '<b>' + m.reactions.length + '</b>' : '') + '</span>';
  }
  const av = grp && it.first ? '<span class="av rav c' + colorIdx(m.sender) + '" aria-hidden="true">' + esc(initials(m.sender)) + '</span>' : '';
  el.innerHTML = av + '<div class="bubble' + (visual ? ' mb' : '') + (m.message && m.kind !== 'poll' ? ' t' + endDir(endTxt) : '') + '">' + body + '<span class="meta' + (overlay ? ' ov' : '') + '">' + metaInner + '</span>' + starBtn + rx + '</div>';
  const ap = el.querySelector('.aplayer');
  if (ap) { AudioCtl.paintNode(ap); AudioCtl.probe(ap.dataset.audio); if (ap.classList.contains('voice')) Waves.request(ap.dataset.audio); }
  if (stk) Was.mount(el);
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
  if (st > 20 && !atDateRow && di >= 0) { stickyPill.textContent = streamDate(S.items[di].dateKey); stickyEl.hidden = false; }
  else stickyEl.hidden = true;
  fab.hidden = total - (st + vh) < 400;
  fabTop.hidden = st < vh * 3;
}
// The floating date shows while you scroll and fades out shortly after, as in WhatsApp, so it doesn't
// sit on top of the first message once you stop.
let stickyTimer = 0;
scroller.addEventListener('scroll', () => {
  VL.schedule();
  stickyEl.classList.add('on');
  clearTimeout(stickyTimer); stickyTimer = setTimeout(() => stickyEl.classList.remove('on'), 1500);
}, { passive: true });
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
function pauseVideos(except) { [...layer.querySelectorAll('.mvid:not(.gifv) video'), $('lbVid')].forEach(v => { if (v !== except && !v.paused) v.pause(); }); }
function vUI(v) {
  const box = v.closest('.mvid');
  if (!box || box.classList.contains('gifv')) return;
  const d = v.duration;
  box.classList.toggle('playing', !v.paused);
  if (!v.paused || v.currentTime > 0) box.classList.add('started');
  const vd = box.querySelector('.vdur');
  if (vd && isFinite(d) && d > 0) vd.textContent = fmtDur(d);
  const pp = box.querySelector('.vpp');
  pp.innerHTML = v.paused ? ICON.play : ICON.pause; pp.setAttribute('aria-label', v.paused ? t('video.play') : t('video.pause'));
  box.querySelector('.vtime').textContent = (v.currentTime > 0 || !v.paused ? fmtDur(v.currentTime) + ' / ' : '') + fmtDur(d);
  box.querySelector('.vseek').value = isFinite(d) && d ? Math.round(v.currentTime / d * 1000) : 0;
  const mu = box.querySelector('.vmute');
  mu.innerHTML = v.muted ? ICON.mute : ICON.volume; mu.setAttribute('aria-label', v.muted ? t('video.unmute') : t('video.mute'));
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
  what = what || t('copy.link');
  try { await navigator.clipboard.writeText(text); toast(t('copy.copied', { what })); return; } catch (e) { /* fall back */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? t('copy.copied', { what }) : t('copy.failed'));
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
  const tg = e.target;
  const lc = tg.closest('.lcopy');
  if (lc) { if (lc.dataset.copy) copyText(lc.dataset.copy, t('loc.coordinates')); else copyText(lc.dataset.url); return; }
  const gv = tg.closest('.gifv');
  if (gv && reducedMotion()) { const v = gv.querySelector('video'); if (v.paused) v.play().catch(() => {}); else v.pause(); return; }
  const box = tg.closest('.mvid:not(.gifv)');
  if (box) {
    const v = box.querySelector('video');
    if (tg.closest('.vmute')) { v.muted = !v.muted; return; }
    if (tg.closest('.vfs')) { toggleFullscreen(box); return; }
    if (tg.closest('.vseek')) return;
    if (tg.closest('.vbig, .vpp') || tg === v) { if (v.paused) v.play().catch(() => {}); else v.pause(); return; }
  }
  const ap = tg.closest('.aplay');
  if (ap) { AudioCtl.toggle(ap.closest('.aplayer').dataset.audio); return; }
  if (tg.closest('.aspeed')) { AudioCtl.speed(); return; }
  const im = tg.closest('[data-lb]');
  if (im) { openLightbox(im.dataset.lb); return; }
  const pd = tg.closest('[data-pdf]');
  if (pd) { const w = pd.closest('.mdocw'); openPdf(pd.dataset.pdf, w && w.querySelector('.mdoc b') ? w.querySelector('.mdoc b').textContent : ''); return; }
  const vc = tg.closest('[data-vcard]');
  if (vc) { openContact(vc.dataset.vcard); return; }
  const rm = tg.closest('[data-more]');
  if (rm) { toggleExpand(+rm.dataset.more); return; }
  const sb = tg.closest('[data-star]');
  if (sb) { toggleStar(+sb.dataset.star); return; }
  // Phones have no hover: tapping a bubble's plain area reveals its star button.
  if (matchMedia('(hover: none)').matches) {
    const row = tg.closest('.row'), on = row && !tg.closest('a,button,input,video,img,audio') && !row.classList.contains('tapped');
    layer.querySelectorAll('.row.tapped').forEach(r => r.classList.remove('tapped'));
    if (on && row.querySelector('.starbtn')) row.classList.add('tapped');
  }
});
// A row changed height (Read more / Show less, a star): update its slot in the virtual list.
layer.addEventListener('message-resize', e => VL.remeasure(e.detail.index));
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
  // This page's save only takes common file types. An animated sticker is a ZIP, so it is saved as one.
  try { await DL.save({ filename: isWas(e.name) ? e.name + '.zip' : e.name, data: e.blob }); }
  catch (err) {
    const code = err && err.code;
    if (code === 'rejected_extension' || code === 'extension_not_enabled') toast(t('dl.blocked', { ext: extOf(e.name) }));
    else if (code && code !== 'declined') toast(t('dl.failed'));
  }
});

/* ---------- Photo viewer ---------- */
// list: what Previous and Next step through. The chat passes its photos; the media gallery passes
// the items in its current filter, which can include videos and stickers.
const LB = { k: -1, start: -1, list: [] };
function openLightbox(name, list) {
  const chat = !list;
  list = (list || (S.images || []).filter(x => S.m2i[x.i] >= 0)).filter(x => !Media.cantShow(x.name) && !isWas(x.name)); // the chat's photos, without ones a filter hides or the browser can't show
  const k = list.findIndex(x => x.name === name);
  if (k < 0) return;
  LB.list = list; LB.chat = chat;
  LB.k = LB.start = k; LB.focus = document.activeElement;
  $('lb').hidden = false; Dialogs.open($('lb')); showLb(); $('lbClose').focus();
}
function showLb() {
  const x = LB.list[LB.k], m = S.msgs[x.i], e = Media.get(x.name);
  if (!e) return;
  const v = $('lbVid'), vid = VIDEO_EXT.test(extOf(e.name)), gif = x.type === 'gif';
  $('lb').classList.toggle('isvid', vid);
  lbImg.hidden = vid; v.hidden = !vid;
  if (vid) {
    lbImg.removeAttribute('src');
    v.loop = v.muted = gif; v.controls = !gif; v.src = e.url;
    if (AudioCtl.el) AudioCtl.el.pause();
    v.play().catch(() => {});
  } else { v.pause(); v.removeAttribute('src'); lbImg.src = e.url; }
  lbImg.alt = m.message || (TYPE_LABEL[x.type] ? typeLabel(x.type) : t('common.photo_alt'));
  $('lbWho').textContent = m.isOutgoing ? t('common.you') : m.sender;
  $('lbWhen').textContent = dateLabel(m.dateKey) + ', ' + m.formattedTime;
  $('lbPos').textContent = (LB.k + 1) + ' / ' + LB.list.length;
  $('lbCap').innerHTML = m.message ? formatText(m.message) : ''; $('lbCap').hidden = !m.message;
  const dl = $('lbDl'); dl.href = e.url; dl.setAttribute('download', e.name);
  zReset();
  $('lbPrev').disabled = LB.k <= 0; $('lbNext').disabled = LB.k >= LB.list.length - 1;
}
function lbStep(d) { const k = LB.k + d; if (k < 0 || k >= LB.list.length) return; LB.k = k; showLb(); }
function closeLightbox(silent) {
  const lb = $('lb');
  if (!lb || lb.hidden) return;
  lb.hidden = true; Dialogs.close(lb); $('lbImg').removeAttribute('src');
  const v = $('lbVid'); v.pause(); v.removeAttribute('src'); v.load();
  if (silent) return;
  const x = LB.list[LB.k];
  if (LB.chat && LB.k !== LB.start && x && S.m2i[x.i] >= 0) VL.scrollTo(S.m2i[x.i], 'center');
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
  if (e.target.closest('.lb-nav') || e.target.tagName === 'VIDEO') return; // leave the video's own controls alone
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
    if (Math.abs(dx) > 60) { lbStep((dx < 0) !== I18N.rtl() ? 1 : -1); moved = true; }
  }
  gest = ptrs.size === 1 ? (() => { const q = [...ptrs.values()][0]; return { type: 'pan', sx: q.x, sy: q.y, x: Z.x, y: Z.y }; })() : null;
}
stage.addEventListener('pointerup', endPtr);
stage.addEventListener('pointercancel', endPtr);
stage.addEventListener('click', e => { if (!moved && e.target === stage) closeLightbox(); });

fabTop.addEventListener('click', () => VL.scrollTo(0));

