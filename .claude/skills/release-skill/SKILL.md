---
name: release-skill
description: Use when releasing development to main ("push to prod"). Covers picking the version, turning CHANGELOG's Unreleased section into the "What's new" notes in English, Urdu and Arabic (js/release-notes.js), bumping APP_VERSION, and the checks the deploy runs.
---

# Releasing a version

A release happens only when the maintainer asks ("push to prod"). It merges `development` into `main`, and every push to `main` deploys GitHub Pages (`.github/workflows/deploy-pages.yml`).

Every release shows its users a **What's new** popup once (`js/components/whats-new.js`). Its text comes from `js/release-notes.js`, which only a release changes. The deploy runs `node tests/release-notes.test.js` first and fails if the notes don't match the version.

## Steps

1. **Start from `development`.** Fetch it and read the `## Unreleased (on development)` section of `CHANGELOG.md`. That section is the list of everything since the last release. If it's empty, there's nothing to release; say so.
2. **Pick the version.** Bump the minor version (1.10.0 → 1.11.0) when anything is new or changed, and the patch version (1.10.0 → 1.10.1) when there are only fixes.
3. **Find what goes in the popup.** Go through each Unreleased bullet and sort it:
   - **new**: something the app couldn't do before (a feature, a setting, a button, a screen);
   - **improved**: an existing feature that now works or looks better, or behaves differently;
   - **fixed**: a bug or issue resolved (something that was broken or wrong).

   Leave out lines users won't notice: docs, tests, the sample chat, agent files, refactors. Merge bullets about the same feature into one item. Keep the most important items first, and keep it to about eight items. Check the commits since the last release (`git log main..development`) for user-facing changes the changelog missed, and add them to CHANGELOG.md too.
4. **Write each item as one short sentence** a user understands without the changelog: what they can do now, or what works now, and where to find it. Use the same names the interface uses ("Media, links and docs", "Settings", "Which one is you?"). Then write the same sentence in Urdu and Arabic, reusing the wording of `js/i18n/ur.js` and `js/i18n/ar.js` for those names. Plain text only (it's escaped), no chat content.
5. **Edit three files, all with the same version and today's date:**
   - `CHANGELOG.md`: rename `## Unreleased (on development)` to `## X.Y.Z (YYYY-MM-DD)`.
   - `js/components/settings.js`: `const APP_VERSION = 'X.Y.Z';`.
   - `js/release-notes.js`: add the new entry at the **top** of `RELEASE_NOTES`:
     ```js
     {
       v: 'X.Y.Z', date: 'YYYY-MM-DD',
       items: [
         { kind: 'new', en: '…', ur: '…', ar: '…' },
         { kind: 'improved', en: '…', ur: '…', ar: '…' },
         { kind: 'fixed', en: '…', ur: '…', ar: '…' }
       ]
     },
     ```
     Never edit or remove older entries: someone who skipped versions sees up to the three newest they missed.
6. **Check:** `node tests/release-notes.test.js` and `node tests/parser.test.js` must both pass.
7. **Release:** commit "Release X.Y.Z" on `development`, push it, then merge `development` into `main` (fast-forward) and push `main`. Check that the "Deploy to GitHub Pages" run succeeds; if "Check release notes" fails, fix the notes on `development` and merge again.
8. **Tell the maintainer** the version and the popup's items in English, so they know what users will see.

## How the popup decides what to show

- `cv-seen-version` in `localStorage` holds the last version the device saw, saved when the popup closes.
- A brand-new user (no key of this app at all) sees nothing; the version is saved silently and they get the tour.
- Someone who used a version from before the popup (other app keys, no `cv-seen-version`) sees the current version.
- Someone on an older version sees every version they missed, newest first, up to three.
- It waits until no dialog, tour or loading screen is open. Blocked storage (private mode) means it's never shown.
- Settings › About › What's new shows every version at any time; use it to check the new entry, or delete `cv-seen-version` in the browser and reload.
