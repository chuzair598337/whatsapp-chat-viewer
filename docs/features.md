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

---

## 1. Offline security and privacy

- **Nothing leaves the device.** The page makes no network requests after it loads: no analytics, no fonts, no CDNs, no link previews and no fetched favicons. Every test run checks that the request log is empty.
- **Enforced by the browser.** A Content-Security-Policy in `index.html` only lets the page load its own files and `blob:`/`data:` URLs, and blocks frames, plugins and form posts. Even a future mistake can't reach the network.
- **No server code.** GitHub Pages only serves the static files. Opening a chat reads it with the browser's `File` API in memory.
- **Bundled dependencies.** JSZip 3.10.1, pdf.js 3.11.174, the lottie-web 5.13.0 light build, libheif (libheif-js 1.23.5, a WebAssembly HEIC decoder) and Notyf 3.10.0 (notifications) ship in `js/vendor/`, so the viewer also works when opened straight from disk with no internet connection.
  - pdf.js is only loaded when a chat contains a PDF, lottie-web only when it contains an iPhone animated sticker, and libheif only when a HEIC photo needs decoding. The Content-Security-Policy allows `'wasm-unsafe-eval'` so the browser can compile libheif's WebAssembly; plain JavaScript `eval` stays blocked.
  - lottie-web's light build draws SVG and has no expression support, so nothing in a sticker runs as code. Image and font paths inside an animation are dropped before it plays, so it never fetches anything.
  - It runs with `eval` disabled and with no font or CMap URLs, so it never fetches anything. Disabling `eval` is also the documented fix for CVE-2024-4367 in this version. A newer pdf.js only ships as ES modules, which a page opened from disk can't load, so 3.11 stays for now.
- **Safe rendering.** Message text is HTML-escaped before formatting is applied. Links are only made clickable when they are `http://` or `https://`, and they open with `target="_blank" rel="noopener noreferrer"`. A message containing `<script>` tags or `javascript:` URLs shows as plain text.
- **Memory hygiene.** Media is turned into `blob:` URLs that only this tab can read. Every URL, decoded waveform and video poster is revoked when another chat is opened. A new archive's media is only swapped in after its chat parses successfully, so a bad file never leaves the viewer half-loaded.
- **Local preferences only.** The theme (`cv-theme`), the language (`app_language`), the background pattern (`cv-doodle`) and whether the welcome tour has been seen (`has_completed_walkthrough`) are stored in `localStorage`. Who you are and the date order belong to the open chat and are not stored. Chat contents are never stored.

## 2. File ingestion: .txt and .zip

- **Ways to open:** drag and drop anywhere on the page, **Browse files** on the start screen, **Open another chat** in the ⋮ menu, the side panel's open button, **Open chat** on the chat card, or the button in the sample chat's banner. Several files can be picked or dropped at once.
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
  - Incoming and outgoing messages, based on the "which one is you" picker. It lists everyone who wrote, with a name search box when there are more than 12 people. In a one-to-one chat it is pre-filled with a best guess; in a group nobody is "You" until you pick yourself, and the most active member is marked as suggested. The picker opens when a chat with more than one person loads, and you can change it later in Settings.
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
  - Reactions. Normal exports don't include them, but `reacted 👍 to "…"` lines, where present, become a reaction pill under the message they quote, with a count and who reacted. A line that matches no earlier message stays as text.
  - Media attachments and "media omitted" placeholders.
  - Documents keep the title and page count that iPhone writes before the file (`Report.pdf • 2 pages <attached: …>`) and that Android writes before `(file attached)`.
- **Wall-clock times:** times are shown exactly as they appear in the export, whatever the viewer's time zone.

## 4. Responsive layout

- **Desktop (over 1024 px):** a two-pane layout. The side panel shows the chat card (messages, media, first and last date, file name, size and iPhone or Android format, with **Statistics** and **Open chat** buttons), the chat list when there are several, search with a results list, the filters, the media tiles, jump to date, the participants with their message counts (the first 80, then "and N more") and the privacy note. The chat pane fills the rest. The ☰ button in the chat header hides the sidebar so the chat takes the full width, and shows it again (not remembered between visits).
- **Tablet and phone:** a single pane. The sidebar opens as a slide-in drawer from the menu button.
- **Chat header:** the chat's name and summary (on a computer it opens Statistics; on a phone it opens the side panel), the search button and the ⋮ menu. The ⋮ menu holds **Media, links and docs**, **Starred messages** (with a count badge, up to 99+), **Chat statistics**, **Open another chat**, **Settings** and **Help and guided tour**; the arrow keys, Home and End move through it, and Esc or Tab closes it.
- **Search** from the header's search button (or `/`, `Ctrl/Cmd+F`) opens as a bar under the chat header on every screen size, with ↑ ↓ and a ✕ close button at the end.
- **Phone polish:** no horizontal scrolling at phone widths, and safe-area insets for notched phones.
- **Group chats:** each sender's name has its own colour, and each run of their messages starts with an avatar showing their initials in that colour.
- **Accessibility:** keyboard focus is managed in modals and returned afterwards, every button and field has an accessible name, toggles such as the start screen's language buttons expose `aria-pressed`, sortable table headers expose `aria-sort`, and animations are switched off for `prefers-reduced-motion`.

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
| **Photos** | Loaded lazily (`loading="lazy"`), with the space reserved from the image's aspect ratio. Clicking opens a full-screen viewer (details below). |
| **Stickers** (`.webp`, `STK-`) | Shown without a bubble at WhatsApp's size: 190 px on desktop and 150 px on phones. Animated stickers play and loop, and the time sits in a small pill underneath. iPhone animated stickers (`.was`, a ZIP holding a Lottie animation) play and loop with the bundled Lottie player, in the chat and in the gallery; if one can't be read it falls back to an "Animated sticker" file card with a download button. |
| **HEIC photos** (iPhone `.heic` / `.heif`) | Safari shows them itself. Other browsers get them decoded by the bundled libheif (`js/vendor/libheif`, WebAssembly, loaded only when needed, nothing fetched) and shown like any photo, in the chat, the photo viewer and the gallery. Download keeps the original file. |
| **Files the browser can't show** | A photo, sticker or video the browser can't decode (a HEIC that can't be decoded, HEVC video in Firefox) turns into a file card saying "Can't show this file here", with its size and a download button. It is left out of the photo viewer and shows as a download tile in the media gallery. |
| **GIFs** | Marked with a GIF badge and loop automatically. iPhone exports store GIFs as `-GIF-….mp4`, so these play as muted looping video. With reduced motion turned on, GIFs start paused and a tap plays them. |
| **Video** | Shown like WhatsApp: a thumbnail from the first frame, a big play button, a video icon with the length in the bottom-left corner, and the time in the bottom-right. The thumbnail keeps the video's real shape, so a portrait phone video (down to 9:16) is shown up to 400 px tall instead of being boxed into landscape. After the first play it switches to custom controls: play/pause, elapsed and total time, a seek bar, mute and full screen. A poster image is taken from the first frame. Only one video or voice note plays at a time. |
| **Voice notes** (`PTT-`, iPhone `-AUDIO-`, `.opus`) | Card with the sender's avatar and a mic badge. Its 36-bar waveform is decoded from the audio with the Web Audio API. Tap or drag the waveform to seek, and switch speed between 1×, 1.5× and 2×. |
| **Audio files** (`AUD-`, `.mp3`, `.m4a`, …) | Music-file card with the file name, play button, seek bar and duration. |
| **Documents** | Card with a coloured type badge (PDF, Word, Excel, PowerPoint, archive, text), the document's title, the file size and a download button. |
| **PDFs** | Like WhatsApp: a preview of the first page above the card, plus the page count. Tapping it opens the in-app PDF viewer (details below). If a PDF is damaged or password protected, the card says so, and the file can still be downloaded. |
| **Links** | Clickable inline. A card under the message shows the site name and address with a coloured letter badge drawn locally, plus a copy button. When a message has several links, the card adds "+ N more links". |
| **Locations** | An offline map card: a street grid drawn locally with a pin (map tiles are never fetched), the coordinates read from the maps link, and a copy button. Tapping it opens the link in your maps app. A shared live location is exported without coordinates, so it shows as "Live location: Not included in exports". |
| **Contacts** (`.vcf`) | Card with the contact's photo or initials, name, and number, or "and N other contacts" when several were shared together. **View contact** opens the details (details below). **Save .vcf** downloads the card so it can be added to a phone's contacts. |

**PDF viewer**
- Every page is drawn on the device with pdf.js. Only the pages near the screen are rendered.
- Zoom with the buttons or the `+`, `-` and `0` keys.
- A download button, and `Esc` closes it.

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
- Fit to screen, download, and swipe or use the arrow keys to move between photos.
- `Esc` closes it.

**Sidebar media summary**
- A tile for each kind (All, Photos, Videos, Audio, Documents, Stickers, Links, Contacts) with its count. Tapping one opens the media gallery on that kind, and **View all** opens it on All.
- How many referenced files were found and how many are missing.

**Media, links and docs gallery** (`js/components/media-gallery.js`)
- Opens from the sidebar tiles or **Media, links and docs** in the ⋮ menu, on **All** unless a tile picked a kind.
- A row of chips at the top (All, Photos, Videos, Audio, Documents, Stickers, Links, Contacts), each with its count. It scrolls sideways on narrow screens, and the arrow keys move between chips.
- By default everything is newest first, under month headings ("This month", then "March 2026" and so on).
- Photos (with GIFs), videos and stickers are a square grid: 4 across, or 3 on phones. Videos show their length and a play icon. Tapping one opens the full-screen viewer, and Previous and Next (or swiping) step through the items in the current filter, playing videos and GIFs in place.
- Documents, audio, links and contacts are rows:
  - documents: type badge, title, page count, size, sender and date; PDFs open in the PDF viewer, and there is a download button;
  - audio: the same voice-note and music players as in the chat, with waveform, seek and speed;
  - links: site badge, site name, address, the message text around the link, copy and open buttons;
  - contacts: the contact card with **View contact** and **Save .vcf**.
- **Sort:** the sort button in the gallery header opens a pick sheet: newest first (the default), oldest first, name A–Z, name Z–A, largest first and smallest first. Size isn't offered for links. Month headings show only for the date sorts. Names sort with the interface language's collation, numbers in order (IMG-2 before IMG-10).
- Every row has a **Show in chat** button that closes the gallery and jumps to the message.
- Only files that are in the export are listed. A category with nothing in it says so ("No videos in this chat"); for a `.txt`-only import it suggests opening the ZIP export instead.
- Items are added 120 at a time as you scroll, so chats with thousands of files stay smooth.

## 7. Search and navigation

- **Search:** in the bar under the chat header, or in the side panel's own search box, which stays in step with it and lists up to 200 results (sender, date and a snippet; click one to jump to it, and on phones the drawer then closes). Results update as you type and ignore case. Message text, sender names and poll options are all searched. Urdu and Arabic spellings match each other: Arabic ي ى ك ه ة find Urdu ی ک ہ, and vowel marks (harakat), the tatweel and zero-width joiners are ignored, so "السلام" finds "السَّلام". Matches are highlighted in the chat with an "n of N" counter.
- **Moving between matches:** Prev/Next buttons, `Enter` and `Shift+Enter`.
- **Sticky date header:** shows the current day while you scroll and fades out shortly after you stop, as in WhatsApp, so it doesn't cover the first message on screen.
- **Filters:** in the sidebar, pick a **From** and **To** date and/or a **Sender**. Only matching messages are shown, and a bar above the chat says "Showing N of M messages" with a **Clear filters** button. Search, jump-to-date and the starred list respect the filters; jumping to a hidden starred message clears them first.
- **Starred messages:** open a message's menu (right-click, long-press or the ⌄ button) and pick **Star**. Starred messages show a small star by the time. **Starred messages** in the header's ⋮ menu opens a panel listing them, newest last; click one to jump to it. The panel's title shows how many there are. Stars are kept in memory only while the chat is open and are never saved (see [deferred.md](deferred.md)).
- **Jump to date:** a date picker in the sidebar, plus the busiest days listed in Statistics, take you straight to that day.
- **Jump buttons:** jump-to-bottom and back-to-top buttons appear when you're away from either end.
- **Keyboard shortcuts:**
  - `/` or `Ctrl/Cmd+F` opens search. `/` is ignored while you're typing in a field.
  - `Esc`: in the search field it clears the text, then closes the bar. Elsewhere it closes, in order, the dialog on top (a pick sheet before the gallery under it), the starred panel, the search bar and the drawer. It also closes the ⋮ menu and the message menu.
  - `Shift+F10` or the menu key on a focused message opens its message menu.
  - In the photo viewer: `+`, `-`, `0`, `R`, arrow keys and `Esc`. In the PDF viewer: `+`, `-`, `0` and `Esc`.

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
- **Sample chat:** a made-up group chat (`js/demo-data.js`) that shows every feature. Its media is drawn or synthesised on the device, and it is only built when asked for. It covers:
  - text across several days and into a second month (April), formatting, lists (including a numbered list that skips numbers), a code block, emoji and an edited message;
  - two long messages, for Read more;
  - Urdu and Arabic messages: a vowelled Arabic verse with its Urdu translation, an Arabic message, a line with Arabic spellings and vowel marks for search, and a message mixing English and Urdu lines;
  - the encryption notice, group events, an iPhone admin event, a disappearing-message timer change and a security-code change;
  - fourteen people, so **Which one is you?** shows its name search and the statistics table has rows to sort;
  - missed and answered calls, a poll, a location, links, reactions, a deleted message and "You deleted this message.";
  - photos (one after a caption over two lines), a video, a GIF, a sticker, an iPhone animated `.was` sticker, a HEIC photo, a voice note, a music file, a PDF, a text file and a contact card;
  - a "video omitted" placeholder.

  New features add a line to it; see PROJECT_RULES.md, section 5.
- **Guided tour:** 25 steps under five chapter labels. Each one dims the page and spotlights the real control or a real message in the sample chat, scrolling the timeline to it first. On phones and tablets, the sidebar steps open the side panel.
  1. **Getting started:** opening a chat; the timeline and date badges.
  2. **Finding things:** search; date and sender filters; jump to date; statistics; media, links and docs; Settings (who you are, theme, language, pattern and date format).
  3. **Messages:** formatting; Read more; edited, deleted and replies; reactions; system notices; calls; polls.
  4. **Media:** photos; videos and GIFs; stickers; voice notes and audio; the PDF viewer; contact cards; locations; links.
  5. The ⋮ menu (media, links and docs, starred messages, statistics, Settings, help), then a closing card, **What this viewer can do**: private and offline, iPhone and Android exports as .zip or .txt, big chats, several chats at once, nothing saved, and the keyboard shortcuts. It also says what exports leave out (forwarded labels, event details, live locations).

  The card shows the chapter, the step number and a progress bar. The pinned date header is hidden during the tour so it doesn't cover a highlighted message.

  It starts whenever the sample chat is opened from the start screen. Finishing or skipping it sets the `has_completed_walkthrough` flag in `localStorage`, which holds no chat data.
- **Help and guided tour:** this item in the header's ⋮ menu opens a small dialog to take the tour again (with the sample chat) or open your own chat. It closes with `Esc`, ✕ or a click outside. If one of your own chats is open, it warns that the tour will switch to the sample chat. Your file isn't changed.
- **Controls:**
  - Every step has **Skip tour**, **Back** (from step 2) and **Next**, which becomes **Finish** on the last step.
  - Keyboard: `→` and `←` move between steps, `Esc` skips, and focus stays inside the tour card.
- **Layout:**
  - On a computer, the card sits next to the highlighted part and follows it when the window is resized or the chat scrolls.
  - On a phone, the card is a full-width panel at the bottom of the screen. It only moves up when the highlighted part is low on the screen, so it is never hidden under a browser or app bar at the top. It follows the visible viewport.
  - Step 3 points at the search button on every screen; on phones its text is shorter.
- **No dependencies:** the tour is written for this app (`js/tour-controller.js`) instead of using a tour library, so the page still makes no network requests.

## 12. Code layout

The scripts are plain browser scripts with no build step. They share globals and load in the order of `index.html`: `jszip`, `i18n/i18n`, `i18n/en`, `i18n/ur`, `i18n/ar`, `vendor/notyf`, `components/toast`, `parser`, `media`, `text-truncator`, `viewer`, `demo-data`, `app`, `components/media-gallery`, `components/message-menu`, `components/settings`, `tour-controller`. pdf.js, lottie-web and libheif are loaded later, only when needed.

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
| `js/components/settings.js` | The Settings screen: who you are, theme, language, background pattern, date format, statistics, help and About, and the pick sheet for choices |
| `js/components/media-gallery.js` | The media, links and docs gallery: its index of attachments and links, the filter chips, sorting, grid and list layouts, and paging |
| `js/components/message-menu.js` | The message menu: long-press, right-click, the ⌄ button and Shift+F10, and its actions |
| `js/app.js` | File opening and the chat list, reactions, filters, starred messages, search, statistics, modals, theme, drawer, and loading the sample chat |
| `js/tour-controller.js` | Sample-chat button on the start screen, the `?` dialog, the guided tour (spotlight, card placement, keyboard) and the `has_completed_walkthrough` flag |
| `css/styles.css` | All styles and theme tokens |
| `css/settings.css` | The Settings screen and pick sheet |
| `tests/parser.test.js` | Parser tests (`node tests/parser.test.js`) |

## 13. Interface languages

- **English (US)** is the default. **Urdu (اردو)** and **Arabic (العربية)** are the others. Pick one under **Language** in Settings or with the English / اردو / العربية switch at the top of the start screen. The choice is saved on this device as `app_language` and applies at once, even with a chat open or the tour running.
- **What is translated:** everything the app says. That covers the start screen, sidebar, header and ⋮ menu, search, filters, starred messages, the gallery and its chips, statistics (including weekday names), the photo, PDF and contact viewers, the guided tour, month headings and dates outside the chat, the poll footer, the "Edited" tag, toasts and error messages.
- **What is never translated:** the chat itself. Messages, sender and contact names, file names, captions, WhatsApp's own system notices, call logs, deleted-message placeholders, omitted-media lines and the date rows between days are shown exactly as they are in the export, so they look the same in both languages.
- **Right to left.** In Urdu and Arabic the page is `dir="rtl"`. The layout uses logical CSS properties, so the side panel, menus and dialogs mirror on their own. A few rules handle the rest: the slide-in drawer, arrow icons, and the arrow keys and swipes in the photo viewer, the gallery chips and the tour, which follow the reading direction.
- **The chat doesn't mirror.** The message list (`#layer`) is `dir="ltr"`, so sent messages are always on the right and received ones, with their avatars, on the left, as in WhatsApp. The app's own labels inside bubbles (poll footer, location and file cards, "Read more") take their direction from their text, so Urdu labels still read right to left.
- **Mixed text.** Each message, name and system notice gets `dir="auto"`, so an English message reads left to right in the Urdu interface and an Urdu message reads right to left in the English one. Inside a message each line takes its own direction (`unicode-bidi: plaintext`), so an English first line followed by Urdu ones reads right. The time sits where the last line ends. Dates in the date fields and file extensions such as `.zip` stay left to right.
- **Interface fonts.** The Urdu interface uses Jameel Noori Nastaleeq when it is installed on the device. Its licence doesn't allow shipping it, so the app bundles **Noto Nastaliq Urdu** as the fallback. The Arabic interface uses the bundled **Noto Naskh Arabic**. Both are under the SIL Open Font Licence (`fonts/`) and limited to Arabic-script characters, so Latin text and numbers keep the normal font. Nothing is downloaded.
- **Chat fonts, in every interface language.** Each run of Arabic-script text in a message, sender name, chat title, system notice or search snippet is wrapped in a span marked Urdu (`.s-ur`, the Nastaliq stack) or Arabic (`.s-ar`, Noto Naskh Arabic), so Urdu always looks like Urdu and a Qur'anic verse looks like Arabic, even in the English interface. Latin text, emoji and numbers around it keep the normal font.
  - **Urdu or Arabic?** Decided per line: letters only Urdu uses (ٹ ڈ ڑ ں ے ہ ی ک گ پ چ ژ, Urdu digits) mean Urdu; letters only Arabic uses (ة ي ك ى) mean Arabic; a fully vowelled line (Qur'anic text) is Arabic. A line that could be either follows the chat's main language, counted over its messages (Urdu unless Arabic wins).
- **For developers.** Text lives in `js/i18n/en.js`, `js/i18n/ur.js` and `js/i18n/ar.js`. These are scripts rather than JSON files, because a page opened from disk (`file://`) can't fetch JSON. Call `t('section.key', { name: value })`; `{name}` is filled in (wrapped in invisible isolate marks so a Latin name or a number keeps its place in an Urdu sentence), a `key_one` entry is used when `n` is 1, and a missing Urdu or Arabic entry falls back to English. Static HTML uses `data-i18n`, `data-i18n-html` and `data-i18n-attr`. Switching fires a `langchange` event, and `app.js` redraws the open chat, panels and dialogs.

## 14. Settings

- **Where:** **Settings** in the header's ⋮ menu opens a screen laid out like WhatsApp's Settings. On a phone it slides up as a full-height sheet. ← or `Esc` closes it.
- **You are:** the card at the top shows who you are in this chat, with your avatar. Tap it to pick another person (or nobody); your messages move to the right in green.
- **Chats:**
  - **Theme:** Light, Dark or Match system, in a pick sheet.
  - **Language:** English, اردو or العربية. The whole app redraws in the new language at once, the Settings screen included.
  - **Background pattern:** a switch for the doodles behind the messages.
  - **Date format:** Automatic, Day / Month or Month / Day (a change re-reads the chat behind a progress screen), with the order being used and a **guessed** badge when the chat could be read either way. A forced order that gives impossible dates is refused with a message. Exports written as YYYY-MM-DD have nothing to choose, so the row is disabled.
- **This chat:** **Chat statistics**.
- **Help:** **Help and guided tour**, the version and the privacy note.
- **What is remembered:** the theme, language and background pattern, on this device. Who you are and the date format apply to the open chat only, because a name is chat data and is never stored.
- **Pick sheets** have a ✕ close button at the right of the title; tapping outside or `Esc` closes them too, without a change.
- **Keyboard:** each row is a button; pick sheets are radio lists (arrow keys move, Enter or Space picks). Focus stays inside the open sheet and returns to the row afterwards.
- **No settings anywhere else.** The ⋮ menu and the side panel hold only actions for the open chat. The side panel keeps **Jump to date**. The start screen keeps its English / اردو / العربية switch, because no chat is open there yet.

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
  - **Share:** the device's share sheet with the files, or the text. It is offered only where the page may open the share sheet (not in browsers without one, nor inside a frame that blocks it, such as the dev preview); if sharing is refused anyway, the message is copied instead. It stands in for Forward. Reply, Forward, Delete and React need a live chat, so they aren't offered.
- **Keyboard:** ↑ ↓, Home and End move; Enter runs; Esc closes and returns focus to the message. Scrolling, resizing, switching language or a press outside closes it.

## 16. Notifications

`js/components/toast.js`, built on the bundled Notyf library (`js/vendor/notyf`, MIT) and restyled to match the app.

- **Where:** cards at the top right of the window (across the top on phones), above everything else, dialogs included.
- **Kinds,** each with its own colour edge and icon:
  - **Success** (green ✓): copied, starred.
  - **Information** (blue i): a star removed.
  - **Warning** (amber !): some files couldn't be extracted, a date order that doesn't fit the chat, a file type the dev preview can't save.
  - **Error** (red ✕): a file that can't be read, a download or share that failed.
- **Stacking:** several notifications stack under each other, newest at the bottom. The same message twice in a row replaces the first instead of stacking.
- **Closing:** each has a ✕ button (labelled for screen readers). They also close on their own: success after 3 s, information after 4.5 s, warnings after 6 s and errors after 8 s.
- **Screen readers:** each one is announced with its kind ("Error: …") through a live region; errors interrupt, the rest wait their turn.
- **Languages:** the kind names and the close label are translated; the text keeps its own direction, so an English file name reads correctly in the Urdu or Arabic interface.
- **Safety:** the text is always escaped, since it can include file names from an export.
- **For developers:** call `toast(text)` for information, `toast(text, 'success' | 'error' | 'warning' | 'info')`, or `toast.success(text)`, `toast.error(text)`, `toast.warning(text)` and `toast.info(text)`. Don't show messages any other way.
