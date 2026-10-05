---
name: media-viewer-skill
description: Use when changing how media renders. Covers photos, stickers, GIFs, video, voice notes, documents, PDFs, contacts, the photo lightbox, and placeholders for missing media.
---

# Media and viewers

## Where things live

| Piece | File |
|---|---|
| Opening a ZIP: worker JSZip, main-thread JSZip, then the native `DecompressionStream` reader | `js/media.js` (`openArchive`) |
| Media store: name to `{blob, url, mime, type}` | `js/media.js` (`Media`) |
| Shared `<audio>` for voice notes | `js/media.js` (`AudioCtl`) |
| Attachment cards and players | `js/viewer.js` (`attHTML`, `docHTML`, `contactHTML`) |
| Lazy queues: waveforms (`Waves`), video posters, PDF thumbnails (`PdfView`), contact cards (`Cards`) | `js/viewer.js` |
| Photo lightbox: zoom, pan, pinch, 90° rotation | `js/viewer.js` (`Z`, `zTo`, `zRotate`, `zFit`) |

## Lookup and lifetime

- **Always look media up with `Media.get(name)`.** It normalises the name (`Media.key`): it strips direction marks, applies NFC and lowercases.
- **Staging:** media from a new archive is staged in a separate map. `Media.adopt` swaps it in only after the chat parsed, so a bad file never leaves the viewer half-loaded.
- **Cleanup:** `Media.reset()` revokes every `blob:` URL and clears every cache. Anything new that creates object URLs must be added there.

## Missing media: the `.txt` case

Every attachment must render something useful when the file is missing:

| Situation | What to show |
|---|---|
| ZIP export, file not in the archive | The dashed "Asset not included in ZIP" card |
| `.txt`-only import | "Not included: opened as text only" |
| `<Media omitted>`, `image omitted` and similar | The same card, with the type icon |
| A file that fails to decode (damaged PDF, unsupported codec) | Say so on the card, and keep the download button |

Never show a broken image or empty space. Never throw.

## Players and viewers

- **One playback at a time.**
  - Voice notes use the single `AudioCtl` element, so playback survives row recycling.
  - Videos pause audio (`pauseVideos` and `AudioCtl`).
- **Voice notes:**
  - 36-bar waveform decoded on demand with the Web Audio API, then cached.
  - Speed cycles through 1×, 1.5× and 2×.
  - Seek by clicking or dragging the waveform, or with the hidden range input.
- **Video:** WhatsApp-style thumbnail with a duration badge until the first play, then custom controls. The box keeps the real aspect ratio, clamped from 9:16 to 1.9 (`clampV`).
- **Stickers:** no bubble, 190 px (150 px on phones).
- **PDFs:**
  - pdf.js loads on demand from `js/vendor/pdfjs/` with `isEvalSupported: false`.
  - It never fetches fonts or CMaps.
  - Only pages near the viewport are rendered.
- **Lightbox controls:**
  - Buttons for zoom in and out, fit, rotate and download.
  - Keys: `+`, `-`, `0` (reset), `R` (rotate 90°), `←`/`→` (previous and next), `Esc` (close).
  - Pinch and double-click zoom.
  - When rotated, `zFit()` scales the photo so it still fits, and `zClamp` swaps width and height so panning stays within bounds.
- **Downloads:** use `<a download>`. Inside the claude.ai preview artifact, use the downloads capability (its allowlist excludes `.opus` and `.vcf`).

## Checks after a change

- **Sample chat:** if the change is visible in the chat, add a line to the sample chat (`js/demo-data.js`) that shows it. See PROJECT_RULES.md, section 5.
- **Both export types:** a ZIP with photos, video (headless Chromium needs VP9, not H.264), voice notes, stickers, PDFs and `.vcf` files; and the `.txt` of the same chat.
- **Hostile files:**
  - a vCard with HTML or `javascript:` in its fields must render as text;
  - a broken PDF must show a fallback.
- **Clean run:** no network requests and no page errors.
- **Visual checks:** light and dark mode, at 1300 px and 390 px.
