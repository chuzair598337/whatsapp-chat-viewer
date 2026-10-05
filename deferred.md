# Deferred and out of scope

These features have been considered and deliberately left out. Each would conflict with the viewer's main promise: an export is opened in the browser, read in memory, and never leaves the device. Please don't add them without first changing this file and [PROJECT_RULES.md](PROJECT_RULES.md).

## Export and data management

| Feature | Why it's left out |
|---|---|
| **PDF export** of a chat | The viewer exists to *read* an export, not to produce new copies. A rendered PDF of a private chat is easy to forward by accident, and it would need a large PDF-writing library that has to be vendored and audited. WhatsApp's own `.zip` is already the portable copy. |
| **Single-file HTML export** | Same reason as PDF. It would also have to embed every photo and video as base64, so a few hundred megabytes of media would become a page most browsers struggle to open. |
| **High-resolution screenshots / image export** | Rendering chat bubbles to an image needs either a canvas re-implementation of the whole layout or a DOM-to-image library. The operating system's screenshot tool already covers the occasional need, without the viewer generating files that contain chat content. |
| **Session persistence** with `IndexedDB` or `localStorage` | Storing a chat would leave its messages and media on the device after the tab is closed, where other people using the same browser profile could find them. Today nothing from a chat is ever written to storage. The only things stored are display preferences (theme, date order, which participant is you) and one flag, `has_completed_walkthrough`, which stops the welcome tour from reappearing. Neither contains chat data. Starred messages and filters are kept in memory for the open chat only, for the same reason. |

## Backend and cloud services

| Feature | Why it's left out |
|---|---|
| **Database, user accounts, sign-in** | The app is a static page on GitHub Pages with no server. Adding accounts would mean running and securing a backend that holds private conversations, which is the opposite of the privacy model. |
| **Cloud backup or sync** between devices | Same reason. People who want a chat on another device can copy the export file there and open it. |
| **Analytics, crash reporting, remote fonts or CDNs** | Every network request is a chance to leak something about the user. The page makes no requests after it loads, and the test suite checks that. |

## Live sync and streaming

| Feature | Why it's left out |
|---|---|
| **WhatsApp Web socket connection** or live message streaming | WhatsApp doesn't offer a public API for reading personal chats. Unofficial WhatsApp Web clients break its terms of service, can get the account banned, and would need the user's session credentials. The viewer only reads files WhatsApp itself exports. |
| **Watching a folder for new exports** | Browsers can't watch the file system without extra permissions and a long-running page. Opening the newer export is simple enough. |
