# To do

Work items in priority order. Tick an item (`[x]`) only once it's built, tested with **both** a `.zip` export with media and a `.txt` export without media, and documented in [docs/features.md](docs/features.md).

Labels:
- *Existed* means the feature was already in a released version when this list was written. It was checked against the code.
- *New* means it was built for this list and released in 1.3.0.
- *New (Phase 4)* means it is on `development` and not yet released.

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

## Phase 4: gaps found in the export-coverage audit (2026-10-05)

These are the suggestions from the audit of official export features. Each one was checked against the code. Only the real gaps were built.

- [x] **Encryption notice** shown as a yellow centred badge. *Existed.*
- [x] **Security-code changes** get their own badge with a shield icon. *New (Phase 4).*
- [x] **Call logs.** *Existed.*
  - Missed, voice, video and group calls, with the duration, show as call cards in the caller's bubble, the way WhatsApp shows them in a chat.
  - *New (Phase 4):* the meaningless "Tap to call back" is dropped.
- [x] **Disappearing-message timer changes** shown as a badge with a timer icon. *New (Phase 4).*
- [x] **Group management events** shown as centred pills with a group icon. *New (Phase 4).*
  - Covers: created, added, removed, left, joined, icon/subject/description changes, admin changes and invite links.
- [x] **Phone-number changes and blocking** get their own badges. *New (Phase 4).*
- [x] **Placeholders for missing media.** *Existed.*
  - `<Media omitted>`, `image omitted`, `file.jpg (file attached)` with no file, and `.txt`-only imports.
- [x] **Document cards** with extension badges, size, download and PDF quick view. *Existed.*
- [x] **Voice notes and audio** with waveform, speed and duration. *Existed.*
- [x] **Contact cards (`.vcf`).** *Existed.*
- [x] **Location.** *Existed:* a link card. *New (Phase 4):*
  - An offline map card: a locally drawn street grid with a pin. Map tiles are never fetched.
  - Coordinates read from the maps link, with a copy button.
  - "Live location shared" lines, which carry no coordinates, are now recognised.
- [x] **Polls** (question, options, vote counts). *Existed.*
- [x] **Reactions.** *Existed (1.3.0).*
- [x] **Date and time detection** across iPhone and Android (`DD/MM/YY`, `MM/DD/YY`, `[YYYY-MM-DD, HH:mm:ss]`, `hh:mm a`). *Existed.*

## Phase 5: onboarding (2026-10-05)

- [x] **Welcome dialog on the first visit.** *New (Phase 5).*
  - "Explore the sample chat" or "Open your own chat".
  - Closing it, skipping the tour or finishing it sets `has_completed_walkthrough` in `localStorage`, which is the only thing stored.
- [x] **Help (`?`) button** in the header, to bring the dialog and tour back. *New (Phase 5).*
- [x] **Demo chat** covering every message type, in `js/demo-data.js`.
  - *Existed* as the built-in sample chat.
  - *New (Phase 5):* moved into its own file, plus a timer change, a security-code change and reactions.
- [x] **Five-step guided tour** in `js/tour-controller.js`. *New (Phase 5).*
  - Steps: opening a chat, the timeline, search and filters, the media viewer, and themes.
  - The spotlight targets the app's real elements (`openBtn`, `scroller`, `searchSec` and `filterSec`, a photo bubble, `themeBtn`).
  - Phones use `sampleOpen` and `searchBtn` instead.
  - Written without Driver.js or any other library.
- [x] **Tour controls.** *New (Phase 5).*
  - Skip, Back, Next and Finish buttons.
  - `Esc`, `←` and `→`.
  - Focus kept in the card.
  - Repositions on resize and scroll, with a phone layout.
- Not done, on purpose: the plan's step 5 mentioned exporting chat summaries. Exports are out of scope (see [deferred.md](deferred.md)), so that step only covers themes and the `?` button.

## Phase 6: long messages (2026-10-05)

- [x] **Read more / Show less.** *New (Phase 6).*
  - Applies to messages over 450 characters or with more than 6 line breaks.
  - Per-message `isExpanded` state for the open chat.
  - The `.read-more-btn` uses the theme's green.
  - Expanding or collapsing dispatches a `message-resize` event, and the virtual list re-measures that row.
  - The cut is made safe for formatting and code blocks.
  - Search matches in the hidden part open the message.
  - The helper is `js/text-truncator.js`. It lives in `js/` rather than `js/utils/`, to match the flat script layout.
  - Message text now uses `white-space: pre-wrap`, so runs of spaces are kept as typed. Line breaks were already kept.

## Phase 7: start screen and safer loading (2026-10-05)

- [x] **Start screen on every launch**, only for choosing a chat: drop area, Browse files, Try the sample chat, export steps and privacy notes. *New (Phase 7).* It replaces the welcome pop-up over the sample chat. The `?` dialog in the header stays as it was.
- [x] **A new file always replaces the open chat**, even mid-load. A load ticket cancels older loads and their parse. *New (Phase 7).*
- [x] **Tour card readable on phones:** bottom placement that follows the visible viewport. *New (Phase 7).*
- [x] **Long messages in the sample chat**, for testing Read more. *New (Phase 7).*
- [x] **Rule: update the sample chat with each feature**, in PROJECT_RULES.md section 5, the three skills and `CLAUDE.md`. *New (Phase 7).*

## Phase 8: header menu (2026-10-06)

- [x] **One ⋮ button in the chat header** with a dropdown for starred messages, statistics, open another chat, theme (light, dark, system) and help, replacing the separate icons so the title isn't cut short. Keyboard and screen-reader friendly (`role="menu"`). *New (Phase 8).*

## Verification done for this list

- iPhone ZIP with photos, video, stickers, voice, PDF and contacts.
- `.txt`-only export.
- A ZIP containing two chats.
- A ZIP and a `.txt` picked together.
- Desktop at 1300 px and phone at 390 px, in light and dark mode.
- The regression suites (formatting, 60,000-message chat, contacts and PDFs, hostile vCard and PDF, video and stickers).
- No page errors and no network requests.
