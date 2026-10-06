"use strict";
/* =====================================================================
   Message menu, like WhatsApp's long-press menu: long-press a message on
   a phone, right-click it on a computer, or use the ⌄ button that shows
   on hover (or Shift+F10 / the menu key on a focused message).

   It lists what can be done with that message in a viewer: Star or
   Unstar (every message), Copy (the text exactly as exported, a poll,
   a contact card's details), Copy link, open the photo, PDF or contact,
   Download each attached file, and Share (the device's share sheet,
   which stands in for WhatsApp's Forward). Reply, Forward and Delete
   need a live chat, so they aren't offered.
   ===================================================================== */
Object.assign(ICON, {
  share: ic('<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'),
  unstar: ic('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/><path d="M3.5 3.5l17 17"/>'),
  chev: ic('<path d="M7 10l5 5 5-5"/>')
});

const MsgMenu = {
  el: $('msgMenu'), i: -1, ret: null,
  isOpen() { return !this.el.hidden; },
  // The actions for message i: [icon, label, run]
  actions(i) {
    const m = S.msgs[i], out = [], starred = !!(S.starred && S.starred.has(i));
    out.push([starred ? 'unstar' : 'star', t(starred ? 'msg.unstar_short' : 'msg.star_short'), () => toggleStar(i)]);
    const text = copyable(m);
    if (text) out.push(['copy', t('mm.copy'), () => copyText(text, t(m.kind === 'poll' ? 'mm.poll' : 'mm.message'))]);
    const url = (m.message.match(RE_URL) || [])[0];
    if (url) out.push(['link', t('link.copy'), () => copyText(/^www\./i.test(url) ? 'https://' + url : trimUrl(url)[0])]);
    for (const a of m.attachments) {
      const e = a.url ? Media.get(a.name) : null;
      if (!e) continue;
      if ((a.type === 'image' || a.type === 'gif') && !Media.cantShow(e.name) && !VIDEO_EXT.test(extOf(e.name))) out.push(['image', t('mm.view_photo'), () => openLightbox(e.name)]);
      if (extOf(e.name) === 'pdf') out.push(['document', t('mm.open_document'), () => openPdf(e.name, a.title || '')]);
      if (a.type === 'contact') {
        out.push(['contact', t('vc.view_contact'), () => openContact(e.name)]);
        const cs = Media.cards.get(e.name);
        if (cs && cs.length) out.push(['copy', t('mm.copy_contact'), () => copyText(cs.map(contactText).join('\n\n'), t('mm.contact'))]);
      }
      out.push(['download', m.attachments.length > 1 ? t('doc.download_name', { name: a.title || e.name }) : t('doc.download'), () => saveFile(e)]);
    }
    if (canShare()) out.push(['share', t('mm.share'), () => shareMsg(m)]);
    out.push(['check', t('sel.select'), () => Sel.start(i)]);
    return out;
  },
  open(i, x, y, anchor) {
    if (i < 0 || !S.msgs[i] || S.msgs[i].isSystem) return;
    if (S.selecting) { Sel.toggle(i); return; } // while selecting, a right-click or long-press picks the message
    this.i = i; this.ret = document.activeElement;
    const acts = this.actions(i);
    this.run = acts.map(a => a[2]);
    this.el.innerHTML = acts.map(([icon, label], k) => '<button role="menuitem" data-mm="' + k + '"><span class="mi">' + (ICON[icon] || '') + '</span><span class="ml">' + esc(label) + '</span></button>').join('');
    this.el.hidden = false;
    const row = layer.querySelector('.row[data-i="' + S.m2i[i] + '"]');
    this.place(row, x, y);
    layer.querySelectorAll('.row.mm-on').forEach(r => r.classList.remove('mm-on'));
    if (row) row.classList.add('mm-on');
    const f = this.el.querySelector('[role="menuitem"]'); if (f) f.focus({ preventScroll: true });
  },
  // Under the message, lined up with its bubble, as in WhatsApp. Near the bottom the chat scrolls up to make room;
  // only when it can't (the end of the chat) does the menu go above the message.
  place(row, x, y) {
    const el = this.el, w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
    const bub = row && row.querySelector('.bubble');
    if (bub) {
      const sc = scroller.getBoundingClientRect(), room = Math.min(vh, sc.bottom) - 8;
      let r = bub.getBoundingClientRect();
      const need = r.bottom + 4 + h - room;
      if (need > 0) {
        const can = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
        if (can > 0) { this.moving = true; scroller.scrollTop += Math.min(need, can, Math.max(0, r.top - sc.top - 8)); VL.update(); r = bub.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => { this.moving = false; })); }
      }
      x = r.right - w; // right-aligned with the bubble, for sent and received messages alike
      y = r.bottom + 4;
      if (y + h > room) y = r.top - h - 4 >= sc.top + 8 ? r.top - h - 4 : room - h;
    }
    el.style.left = Math.max(8, Math.min(x, vw - w - 8)) + 'px';
    el.style.top = Math.max(8, Math.min(y, vh - h - 8)) + 'px';
  },
  close(focusBack) {
    if (this.el.hidden) return;
    this.el.hidden = true; this.el.innerHTML = '';
    layer.querySelectorAll('.row.mm-on').forEach(r => r.classList.remove('mm-on'));
    if (focusBack && this.ret && document.contains(this.ret)) this.ret.focus({ preventScroll: true });
  }
};
// What Copy puts on the clipboard: the message as exported; a poll's question and options; a location's link.
function copyable(m) {
  if (m.kind === 'poll' && m.extra) return [m.extra.q].concat((m.extra.options || []).map(o => '• ' + o.label)).join('\n');
  if (m.kind === 'location' && m.extra) return m.message || m.extra.url || '';
  return m.message || '';
}
function contactText(c) {
  return [c.name].concat(c.org ? [c.org] : [], c.phones.map(p => p.value), c.emails, c.urls).join('\n');
}
// Saving goes through a normal download link, so the published preview's save prompt still applies.
function saveFile(e) {
  const a = document.createElement('a');
  a.href = e.url; a.download = e.name; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
}
// The share sheet only works where the page may use it: not inside a frame that doesn't allow it
// (such as the dev preview), and not in browsers without it. Elsewhere Share isn't offered.
function canShare() {
  if (!navigator.share || !window.isSecureContext) return false;
  const fp = document.permissionsPolicy || document.featurePolicy;
  if (fp && fp.allowsFeature) return fp.allowsFeature('web-share');
  try { return window.top === window; } catch (e) { return false; }
}
async function shareMsg(m) {
  const files = m.attachments.map(a => a.url && Media.get(a.name)).filter(Boolean).map(e => new File([e.blob], e.name, { type: e.mime }));
  const data = files.length && navigator.canShare && navigator.canShare({ files }) ? { files, text: m.message || undefined } : { text: copyable(m) || files.map(f => f.name).join(', ') };
  try { await navigator.share(data); }
  catch (err) {
    if (err && err.name === 'AbortError') return;
    // Blocked after all: copy the message instead, so the press still does something useful.
    const text = copyable(m);
    if (text) copyText(text, t(m.kind === 'poll' ? 'mm.poll' : 'mm.message')); else toast.error(t('mm.share_failed'));
  }
}
const rowMsg = el => { const row = el && el.closest && el.closest('.row:not(.daterow):not(.sysrow)'); if (!row) return -1; const it = S.items[+row.dataset.i]; return it && it.type !== 'date' ? it.i : -1; };

$('msgMenu').addEventListener('click', e => {
  const b = e.target.closest('[data-mm]'); if (!b) return;
  const run = MsgMenu.run[+b.dataset.mm];
  MsgMenu.close(true); if (run) run();
});
$('msgMenu').addEventListener('keydown', e => {
  const items = [...MsgMenu.el.querySelectorAll('[role="menuitem"]')], k = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(k + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
  else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1].focus(); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); MsgMenu.close(true); }
  else if (e.key === 'Tab') MsgMenu.close(false);
});
// Anything else closes it: a press outside, scrolling the chat, resizing the window.
document.addEventListener('pointerdown', e => { if (MsgMenu.isOpen() && !MsgMenu.el.contains(e.target)) MsgMenu.close(false); }, true);
scroller.addEventListener('scroll', () => { if (!MsgMenu.moving) MsgMenu.close(false); }, { passive: true });
window.addEventListener('resize', () => MsgMenu.close(false));

// Right-click (and Android's long-press, which fires contextmenu). A text selection keeps the browser's own menu, for copying part of a message.
layer.addEventListener('contextmenu', e => {
  const i = rowMsg(e.target); if (i < 0) return;
  const sel = window.getSelection && String(window.getSelection());
  if (sel && e.target.closest('.bubble') && e.target.closest('.bubble').contains(window.getSelection().anchorNode)) return;
  e.preventDefault(); press.done = true;
  MsgMenu.open(i, e.clientX, e.clientY);
});
// Long-press on touch screens (iPhone Safari has no contextmenu event). The click that ends it is swallowed.
const press = { timer: 0, x: 0, y: 0, done: false };
layer.addEventListener('pointerdown', e => {
  press.done = false;
  if (e.pointerType !== 'touch' || rowMsg(e.target) < 0 || e.target.closest('.wave, .vseek, .aseek')) return;
  press.x = e.clientX; press.y = e.clientY;
  clearTimeout(press.timer);
  press.timer = setTimeout(() => {
    const i = rowMsg(e.target); if (i < 0 || MsgMenu.isOpen()) return;
    press.done = true;
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (err) { /* ignore */ }
    MsgMenu.open(i, press.x, press.y + 12);
  }, 480);
});
const cancelPress = () => clearTimeout(press.timer);
layer.addEventListener('pointermove', e => { if (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10) cancelPress(); });
layer.addEventListener('pointerup', cancelPress);
layer.addEventListener('pointercancel', cancelPress);
layer.addEventListener('click', e => { if (press.done) { press.done = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
// The ⌄ button in each bubble, and the keyboard.
layer.addEventListener('click', e => {
  const b = e.target.closest('[data-mmenu]'); if (!b) return;
  e.stopImmediatePropagation();
  if (MsgMenu.isOpen() && MsgMenu.i === +b.dataset.mmenu) { MsgMenu.close(true); return; }
  MsgMenu.open(+b.dataset.mmenu, 0, 0, b);
}, true);
layer.addEventListener('keydown', e => {
  if (!(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return;
  const i = rowMsg(document.activeElement); if (i < 0) return;
  e.preventDefault();
  const r = document.activeElement.getBoundingClientRect();
  MsgMenu.open(i, r.left + 20, r.top + 20);
});
document.addEventListener('langchange', () => MsgMenu.close(false));
