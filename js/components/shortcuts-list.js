"use strict";
/* =====================================================================
   Every keyboard shortcut in the app, in one list. The keyboard handler,
   the Keyboard shortcuts sheet, the hints in menus and the tooltips
   (js/components/shortcuts.js) all read it, so a shortcut added here
   shows up everywhere at once. See .claude/skills/keyboard-shortcuts-skill.

   Each entry:
   - id: a short name. A hint on a button or menu item names it in
     data-key="id" (index.html) or KEY_HINTS (shortcuts.js).
   - group: the heading it is listed under in the sheet (KEY_GROUPS).
   - label: the dictionary key of its name (js/i18n), in en, ur and ar.
   - keys: the combinations, as 'Mod+Shift+S'. Mod is Cmd (⌘) on a Mac and
     Ctrl on Windows and Linux. Use { mac: [...], other: [...] } when they
     differ. Letters are written in capitals and match on any keyboard
     layout (Urdu and Arabic included); named keys use the browser's names
     (Escape, Enter, Space, ArrowUp, Home, PageDown, F3).
   - where: the places it works. 'start' (start screen), 'chat', 'select'
     (selecting messages), 'message' (a message has keyboard focus),
     'search' (the search bar is open), 'gallery', 'lb' (photo viewer),
     'pdf', 'keys' (this sheet), 'dialog' (any other dialog).
   - single: true for a key with no Ctrl, Cmd or Alt that works anywhere
     in the chat, or a list of the keys that are (['/']). Settings ›
     Single-key shortcuts turns these off (WCAG 2.1.4).
   - field: also works while typing in a text field.
   - when(): an extra condition, checked before run.
   - run(e): what it does. Return false to leave the key to the browser.
     Without run the entry is only listed: another component handles it.
   Never use a key the browser keeps for itself (PROJECT_RULES.md, "Keyboard").
   ===================================================================== */
const KEY_GROUPS = [
  ['general', 'keys.g_general'], ['message', 'keys.g_message'], ['search', 'keys.g_search'],
  ['select', 'keys.g_select'], ['viewer', 'keys.g_viewer'], ['gallery', 'common.media_links_and_docs']
];
const CHAT = ['chat', 'select'];
const KEY_LIST = [
  /* ---------- General ---------- */
  { id: 'open', group: 'general', label: 'keys.open', keys: ['Mod+O'], where: ['start', 'chat', 'select'], field: true, run: () => pick() },
  { id: 'search', group: 'general', label: 'keys.search', keys: ['Mod+F', '/'], where: ['chat', 'select', 'search'], field: true, single: ['/'],
    run: (e, k) => { if (k === '/' && Keys.typing(e)) return false; if (Sel.on) Sel.stop(); openSearch(); } },
  { id: 'settings', group: 'general', label: 'menu.settings', keys: ['Mod+,', 'Mod+Shift+S'], where: CHAT, field: true, run: () => Settings.open() },
  { id: 'keys', group: 'general', label: 'keys.title', keys: ['?', 'Mod+/'], where: ['start', 'chat', 'select', 'keys'], field: true, single: ['?'],
    run: (e, k) => { if (k === '?' && Keys.typing(e)) return false; Keys.toggle(); } },
  { id: 'gallery', group: 'general', label: 'common.media_links_and_docs', keys: ['M'], where: CHAT, single: true, run: () => Gallery.open() },
  { id: 'starred', group: 'general', label: 'common.starred_messages', keys: ['*'], where: CHAT, single: true, run: () => $('starBtn').click() },
  { id: 'select', group: 'general', label: 'sel.select_messages', keys: ['X'], where: ['chat'], single: true, run: () => Sel.start(Keys.msg()) },
  { id: 'stats', group: 'general', label: 'common.chat_statistics', keys: ['I'], where: CHAT, single: true, run: () => openStats() },
  { id: 'nicks', group: 'general', label: 'nick.title', keys: ['P'], where: CHAT, single: true, run: () => NickUI.open() },
  { id: 'date', group: 'general', label: 'sidebar.jump_to_date', keys: ['D'], where: CHAT, single: true,
    run: () => { if (isNarrow()) openDrawer(); else if (document.body.classList.contains('side-hidden')) toggleSide(); $('jumpDate').focus(); } },
  { id: 'panel', group: 'general', label: 'keys.toggle_panel', keys: ['['], where: CHAT, single: true, run: () => $('menuBtn').click() },
  { id: 'nextMsg', group: 'general', label: 'keys.next_message', keys: ['J'], where: CHAT, single: true, run: () => Keys.move(1) },
  { id: 'prevMsg', group: 'general', label: 'keys.prev_message', keys: ['K'], where: CHAT, single: true, run: () => Keys.move(-1) },
  { id: 'first', group: 'general', label: 'chat.jump_to_first_message', keys: { mac: ['Mod+ArrowUp'], other: ['Mod+Home'] }, where: CHAT, run: () => Keys.edge(-1) },
  { id: 'latest', group: 'general', label: 'chat.jump_to_latest_message', keys: { mac: ['Mod+ArrowDown'], other: ['Mod+End'] }, where: CHAT, run: () => Keys.edge(1) },
  { id: 'nextChat', group: 'general', label: 'keys.next_chat', keys: ['Alt+ArrowDown'], where: CHAT, when: () => (S.library || []).length > 1, run: () => Keys.chat(1) },
  { id: 'prevChat', group: 'general', label: 'keys.prev_chat', keys: ['Alt+ArrowUp'], where: CHAT, when: () => (S.library || []).length > 1, run: () => Keys.chat(-1) },
  { id: 'close', group: 'general', label: 'keys.close', keys: ['Escape'], where: ['start', 'chat', 'gallery', 'keys', 'dialog'], field: true, run: () => Keys.escape() },

  /* ---------- The message that has keyboard focus (J and K move it) ---------- */
  { id: 'msgMenu', group: 'message', label: 'keys.msg_menu', keys: ['Shift+F10'] }, // js/components/message-menu.js
  { id: 'msgOpen', group: 'message', label: 'keys.msg_open', keys: ['Enter'], where: ['message'], run: () => Keys.act(['image', 'document', 'contact']) },
  { id: 'msgStar', group: 'message', label: 'keys.msg_star', keys: ['S'], where: ['message'], run: () => Keys.act(['star', 'unstar']) },
  { id: 'msgCopy', group: 'message', label: 'mm.copy', keys: ['Mod+C'], where: ['message'], when: () => !String(getSelection()), run: () => Keys.act(['copy']) },
  { id: 'msgDownload', group: 'message', label: 'keys.download', keys: ['Mod+S'], where: ['message'], run: () => Keys.act(['download']) },
  { id: 'msgPlay', group: 'message', label: 'keys.msg_play', keys: ['Space'], where: ['message'], run: () => Keys.play() },
  { id: 'msgSeek', group: 'message', label: 'keys.msg_seek', keys: ['ArrowLeft', 'ArrowRight'], where: ['message'],
    run: (e, k) => Keys.seek(k === 'ArrowRight' ? 5 : -5) },
  { id: 'msgSelect', group: 'message', label: 'keys.msg_select', keys: ['X'] }, // the X above, started on this message

  /* ---------- Search bar ---------- */
  { id: 'nextMatch', group: 'search', label: 'keys.next_match', keys: ['Enter', 'Mod+G', 'F3'], where: ['search'], field: true,
    run: (e, k) => { if (k === 'Enter') return false; step(1); } }, // Enter is the search field's own (app.js)
  { id: 'prevMatch', group: 'search', label: 'keys.prev_match', keys: ['Shift+Enter', 'Mod+Shift+G', 'Shift+F3'], where: ['search'], field: true,
    run: (e, k) => { if (k === 'Shift+Enter') return false; step(-1); } },
  { id: 'matchCase', group: 'search', label: 'search.match_case', keys: ['Alt+C'] }, // the search bar's own keys (app.js)
  { id: 'wholeWord', group: 'search', label: 'search.whole_word', keys: ['Alt+W'] },
  { id: 'regex', group: 'search', label: 'search.regex', keys: ['Alt+R'] },
  { id: 'recent', group: 'search', label: 'keys.recent', keys: ['ArrowDown'] }, // js/components/search-history.js

  /* ---------- Selecting messages ---------- */
  { id: 'selPick', group: 'select', label: 'keys.sel_pick', keys: ['Space', 'Enter'] }, // js/components/select-messages.js
  { id: 'selCopy', group: 'select', label: 'keys.sel_copy', keys: ['Mod+C'], where: ['select'], when: () => !String(getSelection()), run: () => Sel.copy() },
  { id: 'selStar', group: 'select', label: 'keys.sel_star', keys: ['S'], where: ['select'], run: () => Sel.star() },
  { id: 'selStop', group: 'select', label: 'sel.cancel', keys: ['Escape'] },

  /* ---------- Photo and PDF viewer ---------- */
  { id: 'lbPrev', group: 'viewer', label: 'viewer.previous_photo', keys: ['ArrowLeft'], where: ['lb'], run: () => lbStep(I18N.rtl() ? 1 : -1) }, // the next photo is on the left in right-to-left
  { id: 'lbNext', group: 'viewer', label: 'viewer.next_photo', keys: ['ArrowRight'], where: ['lb'], run: () => lbStep(I18N.rtl() ? -1 : 1) },
  { id: 'zoomIn', group: 'viewer', label: 'common.zoom_in', keys: ['+'], where: ['lb', 'pdf'], run: () => Keys.inLb() ? zTo(Z.s * 1.5, undefined, undefined, true) : pdfZoom(1) },
  { id: 'zoomOut', group: 'viewer', label: 'common.zoom_out', keys: ['-'], where: ['lb', 'pdf'], run: () => Keys.inLb() ? zTo(Z.s / 1.5, undefined, undefined, true) : pdfZoom(-1) },
  { id: 'fit', group: 'viewer', label: 'viewer.fit_to_screen', keys: ['0'], where: ['lb', 'pdf'], run: () => Keys.inLb() ? zTo(1, undefined, undefined, true) : pdfZoom(0) },
  { id: 'rotate', group: 'viewer', label: 'viewer.rotate_photo', keys: ['R'], where: ['lb'], run: () => zRotate() },
  { id: 'lbVideo', group: 'viewer', label: 'keys.play_video', keys: ['Space'], where: ['lb'], when: () => !$('lbVid').hidden && !$('lbVid').loop,
    run: () => { const v = $('lbVid'); if (v.paused) v.play().catch(() => {}); else v.pause(); } },
  { id: 'pdfPage', group: 'viewer', label: 'keys.pdf_page', keys: ['PageDown', 'PageUp'], where: ['pdf'],
    run: (e, k) => { const b = $('pdfPages'); b.scrollBy({ top: (k === 'PageDown' ? 1 : -1) * b.clientHeight * 0.9 }); } },
  { id: 'lbGo', group: 'viewer', label: 'media_gallery.go_to_message', keys: ['G'], where: ['lb'], run: () => $('lbGo').click() },
  { id: 'viewerDownload', group: 'viewer', label: 'keys.download', keys: ['Mod+S'], where: ['lb', 'pdf'], run: () => $(Keys.inLb() ? 'lbDl' : 'pdfDl').click() },
  { id: 'viewerClose', group: 'viewer', label: 'common.close', keys: ['Escape'], where: ['lb', 'pdf'], field: true, run: () => Keys.inLb() ? closeLightbox() : closePdf() },

  /* ---------- Media, links and docs ---------- */
  { id: 'galTab', group: 'gallery', label: 'keys.gal_tab', keys: ['1', '2', '3', '4', '5', '6', '7', '8'], where: ['gallery'],
    run: (e, k) => { const c = GAL_CATS[+k - 1]; if (!c) return false; Gallery.show(c[0]); $('galChips').querySelector('.on').focus(); } },
  { id: 'galTabs', group: 'gallery', label: 'keys.gal_tabs', keys: ['ArrowLeft', 'ArrowRight'] }, // media-gallery.js, on the tabs
  { id: 'galMenu', group: 'gallery', label: 'keys.gal_menu', keys: ['Shift+F10'] }, // gallery-menu.js
  { id: 'galDownload', group: 'gallery', label: 'keys.download', keys: ['Mod+S'], where: ['gallery'], when: () => galItem(document.activeElement) >= 0,
    run: () => { const it = Gallery.list[galItem(document.activeElement)]; if (!it || !it.e) return false; saveFile(it.e); } }
];
