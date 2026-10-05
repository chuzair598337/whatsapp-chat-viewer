"use strict";
/* =====================================================================
   ZIP reader (native DecompressionStream, no library). Keeps the entry
   index so Phase 2 can extract media files on demand.
   ===================================================================== */
async function readZip(file) {
  const size = file.size, tailLen = Math.min(size, 65557);
  const tail = new DataView(await file.slice(size - tailLen).arrayBuffer());
  let eocd = -1;
  for (let i = tailLen - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('This ZIP file looks damaged. Try exporting the chat again.');
  const count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const entries = new Map(), td = new TextDecoder('utf-8');
  let p = 0;
  for (let k = 0; k < count && p + 46 <= cd.byteLength; k++) {
    if (cd.getUint32(p, true) !== 0x02014b50) break;
    const method = cd.getUint16(p + 10, true), csize = cd.getUint32(p + 20, true), usize = cd.getUint32(p + 24, true);
    const nlen = cd.getUint16(p + 28, true), xlen = cd.getUint16(p + 30, true), clen = cd.getUint16(p + 32, true), loff = cd.getUint32(p + 42, true);
    const name = td.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nlen));
    if (!name.endsWith('/') && !name.startsWith('__MACOSX/')) entries.set(name, { name, method, csize, usize, loff });
    p += 46 + nlen + xlen + clen;
  }
  async function extract(name) {
    const e = entries.get(name);
    if (!e) throw new Error('File not found in ZIP: ' + name);
    const lh = new DataView(await file.slice(e.loff, e.loff + 30).arrayBuffer());
    if (lh.getUint32(0, true) !== 0x04034b50) throw new Error('This ZIP file looks damaged.');
    const start = e.loff + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    const raw = file.slice(start, start + e.csize);
    if (e.method === 0) return raw;
    if (e.method !== 8) throw new Error('This ZIP uses an unsupported compression method.');
    if (typeof DecompressionStream === 'undefined') throw new Error("This browser can't unzip files. Unzip the export and open _chat.txt instead.");
    return await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
  }
  return { entries, extract };
}

/* =====================================================================
   Media store (Phase 2): file name -> Blob URL. Filled from ZIP exports.
   Every URL is revoked when another chat is opened.
   ===================================================================== */
const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', bmp: 'image/bmp', avif: 'image/avif',
  mp4: 'video/mp4', mov: 'video/quicktime', '3gp': 'video/3gpp', webm: 'video/webm', mkv: 'video/x-matroska',
  opus: 'audio/ogg', ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', aac: 'audio/aac', wav: 'audio/wav', amr: 'audio/amr',
  pdf: 'application/pdf', vcf: 'text/vcard', txt: 'text/plain', csv: 'text/csv', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', zip: 'application/zip'
};
const PM = parserModule();
const baseName = n => String(n || '').split('/').pop().trim();
const extOf = n => { const b = baseName(n); return b.includes('.') ? b.split('.').pop().toLowerCase() : ''; };
const clampR = r => Math.min(1.7, Math.max(0.68, r));
const Media = {
  map: new Map(), dims: new Map(), posters: new Map(), waves: new Map(), cards: new Map(), thumbs: new Map(),
  // Lookup key: the chat text has WhatsApp's invisible direction marks stripped, but file names in the
  // ZIP can still contain them (e.g. "00000020-\u200eName.vcf"), so both sides drop them before matching.
  key: n => baseName(n).replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').normalize('NFC').toLowerCase(),
  // Adds one extracted file to a staging map; the live map is only swapped once the chat has parsed.
  stage(into, path, blob) {
    const name = baseName(path), mime = blob.type || MIME[extOf(name)] || 'application/octet-stream';
    const b = blob.type === mime ? blob : blob.slice(0, blob.size, mime);
    into.set(this.key(name), { name, blob: b, url: URL.createObjectURL(b), size: b.size, mime, type: PM.typeFromName(name) });
  },
  discard(map) { for (const e of map.values()) URL.revokeObjectURL(e.url); },
  adopt(map) { this.reset(); this.map = map; },
  get(name) { return name ? this.map.get(this.key(name)) || null : null; },
  reset() {
    AudioCtl.stop(); closeLightbox(true); this.discard(this.map); this.map = new Map(); this.dims.clear(); this.waves.clear();
    for (const u of this.posters.values()) if (u) URL.revokeObjectURL(u);
    for (const u of this.thumbs.values()) if (u) URL.revokeObjectURL(u);
    this.posters.clear(); this.thumbs.clear(); this.cards.clear();
    if (typeof PdfView !== 'undefined') PdfView.reset();
  }
};

/* ZIP reading: JSZip (bundled above) first; the native streaming reader is the fallback for
   archives JSZip can't hold in memory or browsers where it fails. */
/* Unzipping runs in a worker so the page stays responsive on big exports. The worker is built from an
   inline Blob URL and loads the bundled JSZip with importScripts. Browsers block that for pages opened
   from disk (file://), so there, or if the worker fails for any reason, JSZip runs on the main thread. */
function zipWorkerSrc() {
  return 'self.onmessage = async e => { const d = e.data; try {' +
    ' if (d.op === "init") { importScripts(d.lib); self.reply = (id, v) => postMessage({ id, v }); return postMessage({ id: d.id, v: true }); }' +
    ' if (d.op === "open") { self.zip = await JSZip.loadAsync(d.file); const names = []; self.zip.forEach((p, f) => { if (!f.dir && !p.startsWith("__MACOSX/")) names.push(p); }); return postMessage({ id: d.id, v: names }); }' +
    ' if (d.op === "get") { const f = self.zip.file(d.path); if (!f) throw new Error("File not found in ZIP: " + d.path); return postMessage({ id: d.id, v: await f.async("blob") }); }' +
    ' } catch (err) { postMessage({ id: d.id, err: String(err && err.message || err) }); } };';
}
async function openArchiveInWorker(file) {
  const tag = [...document.scripts].find(s => /jszip(\.min)?\.js(\?|$)/.test(s.src));
  if (!tag || location.protocol === 'file:' || typeof Worker === 'undefined') return null;
  let url, w;
  try {
    url = URL.createObjectURL(new Blob([zipWorkerSrc()], { type: 'text/javascript' }));
    w = new Worker(url);
  } catch (e) { if (url) URL.revokeObjectURL(url); return null; }
  let seq = 0, dead = null;
  const waiting = new Map();
  const fail = err => { dead = err; for (const r of waiting.values()) r.no(err); waiting.clear(); };
  w.onmessage = e => { const r = waiting.get(e.data.id); if (!r) return; waiting.delete(e.data.id); if (e.data.err) r.no(new Error(e.data.err)); else r.ok(e.data.v); };
  w.onerror = e => { e.preventDefault(); fail(new Error(e.message || 'The unzip worker stopped.')); };
  const call = (op, extra) => dead ? Promise.reject(dead) : new Promise((ok, no) => { const id = ++seq; waiting.set(id, { ok, no }); w.postMessage(Object.assign({ op, id }, extra)); });
  const close = () => { w.terminate(); URL.revokeObjectURL(url); fail(new Error('closed')); };
  try { await call('init', { lib: new URL(tag.getAttribute('src'), location.href).href }); }
  catch (e) { close(); return null; } // worker can't load JSZip: use it on the main thread instead
  try { const names = await call('open', { file }); return { names, extract: path => call('get', { path }), close, worker: true }; }
  catch (e) { close(); throw e; } // JSZip itself can't read the archive
}

async function openArchive(file) {
  if (file.size < 1.5e9) {
    try { const a = await openArchiveInWorker(file); if (a) return a; }
    catch (e) { console.warn('JSZip could not read this archive; using the built-in reader.', e); return nativeArchive(file); }
  }
  if (window.JSZip && file.size < 1.5e9) {
    try {
      const zip = await JSZip.loadAsync(file);
      const names = [];
      zip.forEach((p, f) => { if (!f.dir && !p.startsWith('__MACOSX/')) names.push(p); });
      return { names, extract: p => zip.file(p).async('blob') };
    } catch (e) { console.warn('JSZip could not read this archive; using the built-in reader.', e); }
  }
  return nativeArchive(file);
}
async function nativeArchive(file) {
  const z = await readZip(file);
  return { names: [...z.entries.keys()], extract: p => z.extract(p) };
}

/* One shared <audio> element drives every voice-note player, so playback survives row recycling. */
const AudioCtl = {
  el: null, name: null, rate: 1, dur: new Map(), failed: new Set(),
  audio() {
    if (this.el) return this.el;
    const a = this.el = new Audio();
    a.preload = 'metadata';
    a.addEventListener('timeupdate', () => this.paint());
    a.addEventListener('loadedmetadata', () => { if (isFinite(a.duration)) this.dur.set(this.name, a.duration); this.paint(); });
    a.addEventListener('play', () => this.paint());
    a.addEventListener('pause', () => this.paint());
    a.addEventListener('ended', () => { a.currentTime = 0; this.paint(); });
    a.addEventListener('error', () => { if (this.name && a.getAttribute('src')) { this.failed.add(this.name); this.paint(); } });
    return a;
  },
  toggle(name, at) {
    const e = Media.get(name);
    if (!e) return;
    const a = this.audio();
    if (this.name !== name) {
      const prev = this.name;
      a.pause(); pauseVideos(); this.name = name; a.src = e.url; a.playbackRate = this.rate;
      this.paintFor(prev);
      if (at != null) a.addEventListener('loadedmetadata', () => { if (isFinite(a.duration)) a.currentTime = at * a.duration; }, { once: true });
      a.play().catch(() => {});
      return;
    }
    if (at != null) { if (isFinite(a.duration)) a.currentTime = at * a.duration; return; }
    if (a.paused) { pauseVideos(); a.play().catch(() => {}); } else a.pause();
  },
  speed() { this.rate = this.rate === 1 ? 1.5 : this.rate === 1.5 ? 2 : 1; if (this.el) this.el.playbackRate = this.rate; layer.querySelectorAll('.aplayer').forEach(n => this.paintNode(n)); },
  stop() { if (this.el) { this.el.pause(); this.el.removeAttribute('src'); this.el.load(); } this.name = null; this.dur.clear(); this.failed.clear(); },
  fmt(s) { if (!isFinite(s)) return '–:––'; s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  paintFor(name) { if (name) layer.querySelectorAll('.aplayer[data-audio="' + CSS.escape(name) + '"]').forEach(n => this.paintNode(n)); },
  paint() { this.paintFor(this.name); },
  paintNode(n) {
    const name = n.dataset.audio, a = this.el, cur = !!a && name === this.name;
    const playing = cur && !a.paused;
    const btn = n.querySelector('.aplay');
    btn.innerHTML = playing ? ICON.pause : ICON.play;
    btn.setAttribute('aria-label', playing ? 'Pause voice message' : 'Play voice message');
    const d = cur && isFinite(a.duration) ? a.duration : this.dur.get(name);
    const t = cur ? a.currentTime : 0;
    const frac = d ? t / d : 0;
    const sk = n.querySelector('.aseek');
    if (sk) sk.value = Math.round(frac * 1000);
    const bars = n.querySelectorAll('.wave rect');
    for (let k = 0; k < bars.length; k++) bars[k].classList.toggle('on', cur && (k + 0.5) / bars.length <= frac);
    n.querySelector('.atime').textContent = cur && (t > 0 || playing) ? this.fmt(t) + ' / ' + this.fmt(d) : this.fmt(d);
    n.querySelector('.aspeed').textContent = this.rate + '×';
    n.classList.toggle('failed', this.failed.has(name));
  },
  probe(name) { // reads the duration of a voice note that hasn't been played yet
    if (this.dur.has(name) || this.failed.has(name)) return;
    const e = Media.get(name);
    if (!e) return;
    this.dur.set(name, NaN);
    const p = new Audio();
    p.preload = 'metadata';
    p.onloadedmetadata = () => { this.dur.set(name, p.duration); this.paintFor(name); p.removeAttribute('src'); };
    p.onerror = () => { this.failed.add(name); this.paintFor(name); };
    p.src = e.url;
  }
};

