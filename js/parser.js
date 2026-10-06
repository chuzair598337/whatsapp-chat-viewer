"use strict";
/* =====================================================================
   PARSER (runs inside an inline Blob-URL Web Worker; falls back to the
   main thread). Self-contained: no references to outer scope.
   ===================================================================== */
function parserModule() {
  const INV = /[​‎‏‪-‮⁦-⁩﻿]/g;
  const SP = /[    ]/g;
  const D = '(\\d{1,4})[./-](\\d{1,2})[./-](\\d{1,4})';
  // AM/PM markers in the languages WhatsApp exports in. Some come before the time (上午10:00, 오전 10:00).
  const MARK = '[AaPp]\\.?\\s?[Mm]\\.?|上午|下午|中午|晚上|凌晨|早上|午前|午後|오전|오후|ص|م|vorm\\.|nachm\\.|पूर्वाह्न|अपराह्न|ก่อนเที่ยง|หลังเที่ยง|قبل دوپہر|بعد دوپہر';
  const PM = /^(?:[Pp]|下午|中午|晚上|午後|오후|م|nachm|अपराह्न|หลังเที่ยง|بعد)/;
  const T = '(?:(' + MARK + ')\\s?)?(\\d{1,2})[:.](\\d{2})(?:[:.](\\d{2}))?\\s*(' + MARK + ')?';
  const SEP = '(?:[,،]?\\s+|[,،]?\\s*(?=' + MARK + '))'; // between the date and the time (، is the Arabic comma)
  const RE_IOS = new RegExp('^\\[' + D + SEP + T + '\\]\\s?(.*)$');
  const RE_AND = new RegExp('^' + D + SEP + T + '\\s?[-\\u2013]\\s(.*)$');
  const pad = n => (n < 10 ? '0' : '') + n;

  function typeFromName(n) {
    const ext = (n.split('.').pop() || '').toLowerCase();
    if (/STICKER|^STK-/i.test(n.split('/').pop()) || ext === 'webp' || ext === 'was') return 'sticker';
    if (/^(jpe?g|png|heic|heif|bmp|avif)$/.test(ext)) return 'image';
    if (ext === 'gif' || /GIF/.test(n)) return 'gif';
    if (/^(mp4|mov|3gp|mkv|webm|avi)$/.test(ext)) return 'video';
    if (/^(opus|ogg|m4a|mp3|aac|wav|amr)$/.test(ext) || /PTT|AUDIO/i.test(n)) return 'audio';
    if (ext === 'vcf') return 'contact';
    return 'document';
  }
  // "Title • 2 pages" (the text WhatsApp writes before a document) -> { title, detail }.
  function docInfo(prefix) {
    const p = (prefix || '').trim();
    if (!p || p.indexOf('•') < 0) return null;
    const parts = p.split(/\s*•\s*/), title = parts.shift();
    return { title, detail: parts.filter(Boolean).join(' · ') };
  }
  function media(type, name, caption, omitted, edited, more) {
    return { kind: 'media', text: (caption || '').trim(), att: [Object.assign({ type, name: name || null, omitted, url: null }, more || {})], edited };
  }
  // Coordinates from a maps link: ?q=lat,lng, query=lat,lng, ll=lat,lng or /@lat,lng.
  function coords(url) {
    let u = url;
    try { u = decodeURIComponent(url); } catch (e) {}
    const m = /(?:[?&](?:q|query|ll|daddr)=(?:loc:)?|@)(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/.exec(u);
    if (!m) return {};
    const lat = +m[1], lng = +m[2];
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : {};
  }
  function classify(raw) {
    let t = raw.replace(INV, '').replace(SP, ' ');
    let edited = false;
    t = t.replace(/\s*<This message was edited>\s*$/i, () => { edited = true; return ''; });
    const one = t.indexOf('\n') < 0;
    let m;
    // Android writes "null" for view-once media and some other messages it can't export.
    if (one && t.trim() === 'null') return { kind: 'unsupported', text: '', att: [], edited };
    if (one && /^(This message was deleted\.?|You deleted this message\.?|This message was deleted by (an )?admin.*|Waiting for this message.*)$/i.test(t))
      return { kind: 'deleted', text: t, att: [], edited };
    if (one && (m = /^(Missed |Silenced |Declined )?(group )?(voice|video) call(?:,\s*(.*))?$/i.exec(t)))
      return { kind: 'call', text: t, att: [], edited, extra: { missed: !!m[1], video: /video/i.test(m[3]), group: !!m[2], label: (m[1] || '') + (m[2] || '') + m[3] + ' call', detail: (m[4] || '').replace(/(Tap|Click) to call back/i, '').replace(/^[\s,.]+|[\s,.]+$/g, '') } };
    // iOS: the file tag can follow a caption of any length, on the same line or after several lines
    // ("Line one\nLine two <attached: 00000127-PHOTO-….jpg>"). For documents, a one-line prefix holds the
    // title and page count instead: "Report.pdf • 2 pages <attached: 00000022-Report.pdf>".
    if ((m = /^([\s\S]*?)\s*<attached: ([^>\n]+)>\s*([\s\S]*)$/.exec(t))) {
      const d = m[1].indexOf('\n') < 0 ? docInfo(m[1]) : null;
      return media(typeFromName(m[2]), m[2].trim(), d ? m[3] : [m[1].trim(), m[3].trim()].filter(Boolean).join('\n'), false, edited, d);
    }
    if ((m = /^([^\n]*?\s•\s\d+\s+pages?\s)?(\S[^\n]*?\.[A-Za-z0-9]{1,6}) \(file attached\)\s*([\s\S]*)$/.exec(t))) return media(typeFromName(m[2]), m[2].trim(), m[3], false, edited, m[1] ? docInfo(m[1]) : null);
    if ((m = /^([\s\S]*?)\s*(<Media omitted>|image omitted|video omitted|audio omitted|sticker omitted|GIF omitted|document omitted|Contact card omitted|video note omitted|view once [\w ]+? omitted)$/i.exec(t))) {
      const w = m[2].toLowerCase();
      const viewOnce = w.startsWith('view once');
      let type = w.includes('image') || w.includes('photo') ? 'image' : w.includes('video') ? 'video' : w.includes('audio') || w.includes('voice') ? 'audio'
        : w.includes('sticker') ? 'sticker' : w.startsWith('gif') ? 'gif' : w.includes('document') ? 'document' : w.includes('contact') ? 'contact' : 'media';
      let name = null, cap = m[1], detail = '';
      if (type === 'document' && cap) { const parts = cap.split(/\s*•\s*/); name = parts.shift().trim(); detail = parts.join(' · '); cap = ''; }
      return media(type, name, cap, true, edited, { viewOnce, detail, raw: m[2], note: w.includes('video note') ? 'Video note' : '' });
    }
    if ((m = /^(live )?location: (https?:\/\/\S+)\s*([\s\S]*)$/i.exec(t)))
      return { kind: 'location', text: m[3].trim(), att: [], edited, extra: { url: m[2], live: !!m[1], ...coords(m[2]) } };
    // Live locations are exported without coordinates: "live location shared".
    if (one && /^live location shared\.?$/i.test(t)) return { kind: 'location', text: '', att: [], edited, extra: { url: null, live: true } };
    if ((m = /^POLL:\s*\n([^\n]+)\n?([\s\S]*)$/.exec(t))) {
      const options = [];
      for (const l of m[2].split('\n')) { const o = /^OPTION:\s*(.+?)\s*\((\d+) votes?\)\s*$/.exec(l.trim()); if (o) options.push({ label: o[1], votes: +o[2] }); }
      return { kind: 'poll', text: '', att: [], edited, extra: { q: m[1].trim(), options } };
    }
    return { kind: 'text', text: t, att: [], edited };
  }

  async function parse(blob, opts, progress) {
    opts = opts || {};
    const recs = [];
    let cur = null, iosN = 0, andN = 0, lines = 0, skipped = 0;
    function handle(line) {
      lines++;
      if (line.charCodeAt(line.length - 1) === 13) line = line.slice(0, -1);
      const n = line.replace(/^[‎‏﻿‪-‮]+/, '').replace(SP, ' ');
      let m = RE_IOS.exec(n), ios = true;
      if (!m) { m = RE_AND.exec(n); ios = false; }
      if (m) {
        if (ios) iosN++; else andN++;
        const rest = m[9];
        let sender = null, body = rest, sys = false, lrm = false;
        const ci = rest.indexOf(': ');
        if (ci > 0) {
          const pre = rest.slice(0, ci);
          if (!ios && (/["“”]/.test(pre) || pre.length > 60)) sys = true;
          else { sender = pre.replace(INV, '').trim(); body = rest.slice(ci + 2); lrm = body.charCodeAt(0) === 0x200E; }
        } else if (/^[^:]{1,60}:$/.test(rest.replace(INV, '').trim())) {
          // "Name:" with nothing after it: WhatsApp writes events (and a few other message types) this way.
          sender = rest.replace(INV, '').trim().slice(0, -1).trim(); body = ''; lrm = false;
        } else sys = true;
        cur = { a: +m[1], b: +m[2], c: +m[3], al: m[1].length, h: +m[5], mi: +m[6], s: m[7] ? +m[7] : 0, ap: m[4] || m[8] || '', sender, body, sys, lrm, x: null };
        recs.push(cur);
      } else if (cur) { (cur.x || (cur.x = [])).push(line); }
      else if (line.trim()) skipped++;
    }
    const dec = new TextDecoder('utf-8');
    const CH = 2 << 20;
    let left = '';
    let lastYield = Date.now();
    for (let off = 0; off < blob.size; off += CH) {
      const buf = await blob.slice(off, off + CH).arrayBuffer();
      const text = left + dec.decode(buf, { stream: off + CH < blob.size });
      const parts = text.split('\n');
      left = parts.pop();
      for (let i = 0; i < parts.length; i++) handle(parts[i]);
      if (progress) progress(Math.min(1, (off + CH) / blob.size) * 0.85);
      if (Date.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = Date.now(); }
    }
    if (left) handle(left);

    // --- decide date order ---
    let maxA = 0, maxB = 0, ymd = false, twelve = false;
    for (const r of recs) { if (r.al === 4) ymd = true; if (r.a > maxA) maxA = r.a; if (r.b > maxB) maxB = r.b; if (r.ap) twelve = true; }
    let detected, ambiguous = false;
    if (ymd) detected = 'ymd';
    else if (maxA > 12 && maxB <= 12) detected = 'dmy';
    else if (maxB > 12 && maxA <= 12) detected = 'mdy';
    else {
      ambiguous = true;
      let invD = 0, invM = 0, pD = -1, pM = -1;
      for (const r of recs) { const kD = r.c * 10000 + r.b * 100 + r.a, kM = r.c * 10000 + r.a * 100 + r.b; if (kD < pD) invD++; if (kM < pM) invM++; pD = kD; pM = kM; }
      detected = invM < invD ? 'mdy' : 'dmy';
    }
    let order = ymd ? 'ymd' : (opts.order === 'dmy' || opts.order === 'mdy') ? opts.order : detected, rejected = false;
    // A forced order that would put a 13th month or a 32nd day in the chat can't be right: keep the detected one.
    if (order !== detected && recs.some(r => (order === 'dmy' ? r.b : r.a) > 12 || (order === 'dmy' ? r.a : r.b) > 31)) { order = detected; rejected = true; }

    // --- build messages ---
    const out = new Array(recs.length);
    const counts = new Map(), sysSenders = new Map();
    let subject = null, e2eName = null;
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      let y, mo, d;
      if (order === 'ymd') { y = r.a; mo = r.b; d = r.c; } else if (order === 'dmy') { d = r.a; mo = r.b; y = r.c; } else { mo = r.a; d = r.b; y = r.c; }
      if (y < 100) y += 2000;
      let h = r.h;
      if (r.ap) { const pm = PM.test(r.ap); h = (h % 12) + (pm ? 12 : 0); }
      const t = Date.UTC(y, mo - 1, d, h, r.mi, r.s);
      const dt = new Date(t);
      const dk = dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
      let text = r.x ? r.body + '\n' + r.x.join('\n') : r.body;
      text = text.replace(/\u0000/g, '').replace(/\s+$/, '');
      const c = text.trim() ? classify(text) : { kind: 'unsupported', text: '', att: [], edited: false };
      const isSystem = r.sys || (r.lrm && c.kind === 'text');
      if (isSystem) {
        // On iPhone a system line's sender is the chat's name, except admin events, which the admin "sends":
        // "~ Ali: ~ Ali changed this group's icon". Those are skipped, and the encryption notice settles it.
        if (r.sender) {
          const bare = s => s.replace(/^[\s\u200E\u200F\u202A-\u202E\u2066-\u2069~]+/, '');
          if (/end-to-end encrypted/i.test(c.text)) e2eName = r.sender;
          else if (!bare(c.text).startsWith(bare(r.sender))) sysSenders.set(r.sender, (sysSenders.get(r.sender) || 0) + 1);
        }
        const sm = /(?:created group|changed the subject (?:from .* )?to|changed the group name (?:from .* )?to|changed this group's name (?:from .* )?to)\s+["“](.+?)["”]\s*$/.exec(c.text);
        if (sm) subject = sm[1];
      } else counts.set(r.sender, (counts.get(r.sender) || 0) + 1);
      const hh = dt.getUTCHours(), mm = dt.getUTCMinutes();
      out[i] = {
        id: 'msg_' + String(i + 1).padStart(5, '0'), t,
        timestamp: dk + 'T' + pad(hh) + ':' + pad(mm) + ':' + pad(dt.getUTCSeconds()),
        formattedTime: twelve ? ((hh % 12) || 12) + ':' + pad(mm) + ' ' + (hh < 12 ? 'AM' : 'PM') : pad(hh) + ':' + pad(mm),
        dateKey: dk, sender: isSystem ? null : r.sender, isSystem, isOutgoing: false,
        message: c.text, kind: isSystem ? 'system' : c.kind, attachments: isSystem ? [] : c.att, edited: c.edited, extra: c.extra || null
      };
      if (progress && (i & 16383) === 0) progress(0.85 + 0.15 * i / recs.length);
    }
    let chatName = null, best = 0;
    for (const [k, v] of sysSenders) if (v > best) { best = v; chatName = k; }
    if (e2eName) chatName = e2eName;
    const participants = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return { messages: out, participants, twelve, order, detected, ambiguous, rejected, chatName, subject, format: iosN >= andN ? 'ios' : 'android', lines, skipped };
  }
  return { parse, classify, typeFromName };
}


/* =====================================================================
   Worker plumbing
   ===================================================================== */
let worker = null;
function getWorker() {
  if (worker !== null) return worker;
  try {
    const src = 'const P=(' + parserModule.toString() + ')();self.onmessage=async e=>{try{const r=await P.parse(e.data.blob,e.data.opts,p=>self.postMessage({progress:p}));self.postMessage({result:r});}catch(err){self.postMessage({error:String(err&&err.message||err)});}};';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
  } catch (e) { worker = false; }
  return worker;
}
// Only one parse runs at a time: starting another (a new file dropped mid-parse) stops the old worker,
// so a stale result can never land on the new chat.
let parseCancel = null;
const SUPERSEDED = 'superseded';
function runParse(blob, opts, onProgress) {
  if (parseCancel) { parseCancel(); parseCancel = null; if (worker) { worker.terminate(); worker = null; } }
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = f => v => { if (done) return; done = true; parseCancel = null; f(v); };
    resolve = finish(resolve); reject = finish(reject);
    parseCancel = () => reject(new Error(SUPERSEDED));
    const local = () => parserModule().parse(blob, opts, p => { if (!done) onProgress(p); }).then(resolve, reject);
    const w = getWorker();
    if (!w) return local();
    w.onmessage = e => {
      const d = e.data;
      if (done) return;
      if (d.progress !== undefined) onProgress(d.progress);
      else if (d.error) reject(new Error(d.error));
      else resolve(d.result);
    };
    w.onerror = ev => { if (ev.preventDefault) ev.preventDefault(); worker = false; if (!done) local(); };
    w.postMessage({ blob, opts });
  });
}

