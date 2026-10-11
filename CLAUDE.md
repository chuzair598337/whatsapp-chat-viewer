# Notes for coding agents

Read [PROJECT_RULES.md](PROJECT_RULES.md) before changing anything. In short:

- **Offline and private.** No network requests, and no chat data stored.
- **Both export types.** Every feature works for a `.zip` with media and a `.txt` without it.
- **Fast.** Use the workers and the virtual list.
- **Accessible.** Use labels and support the keyboard.
- **Settings in one place.** Preferences go in the Settings screen (`js/components/settings.js`), never inline in the ⋮ menu or the sidebar (rules, "Settings").
- **Update the sample chat.** Every change that is visible in a chat adds a made-up line to `js/demo-data.js`, so it can be tested from **Try the sample chat** (rules section 5).
- **Branches.** Work on `development`. Merge to `main` only when the maintainer asks.
- **Keyboard shortcuts.** Every new major action gets a shortcut in `js/components/shortcuts-list.js`, named in en, ur and ar, with a hint in its menu or tooltip; never use a key the browser keeps (rules, "Keyboard shortcuts").
- **Notifications.** Show every short message with `toast.success/info/warning/error` from `js/components/toast.js` (rules, "Notifications").
- **Releases.** Only when the maintainer says "push to prod". Follow `.claude/skills/release-skill`: the release finds what's new, improved and fixed in the CHANGELOG's Unreleased section and adds it to `js/release-notes.js` in English, Urdu and Arabic, so users see it once in the **What's new** popup. The deploy fails without it.
- **Docs.** When a task is done, update `docs/features.md` (only what the app does now), remove the item from `docs/todo.md` (which holds only work the maintainer asked for), add a `CHANGELOG.md` entry, and fix README, rules and skills if they describe what changed. Leave `docs/deferred.md` to the maintainer (rules, "Documentation").

Task guides: `.claude/skills/whatsapp-parser-skill`, `virtual-scroll-skill`, `media-viewer-skill`, `release-skill` and `keyboard-shortcuts-skill`.
