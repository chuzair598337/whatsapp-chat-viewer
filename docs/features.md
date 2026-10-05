# Features

This page describes what the WhatsApp Chat Viewer does and how each part works. For setup and usage, see the [README](../README.md).

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
11. [Code layout](#11-code-layout)

---

## 1. Offline security and privacy

- **Nothing leaves the device.** The page makes no network requests after it loads: no analytics, no fonts, no CDNs, no link previews and no fetched favicons. Every test run checks that the request log is empty.
- **No server code.** GitHub Pages only serves the static files. Opening a chat reads it with the browser's `File` API in memory.
- **Bundled dependencies.** JSZip 3.10.1 and pdf.js 3.11.174 ship in `js/vendor/`, so the viewer also works when opened straight from disk with no internet connection.
  - pdf.js is only loaded when a chat contains a PDF.
  - It runs with `eval` disabled and with no font or CMap URLs, so it never fetches anything.
- **Safe rendering.** Message text is HTML-escaped before formatting is applied. Links are only made clickable when they are `http://` or `https://`, and they open with `target="_blank" rel="noopener noreferrer"`. A message containing `<script>` tags or `javascript:` URLs shows as plain text.
- **Memory hygiene.** Media is turned into `blob:` URLs that only this tab can read. Every URL, decoded waveform and video poster is revoked when another chat is opened. A new archive's media is only swapped in after its chat parses successfully, so a bad file never leaves the viewer half-loaded.
- **Local preferences only.** The theme, the date order and "which one is you" are stored in `localStorage`. Chat contents are never stored.

## 2. File ingestion: .txt and .zip

- **Ways to open:** drag and drop anywhere on the page, the open button, or the file picker on the welcome screen.
- **Type detection:** the first bytes are checked (`PK\x03\x04` means ZIP), then the extension and MIME type, so a renamed file still opens correctly.
- **Plain text (.txt):** the file is read in 2 MB chunks through a streaming `TextDecoder`. Media references in the text appear as "not included" cards.
- **ZIP archives:** opened with JSZip. The viewer finds `_chat.txt` (iPhone) or the main `WhatsApp Chat with ….txt` (Android), and otherwise falls back to the largest `.txt` file.
  - Every other file becomes a `Blob` with the right MIME type, stored in a map keyed by file name.
- **Large archive fallback:** archives over 1.5 GB, or any archive JSZip can't read, go through a built-in reader that reads the ZIP's central directory and inflates entries with the browser's native `DecompressionStream('deflate-raw')`.
- **Progress:** a loading card shows a progress bar for reading, unzipping and parsing.

## 3. Date and timestamp parser

The parser runs in a Web Worker built from an inline `Blob` URL, so the page stays responsive. If workers are blocked, it runs on the main thread instead.

- **Both export layouts:**
  - iPhone: `[14/03/2026, 08:03:12] Name: text`
  - Android: `14/03/2026, 08:03 - Name: text`
- **Date formats:** `DD/MM/YY(YY)`, `MM/DD/YY(YY)` and `YYYY-MM-DD`, with `/`, `.` or `-` as separators.
- **Time formats:** 12-hour (`AM`/`PM`, `a.m.`/`p.m.`) and 24-hour, with or without seconds.
- **Day/month detection:** a 4-digit first field means year first. Otherwise any value over 12 settles the order. If every date is ambiguous, the order that keeps the messages most chronological wins. You can override it in the sidebar settings.
- **Invisible characters:** removes the direction marks and zero-width characters WhatsApp inserts (U+200E, U+200F, U+202A–U+202E, U+2066–U+2069, U+FEFF), and normalises narrow and no-break spaces.
- **Message kinds:**
  - Incoming and outgoing messages, based on the "which one is you" picker, which is pre-filled with a best guess.
  - Multi-line continuations.
  - System lines (group created, member added, security code changed, encryption notice).
  - Calls.
  - Events. WhatsApp exports an event as the sender's name with nothing after it (`[date, time] Name:`), without its title, time, location or replies. The viewer shows a muted "Message not included in the export" card in its place, instead of treating the line as a system notice.
  - Deleted messages and edited messages.
  - Media attachments and "media omitted" placeholders.
  - Documents keep the title and page count that iPhone writes before the file (`Report.pdf • 2 pages <attached: …>`) and that Android writes before `(file attached)`.
- **Wall-clock times:** times are shown exactly as they appear in the export, whatever the viewer's time zone.

## 4. Responsive layout

- **Desktop (over 1024 px):** a two-pane layout. The sidebar shows the chat profile, a summary, the search box with results, media counts and settings. The chat pane fills the rest.
- **Tablet and phone:** a single pane. The sidebar opens as a slide-in drawer from the menu button, and search becomes a strip under the header.
- **Phone polish:** no horizontal scrolling at phone widths, and safe-area insets for notched phones.
- **Accessibility:** keyboard focus is managed in modals and returned afterwards, buttons have labels, and animations are switched off for `prefers-reduced-motion`.

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

## 6. Rich media

Media from a ZIP is matched to its message by file name. WhatsApp's invisible direction marks in file names are ignored when matching. If a referenced file isn't in the archive, the message shows a muted dashed card with the file name and **"Asset not included in ZIP"**. For a `.txt`-only import the card says the chat was opened as text only.

| Type | How it is shown |
|---|---|
| **Photos** | Loaded lazily (`loading="lazy"`), with the space reserved from the image's aspect ratio. Clicking opens a full-screen viewer (details below). |
| **Stickers** (`.webp`, `STK-`) | Shown without a bubble at WhatsApp's size: 190 px on desktop and 150 px on phones. Animated stickers play and loop, and the time sits in a small pill underneath. |
| **GIFs** | Marked with a GIF badge and loop automatically. iPhone exports store GIFs as `-GIF-….mp4`, so these play as muted looping video. |
| **Video** | Shown like WhatsApp: a thumbnail from the first frame, a big play button, a video icon with the length in the bottom-left corner, and the time in the bottom-right. The thumbnail keeps the video's real shape, so a portrait phone video (down to 9:16) is shown up to 400 px tall instead of being boxed into landscape. After the first play it switches to custom controls: play/pause, elapsed and total time, a seek bar, mute and full screen. A poster image is taken from the first frame. Only one video or voice note plays at a time. |
| **Voice notes** (`PTT-`, iPhone `-AUDIO-`, `.opus`) | Card with the sender's avatar and a mic badge. Its 36-bar waveform is decoded from the audio with the Web Audio API. Tap or drag the waveform to seek, and switch speed between 1×, 1.5× and 2×. |
| **Audio files** (`AUD-`, `.mp3`, `.m4a`, …) | Music-file card with the file name, play button, seek bar and duration. |
| **Documents** | Card with a coloured type badge (PDF, Word, Excel, PowerPoint, archive, text), the document's title, the file size and a download button. |
| **PDFs** | Like WhatsApp: a preview of the first page above the card, plus the page count. Tapping it opens the in-app PDF viewer (details below). If a PDF is damaged or password protected, the card says so, and the file can still be downloaded. |
| **Links** | Clickable inline. A card under the message shows the site name and address with a coloured letter badge drawn locally, plus a copy button. When a message has several links, the card adds "+ N more links". |
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
- Fit to screen, download, and swipe or use the arrow keys to move between photos.
- `Esc` closes it.

**Sidebar media summary**
- Counts of photos, videos, audio, stickers, documents and other media.
- How many referenced files were found and how many are missing.

## 7. Search and navigation

- **Search:** results update as you type and ignore case. Message text, sender names and poll options are all searched. Matches are highlighted in the chat with an "n of N" counter.
- **Moving between matches:** Prev/Next buttons, `Enter` and `Shift+Enter`.
- **Results list:** each result shows the sender, date and a snippet, and clicking one jumps to that message.
- **Sticky date header:** shows the current day while you scroll.
- **Jump to date:** a date picker in the sidebar, plus the busiest days listed in Statistics, take you straight to that day.
- **Jump buttons:** jump-to-bottom and back-to-top buttons appear when you're away from either end.
- **Keyboard shortcuts:**
  - `Ctrl/Cmd+F` opens search.
  - `Esc` clears the search, then closes the open panel or drawer.

## 8. Statistics

The statistics window shows:
- **Totals:** messages, words, media, active days out of the chat's span, messages per active day and words per message.
- **Messages by person:** a table with each person's messages, share, words and media, plus a bar for each.
- **Busiest days:** the top seven days. Tap one to jump to it.
- **Activity:** charts by weekday and by hour of day, using the times shown in the export.

## 9. Themes

- **Light**, **Dark** and **System**. System follows `prefers-color-scheme` and updates live when the operating system's setting changes.
- Colours are CSS custom properties, set on `:root` and overridden under `[data-theme="dark"]`, so the whole interface switches at once.
- The chat background pattern can be turned off in the sidebar settings.

## 10. Performance

- **Virtual list:** only the visible rows (about 30) are in the DOM. Row heights are measured after rendering and stored in a Fenwick tree, so finding a scroll position takes O(log n) time.
- **Scroll anchoring:** the view stays on the same message while images load or the window is resized.
- **Lazy media work:** waveforms and posters are decoded on demand, one at a time, and cached until the next file is opened.
- **Benchmark:** 60,000 messages parse in about 1.4 s in headless Chromium, and scrolling stays smooth.

## 11. Code layout

The scripts are plain browser scripts with no build step. They share globals and load in this order:

| File | Responsibility |
|---|---|
| `js/vendor/jszip.min.js` | JSZip 3.10.1 (MIT) |
| `js/vendor/pdfjs/` | pdf.js 3.11.174 legacy build (Apache-2.0), loaded on demand |
| `js/parser.js` | Line parser, date-order detection, message classification, inline worker setup |
| `js/media.js` | ZIP reading, the media map and blob-URL lifecycle, shared audio controller |
| `js/viewer.js` | Formatting, the virtual list, row rendering, media players, contact cards, the photo and PDF viewers |
| `js/app.js` | File opening, search, statistics, modals, theme, drawer and the sample chat |
| `css/styles.css` | All styles and theme tokens |
