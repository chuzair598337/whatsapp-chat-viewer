# Project rules

These rules apply to everyone changing this repository, people and coding agents alike. Agents also have task-specific guides in `.claude/skills/`:
- [whatsapp-parser-skill](.claude/skills/whatsapp-parser-skill/SKILL.md)
- [virtual-scroll-skill](.claude/skills/virtual-scroll-skill/SKILL.md)
- [media-viewer-skill](.claude/skills/media-viewer-skill/SKILL.md)

## 1. Privacy first

- Everything runs in the browser. No chat text, file name or media may leave the device, whether through `fetch`, XHR, beacons, WebSockets, image pixels, or anything else.
- Don't add network dependencies: no CDNs, web fonts, analytics or link-preview fetches. Vendor libraries into `js/vendor/` with their license.
- **The one exception is Settings → Online link previews** (`cv-online-links`, off by default, the maintainer's choice on 2026-10-10). Only while it is on, `js/components/link-cards.js` may load titles from a site's own oEmbed service, YouTube thumbnails, and, on a tap, the site's own player for the link being shown. Only the link itself is sent, only to the site it points to; never to a third-party preview service. Each host is allowed by name in the Content-Security-Policy in `index.html`; add a host there only together with its `embedOf` rule.
- Don't store chat content. Only display preferences (including `cv-online-links` and `cv-autoplay`), the interface language (`app_language`), the `has_completed_walkthrough` flag, the last version whose What's new popup was seen (`cv-seen-version`), the photo and video view in Media, links and docs (`cv-gallery-view`), and the two things the maintainer asked to be remembered go in `localStorage`: nicknames per chat (`chat_nicknames_<id>`, exported name → nickname) and the last 7 searches (`chat_search_history`). Messages and media are never stored. Starred messages and filters live in memory for the open chat. See [docs/deferred.md](docs/deferred.md).
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
  - Modals trap focus and return it when closed.
- **Keyboard shortcuts.** The full guide is `.claude/skills/keyboard-shortcuts-skill`.
  - **One list.** Every shortcut is an entry in `js/components/shortcuts-list.js`, and only `js/components/shortcuts.js` listens for them on the document. Never add another `document` keydown listener for a shortcut. Keys that belong to one control (menus, the search field, the side panel grip, the tour) stay with that control, but are still listed (an entry without `run`) so the Keyboard shortcuts sheet shows them.
  - **Every new major action gets a shortcut**, or a note in its pull request saying why not: anything reachable from the ⋮ menu, the message menu, Settings, a viewer or the gallery. Add the entry, its name in `js/i18n/en.js`, `ur.js` and `ar.js`, a hint where the action is (`data-key` on a menu item, or `KEY_HINTS` for a button's tooltip), a line in [docs/features.md](docs/features.md) section 18, and run `node tests/shortcuts.test.js`.
  - **Mod, never Ctrl alone.** Write `Mod+…`: it is `⌘` on a Mac and `Ctrl` on Windows and Linux. Give a Mac its own keys (`{ mac, other }`) where the platforms differ, such as `⌘↑` for `Ctrl+Home`.
  - **Never take a key the browser keeps:** new or closed tab or window (`Mod+N/T/W`, with Shift too), `Mod+Q`, `Ctrl+Tab`, page zoom (`Mod++`, `Mod+-`, `Mod+0`), back and forward (`Alt+←/→`, `⌘[`, `⌘]`), the address bar and search (`Mod+L`, `Mod+K`, `Mod+E`, `Alt+D`), reload (`Mod+R`, `F5`), bookmarks, history and downloads (`Mod+D`, `Mod+H`, `Mod+J`), print (`Mod+P`), view source (`Mod+U`), `F6`, `F11`, `F12`, and Windows' `Alt+letter` menus. `tests/shortcuts.test.js` checks the list. Take `Mod+S` and `Mod+C` only where there is a file to save or nothing selected to copy.
  - **Single keys** (no Ctrl, ⌘ or Alt) are marked `single` so Settings › Single-key shortcuts can turn them off, and never fire while typing in a field.
  - **People must be able to find them:** the sheet (`?`), the hints in menus and tooltips, and the tour's last card. Never add a shortcut only to the code.
- **Visual.**
  - Respect `prefers-reduced-motion` and both colour schemes.
- **Notifications.**
  - Every short message to the user goes through the shared component in `js/components/toast.js`: `toast.success`, `toast.info`, `toast.warning` or `toast.error` (or `toast(text, kind)`). Never add another toast, `alert()` or ad-hoc banner.
  - Pick the kind by what happened: success for a finished action (copied, starred), info for neutral news (a star removed), warning when something partly worked or was adjusted, error when an action failed.
  - Pass plain text; the component escapes it. Put the words in the dictionaries like any other text.
  - They show at the top right, stack, close on their own and have a ✕. Don't change that per call.
  - Check layouts at phone width (390 px) for horizontal scrolling.
  - **Large screens use their width.** On a laptop or desktop, prefer showing options inline and using columns over leaving space empty, but never at the cost of the phone layout: put large-screen rules behind `min-width` media queries (1100 px for wider sheets) or, inside Media, links and docs, the `gal` container queries (640 px and 900 px), so phones never reach them.

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
- **Check the guided tour still works** after editing the sample, since its chat steps look for specific sample messages (the first photo, the poll, a call, the `github.com` link, "Trip report…" and "- Meet at").
- **Mention the new sample line** in the change's CHANGELOG entry, so testers know where to look.
- Skip this only when a feature can't be shown in a made-up chat, and say why in the change's notes.

## 6. Workflow

- **Branches.**
  - Work on `development`, or on a branch that merges into it.
  - `main` is production. Every push to it deploys GitHub Pages.
  - Merge `development` into `main` only when the maintainer asks.
- **Releases and What's new.** Every release shows its users a **What's new** popup once (`js/components/whats-new.js`), so it must say what changed. Follow `.claude/skills/release-skill`:
  - Keep the CHANGELOG's Unreleased section complete as you work: every user-facing feature, change and fix gets its bullet in the same change. The release reads it to find what's new.
  - At release, sort those bullets into **new**, **improved** and **fixed**, write one short sentence for each in English, Urdu and Arabic, and add them as the new version's entry at the top of `js/release-notes.js`, with the same version and date as `APP_VERSION` and the CHANGELOG heading.
  - Never edit or remove an older entry. Day-to-day work doesn't touch `js/release-notes.js`.
  - `node tests/release-notes.test.js` checks all this, and the deploy runs it, so a release without its notes doesn't go live.
- **Code style.**
  - Scripts are classic files sharing globals, loaded in order: `jszip`, `i18n/i18n`, `i18n/en`, `i18n/ur`, `i18n/ar`, `vendor/notyf`, `components/toast`, `parser`, `media`, `text-truncator`, `vendor/brand-icons`, `viewer`, `components/link-cards`, `demo-data`, `app`, `components/media-gallery`, `components/message-menu`, `components/gallery-menu`, `components/select-messages`, `components/autoplay`, `components/settings`, `components/nicknames`, `components/search-history`, `components/shortcuts-list`, `components/shortcuts`, `tour-controller`, `release-notes`, `components/whats-new`. There is no build step.
  - **Every word the app shows goes through `t('section.key')`** (or `data-i18n` in `index.html`), with the text added to every dictionary: `js/i18n/en.js`, `js/i18n/ur.js` and `js/i18n/ar.js`. Never translate chat content: messages, names, file names, system notices, call logs, deleted and omitted placeholders and the date rows stay as exported.
  - **Use logical CSS properties** (`margin-inline-start`, `inset-inline-end`, `text-align: start`) instead of left and right, so the Urdu layout mirrors. The chat (`#layer`) is `dir="ltr"` and never mirrors: sent on the right, received and avatars on the left.
  - Match the surrounding style.
- **Settings.**
  - **One place for settings.** Every app-wide preference (theme, language, background pattern, display modes) and every per-chat choice (who you are, the date format) lives in the Settings screen, `js/components/settings.js` with `css/settings.css`, opened from **Settings** in the ⋮ menu.
  - **No settings in menus or the sidebar.** The ⋮ menu and the side panel hold only actions for the open chat (Media, links and docs, Starred messages, Select messages, Chat statistics, Open another chat, Help, Keyboard shortcuts). Never put theme or language pickers there. The shortcuts outside Settings are the **Autoplay** button in Media, links and docs (on Audio), which the maintainer asked for (2026-10-10); it flips the same `cv-autoplay` switch as Settings → Autoplay voice messages; and the **View** button on Photos and Videos there (asked for 2026-10-12), which sets the same `cv-gallery-view` as Settings → Photos and videos in Media.
  - **Text for every setting.** Each new setting adds its words to `js/i18n/en.js`, `js/i18n/ur.js` and `js/i18n/ar.js` (through `t()`), and a row in `Settings.render()`.
  - **Storage.** Only display preferences go in `localStorage` (`cv-theme`, `app_language`, `cv-doodle`, `cv-online-links`, `cv-autoplay`, `cv-gallery-view`, `cv-single-keys`, and `cv-seen-version` for What's new), plus nicknames (`chat_nicknames_<id>`) and recent searches (`chat_search_history`), which the maintainer asked to be remembered. No other chat data, such as who you are, is stored.
  - **Names.** Show a sender through `nick(name)` (`js/components/nicknames.js`) so nicknames apply, but compare and store the exported `m.sender`.
- **Tests.** Run `node tests/parser.test.js` after any parser change, and add a case for each new export format. Run `node tests/release-notes.test.js` after changing `js/release-notes.js`, `APP_VERSION` or the What's new popup. Run `node tests/shortcuts.test.js` after changing a shortcut or a dictionary.
- **Documentation.** Update it when a task is complete, in the same change as the code:
  - [docs/features.md](docs/features.md) describes only what the app does today. Anything added, changed or removed is added, changed or removed there.
  - [docs/todo.md](docs/todo.md) holds only work the maintainer has asked for (or approved after an agent noticed it) that isn't built yet. When it's built, delete the item and describe it in features.md. Never add items on your own.
  - [docs/deferred.md](docs/deferred.md) is the maintainer's list of what is out of scope. Don't edit it unless the maintainer asks.
  - [CHANGELOG.md](CHANGELOG.md) gets an entry for every user-facing change, under "Unreleased (on `development`)" until a release.
  - README, these rules, `CLAUDE.md` and `.claude/skills/` are updated whenever a file, dependency, convention or workflow they describe changes.
