---
name: whatsapp-parser-skill
description: Use when changing how WhatsApp export text is parsed in js/parser.js or js/app.js. Covers dates and times, senders, system lines, deleted and edited messages, attachments and reactions.
---

# WhatsApp parser

The parser is `parserModule()` in `js/parser.js`. It runs inside a Web Worker built from `parserModule.toString()` in a Blob URL (`getWorker`, `runParse`), and falls back to the main thread when workers are blocked. So:

- **Self-contained:** `parserModule` must not reference anything outside its own body. No globals and no DOM.
- **Plain data:** it returns plain, cloneable data: `{ messages, participants, order, detected, format, ... }`.
- **Post-processing:** anything that needs app state, such as which participant is you or reactions, belongs in `js/app.js` after the parse (`applyResult`, `foldReactions`).

## Line formats

| Platform | Header |
|---|---|
| iPhone | `[DD/MM/YYYY, HH:MM:SS] Sender: text` |
| Android | `DD/MM/YYYY, HH:MM - Sender: text` (a hyphen or an en dash) |

`D` and `T` in `parserModule` build both regexes (`RE_IOS`, `RE_AND`):
- **Dates:** 1 to 4 digit fields separated by `/`, `.` or `-`.
- **Times:** optional seconds, and `AM`/`PM`/`a.m.`/`p.m.` with any spacing.

A line that matches neither regex continues the previous message.

## Normalise before matching

- Strip invisible marks first, with the `INV` regex: U+200B–U+200F, U+202A–U+202E, U+2066–U+2069, U+FEFF.
- iPhone puts U+200E in front of system lines and attachments. That mark is how system lines from a sender are told apart (`r.lrm`).
- Convert U+202F, U+00A0 and other odd spaces to normal spaces (`SP`). Newer iPhone exports put U+202F before `AM`/`PM`.
- File names inside the ZIP keep these marks. Media lookup goes through `Media.key`, which strips them on both sides. Never compare raw names.

## Dates

- **Wall-clock time:** store it with `Date.UTC(...)` and format it with UTC getters. The viewer shows exactly the time in the export, whatever the viewer's own time zone.
- **Field order:**
  - A 4-digit first field means year/month/day.
  - Otherwise any field over 12 decides the order.
  - If every date is ambiguous, pick the order that keeps the messages most chronological.
  - The user can override the order in the Settings screen (Date format, passed as `opts.order`).
- **Years:** two-digit years are 20xx.

## Message kinds (`classify`)

`text`, `deleted`, `call`, `media`, `poll`, `location`, `unsupported` and `system`.

- **Deleted:** "This message was deleted", "You deleted this message", the admin variants, and "Waiting for this message".
- **Edited:** a trailing `<This message was edited>` is removed and sets `edited: true`. It isn't a separate kind.
- **Attachments:**
  - iPhone: `<attached: NAME>`. The text before it can be a document title with a page count (`Report.pdf • 2 pages`); see `docInfo`.
  - Android: `NAME (file attached)`.
  - Without media: `<Media omitted>`, `image omitted` and similar.
  - The type comes from the file name (`typeFromName`): `PTT-` and `-AUDIO-` are voice notes, `STK-` and `.webp` are stickers, `-GIF-` is a GIF.
- **Unsupported:** an iPhone header with an empty body (`Name:` and nothing else). This is how WhatsApp exports events. Keep it as `unsupported` so the viewer can show a "not included" card instead of dropping it.
- **System:** group changes, security-code notices and the encryption banner. `sender` is `null`.

## Reactions

- Normal exports don't contain reactions.
- `foldReactions` in `js/app.js` handles lines in these forms:
  - `Name: reacted 👍 to "quoted start…"`
  - `Name reacted 👍 to "…"` as a system line
- It attaches `{emoji, by}` to the most recent earlier message (within 3,000 messages) whose text starts with the quoted snippet, and removes the reaction line.
- It never guesses when nothing matches. The line then stays visible as normal text.

## Checklist for any parser change

0. **Sample chat:** add a made-up line in the new format or for the new case to `js/demo-data.js`, so it can be tested from **Try the sample chat**. See PROJECT_RULES.md, section 5.
1. **Add a sample line** for both iPhone and Android, with 12- and 24-hour times, to a local test file. Never commit real exports.
2. **Check both export types:**
   - a `.zip`: the attachment resolves to media;
   - a `.txt`: the attachment shows a "not included" card.
3. **Performance:** re-run the 60,000-message benchmark. Parsing should stay around 1.5 s or less in headless Chromium.
4. **Docs:** update `docs/features.md` section 3 if behaviour changed.
