# Features

This page describes what the WhatsApp Chat Viewer does today and how each part works. It lists only what is in the app: when a feature is added, changed or removed, this page changes with it. For setup and usage, see the [README](../README.md). Requested work that isn't built yet is in [todo.md](todo.md), and ideas ruled out are in [deferred.md](deferred.md).

## Contents

1. [Offline security and privacy](#1-offline-security-and-privacy)
2. [File ingestion: .txt and .zip](#2-file-ingestion-txt-and-zip)
3. [Date and timestamp parser](#3-date-and-timestamp-parser)
4. [Responsive layout](#4-responsive-layout)
5. [WhatsApp formatting](#5-whatsapp-formatting)
6. [Rich media](#6-rich-media)
7. [Search and navigation](#7-search-and-navigation)
8. [Statistics](#8-statistics)
9. [Themes](#9-themes)
10. [Performance](#10-performance)
11. [Start screen, sample chat and guided tour](#11-start-screen-sample-chat-and-guided-tour)
12. [Code layout](#12-code-layout)
13. [Interface languages](#13-interface-languages)
14. [Settings](#14-settings)
15. [Message menu](#15-message-menu)
16. [Notifications](#16-notifications)
17. [Selecting messages](#17-selecting-messages)
18. [What's new](#18-whats-new)
19. [Keyboard shortcuts](#19-keyboard-shortcuts)

---

## 1. Offline security and privacy

- **Nothing leaves the device.** The page makes no network requests after it loads: no analytics, no fonts, no CDNs, no link previews and no fetched favicons. Every test run checks that the request log is empty. The only exception is **Online link previews** in Settings, which is off until you turn it on (see Links below).
- **Enforced by the browser.** A Content-Security-Policy in `index.html` only lets the page load its own files and `blob:`/`data:` URLs, and blocks frames, plugins and form posts. Even a future mistake can't reach the network.
- **No server code.** GitHub Pages only serves the static files. Opening a chat reads it with the browser's `File` API in memory.
- **Bundled dependencies.** JSZip 3.10.1, pdf.js 3.11.174, the lottie-web 5.13.0 light build, libheif (libheif-js 1.23.5, a WebAssembly HEIC decoder) and Notyf 3.10.0 (notifications) ship in `js/vendor/`, so the viewer also works when opened straight from disk with no internet connection.
  - pdf.js is only loaded when a chat contains a PDF, lottie-web only when it contains an iPhone animated sticker, and libheif only when a HEIC photo needs decoding. The Content-Security-Policy allows `'wasm-unsafe-eval'` so the browser can compile libheif's WebAssembly; plain JavaScript `eval` stays blocked.
  - lottie-web's light build draws SVG and has no expression support, so nothing in a sticker runs as code. Image and font paths inside an animation are dropped before it plays, so it never fetches anything.
  - It runs with `eval` disabled and with no font or CMap URLs, so it never fetches anything. Disabling `eval` is also the documented fix for CVE-2024-4367 in this version. A newer pdf.js only ships as ES modules, which a page opened from disk can't load, so 3.11 stays for now.
- **Safe rendering.** Message text is HTML-escaped before formatting is applied. Links are only made clickable when they are `http://` or `https://`, and they open with `target="_blank" rel="noopener noreferrer"`. A message containing `<script>` tags or `javascript:` URLs shows as plain text.
- **Memory hygiene.** Media is turned into `blob:` URLs that only this tab can read. Every URL, decoded waveform and video poster is revoked when another chat is opened. A new archive's media is only swapped in after its chat parses successfully, so a bad file never leaves the viewer half-loaded.
- **What is stored on the device.** The theme (`cv-theme`), the chat text size (`cv-text-size`), the language (`app_language`), the background pattern (`cv-doodle`), the Online link previews switch (`cv-online-links`), Autoplay voice messages (`cv-autoplay`), whether the welcome tour has been seen (`has_completed_walkthrough`) and the last version whose What's new popup was seen (`cv-seen-version`) are stored in `localStorage`. So are, only once you use them, the nicknames you give people (`chat_nicknames_<id>`, one entry per chat, holding each renamed person's exported name and nickname) and your last 7 searches (`chat_search_history`). Who you are and the date order belong to the open chat and are not stored. Messages and media are never stored, and nothing stored ever leaves the device.

## 2. File ingestion: .txt and .zip

- **Ways to open:** drag and drop anywhere on the page (a panel with a folder icon says "Drop your WhatsApp export here"), **Browse files** on the start screen, **Open another chat** in the ⋮ menu, the side panel's open button, **Open another chat** on the chat card, or the button in the sample chat's banner. Several files can be picked or dropped at once.
- **Type detection:** the first bytes are checked (`PK\x03\x04` means ZIP), then the extension and MIME type, so a renamed file still opens correctly.
- **Plain text (.txt):** the file is read in 2 MB chunks through a streaming `TextDecoder`. Media references in the text appear as "not included" cards.
- **ZIP archives:** opened with the built-in streaming reader (below). The viewer finds `_chat.txt` (iPhone) or the main `WhatsApp Chat with ….txt` (Android), and otherwise falls back to the largest `.txt` file.
  - The chat appears as soon as its text is read. The media is extracted afterwards, four files at a time, and photos, players, the media section and the gallery fill in as files arrive ("Loading media · n of N" in the sidebar, "Loading…" on cards still waiting). Opening another chat stops it.
  - Every other file becomes a `Blob` with the right MIME type, stored in a map keyed by file name.
  - Export names in other languages are recognised too ("WhatsApp-Chat mit …", "Chat de WhatsApp con …", "Discussion WhatsApp avec …" and others), for the chat title and for finding chats in a ZIP.
- **Streaming reader:** reads only the ZIP's file list, then slices each file out and inflates it with the browser's `DecompressionStream('deflate-raw')`, so even a multi-gigabyte export isn't loaded into memory. It supports ZIP64 (over 65,535 files or over 4 GB).
- **JSZip fallback:** for browsers without `DecompressionStream`, or an archive the streaming reader can't open, JSZip runs in a background worker (or on the main thread for a page opened from disk).
- **Several chats:** when the picked files hold more than one chat, a **Chats in these files** list appears in the sidebar. Click a chat to switch to it.
  - Sources: several `.txt` or `.zip` files picked together, a ZIP with one chat per folder, or a ZIP that contains other `WhatsApp Chat ….zip` files.
  - Each chat only sees the media from its own folder, so files with the same name in two chats don't get mixed up.
- **Progress:** a loading card shows a progress bar for reading, unzipping and parsing.

## 3. Date and timestamp parser

The parser runs in a Web Worker built from an inline `Blob` URL, so the page stays responsive. If workers are blocked, it runs on the main thread instead.

- **Both export layouts:**
  - iPhone: `[14/03/2026, 08:03:12] Name: text`
  - Android: `14/03/2026, 08:03 - Name: text`
- **Date formats:** `DD/MM/YY(YY)`, `MM/DD/YY(YY)` and `YYYY-MM-DD`, with `/`, `.` or `-` as separators.
- **Time formats:** 12-hour (`AM`/`PM`, `a.m.`/`p.m.`) and 24-hour, with or without seconds.
- **Day/month detection:** a 4-digit first field means year first. Otherwise any value over 12 settles the order. If every date is ambiguous, the order that keeps the messages most chronological wins. You can override it under **Date format** in Settings.
- **Invisible characters:** removes the direction marks and zero-width characters WhatsApp inserts (U+200E, U+200F, U+202A–U+202E, U+2066–U+2069, U+FEFF), and normalises narrow and no-break spaces.
- **Message kinds:**
  - Incoming and outgoing messages, based on the **Which one is you?** dialog. It opens when a chat with more than one person loads (and from **You are** in Settings) and lists everyone who wrote, with a name search box when there are more than 12 people.
    - **Mandatory when a chat opens:** it has no ✕, and `Esc` or a tap outside doesn't close it.
    - **Optional from Settings:** opened from **You are**, it has a ✕ in its header and a **Cancel** button next to **Show chat**, and `Esc` or a tap outside closes it too. Each of these keeps who you were; only **Show chat** changes it. In nickname editing, `Esc` and **Cancel** first go back to choosing.
    - Someone is always chosen: in a one-to-one chat the best guess, in a group the person with the most messages (marked **suggested**); **None of these** puts everyone on the left. **Show chat** confirms the choice, and it can be changed later in Settings.
    - **Nicknames:** the ✎ button in its header switches to editing. The radio buttons go away, the title becomes **Participants and nicknames**, and each person becomes a field labelled with their exported name and message count, with the placeholder "Nickname (optional)". Every field is optional; an empty one keeps the exported name. `Enter` moves to the next field (and saves from the last one). The footer shows **Cancel** and **Save**: Save stores every change at once (a notification says how many), Cancel or `Esc` drops the edits, and both go back to choosing, with the earlier choice kept. The name search works in both modes.
  - The chat's name on iPhone comes from the sender of its system lines (the encryption notice first). Admin events, which the admin "sends" ("~ Ali: ~ Ali changed this group's icon"), are left out.
  - Multi-line continuations.
  - System lines, shown as centred pills the way WhatsApp groups them:
    - the encryption and business-account notices on yellow;
    - security-code changes with a shield icon;
    - disappearing-message timer changes with a timer icon;
    - phone-number changes and blocking;
    - group events (created, added, removed, left, joined, icon/subject/description changes, admins, invite links) with a group icon.
  - Calls: missed, voice, video and group calls, with the duration, as a call card in the caller's bubble. Missed calls are shown in red, and WhatsApp's "Tap to call back" is dropped.
  - Events. WhatsApp exports an event as the sender's name with nothing after it (`[date, time] Name:`), without its title, time, location or replies. The viewer shows a muted "Message not included in the export" card in its place, instead of treating the line as a system notice.
  - Deleted messages ("This message was deleted") and edited messages (an *Edited* tag by the time).
  - Messages that never loaded. When a message never finished downloading on the phone that exported the chat, WhatsApp writes "Waiting for this message. This may take a while." (or "… Check your phone.", or just "Waiting for this message"; iPhone puts U+200E in front) instead of its content. The parser keeps it as its own kind, `waiting`, with no text and the exported line in `extra.raw`; it also knows the Spanish, Portuguese, French, German, Italian and Indonesian wording. The viewer shows it in the sender's bubble, with their name, avatar and time, as a muted card with an hourglass: **Message wasn't loaded**, "This message never finished loading on the phone that exported the chat, so its content isn't in the export." (in English, Urdu or Arabic). It counts as a message from its sender in the header, the side panel and Statistics (with no words). Search doesn't match the notice's wording, only the sender; a starred one is listed as "Message wasn't loaded"; **Copy** (in the message menu and in Select messages) copies the line exactly as exported.
  - Reactions. Normal exports don't include them, but `reacted 👍 to "…"` lines, where present, become a reaction pill under the message they quote, with a count and who reacted. A line that matches no earlier message stays as text.
  - Media attachments and "media omitted" placeholders.
  - Documents keep the title and page count that iPhone writes before the file (`Report.pdf • 2 pages <attached: …>`) and that Android writes before `(file attached)`.
- **Wall-clock times:** times are shown exactly as they appear in the export, whatever the viewer's time zone.

## 4. Responsive layout

- **Breakpoints:** phones are 640 px wide and narrower everywhere (search toggle labels, the full-screen gallery and Settings, bottom sheets, sticker size); two panes from 1024 px, so an iPad in landscape gets them.
- **Desktop and iPad landscape (1024 px and wider):** a two-pane layout. The side panel shows the chat card (messages, media, first and last date, file name, size and iPhone or Android format, with **Statistics** and **Open another chat** buttons), the chat list when there are several, the filters, the media tiles, jump to date, the participants with their message counts (the first 80, then "and N more") and the privacy note. The chat pane fills the rest. The panel's width follows the window, from 300 px at 1024 px up to 420 px on big monitors. Dragging the grip at the middle of the panel's inner edge makes it wider or narrower (280 px up to half the window, at most 640 px); the arrow keys do the same on the focused grip, Home and End jump to the limits, and a double-click resets it. The width lasts until the page is closed. The ☰ button in the chat header hides the sidebar so the chat takes the full width, and shows it again (not remembered between visits).
- **Tablet and phone (narrower than 1024 px):** a single pane. The sidebar opens as a slide-in drawer from the menu button. Widening the window past 1024 px closes the drawer, so it doesn't come back unasked when the window narrows again. While it is closed it is inert, so Tab never reaches it off screen; while it is open the chat behind the backdrop is inert. Opening it moves keyboard focus to its ✕, and closing it (✕, `Esc`, a tap on the backdrop, or picking a participant, a date or a chat) returns focus to ☰.
- **Chat column:** messages sit in a column up to 1040 px wide. A bubble is at most 86% of its row on phones, levelling off at 533 px and then 65% up to 620 px, so bubbles never get narrower as the window grows. When the column is about 900 px wide or more, photos and videos show at up to 400 px and link cards at 360 px. The jump-to-first and jump-to-latest buttons sit at the column's right edge (on the right in every language, since the chat is left to right).
- **Start screen:** a 560 px column, widening to 680 px with slightly larger text from 1600 px.
- **Short screens and phones on their side** (under 500 px tall, such as 844×390): the header, the sample chat's note and the search bar get compact (a 48 px header, the note on one line with its button beside it, smaller scroll buttons), so the chat keeps most of the height. The side panel shows the chat's avatar beside its name and caps the list of chats at 40% of the height. In landscape every sheet uses the full height; Settings and **Media, links and docs** fill the screen, and the gallery puts its title, chips and buttons in one row with six tiles per row.
- **Menus and lists that don't fit scroll:** the ⋮ menu scrolls when the window is too short for it, and **Recent searches** stays above the bottom of the screen (and above an on-screen keyboard), scrolling the rest.
- **Filter bar on phones:** one line, the filter cut short with … (the whole text is its tooltip) and a ✕ to clear the filters. On phones and short screens, the sample chat's note steps aside while a filter or search is on.
- **Name search in Which one is you? and Participants and nicknames** stays at the top while the list scrolls under it. On touch screens the nickname fields are 44 px tall.
- **Chat header:** the chat's name and summary (on a computer it opens Statistics; on a phone it opens the side panel). The summary gives the participants, the message count and the date range; on phones (640 px and narrower) the date range comes first, since the end of the line is cut off, and its tooltip has the whole line. Then the search button and the ⋮ menu. The ⋮ menu holds **Media, links and docs**, **Starred messages** (with a count badge, up to 99+), **Select messages**, **Chat statistics**, **Open another chat**, **Settings**, **Help and guided tour** and **Keyboard shortcuts**; the arrow keys, Home and End move through it, and Esc or Tab closes it. On a computer each item shows its keyboard shortcut at the end (section 19).
- **Search** from the header's search button (or `/`, `Ctrl+F`, `⌘F` on a Mac) opens as a bar under the chat header on every screen size, with ↑ ↓ and a ✕ close button at the end. The browser's own clear ✕ inside the field is hidden so the two don't look alike; `Esc` clears the text.
- **Not selectable:** the side panel, the header, banners, menus, buttons and date pills can't be selected by dragging or clicking, as in WhatsApp. Message text, search and date fields stay selectable.
- **Text size:** Settings › Text size (section 14) makes the chat's text smaller or larger, from 90% to 150%, on every screen size, with `+` and `-` as keys. Message rows reflow and are measured again, with no horizontal scrolling at phone width.
- **Phone polish:** no horizontal scrolling at phone widths. Safe-area insets keep notched phones' notch, rounded corners and home indicator clear (`viewport-fit=cover`): the app, the drawer, the starred panel, centred and full-screen sheets, the photo and PDF viewers and the start screen are padded on every side that needs it, and the chat list leaves room under its last message.
- **Touch screens** (`pointer: coarse`, phones and tablets): controls are about 44 px to tap. Header and toolbar buttons, the floating ↓ button, buttons in dialogs and the tour, menu items, the start screen's language buttons and the banner's button grow; date and sender fields are 40 px tall. Small buttons inside messages and tables (the voice note's speed button, **Read more**, a link card's Copy, the message ⌄ button, **View all** and the statistics sort headers) keep their look and get an invisible 44 px tap area around them, so bubbles don't change size. The search toggles get their labelled row under the field on touch tablets too (not on a landscape phone, where they stay at the end of the field). On a touch screen wider than 1024 px, the side panel's resize grip is always shown.
- **The page always fits the screen** (iPhone 8 report): the page itself never scrolls or pans sideways (`<html>` hides overflow and `<body>` clips it), so a panel sliding in can't make phones zoom the page out, and closing a dialog or the tour puts back any page scroll a focused field left behind. On touch screens text fields, date fields and drop-downs use 16 px text, so iOS Safari no longer zooms in when one gets focus (and leaves the page shifted and cut off at the edge); pinch zoom stays allowed.
- **Tour card on small screens:** it is never taller than the visible area (on an iPhone 8 with Safari's bars, about 375 × 553); its text scrolls and Skip, Back and Next or Finish stay at the bottom of the card.
- **Touch-only devices** (no mouse or trackpad): Settings hides **Keyboard shortcuts** and **Single-key shortcuts**, and the guided tour skips its keyboard shortcuts step. The ⋮ menu already hides key hints there.
- **Group chats:** each sender's name has its own colour, and each run of their messages starts with an avatar showing their initials in that colour.
- **Accessibility:** keyboard focus is managed in modals and returned afterwards, menu items show a green focus ring, every button and field has an accessible name, toggles such as the start screen's language buttons expose `aria-pressed`, sortable table headers expose `aria-sort`, and animations are switched off for `prefers-reduced-motion` (the loading bar then shows a still, full-width bar instead of a sliding one). Primary buttons are white on dark green in light mode and dark on green in dark mode, and the time on your own messages in dark mode is 4.9:1, so both pass WCAG AA. Side panel section headings are all green; only their counts are grey.

## 5. WhatsApp formatting

| Syntax | Result |
|---|---|
| `*bold*` | **bold** |
| `_italic_` | *italic* |
| `~strike~` | ~~strike~~ |
| `` `code` `` and ```` ```block``` ```` | `monospace` |
| `- item` / `* item` | bulleted list |
| `1. item` | numbered list |
| `> quote` | block quote |

- Markers only count at word boundaries, the way WhatsApp applies them, so `2*3*4` stays as typed.
- Messages that are only emoji (up to three) are shown large.
- Spaces and line breaks are kept exactly as typed.
- **Long messages** are shortened like in WhatsApp.
  - Which ones: any message over 450 characters or with more than 6 line breaks shows its first part (at most 6 lines), then "… **Read more**".
  - Expanding and collapsing: clicking Read more shows the whole message with **Show less** at the bottom. After Show less, the start of the message is scrolled back into view if needed.
  - Where the cut goes: at a word break, never inside a `*bold*`, `_italic_`, `~strike~` or `` `code` `` span. A message that starts with a ```` ``` ```` block is cut inside it, and the block is closed; otherwise the cut goes before the block.
  - Search: if a search match is in the hidden part, the message opens automatically, so the highlight is visible.
  - The expanded or collapsed state lasts while the chat is open, and the list re-measures the row so scrolling stays smooth.
  - Code: `js/text-truncator.js`.

## 6. Rich media

Media from a ZIP is matched to its message by file name. WhatsApp's invisible direction marks in file names are ignored when matching. If a referenced file isn't in the archive, the message shows a muted dashed card with the file name and **"Not in this ZIP"**. Media WhatsApp left out of the export says **"Left out when the chat was exported"**. For a `.txt`-only import the card says the chat was opened as text only.

| Type | How it is shown |
|---|---|
| **Photos** | Loaded lazily (`loading="lazy"`), with the space reserved from the image's aspect ratio. The time sits on a small dark pill in the corner, so it reads on light photos too (videos the same). Clicking opens a full-screen viewer (details below). |
| **Stickers** (`.webp`, `STK-`) | Shown without a bubble at WhatsApp's size: 190 px on desktop and 150 px on phones. Animated stickers play and loop, and the time sits in a small pill underneath. iPhone animated stickers (`.was`, a ZIP holding a Lottie animation) play and loop with the bundled Lottie player, in the chat and in the gallery; if one can't be read it falls back to an "Animated sticker" file card with a download button. |
| **HEIC photos** (iPhone `.heic` / `.heif`) | Safari shows them itself. Other browsers get them decoded by the bundled libheif (`js/vendor/libheif`, WebAssembly, loaded only when needed, nothing fetched) and shown like any photo, in the chat, the photo viewer and the gallery. Download keeps the original file. |
| **Files the browser can't show** | A photo, sticker or video the browser can't decode (a HEIC that can't be decoded, HEVC video in Firefox) turns into a file card saying "Can't show this file here", with its size and a download button. It is left out of the photo viewer and shows as a download tile in the media gallery. |
| **GIFs** | Marked with a GIF badge and loop automatically. iPhone exports store GIFs as `-GIF-….mp4`, so these play as muted looping video. With reduced motion turned on, GIFs start paused and a tap plays them. |
| **Video** | Shown like WhatsApp: a thumbnail from the first frame, a big play button, a video icon with the length in the bottom-left corner, and the time in the bottom-right. The thumbnail keeps the video's real shape, so a portrait phone video (down to 9:16) is shown up to 400 px tall instead of being boxed into landscape. After the first play it switches to custom controls: play/pause, elapsed and total time, a seek bar, mute and full screen. A poster image is taken from the first frame. Only one video or voice note plays at a time. |
| **Voice notes** (`PTT-`, iPhone `-AUDIO-`, `.opus`) | Card with the sender's avatar and a mic badge. Its 36-bar waveform is decoded from the audio with the Web Audio API. Tap or drag the waveform to seek, only on the note that is playing (or paused part-way): on any other note a tap does nothing and a swipe scrolls the list, so scrolling can't start or move a note by accident. Switch speed between 1×, 1.5× and 2×. The length shows before the first play, also on iPhone. If the browser's audio player accepts a note but never starts it (seen on iPhone Safari), or can't play its format, the note is decoded and played through Web Audio instead, and later notes go straight there. |
| **Audio files** (`AUD-`, `.mp3`, `.m4a`, …) | Music-file card with the file name, play button, seek bar and duration. The seek bar works only on the file that is playing (or paused part-way). Uses the same Web Audio fallback as voice notes (files up to 40 MB). |
| **Documents** | Card with a coloured type badge (PDF, Word, Excel, PowerPoint, archive, text), the document's title, the file size and a download button. |
| **PDFs** | Like WhatsApp: a preview of the first page above the card, plus the page count. Tapping it opens the in-app PDF viewer (details below). If a PDF is damaged or password protected, the card says so, and the file can still be downloaded. |
| **Links** | Clickable inline. Each link in the message gets a card (up to three, then "+ N more links") with the site's logo on its brand colour, the site's name, what the link is and the address, plus a copy button. About 100 widely used sites have their official logo, bundled with the app (Simple Icons, CC0): YouTube, TikTok, Instagram, Facebook, X, Threads, WhatsApp, Telegram, Snapchat, Google, Google Maps, Drive, Docs, Sheets, Slides, Forms, Meet, Gmail, Spotify, GitHub, Wikipedia, Zoom and more. Microsoft Excel, Word, PowerPoint, OneDrive, Outlook and Teams, LinkedIn, Amazon, Canva, ChatGPT and Daraz, which have no free-to-use logo, get a plain spreadsheet, document, slides or letter icon in their brand colour. Government (`.gov`, `.gov.pk`…) and school or university (`.edu`, `.ac.uk`…) sites get a building or cap icon; other sites keep a coloured letter. What the link is comes from the address alone: for example YouTube video, Short, channel; Instagram reel, post or profile; TikTok video with its @name; WhatsApp channel, group invite or chat with a number; Google search with the search words; GitHub repository; Wikipedia article; OneDrive file or folder; a short link (bit.ly, TinyURL); or a PDF or image file. A WhatsApp export doesn't include link previews (titles and pictures), so by default none are shown and nothing is fetched. **Online link previews** (Settings, off by default, remembered on this device) adds, for YouTube (videos, Shorts, live), Vimeo, Instagram posts and reels, TikTok links that include the video number, Spotify, SoundCloud, Dailymotion, Facebook videos and Google Docs, Sheets, Slides and Forms: a **Play here**, **Show post here**, **Listen here** or **Show document here** button that loads the site's own player into the card on a tap, a thumbnail for YouTube links, and the title from the site's own oEmbed service (YouTube, Vimeo, TikTok, Spotify, SoundCloud) in place of the card's label, in the chat and in Media > Links. Only the link is sent, only to that site. Short links (vt.tiktok.com, share.google), WhatsApp channels and most other sites can't be shown inside a page, so they keep their card and open in a new tab. A video can still refuse to play when its owner turned off embedding, and Google files show only when shared publicly. |
| **Locations** | An offline map card: a street grid drawn locally with a pin (map tiles are never fetched), the coordinates read from the maps link, and a copy button. Tapping it opens the link in your maps app. A shared live location is exported without coordinates, so it shows as "Live location: Not included in exports". |
| **Contacts** (`.vcf`) | Card with the contact's photo or initials, name, and number, or "and N other contacts" when several were shared together. **View contact** opens the details (details below). **Save .vcf** downloads the card so it can be added to a phone's contacts. |

**PDF viewer**
- Every page is drawn on the device with pdf.js. Only the pages near the screen are rendered.
- Zoom with the buttons or the `+` and `-` keys. The Fit button (or `0`) switches between fitting the page width and fitting the whole page; after zooming it first goes back to the current fit. A phone on its side opens on the whole page; everywhere else it opens on the page width.
- A download button, and `Esc` closes it.
- On phones (640 px and narrower) the header is a **Back** arrow, the file name with its page count, and a **⋮** button whose bottom sheet (no title) has **Zoom out**, **Zoom in**, the Fit option (named for what it will do next) and **Download**. Larger screens keep the zoom buttons, Download and ✕ in the header.

**Contact details**
- Shows each contact in the file: phone numbers with their labels (Mobile, Home, Work, and whether they're on WhatsApp), email addresses and websites.
- WhatsApp Business details are included: the business name and the business description, with WhatsApp formatting.
- Numbers open the phone dialler (`tel:`) and have a copy button.
- Reads the variations WhatsApp writes:
  - Several cards joined by `_$!<VCard-Separator>!$_`.
  - Unfolded multi-line values.
  - Quoted-printable text.
  - Embedded photos.

**Full-screen photo viewer**
- Zoom with the buttons, the mouse wheel, a double-click, pinch, or the `+`, `-` and `0` keys.
- Drag to pan.
- Rotate 90° with the rotate button or the `R` key. Zoom and panning still work on a rotated photo, which is scaled to fit the screen.
- Fit to screen, download, and swipe or use the arrow keys to move between photos. A swipe works on a video too, anywhere but its controls bar along the bottom.
- On phones (640 px and narrower) the header is a **Back** arrow (it does what ✕ does; mirrored in Urdu and Arabic), the sender with a one-line date, the position ("3 / 9") and a **⋮** button (`js/components/viewer-menu.js`). ⋮ opens a sheet from the bottom with no title: **Go to message**, **Rotate photo** and **Fit to screen** (photos only; Fit only while zoomed in), **Star** or **Unstar**, **Copy caption** (when there is one), **Download** and **Share** (where the device can share). It closes with `Esc`, a tap outside or after picking an option; the arrow keys move through it. Larger screens, including a phone on its side, keep the full header with ✕. The keys are the same on every screen.
- `Esc` closes it.

**Sidebar media summary**
- A tile for each kind the chat has (All, Photos, Videos, Audio, Documents, Stickers, Links, Contacts) with its count. A kind with nothing in it gets no tile, and All shows only when something does. The tiles wrap into full rows (up to 4 a row, 3 a row when there are 5 or 6, a short last row stretches), so there are no gaps. Tapping one opens the media gallery on that kind, and **View all** opens it on All. The counts are what the gallery lists: files in the export, plus links.
- With no media, links or docs at all (a text-only chat, or a .txt export whose attachments aren't included), a short line ("No media, links or documents in this chat", or "No media, links or docs to show" when the export left the files out) takes the tiles' place and **View all** is hidden.
- How many referenced files were found and how many are missing, or why none can be shown (opened as text only, not in this ZIP).

**Media, links and docs gallery** (`js/components/media-gallery.js`)
- Opens from the sidebar tiles or **Media, links and docs** in the ⋮ menu, on **All** unless a tile picked a kind.
- A row of chips at the top (All, Photos, Videos, Audio, Documents, Stickers, Links, Contacts), each with its count, leaving out any kind with nothing in it. It scrolls sideways on narrow screens, and the arrow keys move between chips. If the shown kind has nothing in it (another chat was opened), the gallery goes back to All.
- A chat with no media, links or docs still opens it from the ⋮ menu or `M`: it shows an empty state (an icon, "No media, links or documents in this chat" and a hint, or the text-only hint for a .txt export) with no chips and no Sort button.
- By default everything is newest first, under month headings ("This month", then "March 2026" and so on).
- Photos (with GIFs), videos and stickers are a square grid: 4 across, or 3 on phones. Videos show their length and a play icon. Tapping one opens the full-screen viewer, and Previous and Next (or swiping) step through the items in the current filter, playing videos and GIFs in place.
- Documents, audio, links and contacts are rows:
  - documents: type badge, title, page count, size, sender and date; PDFs open in the PDF viewer, and there is a download button;
  - audio: the same voice-note and music players as in the chat, with waveform, seek and speed (seeking only on the note that is playing, as in the chat);
  - links: the site's logo, its name and what the link is (as in the chat's link cards), address, the message text around the link, copy and open buttons;
  - contacts: the contact card with **View contact** and **Save .vcf**.
- **Autoplay:** on **Audio**, an Autoplay button (a list with a play mark) sits in the header before Sort, on phones and computers. While it is on (highlighted, `aria-pressed`), each audio that plays to its end starts the next one in the list, voice notes and music files alike, in the list's sort order, loading more of the list and scrolling to it as needed. A notification says when it is turned on or off. It is the same switch as **Autoplay voice messages** in Settings, so it is remembered on this device and off by default.
- **Sort:** the sort button in the gallery header opens a pick sheet: newest first (the default), oldest first, name A–Z, name Z–A, largest first and smallest first. Size isn't offered for links. Month headings show only for the date sorts. Names sort with the interface language's collation, numbers in order (IMG-2 before IMG-10).
- **Item options** (`js/components/gallery-menu.js`): long-press an item on a phone, right-click it on a computer, press its ⋮ button (on every row, and on a grid tile when you hover or focus it; on touch screens the tile's ⋮ always shows), or press `Shift+F10` on a focused item. On phones (640 px and narrower) the rows show only the ⋮ button, and the copy, open and download buttons move into it; larger screens keep those quick buttons next to ⋮. The menu is a plain list of options with no title. By type, it offers:
  - **Go to message** on every item: closes the gallery and scrolls the chat to the message, which flashes and gets keyboard focus. A date or sender filter that hides it is cleared first;
  - **View** for photos, GIFs, videos and stickers; **Open** for documents (PDFs in the PDF viewer); **Play** or **Pause** for audio; **View contact** for contacts; **Open link** for links;
  - **Star** or **Unstar** the message. Items of a starred message show a small star on their tile or next to their date;
  - **Copy caption** when the message has text, **Copy contact details** for contacts, **Copy link** for links;
  - **Download** for files, and **Share** where the browser has a share sheet.
- The photo viewer has a **Go to message** button too, opened from the gallery or the chat.
- Only files that are in the export are listed. A category with nothing in it says so ("No videos in this chat"); for a `.txt`-only import it suggests opening the ZIP export instead.
- Items are added 120 at a time as you scroll, so chats with thousands of files stay smooth.

## 7. Search and navigation

- **Search:** in the bar under the chat header. Results update as you type and ignore case unless Match case is on. Message text, sender names (both the exported name and any nickname) and poll options are all searched. Urdu and Arabic spellings match each other: Arabic ي ى ك ه ة find Urdu ی ک ہ, and vowel marks (harakat), the tatweel and zero-width joiners are ignored, so "السلام" finds "السَّلام". Matches are highlighted in the chat with an "n of N" counter that counts every match, not every message: "Develop" in the sample chat is "1 of 5", because one message holds it five times. Each message counts every match in its text, or in its poll question and options; a message found only by its sender, nickname or file name counts once. The current match is a darker orange with a ring, and the chat scrolls to it, also in the middle of a long message (a long message whose match is past the Read more cut opens in full while it is a result).
- **Search text stays selected:** after a search runs, found or not, its text is selected, so typing again replaces it, as in a browser's find bar. That happens after `Enter`, after picking a recent search, and whenever the field gets focus back (a second click places the caret). It doesn't happen while you type.
- **Search options:** three toggles next to the search field, as in a code editor. Each can be on or off, in any combination, and turning one on or off searches again, so the highlights, the counter and ↑ ↓ always follow them.
  - **Aa Match case:** "Develop" no longer finds "develop".
  - **ab Whole word:** "develop" finds only the word "develop", not "developer" or "development". A word is letters, digits and `_` in any script, so it works for Urdu and Arabic too: "سب" skips "سبزہ".
  - **.\* Regex (regular expression):** the text is a JavaScript regular expression, for example `TRL-\d+`; `^` and `$` match at the start and end of each line. It ignores case unless Match case is on and keeps whole words when Whole word is on. A pattern that isn't valid shows "Invalid pattern" in red in place of the counter (the reason is in its tooltip), and nothing is searched until it's fixed.
  - **How they look:** on, a toggle is filled green with a green outline; off, it is a plain grey glyph. They report on or off to screen readers. On a computer or tablet they close off the end of the search field; on a phone (640 px or narrower) they sit on their own row under it, with their names.
  - **Keyboard:** `Alt+C`, `Alt+W` and `Alt+R` (`⌥C`, `⌥W`, `⌥R` on a Mac) while the search bar has focus.
  - They stay as set while the page is open and go back to off when it reloads; nothing is stored.
- **Moving between matches:** one match at a time, through every match in a message before going on to the next message, and round from the last match to the first. Prev/Next buttons, `Enter` and `Shift+Enter` in the field, and `F3` / `Shift+F3` or `Ctrl+G` / `Ctrl+Shift+G` (`⌘G` / `⇧⌘G`) while the bar is open.
- **Recent searches** (`js/components/search-history.js`): when the search field gets focus, a list under it shows your last 7 searches, newest first. Typing narrows it to the searches that contain the text. A search is added when you submit it (`Enter`, ↑ ↓, or picking it from the list); searching for the same words again moves them to the top instead of adding a copy, and the oldest drops off past 7. Click one to fill the bar and run it. Each has a ✕ that removes only that one, and **Clear all** in the list's heading removes them all after a confirmation dialog (Cancel has focus, so a stray Enter or tap changes nothing; Esc or a tap outside cancels too). Keyboard: ↓ moves from the field into the list, ↑ ↓ move through it, `Delete` removes the focused search, `Esc` closes the list. A click outside or leaving the field closes it too. The list is shared by every chat and kept on this device (`chat_search_history`). It mirrors in Urdu and Arabic.
- **Sticky date header:** shows the current day while you scroll and fades out shortly after you stop, as in WhatsApp, so it doesn't cover the first message on screen.
- **Filters:** in the sidebar, pick a **From** and **To** date and/or a **Sender**. Tapping someone in the side panel's **Participants** list also sets the Sender filter to them (their row is highlighted), and tapping them again sets it back to **Everyone**. On tablets and phones, picking a sender either way closes the side panel and shows the chat; on a computer the docked panel stays open. Only matching messages are shown, and a bar above the chat says "Showing N of M messages" with a **Clear filters** button. Search, jump-to-date and the starred list respect the filters; jumping to a hidden starred message clears them first.
- **Starred messages:** open a message's menu (right-click, long-press or the ⌄ button) and pick **Star**. Starred messages show a small star by the time. **Starred messages** in the header's ⋮ menu opens a panel listing them, newest last; click one to jump to it. From 1200 px the panel is a third column beside the chat, which narrows to make room, and stays open as you jump; narrower, it slides over the chat and closes after a jump; on phones (640 px and narrower) it fills the screen. A starred location shows "Location" (or "Live location") as its text. The panel's title shows how many there are. Stars are kept in memory only while the chat is open and are never saved (see [deferred.md](deferred.md)).
- **Jump to date:** a date picker in the sidebar, plus the busiest days listed in Statistics, take you straight to that day.
- **Jump buttons:** jump-to-bottom and back-to-top buttons appear when you're away from either end.
- **Keyboard shortcuts:** see section 19.

## 8. Statistics

The statistics window shows:
- **Totals:** messages, words, media, active days out of the chat's span, messages per active day and words per message.
- **Busiest days:** the top seven days. Tap one to jump to it.
- **Activity:** charts by weekday and by hour of day, using the times shown in the export.
- **Messages by person**, last so a long list doesn't push the charts down: a table of everyone with their messages, share, words and media, plus a bar for each. Every column header sorts the table (most first for numbers, A–Z for names); pressing it again reverses the order. The sorted column shows ▲ or ▼ and is announced to screen readers (`aria-sort`).

## 9. Themes

- **Light**, **Dark** and **Match system**, chosen under **Theme** in Settings (⋮ menu, **Settings**). Match system follows `prefers-color-scheme` and updates live when the operating system's setting changes.
- Colours are CSS custom properties, set on `:root` and overridden under `[data-theme="dark"]`, so the whole interface switches at once.
- The chat background pattern can be turned off with **Background pattern** in Settings.

## 10. Performance

- **Virtual list:** only the visible rows (about 30) are in the DOM. Row heights are measured after rendering and stored in a Fenwick tree, so finding a scroll position takes O(log n) time.
- **End of the chat:** the list leaves a 28 px gap under the last message, with or without filters, so it never sits on the bottom edge.
- **Scroll anchoring:** the view stays on the same message while images load or the window is resized.
- **Lazy media work:** waveforms and posters are decoded on demand, one at a time, and cached until the next file is opened.
- **Benchmark:** 60,000 messages parse in about 1.4 s in headless Chromium, and scrolling stays smooth.

## 11. Start screen, sample chat and guided tour

- **Start screen:** every launch opens on a screen that is only about choosing a chat, with no chat viewer behind it. Nothing is kept between visits, so there is never an earlier chat to go back to. It has:
  - a large drop area with a **Browse files** button. A `.zip` with media or a `.txt` without media, and several files at once, are all accepted. Dropping a file anywhere on the page works too;
  - **Try the sample chat**, which opens the made-up chat and starts the guided tour (every time; **Skip tour** ends it);
  - "How do I export a chat from WhatsApp?" steps for iPhone and Android;
  - the privacy promises: nothing uploaded, nothing saved, works offline.

  The start screen stays up if a file can't be read, with a message saying why. Shortcuts such as `/` do nothing there.
- **Replacing the open chat:** drop or pick a new file at any time and it replaces the chat on screen. This includes while another file is still loading. Each load takes a ticket, and a newer one cancels the older one at its next step: an unfinished parse is stopped, its media is thrown away, and only the newest file reaches the screen.
- **Sample chat:** a made-up group chat (`js/demo-data.js`) that shows every feature. Its media is drawn or synthesised on the device, and it is only built when asked for. The video and the GIF are recorded in the background after the chat shows; until then they show "Loading…" and aren't counted as missing. It covers:
  - text across several days and into a second month (April), formatting, lists (including a numbered list that skips numbers), a code block, emoji and an edited message;
  - two long messages, for Read more;
  - Urdu and Arabic messages: a vowelled Arabic verse with its Urdu translation, an Arabic message, a line with Arabic spellings and vowel marks for search, and a message mixing English and Urdu lines;
  - three messages for the search options (3 April, 8:24 to 8:26 AM): "Develop", "develop", "developer", "Development" and "developers" in one message, two booking codes `TRL-2041` and `TRL-2042` for a regular expression, and an Urdu line with "سبزہ" and "سب" for Whole word;
  - the encryption notice, group events, an iPhone admin event, a disappearing-message timer change and a security-code change;
  - fifteen people, so **Which one is you?** and **Participants and nicknames** show their name search and the statistics table has rows to sort;
  - someone saved only as a phone number (a made-up `+1 555 0142`, "Zain"), to try a nickname on;
  - missed and answered calls, a poll, a location, links, reactions, a deleted message, "You deleted this message." and a message that never loaded ("Waiting for this message", 14 March, 8:17 AM);
  - photos (one after a caption over two lines), a video, a GIF, a sticker, an iPhone animated `.was` sticker, a HEIC photo, five voice notes in a row from four people (16 March, 9:16 AM, for Autoplay voice messages; the music file after them ends the run), a music file, a PDF, a text file and a contact card;
  - a "video omitted" placeholder.

  New features add a line to it; see PROJECT_RULES.md, section 5.
- **Guided tour:** 26 steps under five chapter labels. Each one dims the page and spotlights the real control or a real message in the sample chat, scrolling the timeline to it first. On phones and tablets, the sidebar steps open the side panel.
  1. **Getting started:** opening a chat; the timeline and date badges.
  2. **Finding things:** search (with Match case, Whole word, Regex and recent searches); date and sender filters (also by tapping a participant); jump to date; statistics; media, links and docs (with each item's options, Go to message and the Audio autoplay button); Settings (who you are, nicknames, theme, language, pattern, date format, Online link previews and Autoplay voice messages, and What's new under About); keyboard shortcuts (Settings › Keyboard shortcuts and the Single-key shortcuts switch).
  3. **Messages:** formatting; Read more; edited, deleted and replies (it also mentions the card for a message that never loaded); reactions; system notices; calls; polls.
  4. **Media:** photos; videos and GIFs; stickers; voice notes and audio (with Autoplay voice messages); the PDF viewer; contact cards; locations; links (logos, link types and the Online link previews switch).
  5. The ⋮ menu (media, links and docs, starred messages, statistics, Settings, help, keyboard shortcuts), then a closing card, **What this viewer can do**: private and offline, iPhone and Android exports as .zip or .txt, big chats, several chats at once, nothing saved, and the keyboard shortcuts (press `?` for the list). It also says what exports leave out (forwarded labels, event details, live locations).

  The card shows the chapter, the step number and a progress bar. The pinned date header is hidden during the tour so it doesn't cover a highlighted message.

  It starts whenever the sample chat is opened from the start screen. Finishing or skipping it sets the `has_completed_walkthrough` flag in `localStorage`, which holds no chat data.
- **Help and guided tour:** this item in the header's ⋮ menu opens a small dialog to take the tour again (with the sample chat) or open your own chat. It closes with `Esc`, ✕ or a click outside. If one of your own chats is open, it warns that the tour will switch to the sample chat. Your file isn't changed.
- **Controls:**
  - Every step has **Skip tour**, **Back** (from step 2) and **Next**, which becomes **Finish** on the last step.
  - Keyboard: `→` and `←` move between steps, `↑` `↓` `Page Up` `Page Down` scroll the card's text when it is cut short, `Esc` skips, and focus stays inside the tour card.
- **Layout:**
  - On a computer, a tablet or a phone on its side, the card sits next to the highlighted part and follows it when the window is resized or the chat scrolls: below, above, right or left of it, narrower (down to 260 px) to fit at its side, or at the top or bottom edge. It never covers the highlight unless nothing else fits.
  - The card is never taller than the screen: its text scrolls and the buttons stay in view (on a phone on its side too).
  - On tablets the sidebar steps put the card next to the open side panel, and the Settings steps put it next to the Settings sheet when there is room. Otherwise the Settings step highlights only **You are**, with the card below it.
  - A highlight is cut to the box that scrolls it, so it never runs past the bottom of the Settings sheet.
  - On a phone, the card is a full-width panel at the bottom of the screen. It only moves up when the highlighted part is low on the screen, so it is never hidden under a browser or app bar at the top. It follows the visible viewport.
  - The **Voice notes and audio** step highlights the music file and the voice note just before it, so the highlight stays small.
  - Step 3 points at the search button on every screen; on phones its text is shorter.
- **No dependencies:** the tour is written for this app (`js/tour-controller.js`) instead of using a tour library, so the page still makes no network requests.

## 12. Code layout

The scripts are plain browser scripts with no build step. They share globals and load in the order of `index.html`: `jszip`, `i18n/i18n`, `i18n/en`, `i18n/ur`, `i18n/ar`, `vendor/notyf`, `components/toast`, `parser`, `media`, `text-truncator`, `vendor/brand-icons`, `viewer`, `components/link-cards`, `demo-data`, `app`, `components/media-gallery`, `components/message-menu`, `components/gallery-menu`, `components/viewer-menu`, `components/select-messages`, `components/autoplay`, `components/settings`, `components/nicknames`, `components/search-history`, `components/shortcuts-list`, `components/shortcuts`, `tour-controller`, `release-notes`, `components/whats-new`. pdf.js, lottie-web and libheif are loaded later, only when needed.

| File | Responsibility |
|---|---|
| `js/vendor/jszip.min.js` | JSZip 3.10.1 (MIT) |
| `js/vendor/pdfjs/` | pdf.js 3.11.174 legacy build (Apache-2.0), loaded on demand |
| `js/vendor/lottie/` | lottie-web 5.13.0 light build (MIT), loaded on demand for `.was` stickers |
| `js/vendor/libheif/` | libheif from libheif-js 1.23.5 (LGPL-3.0), WebAssembly HEIC decoder, loaded on demand |
| `js/vendor/notyf/` | Notyf 3.10.0 (MIT), the notification library under `js/components/toast.js` |
| `fonts/` | Noto Nastaliq Urdu and Noto Naskh Arabic (SIL OFL 1.1) |
| `js/i18n/i18n.js` | Interface languages: `t()`, `data-i18n` attributes, switching, the `app_language` setting |
| `js/i18n/en.js`, `js/i18n/ur.js`, `js/i18n/ar.js` | The English, Urdu and Arabic dictionaries |
| `js/components/toast.js` | Notifications: `toast(text, kind)` and `toast.success/error/warning/info` |
| `js/parser.js` | Line parser, date-order detection, message classification, inline worker setup |
| `js/media.js` | ZIP reading (the native streaming reader first, then JSZip in a worker or on the main thread), the media map and blob-URL lifecycle, shared audio controller |
| `js/text-truncator.js` | Decides when a long message is shortened and where the cut goes (Read more / Show less) |
| `js/viewer.js` | Formatting, Urdu and Arabic script fonts, the virtual list, row rendering, media players, `.was` stickers, HEIC decoding, contact cards, the photo and PDF viewers |
| `js/demo-data.js` | The made-up sample chat and the code that generates its media on the device |
| `js/components/settings.js` | The Settings screen: who you are, theme, language, background pattern, Online link previews, Autoplay voice messages, date format, nicknames, statistics, help and About, and the pick sheet for choices |
| `js/components/nicknames.js` | Participant nicknames: `nick(name)`, the per-chat store and the Participants and nicknames sheet |
| `js/components/search-history.js` | Recent searches: the list under the search bar and its store |
| `js/components/media-gallery.js` | The media, links and docs gallery: its index of attachments and links, the filter chips, sorting, grid and list layouts, and paging |
| `js/components/message-menu.js` | The message menu: long-press, right-click, the ⌄ button and Shift+F10, and its actions |
| `js/components/autoplay.js` | Autoplay: the `cv-autoplay` switch, the next voice note in the chat or the next audio in the gallery when one ends, and the gallery's Autoplay button |
| `js/components/select-messages.js` | Selecting messages: the selection bar, Star, Copy and Share for several messages |
| `js/components/shortcuts-list.js` | Every keyboard shortcut: its keys on a Mac and elsewhere, where it works, its name and what it does |
| `js/components/shortcuts.js` | The one keyboard handler for the shortcuts, the Keyboard shortcuts sheet, and the shortcut hints in menus and tooltips |
| `js/app.js` | File opening and the chat list, reactions, filters, starred messages, search, statistics, modals, theme, drawer, and loading the sample chat |
| `js/release-notes.js` | The What's new notes: for each version, what's new, improved and fixed, in English, Urdu and Arabic |
| `js/components/whats-new.js` | The What's new popup: which versions this device hasn't seen (`cv-seen-version`), waiting for other dialogs, and showing it |
| `js/tour-controller.js` | Sample-chat button on the start screen, the `?` dialog, the guided tour (spotlight, card placement, keyboard) and the `has_completed_walkthrough` flag |
| `css/styles.css` | All styles and theme tokens |
| `css/settings.css` | The Settings screen, pick sheet and Participants and nicknames sheet |
| `tests/parser.test.js` | Parser tests (`node tests/parser.test.js`) |
| `tests/release-notes.test.js` | Checks the newest release notes match `APP_VERSION` and the CHANGELOG, in all three languages, and how the popup picks versions; the deploy runs it |
| `tests/shortcuts.test.js` | Keyboard shortcut list tests: every name in en, ur and ar, no clashing or browser-reserved keys (`node tests/shortcuts.test.js`) |

## 13. Interface languages

- **English (US)** is the default. **Urdu (اردو)** and **Arabic (العربية)** are the others. Pick one under **Language** in Settings or with the English / اردو / العربية switch at the top of the start screen. The choice is saved on this device as `app_language` and applies at once, even with a chat open or the tour running.
- **What is translated:** everything the app says. That covers the start screen, sidebar, header and ⋮ menu, search, filters, starred messages, the gallery and its chips, statistics (including weekday names), the photo, PDF and contact viewers, the guided tour, month headings and dates outside the chat, the poll footer, the "Edited" tag, the **Message wasn't loaded** card, toasts and error messages.
- **What is never translated:** the chat itself. Messages, sender and contact names, file names, captions, WhatsApp's own system notices, call logs, deleted-message placeholders, omitted-media lines and the date rows between days are shown exactly as they are in the export, so they look the same in both languages.
- **Right to left.** In Urdu and Arabic the page is `dir="rtl"`. The layout uses logical CSS properties, so the side panel, menus and dialogs mirror on their own. A few rules handle the rest: the slide-in drawer, arrow icons, and the arrow keys and swipes in the photo viewer, the gallery chips and the tour, which follow the reading direction.
- **The chat doesn't mirror.** The message list (`#layer`) is `dir="ltr"`, so sent messages are always on the right and received ones, with their avatars, on the left, as in WhatsApp. The app's own labels inside bubbles (poll footer, location and file cards, "Read more") take their direction from their text, so Urdu labels still read right to left.
- **Mixed text.** Each message, name and system notice gets `dir="auto"`, so an English message reads left to right in the Urdu interface and an Urdu message reads right to left in the English one. Inside a message each line takes its own direction (`unicode-bidi: plaintext`), so an English first line followed by Urdu ones reads right. The time sits where the last line ends. Dates in the date fields and file extensions such as `.zip` stay left to right. So do shortcut keys such as `⌘F` or `Ctrl+O` in the tour and What's new, the photo viewer's "3 / 7" counter and time, and zoomed PDF pages (zooming keeps the middle of the view in place). The chat title in the header, the side panel and the chats list takes its direction from its text, so an English title in Urdu is cut at its end, still lined up on the right; the current chat's green bar sits on the right. The File fact shortens the file name and always shows its size and format, and the side panel's subtitle stays on one line in every language.
- **Interface fonts.** The Urdu interface uses Jameel Noori Nastaleeq when it is installed on the device. Its licence doesn't allow shipping it, so the app bundles **Noto Nastaliq Urdu** as the fallback. The Arabic interface uses the bundled **Noto Naskh Arabic**. Both are under the SIL Open Font Licence (`fonts/`) and limited to Arabic-script characters, so Latin text and numbers keep the normal font. Nothing is downloaded.
- **Chat fonts, in every interface language.** Each run of Arabic-script text in a message, sender name, chat title or system notice is wrapped in a span marked Urdu (`.s-ur`, the Nastaliq stack) or Arabic (`.s-ar`, Noto Naskh Arabic), so Urdu always looks like Urdu and a Qur'anic verse looks like Arabic, even in the English interface. Latin text, emoji and numbers around it keep the normal font.
  - **Urdu or Arabic?** Decided per line: letters only Urdu uses (ٹ ڈ ڑ ں ے ہ ی ک گ پ چ ژ, Urdu digits) mean Urdu; letters only Arabic uses (ة ي ك ى) mean Arabic; a fully vowelled line (Qur'anic text) is Arabic. A line that could be either follows the chat's main language, counted over its messages (Urdu unless Arabic wins).
- **For developers.** Text lives in `js/i18n/en.js`, `js/i18n/ur.js` and `js/i18n/ar.js`. These are scripts rather than JSON files, because a page opened from disk (`file://`) can't fetch JSON. Call `t('section.key', { name: value })`; `{name}` is filled in (wrapped in invisible isolate marks so a Latin name or a number keeps its place in an Urdu sentence), a `key_one` entry is used when `n` is 1, and a missing Urdu or Arabic entry falls back to English. Static HTML uses `data-i18n`, `data-i18n-html` and `data-i18n-attr`. Switching fires a `langchange` event, and `app.js` redraws the open chat, panels and dialogs.

## 14. Settings

- **Where:** **Settings** in the header's ⋮ menu opens a screen laid out like WhatsApp's Settings. On a phone it slides up as a full-height sheet. ← or `Esc` closes it.
- **You are:** the card at the top shows who you are in this chat, with your avatar. Tap it to pick another person (or nobody) in **Which one is you?**; your messages move to the right in green. Here the dialog can be closed without a change (✕, **Cancel**, `Esc` or a tap outside).
- **Chats:**
  - **Theme:** Light, Dark or Match system, in a pick sheet.
  - **Text size:** Small (90%), Default (100%), Large (115%), Larger (130%) or Largest (150%), in a pick sheet that shows each choice at its size. It scales the chat's text only: messages, sender names, times, quotes and code, link cards, polls, call, location, file and contact cards, system notices, date pills and Read more. Photos, videos, stickers, icons and the rest of the app keep their size, and Urdu and Arabic text in the chat grows with it. Rows are measured again at once, so nothing overlaps and the reading position stays. It is applied when the app starts, before a chat opens. On a computer the row names its keys, `+` and `-` in the chat (section 19). For the whole app, the browser's own zoom (`Ctrl` `+` / `-`) still works.
  - **Language:** English, اردو or العربية. The whole app redraws in the new language at once, the Settings screen included.
  - **Background pattern:** a switch for the doodles behind the messages.
  - **Autoplay voice messages** (`js/components/autoplay.js`, off by default): when a voice message plays to its end, the next message plays if it is also a voice message and comes straight after it, whoever sent it, like WhatsApp. Anything else in between (text, a link, a photo, a music file, a notice) ends the run. The next note scrolls into view if it isn't on screen. Pausing a note stops the run. The same switch drives the **Autoplay** button in Media, links and docs. It works with the iPhone Web Audio fallback too.
  - **Date format:** Automatic, Day / Month or Month / Day (a change re-reads the chat behind a progress screen), with the order being used and a **guessed** badge when the chat could be read either way. A forced order that gives impossible dates is refused with a message. Exports written as YYYY-MM-DD have nothing to choose, so the row is disabled.
- **This chat:**
  - **Participants and nicknames** (`js/components/nicknames.js`): lists everyone who wrote in the chat (with a name search above 12 people), each with their exported name, message count and a nickname field. Type a nickname and press `Enter` or leave the field to save it; a notification confirms it. **Reset** (or clearing the field) brings back the exported name. The row shows how many nicknames are set.
    - A nickname replaces the person's name everywhere the viewer shows a sender: the name and initials above their messages, voice note avatars, reactions, the side panel's participant list and the chat card, the sender filter and filter bar, starred messages, statistics, **Which one is you?** (with the exported name under it), the photo viewer, the gallery, copied messages, and the title of a one-to-one chat. Avatar colours stay the same.
    - Messages keep their exported sender, so who you are and the sender filter are unaffected, and search finds a person by either name. Chat content stays as exported, so system notices such as "Ayesha Khan added …" keep the original names.
    - Nicknames can also be set from **Which one is you?**, which opens with every new chat (and from **You are** in Settings), with the ✎ button in its header.
    - Kept on this device per chat (`chat_nicknames_<id>`, where the id comes from everyone's exported name and the first message), so the same export opens with the same nicknames and other chats never share them.
  - **Chat statistics**.
- **Help:** **Help and guided tour**, **Keyboard shortcuts** (opens the list, section 19), **Single-key shortcuts** (on by default; turns off the shortcuts that are a single key without Ctrl, ⌘ or Alt, such as `M`, `J` and `?`, for people whose screen reader or voice control uses those keys; these two rows are hidden on touch-only phones and tablets), **About** (the version; tap it for **What's new**, every version's notes) and the privacy note.
- **What is remembered:** the theme, text size (`cv-text-size`), language, background pattern, Online link previews, Autoplay voice messages and Single-key shortcuts (`cv-single-keys`), nicknames (per chat) and recent searches, on this device. Who you are and the date format apply to the open chat only.
- **Pick sheets** have a ✕ close button at the right of the title; tapping outside or `Esc` closes them too, without a change.
- **Keyboard:** each row is a button; pick sheets are radio lists (arrow keys move, Enter or Space picks). Focus stays inside the open sheet and returns to the row afterwards.
- **No settings anywhere else.** The ⋮ menu and the side panel hold only actions for the open chat. The one shortcut is the **Autoplay** button in Media, links and docs (on Audio), which flips the same Autoplay voice messages switch. **Keyboard shortcuts** in the ⋮ menu is help, like Help and guided tour: it opens the list and changes nothing. The side panel keeps **Jump to date**. The start screen keeps its English / اردو / العربية switch, because no chat is open there yet.

## 15. Message menu

`js/components/message-menu.js`, like WhatsApp's long-press menu.

- **Opening it:** long-press a message on a phone or tablet (the tap that ends it doesn't open the photo), right-click it on a computer, press the ⌄ button that appears on a message on hover (the only button shown on hover, as in WhatsApp Web) (on phones, after tapping the message), or press Shift+F10 or the menu key on a focused message. Right-clicking a text selection keeps the browser's own menu, for copying part of a message.
- **Where it opens:** under the message, lined up with the right edge of its bubble for sent and received messages alike, and only as wide as its options. If it doesn't fit below, the chat scrolls up to make room; at the very end of the chat it opens above the message instead.
- **Only the options**, no header: the menu lists what can be done and nothing else.
- **Actions, by message:**
  - **Star / Unstar:** every message.
  - **Copy:** the whole message exactly as exported, line breaks and formatting marks included. A poll copies its question and options; a location copies its text or link.
  - **Copy link:** the first link in the message.
  - **View photo**, **Open document** (PDFs) and **View contact**, for those attachments, plus **Copy contact details** (name, organisation, numbers, emails, web addresses) for a contact card.
  - **Download:** one entry per attached file (photo, video, voice note, sticker, document, contact card), named by file when there are several.
  - **Select:** starts selecting messages with this one picked (see below).
  - **Share:** the device's share sheet with the files, or the text. It is offered only where the page may open the share sheet (not in browsers without one, nor inside a frame that blocks it, such as the dev preview); if sharing is refused anyway, the message is copied instead. It stands in for Forward. Reply, Forward, Delete and React need a live chat, so they aren't offered.
- **Keyboard:** ↑ ↓, Home and End move; Enter runs; Esc closes and returns focus to the message. Scrolling, resizing, switching language or a press outside closes it. On a computer, Star, Copy, View photo, Open document, View contact, Download (one file) and Select show the key that does the same on a focused message (section 19).

## 16. Notifications

`js/components/toast.js`, built on the bundled Notyf library (`js/vendor/notyf`, MIT) and restyled to match the app.

- **Where:** cards at the top right of the window (across the top on phones), above everything else, dialogs included.
- **Kinds,** each with its own colour edge and icon:
  - **Success** (green ✓): copied, starred.
  - **Information** (blue i): a star removed.
  - **Warning** (amber !): some files couldn't be extracted, a date order that doesn't fit the chat, a file type the dev preview can't save.
  - **Error** (red ✕): a file that can't be read, a download or share that failed.
- **Stacking:** several notifications stack under each other, newest at the bottom. Each one stays until its own time runs out or its ✕ is pressed, even when the same message appears again.
- **Closing:** each has a ✕ button (labelled for screen readers). They also close on their own: success after 3 s, information after 4.5 s, warnings after 6 s and errors after 8 s.
- **Screen readers:** each one is announced with its kind ("Error: …") through a live region; errors interrupt, the rest wait their turn.
- **Languages:** the kind names and the close label are translated; the text keeps its own direction, so an English file name reads correctly in the Urdu or Arabic interface.
- **Safety:** the text is always escaped, since it can include file names from an export.
- **For developers:** call `toast(text)` for information, `toast(text, 'success' | 'error' | 'warning' | 'info')`, or `toast.success(text)`, `toast.error(text)`, `toast.warning(text)` and `toast.info(text)`. Don't show messages any other way.

## 17. Selecting messages

`js/components/select-messages.js`, like WhatsApp's Select.

- **Starting:** **Select messages** in the header's ⋮ menu, or **Select** in a message's menu (which starts with that message picked).
- **Picking:** each tap or click on a message picks the whole message, and another tap unpicks it. Scroll and pick as many as you like. A ✓ circle at the start of each message shows its state, and picked messages are tinted. Dates and system notices can't be picked. While selecting, taps don't open photos, links or players, and right-click or long-press picks the message too. On a keyboard, Space or Enter on a message's circle picks it.
- **The bar:** the header becomes a bar with ✕, the number picked and the actions, which are off until something is picked:
  - **Star** or **Unstar** (when every picked message is already starred) for all of them at once;
  - **Copy** the picked messages as text, oldest first, one per message: `[Mar 14, 2026, 8:03 AM] Ayesha Khan: …`, with attachments as `<file name>`;
  - **Share** them through the device's share sheet, as that text plus their files where the device can share files. As with a single message, Share is only offered where the page may open the share sheet; if it's refused, the text is copied instead.
- **Ending:** ✕, `Esc`, or sharing them. Opening another chat ends it too. Nothing about a selection is stored.

## 18. What's new

- **Once per version:** after a new version is released, the next time the app opens a **What's new** popup lists what changed, grouped under **New** (green), **Improved** (blue) and **Fixed** (amber) badges, one short sentence per item. **Got it**, ✕, `Esc` or a tap outside closes it, and it doesn't come back for that version on that device.
- **Who sees what:**
  - Someone opening the app for the first time sees nothing; they get the start screen and the tour.
  - Someone who used a version from before the popup existed sees the current version's notes.
  - Someone who skipped versions sees every version they missed, newest first, each with its version number and date, up to three.
- **When:** at start-up, on the start screen. If another dialog, the tour or the loading screen is open, it waits until they close.
- **Stored:** the last version seen (`cv-seen-version` in `localStorage`), saved when the popup closes. If the browser can't store it (some private modes), the popup isn't shown, so it never repeats on every visit.
- **Any time:** Settings › Help › **About** opens it with every version's notes.
- **Languages:** the notes and their labels are in English, Urdu and Arabic, following the interface language (right to left in Urdu and Arabic).
- **Where the notes come from:** `js/release-notes.js`, a list written at each release from the CHANGELOG (see `.claude/skills/release-skill`). The deploy runs `node tests/release-notes.test.js`, which stops a release whose notes don't match its version.

## 19. Keyboard shortcuts

`js/components/shortcuts-list.js` lists every shortcut; `js/components/shortcuts.js` handles the keys and draws the list. Mod is `⌘` (Command) on a Mac and `Ctrl` on Windows and Linux; on a Mac, `Ctrl` combinations are left to the browser.

- **Where to see them all:** the **Keyboard shortcuts** sheet. Open it with `?` or `Ctrl+/` (`⌘/`), from Settings › Help › **Keyboard shortcuts**, from the ⋮ menu, or from the **Keyboard shortcuts ?** link on the start screen (computers only). It lists every shortcut by group with its keys as key caps, in English, Urdu or Arabic (key names stay as printed on the keyboard). On the start screen it shows only what works there. `?`, `Esc` or ✕ closes it.
- **Hints where things are:** on a computer, items in the ⋮ menu and the message menu show their key at the end, and buttons such as ☰, search, the search options, ↑ ↓, the jump buttons, Download and Go to message name their key in the tooltip and to screen readers (`aria-keyshortcuts`). Phones and tablets without a mouse don't show them.
- **Anywhere in a chat:**
  - `Ctrl+O` / `⌘O` open a chat export (also on the start screen);
  - `Ctrl+F` / `⌘F` or `/` search;
  - `Ctrl+,` or `Ctrl+Shift+S` (`⌘,` or `⇧⌘S`) Settings;
  - `?` or `Ctrl+/` (`⌘/`) the shortcuts list;
  - `+` / `-` a step bigger or smaller chat text (Settings › Text size), with a notification naming the new size (`=` works as `+`; `Ctrl` `+` / `-` stay the browser's page zoom);
  - `M` Media, links and docs; `*` starred messages; `X` select messages; `I` chat statistics; `P` participants and nicknames; `D` jump to date; `[` show or hide the side panel;
  - `J` / `K` next and previous message (keyboard focus moves to it and the chat scrolls just enough to show it);
  - `Ctrl+Home` / `Ctrl+End` (`⌘↑` / `⌘↓`) first and latest message;
  - `Alt+↓` / `Alt+↑` (`⌥↓` / `⌥↑`) next and previous chat, when several are open;
  - `Esc` closes, in order, the dialog on top, the starred panel, the search bar and the side drawer. "Which one is you?" opened for a new chat can't be closed this way.
- **On a message that has focus** (after `J` or `K`, or Go to message): `Shift+F10` or the menu key opens its menu; `Enter` opens its photo, PDF or contact; `S` stars or unstars it; `Ctrl+C` / `⌘C` copies it (when no text is selected); `Ctrl+S` / `⌘S` downloads its file; `Space` plays or pauses its voice message, and `←` / `→` go back or forward 5 seconds while it plays; `X` starts selecting with it.
- **Search bar:** `Enter` / `Shift+Enter`, `F3` / `Shift+F3` and `Ctrl+G` / `Ctrl+Shift+G` (`⌘G` / `⇧⌘G`) step through matches; `Alt+C`, `Alt+W`, `Alt+R` (`⌥C`, `⌥W`, `⌥R`) switch Match case, Whole word and Regex; `↓` goes into the recent searches.
- **Selecting messages:** `Space` or `Enter` picks or unpicks a message; `Ctrl+C` / `⌘C` copies the picked messages; `S` stars them; `Esc` stops selecting.
- **Photo and PDF viewer:** `←` `→` previous and next photo (swapped in Urdu and Arabic); `+` `-` zoom; `0` fit (in a PDF, switches between page width and whole page); `R` rotate; `Space` plays or pauses a video; `Page Down` / `Page Up` move through a PDF; `G` goes to the photo's message; `Ctrl+S` / `⌘S` downloads the photo or PDF; `Esc` closes.
- **Media, links and docs:** `1` to `8` switch to the first to eighth chip shown (All, Photos, Videos, Audio, Documents, Stickers, Links, Contacts, leaving out kinds with nothing in them); `←` `→` move between those tabs; `Shift+F10` opens the focused item's options; `Ctrl+S` / `⌘S` downloads it; `Esc` closes.
- **When they don't fire:** while the guided tour or a menu is open, behind another dialog (only `Esc` works there), and, for keys without Ctrl, ⌘ or Alt, while typing in a field or composing with an input method. Single keys can be turned off in Settings; the list then shows them greyed out.
- **Browser keys are left alone:** new and close tab or window, page zoom (`Ctrl` `+` `-` `0`), back and forward, the address bar, reload, print, bookmarks, history and downloads. `Ctrl+S` is only taken where there is a file to save. On a Mac, `⌘,` may open the browser's own settings in some browsers; `⇧⌘S` works there instead. In Firefox and Edge, `Ctrl+Shift+S` may open the browser's screenshot tool; `Ctrl+,` works there instead.
- **Any keyboard layout:** letter keys also work with an Urdu or Arabic layout, matched by the key's position.
