# Notes for coding agents

Read [PROJECT_RULES.md](PROJECT_RULES.md) before changing anything. In short:

- **Offline and private.** No network requests, and no chat data stored.
- **Both export types.** Every feature works for a `.zip` with media and a `.txt` without it.
- **Fast.** Use the workers and the virtual list.
- **Accessible.** Use labels and support the keyboard.
- **Settings in one place.** Preferences go in the Settings screen (`js/components/settings.js`), never inline in the ⋮ menu or the sidebar (rules, "Settings").
- **Update the sample chat.** Every change that is visible in a chat adds a made-up line to `js/demo-data.js`, so it can be tested from **Try the sample chat** (rules section 5).
- **Branches.** Work on `development`. Merge to `main` only when the maintainer asks.
- **Records.** Update `todo.md`, `CHANGELOG.md` and `docs/features.md` with each change.

Task guides: `.claude/skills/whatsapp-parser-skill`, `virtual-scroll-skill` and `media-viewer-skill`.
