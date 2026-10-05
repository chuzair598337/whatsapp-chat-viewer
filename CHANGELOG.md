# Changelog

## Unreleased (on `development`)

- **Start screen:** the app now opens on a screen just for choosing a chat. It replaces the welcome pop-up over the sample chat. It offers:
  - a drop area with **Browse files**;
  - **Try the sample chat**, which starts the guided tour on the first visit;
  - export steps for iPhone and Android;
  - the privacy promises.

  The sample chat is only built when asked for, so the app starts faster.
- **Replacing a chat mid-load:** a file dropped or picked while another is still loading now cleanly replaces it. The older load is cancelled, including its parse, and only the newest chat appears.
- **Tour on phones:** the tour card now sits at the bottom of the screen and follows the visible viewport, so it is no longer hidden under the browser or app bar at the top.
- **Sample chat:** two long messages (a trip report and a nine-item packing list) to try Read more.
- **Project rule:** every feature that changes how messages look adds a line to the sample chat, so it can be tested from **Try the sample chat** (PROJECT_RULES.md, section 5, and the agent skills). A `CLAUDE.md` points agents to the rules.
- **Read more:** messages over 450 characters or with more than 6 line breaks are shortened, with "… Read more" and "Show less".
  - The cut never splits a word, a formatting span or a code block.
  - A search match in the hidden part opens the message automatically.
  - The list re-measures the row, so scrolling stays smooth.
  - New file: `js/text-truncator.js`.
- **Spacing:** message text keeps runs of spaces exactly as typed (`white-space: pre-wrap`).
- **Welcome and guided tour:** first-time visitors see a welcome dialog with two choices:
  - **Explore the sample chat** starts a five-step tour: opening a chat, the timeline, search and filters, media, and themes.
  - **Open your own chat** opens the file picker.

  The tour has Skip, Back and Next or Finish buttons, works with `←`, `→` and `Esc`, and repositions on resize and on phones. A new **?** button in the header brings it back. The only thing remembered is the `has_completed_walkthrough` flag. The tour is written for this app, with no library.
- **Sample chat:** moved to `js/demo-data.js`, and it now also shows a disappearing-message change, a security-code change and reactions.
- **System notices** are now grouped like WhatsApp shows them:
  - security-code changes, with a shield icon;
  - disappearing-message timer changes, with a timer icon;
  - phone-number changes and blocking;
  - group events (created, added, left, removed, icon/subject/description changes, admins, invite links), with a group icon.
- **Locations:** shared locations show an offline map card, a locally drawn grid with a pin, plus the coordinates and a copy button. No map tiles are ever fetched. "Live location shared" lines are recognised too.
- **Calls:** the meaningless "Tap to call back" is dropped from missed calls.
- `todo.md` gained Phase 4, which lists each suggestion from the export-coverage audit as either existing or new.

## 1.3.0 (2026-10-05)

- **Several chats at once:** pick or drop several exports together, or open a ZIP that holds more than one chat (in folders, or as nested chat ZIPs). A "Chats in these files" list in the sidebar switches between them, and each chat only sees its own media.
- **Starred messages:** star any message (hover on desktop, tap the bubble on a phone). Starred messages show a star by the time, and a panel in the header lists them; click one to jump to it. Stars are kept only while the chat is open and are never saved.
- **Filters:** a date range (From and To) and a sender filter in the sidebar. A bar above the chat says how many messages are shown and clears the filters in one click. Search and jump-to-date only land on visible messages.
- **Reactions:** when an export contains `reacted 👍 to "…"` lines, they become a WhatsApp-style reaction pill under the message they refer to, with a count and who reacted. Normal WhatsApp exports don't include reactions.
- **Group avatars:** each group member's run of messages starts with an avatar showing their initials, in the same colour as their name.
- **Photo viewer:** rotate photos 90° with the new button or the `R` key; zoom and panning still work while rotated.
- **Keyboard:** `/` jumps to search. `Esc` also closes the starred panel.
- **Faster opening:** ZIP files are unzipped in a background worker, so the page stays responsive. Pages opened straight from disk use the main thread, as before.
- **Project files:** added `todo.md` (work list by priority, with what existed and what's new), `deferred.md` (what's out of scope and why), `PROJECT_RULES.md`, and agent guides in `.claude/skills/`.

## 1.2.0 (2026-10-05)

- **Events:** WhatsApp exports an event as an empty `Name:` line, without any event details.
  - Before, the viewer showed this line as a grey system notice with just the sender's name.
  - It's now an outgoing or incoming bubble, from the right sender, with a "Message not included in the export" card.
- **Videos:**
  - Portrait videos keep their shape (down to 9:16, up to 400 px tall) instead of being letterboxed in a landscape box.
  - Before the first play, a video shows WhatsApp's thumbnail layout: a play button, a video icon with the length, and the time overlaid. The full controls appear once it plays.
- **Stickers:** shown at WhatsApp's size, 190 px on desktop and 150 px on phones.

## 1.1.0 (2026-10-05)

- **Contact cards:** `.vcf` contacts shared in a chat now show as a WhatsApp-style card, with a details view (numbers, business info) and a **Save .vcf** button.
  - Before, iPhone exports reported them as missing, because the file names in the ZIP contain an invisible direction mark that the chat text doesn't.
- **PDFs:** shared PDFs now show a first-page preview, their title and page count, and open in an in-app viewer with zoom and download.
  - Before, the iPhone line `Title.pdf • 2 pages <attached: …>` wasn't recognised as an attachment and showed as raw text.
- Added pdf.js 3.11.174 to `js/vendor/pdfjs/`. It is only loaded when a chat contains a PDF, and makes no network requests.

## 1.0.0 (2026-10-05)

- First release:
  - Offline viewer for `.txt` and `.zip` WhatsApp exports.
  - Rich media, search and statistics.
  - Light and dark themes.
  - Deployed to GitHub Pages.
