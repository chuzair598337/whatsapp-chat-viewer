"use strict";
/* =====================================================================
   Settings screen, laid out like WhatsApp's: opened from "Settings" in
   the header's ⋮ menu. Every preference lives here (PROJECT_RULES.md,
   "Settings"): who you are, theme, text size, language, background pattern and the
   date format, plus shortcuts to statistics, the tour and About (What's new).

   - Theme, text size, language and background pattern are kept in localStorage
     (cv-theme, app_language, cv-text-size, cv-doodle, cv-online-links, cv-autoplay, cv-gallery-view, cv-single-keys). Who you are and the date format
     belong to the open chat and are not stored.
   - Participants and nicknames opens its own sheet
     (js/components/nicknames.js); nicknames are kept per chat.
   - A row with choices opens the pick sheet (#pickModal), a list of radio
     buttons like WhatsApp's own dialogs.
   - The screen is drawn from JavaScript, so render() redraws it in the
     current language.
   ===================================================================== */
const APP_VERSION = '1.12.0';
Object.assign(ICON, {
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  globe: ic('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z"/>'),
  palette: ic('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6h1.9a4.7 4.7 0 0 0 4.7-4.7c0-3.6-4-6.6-9-6.6z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>'),
  calendar: ic('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  info: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/>'),
  textsize: ic('<path d="M3 19l5.5-14 5.5 14M5 14h7M14.5 19l3.5-9 3.5 9M15.7 16h4.6"/>'),
  doodle: ic('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7.5 9.5l2-2 2 2 2-2 2 2M8 15.5h.1M12 15.5h.1M16 15.5h.1"/>')
});

const Settings = {
  open() {
    if (!S.msgs.length) return;
    this.render();
    openModal('setModal');
    $('setBack').focus();
  },
  // quiet: the tour moves on, so focus isn't sent back to the ⋮ button
  close(quiet) {
    const m = $('setModal');
    if (m.hidden) return;
    if (quiet) { m.hidden = true; Dialogs.close(m); } else closeModal('setModal');
  },
  isOpen() { return !$('setModal').hidden; },
  render() {
    const res = S.res;
    if (!res) return;
    // Redrawing replaces the rows, so the focused one gets focus back afterwards.
    const ae = document.activeElement, keep = ae && $('setBody').contains(ae) ? (ae.dataset.set ? '[data-set="' + ae.dataset.set + '"]' : ae.id ? '#' + ae.id : null) : null;
    const chev = '<span class="sx" aria-hidden="true">' + ICON.next + '</span>';
    const row = (act, icon, title, sub, extra) =>
      '<button class="set-row" data-set="' + act + '"' + (extra || '') + '><span class="si">' + ICON[icon] + '</span><span class="st"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + chev + '</button>';
    const tsKeys = Keys.text('textSize'); // + or −, hidden on touch screens (css/settings.css)
    const me = S.me, themeName = t({ light: 'menu.light', dark: 'menu.dark', system: 'menu.match_system' }[theme]);
    const orderName = { dmy: 'DD/MM/YYYY', mdy: 'MM/DD/YYYY', ymd: 'YYYY-MM-DD' }[res.order];
    const orderVal = t({ auto: 'sidebar.automatic', dmy: 'sidebar.day_month', mdy: 'sidebar.month_day' }[S.order] || 'sidebar.automatic');
    const orderSub = res.order === 'ymd' ? esc(t('settings.date_fixed'))
      : esc(orderVal) + ' · <bdi>' + esc(t('sidebar.reading_dates_as', { format: orderName })) + '</bdi>' + (res.ambiguous && S.order === 'auto' ? ' <span class="chip">' + t('sidebar.guessed') + '</span>' : '');
    $('setBody').innerHTML =
      '<button class="set-prof" data-set="me" aria-label="' + esc(t('settings.change_you')) + '">' +
        (me ? '<span class="av c' + colorIdx(me) + '">' + esc(initials(nick(me))) + '</span>' : '<span class="av none">–</span>') +
        '<span class="st"><small>' + t('settings.you_are') + '</small><b dir="auto">' + esc(me ? nick(me) : t('settings.nobody_chosen')) + '</b><small>' + t(me ? 'settings.your_messages_right' : 'settings.everyone_left') + '</small></span>' + chev + '</button>' +
      '<section class="set-grp" aria-labelledby="setG1"><h3 id="setG1">' + t('settings.chats') + '</h3>' +
        row('theme', 'palette', t('menu.theme'), esc(themeName)) +
        row('textsize', 'textsize', t('settings.text_size'), esc(textSizeName(textSize)) + (tsKeys ? '<span class="set-key"> · <bdi>' + esc(tsKeys) + '</bdi></span>' : ''), tsKeys ? ' aria-keyshortcuts="' + esc(Keys.aria('textSize')) + '"' : '') +
        row('lang', 'globe', t('common.language'), '<bdi>' + esc(I18N.info().name) + '</bdi>') +
        '<label class="set-row"><span class="si">' + ICON.doodle + '</span><span class="st"><b>' + t('sidebar.background_pattern') + '</b><small>' + t('settings.pattern_sub') + '</small></span><input type="checkbox" class="switch" id="doodle"' + (doodleOn ? ' checked' : '') + '></label>' +
        '<label class="set-row"><span class="si">' + ICON.link + '</span><span class="st"><b>' + t('settings.online_links') + '</b><small>' + t('settings.online_links_sub') + '</small></span><input type="checkbox" class="switch" id="onlineLinks"' + (onlineLinks ? ' checked' : '') + '></label>' +
        '<label class="set-row"><span class="si">' + ICON.autoplay + '</span><span class="st"><b>' + t('settings.autoplay') + '</b><small>' + t('settings.autoplay_sub') + '</small></span><input type="checkbox" class="switch" id="autoplay"' + (Autoplay.on ? ' checked' : '') + '></label>' +
        row('gview', 'image', t('settings.gallery_view'), esc(t('settings.gallery_view_sub', { view: Gallery.layoutName() }))) +
        row('order', 'calendar', t('sidebar.date_format'), orderSub, res.order === 'ymd' ? ' disabled' : '') +
      '</section>' +
      '<section class="set-grp" aria-labelledby="setG2"><h3 id="setG2">' + t('settings.this_chat') + '</h3>' +
        row('nick', 'group', t('nick.title'), Nick.count() ? esc(t('nick.n_renamed', { n: Nick.count(), count: nf(Nick.count()) })) : t('nick.sub')) +
        row('stats', 'stats', t('common.chat_statistics'), t('settings.stats_sub')) +
      '</section>' +
      '<section class="set-grp" aria-labelledby="setG3"><h3 id="setG3">' + t('settings.help') + '</h3>' +
        row('tour', 'help', t('menu.help_and_guided_tour'), t('settings.tour_sub')) +
        row('keys', 'keyboard', t('keys.title'), t('keys.settings_sub')) +
        '<label class="set-row"><span class="si">' + ICON.keyboard + '</span><span class="st"><b>' + t('keys.single') + '</b><small>' + t('keys.single_sub') + '</small></span><input type="checkbox" class="switch" id="singleKeys"' + (Keys.single ? ' checked' : '') + '></label>' +
        row('whatsnew', 'info', t('settings.about'), esc(t('settings.version', { v: APP_VERSION })) + ' · ' + t('whats_new.title')) +
        '<div class="set-row static"><span class="si">' + ICON.lock + '</span><span class="st"><small>' + t('sidebar.your_chat_is_read_inside') + ' ' + t('settings.saved_note') + '</small></span></div>' +
      '</section>';
    const f = keep && $('setBody').querySelector(keep); if (f) f.focus({ preventScroll: true });
  },
  act(a) {
    if (a === 'me') openMeModal(true); // optional here: ✕, Cancel, Esc and a tap outside close it
    else if (a === 'theme') pickSheet(t('menu.theme'), [['light', t('menu.light')], ['dark', t('menu.dark')], ['system', t('menu.match_system')]], theme, v => { setTheme(v); this.render(); });
    else if (a === 'textsize') pickSheet(t('settings.text_size'), TEXT_SIZES.map(([v, f]) => [v, '<span class="ts-opt" style="--ts:' + f + '">' + esc(t('settings.ts_' + v)) + '</span> <small class="ts-pct">' + esc(f.toLocaleString(I18N.locale(), { style: 'percent' })) + '</small>']), textSize, v => { setTextSize(v); this.render(); });
    else if (a === 'lang') pickSheet(t('common.language'), LANGS.map(l => [l.code, '<span lang="' + l.code + '">' + esc(l.name) + '</span>']), I18N.lang, v => I18N.set(v));
    else if (a === 'order') pickSheet(t('sidebar.date_format'), [['auto', t('sidebar.automatic')], ['dmy', t('sidebar.day_month') + ' <bdi dir="ltr">(DD/MM/YYYY)</bdi>'], ['mdy', t('sidebar.month_day') + ' <bdi dir="ltr">(MM/DD/YYYY)</bdi>']], S.order, v => setOrder(v));
    else if (a === 'gview') Gallery.pickLayout(); // also the View button on Photos and Videos (js/components/media-gallery.js)
    else if (a === 'nick') NickUI.open(); // js/components/nicknames.js
    else if (a === 'stats') openStats();
    else if (a === 'tour') { this.close(true); Tour.welcome(); }
    else if (a === 'whatsnew') WhatsNew.show(); // js/components/whats-new.js: every version
    else if (a === 'keys') Keys.open(); // js/components/shortcuts.js
  }
};

/* Pick sheet: a title with a ✕ close button and a list of radio buttons. Picking one closes it and calls done(value);
   ✕, Esc or a tap outside closes it without a change.
   Labels are the app's own text (trusted), never chat content. */
let pickDone = null;
function pickSheet(title, opts, cur, done) {
  pickDone = done;
  $('pickTitle').textContent = title;
  $('pickList').innerHTML = opts.map(([v, label]) =>
    '<label class="pickopt"><input type="radio" name="pick" value="' + esc(v) + '"' + (v === cur ? ' checked' : '') + '><span>' + label + '</span></label>').join('');
  openModal('pickModal');
  const c = $('pickList').querySelector('input:checked') || $('pickList').querySelector('input');
  if (c) c.focus();
}
// A click or Enter picks; arrow keys only move between the choices, as in a radio group.
$('pickList').addEventListener('click', e => {
  const r = e.target.closest('.pickopt'); if (!r || e.detail === 0) return; // keyboard: handled below
  const v = r.querySelector('input').value, done = pickDone;
  e.preventDefault(); pickDone = null; closeModal('pickModal'); if (done) done(v);
});
$('pickList').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const r = e.target.closest('.pickopt'); if (!r) return;
  e.preventDefault(); const v = r.querySelector('input').value, done = pickDone; pickDone = null; closeModal('pickModal'); if (done) done(v);
});

$('setBody').addEventListener('click', e => { const b = e.target.closest('[data-set]'); if (b && !b.disabled) Settings.act(b.dataset.set); });
$('setBody').addEventListener('change', e => { if (e.target.id === 'doodle') setDoodle(e.target.checked); else if (e.target.id === 'onlineLinks') LinkOnline.set(e.target.checked); else if (e.target.id === 'autoplay') Autoplay.set(e.target.checked); else if (e.target.id === 'singleKeys') { Keys.setSingle(e.target.checked); Settings.render(); } });
$('setBack').innerHTML = ICON.back;
$('setBack').onclick = () => Settings.close();
$('miSet').innerHTML = ICON.gear;
$('setBtn').onclick = () => Settings.open();
