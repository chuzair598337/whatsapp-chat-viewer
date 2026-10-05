# To do

Work items in priority order. Tick an item (`[x]`) only once it's built, tested with **both** a `.zip` export with media and a `.txt` export without media, and documented in [docs/features.md](docs/features.md).

Labels:
- *Existed* means the feature was already in a released version when this list was written. It was checked against the code.
- *New* means it was built for this list. It is on `development` and not yet released.

Out-of-scope ideas live in [deferred.md](deferred.md).

## Phase 1 (high priority): parser robustness and core performance

- [x] **International date and time parsing.** *Existed (1.0.0).*
  - iPhone `[date, time] Name:` and Android `date, time - Name:` layouts.
  - 12- and 24-hour times, including `a.m.`/`p.m.`.
  - `/`, `.` and `-` separators; day/month order detected automatically.
  - Invisible Unicode marks stripped (U+200E, U+202F and others).
  - Code: `js/parser.js`.
- [x] **Web Worker offloading.**
  - Parsing in a worker. *Existed (1.0.0).*
  - Unzipping in a worker. *New.* JSZip runs in a second worker, with a main-thread fallback.
  - The plan named a separate `js/parser.worker.js` file. Both workers are built from inline Blob URLs instead, because browsers refuse to start a worker from a separate file when `index.html` is opened from disk (`file://`), and opening from disk is a supported offline route. The unzip worker also falls back to the main thread on `file://`, because `importScripts` is blocked there.
- [x] **Virtual list for 50,000+ messages.** *Existed (1.0.0).*
  - Only about 30 rows are in the DOM.
  - A Fenwick tree tracks row heights.
  - Tested with 60,001 messages.
- [x] **Message states.** *Existed (1.0.0):* deleted ("This message was deleted"), edited ("Edited" tag), and security and other system notices as centred pills. *New:* the "Edited" tag is now styled like WhatsApp's.
- [x] **Emoji reaction badges.** *New.*
  - A floating pill under the bubble, with grouped emoji, a count, and a tooltip naming who reacted.
  - Fed from `reacted 👍 to "…"` lines, which are matched back to the message they quote.
  - Normal WhatsApp exports don't include reactions. Chats without these lines simply show no badges.

## Phase 2 (medium priority): multi-chat UI, search and photo viewer

- [x] **Multi-chat sidebar.** *New.*
  - Opening several files at once, or a ZIP holding several chats (folders or nested chat ZIPs), lists them under "Chats in these files".
  - Each chat only sees the media from its own folder.
- [x] **Group participant visuals.**
  - Name colours hashed from the sender's name. *Existed (1.0.0).*
  - Avatar initials beside each group member's run of messages, in the same colour. *New.*
- [x] **Starred messages panel.** *New.*
  - Star button on each bubble: shown on hover on desktop, on tap on phones.
  - A star in the time stamp, and a slide-over panel listing starred messages. Click one to jump to it.
  - In memory only, and cleared when another chat opens. See [deferred.md](deferred.md).
- [x] **Date-range and sender filters.** *New.*
  - From and To dates plus a sender list, in the sidebar.
  - A bar above the chat shows "Showing N of M messages" with a Clear button.
  - Search, jump-to-date and starred jumps respect the filters.
- [x] **Photo viewer.**
  - Zoom and pan. *Existed (1.0.0).*
  - 90° rotation, with a button and the `R` key. *New.*

## Phase 3 (lower priority): media player, accessibility and polish

- [x] **Voice-note player.** *Existed (1.0.0).*
  - Waveform decoded from the audio.
  - Tap or drag to seek; 1×, 1.5× and 2× speeds.
- [x] **Document cards.** *Existed (1.0.0 to 1.1.0).*
  - Coloured type badges (PDF, Word, Excel, PowerPoint, ZIP, text), the file size, and PDF first-page previews.
  - A "not included" card when the file is missing or the chat was opened as text only.
- [x] **Accessibility.**
  - ARIA labels, focus handling in modals, `Esc` to close, and reduced motion. *Existed (1.0.0).*
  - `/` to jump to search and `R` to rotate. *New.*
  - Labels on every new control: reactions, star toggles with `aria-pressed`, filters and the chat list. *New.*
  - Audit: no visible button, input or select without an accessible name.

## Verification done for this list

- iPhone ZIP with photos, video, stickers, voice, PDF and contacts.
- `.txt`-only export.
- A ZIP containing two chats.
- A ZIP and a `.txt` picked together.
- Desktop at 1300 px and phone at 390 px, in light and dark mode.
- The regression suites (formatting, 60,000-message chat, contacts and PDFs, hostile vCard and PDF, video and stickers).
- No page errors and no network requests.
