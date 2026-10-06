# Project rules

These rules apply to everyone changing this repository, people and coding agents alike. Agents also have task-specific guides in `.claude/skills/`:
- [whatsapp-parser-skill](.claude/skills/whatsapp-parser-skill/SKILL.md)
- [virtual-scroll-skill](.claude/skills/virtual-scroll-skill/SKILL.md)
- [media-viewer-skill](.claude/skills/media-viewer-skill/SKILL.md)

## 1. Privacy first

- Everything runs in the browser. No chat text, file name or media may leave the device, whether through `fetch`, XHR, beacons, WebSockets, image pixels, or anything else.
- Don't add network dependencies: no CDNs, web fonts, analytics or link-preview fetches. Vendor libraries into `js/vendor/` with their license.
- Don't store chat content. Only display preferences, the interface language (`app_language`) and the `has_completed_walkthrough` flag go in `localStorage`. Starred messages and filters live in memory for the open chat. See [deferred.md](deferred.md).
- Treat every export as hostile input:
  - Escape text before formatting it.
  - Only link `http(s)`, `tel:` and `mailto:` URLs.
  - Never use `innerHTML` with unescaped data.
- Never commit a real chat export. `.gitignore` already ignores `*.zip` and `*.txt`.

## 2. Both export types, always

Every parser change and every message or media feature must work for both:

1. **A `.zip` export with media.** Files are matched by name. Ignore case, NFC differences and WhatsApp's invisible direction marks.
2. **A standalone `.txt` export without media.** Every attachment reference must still render, as a placeholder card that says the file isn't included. Never as a broken image, a blank space or an error.

Test both before calling a change done.

## 3. Performance

- **The page must not freeze while a file opens.**
  - Parsing and unzipping run in workers built from inline Blob URLs, with a main-thread fallback for pages opened from disk.
  - Long main-thread loops yield and report progress.
- **Scrolling must stay smooth with 50,000+ messages.**
  - Only visible rows exist in the DOM, through the virtual list in `js/viewer.js`.
  - Never render the whole chat.
  - Never read layout inside a loop over all messages.
- **Media work happens lazily.** Decode waveforms, posters and PDF pages only when needed, cache them, and revoke every `blob:` URL when another chat opens.

## 4. Accessibility and UX

- **Names and state.**
  - Every interactive control is a real `<button>`, `<a>` or form field with an accessible name (`aria-label`, text or a `<label>`).
  - Toggles expose `aria-pressed`.
- **Keyboard.**
  - Everything works from the keyboard.
  - `Esc` closes the topmost panel or modal.
  - `/` or `Ctrl/Cmd+F` opens search.
  - Modals trap focus and return it when closed.
- **Visual.**
  - Respect `prefers-reduced-motion` and both colour schemes.
  - Check layouts at phone width (390 px) for horizontal scrolling.

## 5. Keep the sample chat up to date

The sample chat (`js/demo-data.js`) is how the maintainer tests every change: open the app, choose **Try the sample chat**, and the new feature should be right there.

- **Every feature or fix that changes how messages look or behave adds a sample line that shows it, in the same change.** Examples:
  - a new message type;
  - a new system notice;
  - a long message for Read more;
  - a reaction.
- **Keep it realistic.** It's a made-up chat in WhatsApp's real iPhone export format (`[DD/MM/YYYY, h:mm:ss AM] Name: text`, with the U+200E marks WhatsApp adds).
  - No real people, numbers or chat content. Never paste lines from a user's export.
  - New media must be generated on the device in `makeSampleMedia` (canvas, synthesised audio). Nothing is fetched.
- **Check the guided tour still works** after editing the sample, since step 4 looks for the first photo.
- **Mention the new sample line** in the change's CHANGELOG entry, so testers know where to look.
- Skip this only when a feature can't be shown in a made-up chat, and say why in the change's notes.

## 6. Workflow

- **Branches.**
  - Work on `development`, or on a branch that merges into it.
  - `main` is production. Every push to it deploys GitHub Pages.
  - Merge `development` into `main` only when the maintainer asks.
- **Code style.**
  - Scripts are classic files sharing globals, loaded in order: `jszip`, `i18n/i18n`, `i18n/en`, `i18n/ur`, `i18n/ar`, `parser`, `media`, `text-truncator`, `viewer`, `demo-data`, `app`, `components/media-gallery`, `components/message-menu`, `components/settings`, `tour-controller`. There is no build step.
  - **Every word the app shows goes through `t('section.key')`** (or `data-i18n` in `index.html`), with the text added to every dictionary: `js/i18n/en.js`, `js/i18n/ur.js` and `js/i18n/ar.js`. Never translate chat content: messages, names, file names, system notices, call logs, deleted and omitted placeholders and the date rows stay as exported.
  - **Use logical CSS properties** (`margin-inline-start`, `inset-inline-end`, `text-align: start`) instead of left and right, so the Urdu layout mirrors. The chat (`#layer`) is `dir="ltr"` and never mirrors: sent on the right, received and avatars on the left.
  - Match the surrounding style.
- **Settings.**
  - **One place for settings.** Every app-wide preference (theme, language, background pattern, display modes) and every per-chat choice (who you are, the date format) lives in the Settings screen, `js/components/settings.js` with `css/settings.css`, opened from **Settings** in the ⋮ menu.
  - **No settings in menus or the sidebar.** The ⋮ menu and the side panel hold only actions for the open chat (Media, links and docs, Starred messages, Chat statistics, Open another chat, Help). Never put theme or language pickers there.
  - **Text for every setting.** Each new setting adds its words to `js/i18n/en.js`, `js/i18n/ur.js` and `js/i18n/ar.js` (through `t()`), and a row in `Settings.render()`.
  - **Storage.** Only display preferences go in `localStorage` (`cv-theme`, `app_language`, `cv-doodle`). Nothing from the chat, such as a name, is ever stored.
- **Tests.** Run `node tests/parser.test.js` after any parser change, and add a case for each new export format.
- **Records.** Track work in [todo.md](todo.md), user-facing changes in [CHANGELOG.md](CHANGELOG.md), and behaviour in [docs/features.md](docs/features.md).
