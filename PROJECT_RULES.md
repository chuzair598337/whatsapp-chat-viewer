# Project rules

These rules apply to everyone changing this repository, people and coding agents alike. Agents also have task-specific guides in `.claude/skills/`:
- [whatsapp-parser-skill](.claude/skills/whatsapp-parser-skill/SKILL.md)
- [virtual-scroll-skill](.claude/skills/virtual-scroll-skill/SKILL.md)
- [media-viewer-skill](.claude/skills/media-viewer-skill/SKILL.md)

## 1. Privacy first

- Everything runs in the browser. No chat text, file name or media may leave the device, whether through `fetch`, XHR, beacons, WebSockets, image pixels, or anything else.
- Don't add network dependencies: no CDNs, web fonts, analytics or link-preview fetches. Vendor libraries into `js/vendor/` with their license.
- Don't store chat content. Only display preferences go in `localStorage`. Starred messages and filters live in memory for the open chat. See [deferred.md](deferred.md).
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

## 5. Workflow

- **Branches.**
  - Work on `development`, or on a branch that merges into it.
  - `main` is production. Every push to it deploys GitHub Pages.
  - Merge `development` into `main` only when the maintainer asks.
- **Code style.**
  - Scripts are classic files sharing globals, loaded in order: `jszip`, `parser`, `media`, `viewer`, `app`. There is no build step.
  - Match the surrounding style.
- **Records.** Track work in [todo.md](todo.md), user-facing changes in [CHANGELOG.md](CHANGELOG.md), and behaviour in [docs/features.md](docs/features.md).
