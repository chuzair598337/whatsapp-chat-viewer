---
name: keyboard-shortcuts-skill
description: Use when adding or changing a keyboard shortcut, or when building any new major action (a ⋮ menu item, a message menu action, a Settings row, a viewer or gallery control) that should get one. Covers js/components/shortcuts-list.js, the Keyboard shortcuts sheet, menu and tooltip hints, browser-reserved keys, Mac vs Windows keys and the en/ur/ar text.
---

# Keyboard shortcuts

Every shortcut is one entry in `js/components/shortcuts-list.js` (`KEY_LIST`). `js/components/shortcuts.js` (`Keys`) is the only `document` keydown listener for shortcuts. It works out where the keyboard is, finds the first matching entry and runs it, and it draws the Keyboard shortcuts sheet (`#keysModal`) and the hints from the same list. One entry is therefore the shortcut, its line in the sheet, its menu hint and its tooltip.

## Adding a shortcut for a new feature

1. **Pick the keys.**
   - Use `Mod+…` for anything that can run while typing or that mirrors a desktop app (`Mod+O` open, `Mod+,` settings). Mod is `⌘` on a Mac and `Ctrl` elsewhere. When the Mac convention differs, give `{ mac: [...], other: [...] }`, as `first` and `latest` do (`⌘↑` vs `Ctrl+Home`).
   - Use a single letter (`single: true`) for frequent chat actions, as Gmail does (`M`, `X`, `J`, `K`). Single keys never fire while typing, and Settings › Single-key shortcuts turns them off. For an entry that mixes both kinds of key, list only the single ones: `single: ['/']`.
   - Use plain keys scoped to a place (`S` on a focused message, `G` in the photo viewer, digits in the gallery) when the action belongs to that place.
   - **Never** use a key the browser keeps. The list is in PROJECT_RULES.md, "Keyboard shortcuts", and `tests/shortcuts.test.js` checks it. Avoid `Alt+letter`, which opens Windows browser menus, and `Alt+←/→`.
   - Check that nothing else answers the same key in the same place. The test fails if two entries clash, unless one of them has `when()` or hands the key on.
2. **Add the entry** in the right group (`KEY_GROUPS`) and place (`where`):

   ```js
   { id: 'export', group: 'general', label: 'keys.export', keys: ['Mod+E'], where: ['chat', 'select'], run: () => Export.open() },
   ```

   - `where` names the places: `start`, `chat`, `select`, `message` (the row itself has focus), `search` (bar open), `gallery`, `lb`, `pdf`, `keys`, `dialog`. `Keys.places()` decides which places apply.
   - `field: true` lets it run while typing (only for `Mod` keys and `Esc`).
   - `when()` is an extra condition. If `run` returns `false`, the key goes on to the next entry or to the browser. Use that for "copy only when nothing is selected" or "Space only when there is a voice note".
   - Leave `run` out when another component already handles the key (a menu's arrows, the search field's Enter). The sheet still lists it.
   - For an action in the message menu, add the shortcut's id as the fourth item of its `MsgMenu.actions` row, and use `Keys.act([icons])` so the key and the menu do the same thing.
3. **Name it in all three dictionaries** under `keys.*` in `js/i18n/en.js`, `ur.js` and `ar.js` (or reuse the action's existing label, such as `menu.settings`). Key names stay Latin (`Ctrl`, `⌘`, `M`) in every language.
4. **Show it where the action is.**
   - A ⋮ menu item gets `<span class="mk" data-key="id" aria-hidden="true"></span>` after its label. A message menu row gets it through the fourth item.
   - A button gets a `KEY_HINTS` row: `[element id, shortcut id, dictionary key of its tooltip]`. `Keys.decorate()` writes the tooltip and `aria-keyshortcuts`, and runs again after a language change. When the button's name changes with its state (☰ says Show or Hide chat details), the third item is a function that returns the key, and the code that changes the name calls `Keys.hint(id)`.
5. **Docs and checks.**
   - Add the shortcut to docs/features.md section 18, and to the feature's own section if it mentions keys.
   - Add a CHANGELOG line.
   - If the feature is new in the sample chat, mention its key in the sample line's comment.
   - Run `node tests/shortcuts.test.js`.
   - In Chromium, press the key in English, Urdu and Arabic, with a field focused and with Settings › Single-key shortcuts off.
   - Fake a Mac with `Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' })` in an init script, and check that `⌘` works and `Ctrl` doesn't.

## How matching works

- `parseKey('Mod+Shift+S')` → `{ mod, shift, alt, key, parts (key caps), aria }`. `keyHit(e, c)` requires the exact modifiers. On a Mac only `metaKey` counts as Mod, and `ctrlKey` must be off.
- Letters compare `e.key` when it is ASCII, else the physical `e.code` (`KeyM`). This is how `M` still works on an Urdu or Arabic layout, and how `⌥C` works when the Mac types `ç`. Symbols fall back to `KEY_CODE` positions (`Slash` for `/` and `?`).
- `Space` is written `Space` (`e.key === ' '`). `+` also matches `=`.
- Shift is not checked for symbols, because `?` and `*` need Shift on most layouts. Playwright's `Shift+8` reports `8`, so test `*` with `keyboard.press('*')`.
- Nothing fires while the tour or a menu is open, during IME composition, or when an earlier handler already called `preventDefault()`.

## Don'ts

- No `document.addEventListener('keydown', …)` for a shortcut outside `shortcuts.js`. The guided tour's capture listener and the selection mode's `Esc` are the only exceptions.
- No hard-coded "Ctrl+X" in dictionary text for a tooltip. The hint is added from the list, so a Mac shows `⌘`.
- Don't put a preference in a shortcut's place: a key may open Settings, but settings stay in Settings (PROJECT_RULES.md, "Settings").
