"use strict";
/* =====================================================================
   Long-message truncation ("Read more" / "Show less"), like WhatsApp.
   A message is shortened when it is longer than TRUNC_CHARS characters or
   has more than TRUNC_LINES line breaks. The cut never lands inside a
   ```code block``` or an open *bold*, _italic_, ~strike~ or `code` span,
   so the preview formats exactly like the start of the full message.
   Pure functions: no DOM, no app state.
   ===================================================================== */
const TRUNC_CHARS = 450, TRUNC_LINES = 6;

function needsTruncation(text) {
  if (!text) return false;
  if (text.length > TRUNC_CHARS) return true;
  let nl = 0;
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10 && ++nl > TRUNC_LINES) return true;
  return false;
}

// Returns { truncated: false, text } or { truncated: true, preview, full, cut }: preview is the first `cut` characters
// (plus a closing ``` when the cut falls inside a leading code block).
function truncateText(text) {
  if (!needsTruncation(text)) return { truncated: false, text };
  let cut = Math.min(text.length, TRUNC_CHARS), nl = 0;
  for (let i = 0; i < cut; i++) if (text.charCodeAt(i) === 10 && ++nl === TRUNC_LINES) { cut = i; break; } // keep the first 6 lines
  const atLineEnd = text.charCodeAt(cut) === 10;
  if (!atLineEnd) { // back up to a word break so a word or link isn't split
    const ws = text.slice(0, cut).search(/\s\S*$/);
    if (ws > cut - 80 && ws > 0) cut = ws;
  }
  // Don't stop inside a ``` block: stop before it. If the message starts with the block, cut inside it and close it.
  let fenceOpen = false;
  if ((text.slice(0, cut).split('```').length - 1) % 2) {
    const open = text.lastIndexOf('```', cut - 1);
    if (open > 40) cut = open; else fenceOpen = text.indexOf('```', cut) >= 0;
  }
  // Don't leave an inline marker open on the last line (markers never span lines).
  for (let pass = 0; pass < 4 && !fenceOpen; pass++) {
    const ls = text.lastIndexOf('\n', cut - 1) + 1, line = text.slice(ls, cut).replace(/```[\s\S]*?```/g, m => ' '.repeat(m.length));
    let moved = false;
    for (const mk of ['`', '*', '_', '~']) {
      const opens = [];
      for (let k = 0; k < line.length; k++) if (line[k] === mk) opens.push(k);
      if (opens.length % 2) { cut = ls + opens[opens.length - 1]; moved = true; break; }
    }
    if (!moved) break;
  }
  const kept = text.slice(0, cut).replace(/\s+$/, '');
  if (!kept || kept.length >= text.replace(/\s+$/, '').length) return { truncated: false, text };
  return { truncated: true, preview: fenceOpen ? kept + '```' : kept, full: text, cut: kept.length };
}
