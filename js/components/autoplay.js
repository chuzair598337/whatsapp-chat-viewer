"use strict";
/* =====================================================================
   Autoplay for voice messages and audio, like WhatsApp's playback of
   consecutive voice notes. One switch, kept in localStorage (cv-autoplay,
   off by default), shown in two places:

   - Settings › Chats › "Autoplay voice messages" (js/components/settings.js).
   - The Autoplay button in the header of Media, links and docs, shown on
     the Audio chip. It flips the same switch.

   When a note plays to its end (AudioCtl.ended in js/media.js):
   - In Media, links and docs (Audio chip), the next audio in the list plays,
     in the order the list is sorted.
   - In the chat, the next message plays if it is a voice message that comes
     straight after it, with nothing else (text, link, media, a notice) in
     between, whoever sent it. The chain stops at the first other message.
   Pausing a note stops the chain, since only a note that ends naturally
   starts the next. The next note is scrolled into view.
   Loaded after media-gallery.js and before settings.js.
   ===================================================================== */
ICON.autoplay = ic('<path d="M4 6.5h10M4 11h10M4 15.5h6"/><path d="M15 13.2v6.6l5.2-3.3z" fill="currentColor"/>');

const Autoplay = {
  on: store('cv-autoplay') === '1',
  idx: null, idxOf: null, // voice-note file name -> message number, built once per chat

  set(on) {
    this.on = !!on;
    store('cv-autoplay', this.on ? '1' : '0');
    this.paint();
    if (Settings.isOpen()) Settings.render();
  },
  // The header button flips the switch and says so in a toast.
  toggle() {
    this.set(!this.on);
    if (this.on) toast.info(t('autoplay.on_toast')); else toast.info(t('autoplay.off_toast'));
  },
  paint() {
    const b = $('galAuto');
    b.hidden = Gallery.cat !== 'audio';
    b.setAttribute('aria-pressed', String(this.on)); // its name stays "Autoplay"; pressed says whether it is on
  },

  ended(name) {
    if (!this.on || !name) return;
    const next = !$('galModal').hidden ? this.nextInGallery(name) : this.nextInChat(name);
    if (next && AudioCtl.name === name && !AudioCtl.playing()) AudioCtl.toggle(next);
  },
  // The next item of the Audio list (a voice note or an audio file), loading more of the list when needed.
  nextInGallery(name) {
    if (Gallery.cat !== 'audio') return null;
    const k = Gallery.list.findIndex(it => it.e && it.e.name === name), it = Gallery.list[k + 1];
    if (k < 0 || !it || AudioCtl.failed.has(it.e.name)) return null;
    while (Gallery.n <= k + 1 && Gallery.n < Gallery.list.length) Gallery.more();
    const row = galBody.querySelector('[data-gi="' + (k + 1) + '"]');
    if (row) row.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    return it.e.name;
  },
  // The voice message right after this one in the chat, if the message after it is one.
  nextInChat(name) {
    if (!isVoice(name)) return null;
    if (this.idxOf !== S.msgs) {
      this.idxOf = S.msgs; this.idx = new Map();
      S.msgs.forEach((m, i) => { for (const a of m.attachments) if (a.type === 'audio' && a.name) this.idx.set(Media.key(a.name), i); });
    }
    const i = this.idx.get(Media.key(name));
    if (i === undefined) return null;
    const m = S.msgs[i + 1], a = m && this.voiceOnly(m);
    if (!a) return null;
    const k = S.m2i[i + 1];
    if (k >= 0) { // scroll only when the next note isn't fully on screen
      const el = VL.nodes.get(k), r = el && el.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
      if (!r || r.top < sr.top || r.bottom > sr.bottom) VL.scrollTo(k, 'center');
    }
    return a.name;
  },
  // A message that is a single voice note this chat has the file for, with no caption.
  voiceOnly(m) {
    if (m.isSystem || m.kind !== 'media' || (m.message || '').trim()) return null;
    const a = m.attachments.length === 1 ? m.attachments[0] : null;
    return a && a.type === 'audio' && isVoice(a.name) && Media.get(a.name) && !AudioCtl.failed.has(a.name) ? a : null;
  }
};

$('galAuto').innerHTML = ICON.autoplay;
$('galAuto').onclick = () => Autoplay.toggle();
