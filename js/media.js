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
  if (eocd < 0) throw new Error(t('zip.damaged'));
  let count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
  // ZIP64 (over 65,535 files or over 4 GB): the real count, size and offset are in the ZIP64 end record,
  // found through the locator just before the classic one.
  if (count === 0xFFFF || cdSize === 0xFFFFFFFF || cdOff === 0xFFFFFFFF) {
    const lp = eocd - 20;
    if (lp < 0 || tail.getUint32(lp, true) !== 0x07064b50) throw new Error(t('zip.damaged'));
    const recOff = Number(tail.getBigUint64(lp + 8, true));
    const rec = new DataView(await file.slice(recOff, recOff + 56).arrayBuffer());
    if (rec.getUint32(0, true) !== 0x06064b50) throw new Error(t('zip.damaged'));
    count = Number(rec.getBigUint64(32, true)); cdSize = Number(rec.getBigUint64(40, true)); cdOff = Number(rec.getBigUint64(48, true));
  }
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const entries = new Map(), td = new TextDecoder('utf-8');
  let p = 0;
  for (let k = 0; k < count && p + 46 <= cd.byteLength; k++) {
    if (cd.getUint32(p, true) !== 0x02014b50) break;
    const method = cd.getUint16(p + 10, true);
    let csize = cd.getUint32(p + 20, true), usize = cd.getUint32(p + 24, true);
    const nlen = cd.getUint16(p + 28, true), xlen = cd.getUint16(p + 30, true), clen = cd.getUint16(p + 32, true);
    let loff = cd.getUint32(p + 42, true);
    const name = td.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nlen));
    if (usize === 0xFFFFFFFF || csize === 0xFFFFFFFF || loff === 0xFFFFFFFF) { // ZIP64 extra field (id 1) holds the saturated values, in this order
      for (let x = p + 46 + nlen, end = x + xlen; x + 4 <= end;) {
        const id = cd.getUint16(x, true), len = cd.getUint16(x + 2, true);
        if (id === 1) {
          let q = x + 4;
          if (usize === 0xFFFFFFFF) { usize = Number(cd.getBigUint64(q, true)); q += 8; }
          if (csize === 0xFFFFFFFF) { csize = Number(cd.getBigUint64(q, true)); q += 8; }
          if (loff === 0xFFFFFFFF) loff = Number(cd.getBigUint64(q, true));
          break;
        }
        x += 4 + len;
      }
    }
    if (!name.endsWith('/') && !name.startsWith('__MACOSX/')) entries.set(name, { name, method, csize, usize, loff });
    p += 46 + nlen + xlen + clen;
  }
  async function extract(name) {
    const e = entries.get(name);
    if (!e) throw new Error(t('zip.not_found', { name }));
    const lh = new DataView(await file.slice(e.loff, e.loff + 30).arrayBuffer());
    if (lh.getUint32(0, true) !== 0x04034b50) throw new Error(t('zip.damaged_short'));
    const start = e.loff + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    const raw = file.slice(start, start + e.csize);
    if (e.method === 0) return raw;
    if (e.method !== 8) throw new Error(t('zip.method'));
    if (typeof DecompressionStream === 'undefined') throw new Error(t('zip.no_unzip'));
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
  // pending: files of the open ZIP not extracted yet; loading: { done, total } while they are.
  pending: new Set(), loading: null,
  map: new Map(), dims: new Map(), posters: new Map(), waves: new Map(), cards: new Map(), thumbs: new Map(),
  // bad: keys of photos, stickers and videos this browser couldn't decode (HEIC outside Safari, HEVC in Firefox).
  bad: new Set(),
  // Lookup key: the chat text has WhatsApp's invisible direction marks stripped, but file names in the
  // ZIP can still contain them (e.g. "00000020-\u200eName.vcf"), so both sides drop them before matching.
  key: n => baseName(n).replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').normalize('NFC').toLowerCase(),
  // Adds one extracted file to a staging map; the live map is only swapped once the chat has parsed.
  stage(into, path, blob) {
    const name = baseName(path), mime = blob.type || MIME[extOf(name)] || 'application/octet-stream';
    const b = blob.type === mime ? blob : blob.slice(0, blob.size, mime);
    into.set(this.key(name), { name, blob: b, url: URL.createObjectURL(b), size: b.size, mime, type: PM.typeFromName(name) });
  },
  discard(map) { for (const e of map.values()) { URL.revokeObjectURL(e.url); if (e.view) URL.revokeObjectURL(e.view); } },
  adopt(map) { this.reset(); this.map = map; },
  get(name) { return name ? this.map.get(this.key(name)) || null : null; },
  // A photo, sticker or video that failed to decode (or an animated sticker that failed to play).
  cantShow(name) { return !!name && this.bad.has(this.key(name)); },
  reset() {
    AudioCtl.stop(); closeLightbox(true); Was.reset(); Heic.jobs.clear(); this.discard(this.map); this.map = new Map(); this.dims.clear(); this.waves.clear(); this.bad.clear();
    for (const u of this.posters.values()) if (u) URL.revokeObjectURL(u);
    for (const u of this.thumbs.values()) if (u) URL.revokeObjectURL(u);
    this.posters.clear(); this.thumbs.clear(); this.cards.clear();
    if (typeof PdfView !== 'undefined') PdfView.reset();
    if (typeof Waves !== 'undefined') { Waves.tried.clear(); Waves.q = []; Posters.q = []; Cards.q = []; }
    this.pending.clear(); this.loading = null;
    if (typeof Cards !== 'undefined') for (const n of [...Cards.waits.keys()]) Cards.settle(n, null);
  }
};

/* ZIP reading: the built-in streaming reader (readZip above) comes first wherever the browser can
   inflate (DecompressionStream). It reads only the file list and slices each file out on demand, so
   even a multi-gigabyte export isn't loaded into memory. JSZip (bundled) is the fallback for older
   browsers and for archives the built-in reader can't open. */
/* Unzipping runs in a worker so the page stays responsive on big exports. The worker is built from an
   inline Blob URL and loads the bundled JSZip with importScripts. Browsers block that for pages opened
   from disk (file://), so there, or if the worker fails for any reason, JSZip runs on the main thread. */
function zipWorkerSrc() {
  return 'self.onmessage = async e => { const d = e.data; try {' +
    ' if (d.op === "init") { importScripts(d.lib); self.reply = (id, v) => postMessage({ id, v }); return postMessage({ id: d.id, v: true }); }' +
    ' if (d.op === "open") { self.zip = await JSZip.loadAsync(d.file); const names = []; self.zip.forEach((p, f) => { if (!f.dir && !p.startsWith("__MACOSX/")) names.push(p); }); return postMessage({ id: d.id, v: names }); }' +
    ' if (d.op === "get") { const f = self.zip.file(d.path); if (!f) return postMessage({ id: d.id, missing: d.path }); return postMessage({ id: d.id, v: await f.async("blob") }); }' +
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
  w.onmessage = e => { const r = waiting.get(e.data.id); if (!r) return; waiting.delete(e.data.id); if (e.data.err) r.no(new Error(e.data.err)); else if (e.data.missing) r.no(new Error(t('zip.not_found', { name: e.data.missing }))); else r.ok(e.data.v); };
  w.onerror = e => { e.preventDefault(); fail(new Error(e.message || t('zip.worker'))); };
  const call = (op, extra) => dead ? Promise.reject(dead) : new Promise((ok, no) => { const id = ++seq; waiting.set(id, { ok, no }); w.postMessage(Object.assign({ op, id }, extra)); });
  const close = () => { w.terminate(); URL.revokeObjectURL(url); fail(new Error('closed')); };
  try { await call('init', { lib: new URL(tag.getAttribute('src'), location.href).href }); }
  catch (e) { close(); return null; } // worker can't load JSZip: use it on the main thread instead
  try { const names = await call('open', { file }); return { names, extract: path => call('get', { path }), close, worker: true }; }
  catch (e) { close(); throw e; } // JSZip itself can't read the archive
}

async function openArchive(file) {
  if (typeof DecompressionStream !== 'undefined') {
    try { return await nativeArchive(file); } catch (e) { console.warn('The built-in ZIP reader could not open this archive; trying JSZip.', e); }
  }
  if (file.size < 1.5e9) {
    try { const a = await openArchiveInWorker(file); if (a) return a; }
    catch (e) { console.warn('JSZip could not read this archive; using the built-in reader.', e); return nativeArchive(file); }
  }
  if (window.JSZip && file.size < 1.5e9) {
    try {
      const zip = await JSZip.loadAsync(file);
      const names = [];
      zip.forEach((p, f) => { if (!f.dir && !p.startsWith('__MACOSX/')) names.push(p); });
      return { names, extract: p => { const f = zip.file(p); return f ? f.async('blob') : Promise.reject(new Error(t('zip.not_found', { name: p }))); } };
    } catch (e) { console.warn('JSZip could not read this archive; using the built-in reader.', e); }
  }
  return nativeArchive(file);
}
async function nativeArchive(file) {
  const z = await readZip(file);
  return { names: [...z.entries.keys()], extract: p => z.extract(p) };
}

/* One shared <audio> element drives every voice-note player, so playback survives row recycling.
   iPhone Safari sometimes accepts play() on a Blob URL and then never starts (stuck at 0:00, no sound),
   while Web Audio decodes the same file fine. So a watchdog checks that playback really moves; if it
   doesn't (or the format can't be played), the note is decoded and played through Web Audio instead. */
const AudioCtl = {
  el: null, name: null, rate: 1, dur: new Map(), failed: new Set(),
  wa: null, waOnly: false, watch: 0, tick: 0, cache: null, at: null,
  audio() {
    if (this.el) return this.el;
    const a = this.el = new Audio();
    a.preload = 'metadata';
    a.addEventListener('timeupdate', () => { if (a.currentTime > 0) clearTimeout(this.watch); this.paint(); });
    a.addEventListener('loadedmetadata', () => { if (isFinite(a.duration)) this.dur.set(this.name, a.duration); this.paint(); });
    a.addEventListener('play', () => this.paint());
    a.addEventListener('pause', () => this.paint());
    a.addEventListener('ended', () => { clearTimeout(this.watch); a.currentTime = 0; this.paint(); });
    a.addEventListener('error', () => { if (this.name && a.getAttribute('src') && !this.wa) this.fallback(false); });
    return a;
  },
  ctx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    return AC ? (Waves.ctx = Waves.ctx || new AC()) : null;
  },
  // Called inside the tap, the only moment iPhone Safari lets a page start sound.
  unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (err) { /* ignore */ }
    const c = this.ctx();
    if (c && c.state !== 'running') c.resume().catch(() => {});
  },
  toggle(name, at) {
    const e = Media.get(name);
    if (!e) return;
    this.unlock();
    if (this.name !== name) {
      const prev = this.name;
      this.halt(); pauseVideos(); this.name = name; this.at = at; this.failed.delete(name);
      this.paintFor(prev);
      if (this.waOnly) { this.waPlay(e, at); return; }
      const a = this.audio();
      a.src = e.url; a.playbackRate = this.rate;
      if (at != null) a.addEventListener('loadedmetadata', () => { if (isFinite(a.duration)) a.currentTime = at * a.duration; }, { once: true });
      this.start();
      return;
    }
    if (this.wa) {
      if (at != null) this.waSeek(at);
      else if (this.wa.playing) this.waPause();
      else { pauseVideos(); this.waResume(); }
      return;
    }
    const a = this.audio();
    if (at != null) { if (isFinite(a.duration)) a.currentTime = at * a.duration; return; }
    if (a.paused) { pauseVideos(); this.start(); } else this.pause();
  },
  // Plays the <audio> element and arms the watchdog.
  start() {
    const a = this.el, name = this.name, t0 = a.currentTime;
    a.play().catch(err => { if (err && err.name === 'NotSupportedError' && this.name === name && !this.wa) this.fallback(false); });
    clearTimeout(this.watch);
    this.watch = setTimeout(() => { if (this.name === name && !this.wa && a.currentTime <= t0 + 0.05) this.fallback(true); }, 2500);
  },
  // stalled: playback never moved, so this browser's <audio> is unreliable; play every later note with Web Audio too.
  fallback(stalled) {
    const e = Media.get(this.name), a = this.el, at = a.currentTime || 0;
    clearTimeout(this.watch);
    a.pause(); a.removeAttribute('src'); a.load();
    if (stalled) this.waOnly = true;
    if (e) this.waPlay(e, at ? null : this.at, at);
  },
  pause() {
    clearTimeout(this.watch);
    if (this.wa) { if (this.wa.playing) this.waPause(); } else if (this.el && !this.el.paused) this.el.pause();
  },
  halt() {
    clearTimeout(this.watch);
    if (this.el) this.el.pause();
    if (this.wa) { this.waKill(); this.wa = null; }
  },
  async decode(e) {
    if (this.cache && this.cache.e === e) return this.cache.buf;
    const c = this.ctx(), ab = await e.blob.arrayBuffer();
    const buf = await new Promise((ok, no) => { const p = c.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); });
    this.cache = { e, buf };
    return buf;
  },
  // Web Audio playback; frac is a position from 0 to 1, sec a position in seconds.
  async waPlay(e, frac, sec) {
    const name = this.name, w = this.wa = { name, buf: null, src: null, start: 0, off: sec || 0, frac, playing: true };
    this.paint();
    try {
      if (!this.ctx() || e.size > 40e6) throw new Error('unplayable');
      const buf = await this.decode(e);
      if (this.wa !== w) return;
      w.buf = buf; this.dur.set(name, buf.duration);
      if (w.frac != null) w.off = w.frac * buf.duration;
      if (w.playing) this.waStart(); else this.paint();
    } catch (err) {
      if (this.wa !== w) return;
      this.wa = null; this.failed.add(name); this.paint();
    }
  },
  waStart() {
    const w = this.wa, c = this.ctx();
    if (c.state !== 'running') c.resume().catch(() => {});
    if (w.off >= w.buf.duration - 0.05) w.off = 0;
    const s = c.createBufferSource();
    s.buffer = w.buf; s.playbackRate.value = this.rate; s.connect(c.destination);
    s.onended = () => { if (w.src !== s) return; w.src = null; w.playing = false; w.off = 0; this.stopTick(); this.paint(); };
    s.start(0, w.off);
    w.src = s; w.start = c.currentTime; w.playing = true;
    clearInterval(this.tick); this.tick = setInterval(() => this.paint(), 200);
    this.paint();
  },
  waNow() { const w = this.wa; return !w ? 0 : w.src ? Math.min(w.buf.duration, w.off + (this.ctx().currentTime - w.start) * this.rate) : w.off; },
  waKill() {
    const w = this.wa;
    if (w && w.src) { const s = w.src; w.src = null; try { s.stop(); } catch (err) { /* already stopped */ } s.disconnect(); }
    this.stopTick();
  },
  stopTick() { clearInterval(this.tick); this.tick = 0; },
  waPause() { const w = this.wa; w.off = this.waNow(); w.playing = false; this.waKill(); this.paint(); },
  waResume() { const w = this.wa; w.playing = true; if (w.buf) this.waStart(); else this.paint(); },
  waSeek(frac) {
    const w = this.wa;
    if (!w.buf) { w.frac = frac; return; }
    const was = w.playing; this.waKill(); w.off = frac * w.buf.duration;
    if (was) this.waStart(); else this.paint();
  },
  speed() {
    const w = this.wa;
    if (w && w.src) { w.off = this.waNow(); w.start = this.ctx().currentTime; }
    this.rate = this.rate === 1 ? 1.5 : this.rate === 1.5 ? 2 : 1;
    if (this.el) this.el.playbackRate = this.rate;
    if (w && w.src) w.src.playbackRate.value = this.rate;
    document.querySelectorAll('.aplayer').forEach(n => this.paintNode(n));
  },
  stop() { this.halt(); if (this.el) { this.el.removeAttribute('src'); this.el.load(); } this.name = null; this.cache = null; this.dur.clear(); this.failed.clear(); },
  fmt(s) { if (!isFinite(s)) return '–:––'; s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  paintFor(name) { if (name) document.querySelectorAll('.aplayer[data-audio="' + CSS.escape(name) + '"]').forEach(n => this.paintNode(n)); },
  paint() { this.paintFor(this.name); },
  paintNode(n) {
    const name = n.dataset.audio, a = this.el, w = this.wa, cur = name === this.name && (!!w || !!a);
    const playing = cur && (w ? w.playing : !a.paused);
    const btn = n.querySelector('.aplay');
    btn.innerHTML = playing ? ICON.pause : ICON.play;
    btn.setAttribute('aria-label', playing ? t('audio.pause') : t('audio.play'));
    const cd = !cur ? NaN : w ? (w.buf ? w.buf.duration : NaN) : a.duration;
    const d = isFinite(cd) ? cd : this.dur.get(name);
    const at = !cur ? 0 : w ? this.waNow() : a.currentTime;
    const frac = d ? at / d : 0;
    const sk = n.querySelector('.aseek');
    if (sk) sk.value = Math.round(frac * 1000);
    const bars = n.querySelectorAll('.wave rect');
    for (let k = 0; k < bars.length; k++) bars[k].classList.toggle('on', cur && (k + 0.5) / bars.length <= frac);
    n.querySelector('.atime').textContent = cur && (at > 0 || playing) ? this.fmt(at) + ' / ' + this.fmt(d) : this.fmt(d);
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

