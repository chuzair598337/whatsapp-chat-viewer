# Changelog

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
