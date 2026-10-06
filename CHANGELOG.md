# Changelog

## 1.6.0 (2026-10-06)

- **Fixes from the group-chat audit:**
  - **iPhone photos with a caption over several lines** now show the photo. The caption used to keep the raw `<attached: …>` tag and the file was lost (49 of 1,214 files in the audited export).
  - **"Which one is you?" lists everyone.** It used to stop at 40 people. Groups with more than 12 people get a name search box at the top.
  - **Groups no longer pick "You" for you.** The export can't say who saved it, and the old guess (the most active member) made that person "You" when the picker was closed with ✕. Now nobody is "You" until you pick yourself, and the most active member is only marked as *suggested*.
  - **Search finds Urdu and Arabic spelling variants.** Arabic ي ى ك ه ة match Urdu ی ک ہ, and vowel marks (harakat), the tatweel and zero-width joiners are ignored, so "کیا" finds "كيا" and "السلام" finds "السَّلام". Highlights still cover the words as written.
  - **iPhone animated stickers (`.was`) play.** They are Lottie animations in a ZIP, now drawn by a bundled Lottie player (no network), in the chat and the media gallery. One that can't be read falls back to a file card. In the dev preview, which only saves common file types, the sticker downloads as a `.zip`.
  - **The floating date fades out** shortly after you stop scrolling, as in WhatsApp, instead of covering the first message on screen.
  - **Files the browser can't show get a file card** with a download button instead of a broken picture: iPhone animated stickers (`.was`), and HEIC photos or HEVC videos in browsers that can't decode them. They're also left out of the photo viewer, and show as download tiles in the media gallery.
  - **Mixed English and Urdu messages:** each line takes its own direction, so an English first line no longer forces the Urdu lines after it to read left to right. The time sits by the last line.
  - **iPhone group names:** admin events ("~ Ali changed this group's icon") no longer make the admin the chat's name, and the encryption notice names the chat. A small group from a renamed file used to be taken for a one-to-one chat with the admin.
  - **Sizes over 1 GB** show in GB (2.39 GB, not 2444.8 MB).
- **Sample chat:**
  - a photo whose caption runs over two lines;
  - ten more members join in April (14 people, so the picker shows its search box), with an admin event;
  - a line with Arabic spellings and vowel marks, to try the search;
  - a message with an English line followed by Urdu ones;
  - a real animated sticker (a spinning star) and a HEIC photo, which shows as a file card.

## 1.5.0 (2026-10-06)

- **Settings screen, like WhatsApp's.** **Settings** in the ⋮ menu opens one place for every preference: who you are (with your avatar), theme, language, background pattern and date format, plus chat statistics, the tour and an About note. Choices open a WhatsApp-style pick sheet, closed with the ✕ next to its title (or a tap outside).
  - The ⋮ menu now holds only chat actions; its Theme and Language lists moved to Settings.
  - The side panel's View section is gone: who you are, date format and background pattern moved to Settings, and **Jump to date** stays in the side panel.
  - The theme, language and background pattern are remembered on this device as before. Who you are and the date format stay per chat and aren't stored, because a name is chat data.
  - The guided tour shows the Settings screen in place of the old "Which one is you" step.
- **Phone layout fixes** (checked at 360 and 390 px, phone landscape, tablet and desktop, in English and Urdu, light and dark):
  - Settings fills the screen on phones, like WhatsApp, and its choice lists run edge to edge at the bottom instead of stopping short of the right side.
  - Settings rows keep one even background on iPhone instead of looking greyed out, and rows only highlight on hover where there is a mouse.
  - "Which one is you?" and Chat statistics opened from Settings now appear on top of it instead of behind it.
  - In Urdu, phone numbers on contact cards read the right way round (+1 555 0100), and PDF and photo viewer titles keep their order.
  - Sheets size to the visible screen (`dvh`), so they aren't hidden under the phone's browser bars.
  - The sample-chat note is smaller on phones, leaving more room for the chat.
- **Languages: English and Urdu.** Choose one under **Language** in the ⋮ menu, or with the English / اردو switch on the start screen. The choice is remembered on this device (`app_language` in `localStorage`); English (US) is the default.
  - Everything the app itself says is translated: the start screen, menus, buttons, filter chips, dialogs, the gallery, statistics, the guided tour, date labels outside the chat, status and error messages. The small "Edited" tag follows the interface language too.
  - The chat itself is shown exactly as exported, in either language: messages, names, file names, WhatsApp's system notices, call logs ("Missed voice call"), deleted-message placeholders ("You deleted this message."), omitted media ("Video omitted") and the date rows between days.
  - Urdu reads right to left: the side panel, menus, dialogs and the arrow keys in the photo viewer and the tour mirror. The chat does not: sent messages stay on the right and received ones, with their avatars, on the left, as in WhatsApp.
  - Urdu text uses Jameel Noori Nastaleeq when it is installed. It can't be shipped with the app, so Noto Nastaliq Urdu (Open Font Licence) is bundled as the fallback. No font is downloaded.
  - Messages written in Urdu or Arabic are now laid out right to left in any language, with the time where the text ends.
- **Fixes from the Urdu layout audit:** sent bubbles stay on the right in Urdu; call logs, deleted and omitted placeholders and date rows are no longer translated; copying a location's coordinates works again; English polls, search results, starred messages and the sidebar's file line read in the right order in Urdu; names and numbers inside Urdu sentences keep their place; the ⋮ menu opens from the correct corner and the English option sits next to its icon; a missing file inside a ZIP gives a translated message.
- **Sample chat:** a message in Urdu, to show that chat text isn't translated and reads right to left, and an Urdu message and "You deleted this message." from you, which stay on the right.
- **Guided tour:** **Try the sample chat** on the start screen starts the tour every time again, not only on the first visit.
- **Fixes from the production audit** (all 27 findings):
  - **Opening ZIPs:** the chat now appears as soon as its text is read, and the media fills in afterwards. ZIPs are read in place instead of being loaded into memory whole, so big exports no longer risk crashing a phone. ZIP64 archives (over 65,535 files or 4 GB) now keep all their media. Selecting several files no longer gives up when the first one fails, a dropped folder gets a clear message, and the first chat of a multi-chat ZIP gets its own title.
  - **Exports in other languages:** times with 上午/下午, 午前/午後, 오전/오후, ص/م, vorm./nachm. and similar now open, and localised export file names are recognised.
  - **Dates:** choosing a date order that would give a 13th month is refused with a message instead of silently shifting the dates. Changing the order no longer hides another file's progress screen.
  - **Messages:** links in quotes or `< >` open the right address; links ending in "(…)" keep it; numbered lists keep their numbers (a list going 1, 2, 10 shows 10); Android's "null" placeholder shows as "Message not included in the export"; media left out of an export says so, instead of "Asset not included in ZIP".
  - **Media:** voice notes keep their waveform after switching chats; "View contact" works on the first click; vCard 4 contact photos show; the photo viewer skips photos hidden by filters; GIFs don't autoplay when reduced motion is on (tap to play).
  - **Keyboard and screen readers:** dialogs keep focus inside them, and `/` and Ctrl+F don't open search behind a dialog. `Esc` closes the phone search bar from anywhere.
  - **Security:** a Content-Security-Policy makes the browser block any network request. The live site now publishes only the app's files, not the repo's notes.
  - **Smaller fixes:** the search cache is reset when media is relinked, a failed PDF preview no longer makes the chat jump, the ZIP note says "This ZIP doesn't include…" rather than "Opened as text only", and the search arrows' enabled check is simpler.
  - pdf.js stays at 3.11.174 with `eval` disabled, which is the documented fix for CVE-2024-4367; newer versions can't run from a page opened from disk.
- **Sample chat:** a link in quotes and a numbered list that skips from 2 to 10.
- **Parser tests:** `node tests/parser.test.js` checks the export formats the sample chat can't show.

- **Media, links and docs:** a gallery of everything shared in the chat, like WhatsApp's.
  - Chips at the top switch between All, Photos, Videos, Audio, Documents, Stickers, Links and Contacts, with counts.
  - Items are newest first under month headings. Photos, videos and stickers show as a square grid, and the rest as rows.
  - The photo viewer steps through the current filter and now plays videos and GIFs too.
  - Rows reuse the chat's players, PDF viewer and contact cards, and have a **Show in chat** button.
  - Only files that are in the export are shown, and very large chats load as you scroll.
  - Open it from the new tiles in the sidebar's media section or from the ⋮ menu. The tour has a step for it.
- **Sample chat:** an April photo and link, so the gallery shows two months.

## 1.4.0 (2026-10-06)

- **Fuller guided tour:** 24 steps instead of five, in four chapters (Getting started, Finding things, Messages, Media). It points at the real control or a real sample message for: search, date and sender filters, jump to date, statistics, "which one is you", formatting, Read more, edited, deleted and reply messages, reactions, system notices, date badges, calls, polls, photos, videos and GIFs, stickers, voice notes and audio, the PDF viewer, contact cards, locations, links and the ⋮ menu. It ends with a summary of what the viewer can do. Sidebar steps open the side panel on phones and tablets, and a progress bar replaces the dots.
- **Sample chat:** a shared contact card (a made-up park ranger desk), for the contact card step.
- **Header menu:** the star, statistics, theme, help and open buttons in the chat header are replaced by one ⋮ button, as in WhatsApp, so the chat title has room. It opens a dropdown with:
  - **Starred messages** (with the count), **Chat statistics** and **Open another chat**;
  - **Theme**: Light, Dark or Match system, with a tick on the current one;
  - **Help and guided tour**.

  The menu closes on `Esc`, a click outside or after choosing; arrow keys, `Home` and `End` move through it. The tour's last step now points at the ⋮ button. No sample chat line was needed, since messages look the same.
- **Start screen:** the app now opens on a screen just for choosing a chat. It replaces the welcome pop-up over the sample chat. It offers:
  - a drop area with **Browse files**;
  - **Try the sample chat**, which starts the guided tour on the first visit;
  - export steps for iPhone and Android;
  - the privacy promises.

  The sample chat is only built when asked for, so the app starts faster.
- **Replacing a chat mid-load:** a file dropped or picked while another is still loading now cleanly replaces it. The older load is cancelled, including its parse, and only the newest chat appears.
- **Tour on phones:** the tour card now sits at the bottom of the screen and follows the visible viewport, so it is no longer hidden under the browser or app bar at the top.
- **Sample chat:** two long messages (a trip report and a nine-item packing list) to try Read more.
- **Project rule:** every feature that changes how messages look adds a line to the sample chat, so it can be tested from **Try the sample chat** (PROJECT_RULES.md, section 5, and the agent skills). A `CLAUDE.md` points agents to the rules.
- **Read more:** messages over 450 characters or with more than 6 line breaks are shortened, with "… Read more" and "Show less".
  - The cut never splits a word, a formatting span or a code block.
  - A search match in the hidden part opens the message automatically.
  - The list re-measures the row, so scrolling stays smooth.
  - New file: `js/text-truncator.js`.
- **Spacing:** message text keeps runs of spaces exactly as typed (`white-space: pre-wrap`).
- **Welcome and guided tour:** first-time visitors see a welcome dialog with two choices:
  - **Explore the sample chat** starts a five-step tour: opening a chat, the timeline, search and filters, media, and themes.
  - **Open your own chat** opens the file picker.

  The tour has Skip, Back and Next or Finish buttons, works with `←`, `→` and `Esc`, and repositions on resize and on phones. A help item in the header brings it back. The only thing remembered is the `has_completed_walkthrough` flag. The tour is written for this app, with no library.
- **Sample chat:** moved to `js/demo-data.js`, and it now also shows a disappearing-message change, a security-code change and reactions.
- **System notices** are now grouped like WhatsApp shows them:
  - security-code changes, with a shield icon;
  - disappearing-message timer changes, with a timer icon;
  - phone-number changes and blocking;
  - group events (created, added, left, removed, icon/subject/description changes, admins, invite links), with a group icon.
- **Locations:** shared locations show an offline map card, a locally drawn grid with a pin, plus the coordinates and a copy button. No map tiles are ever fetched. "Live location shared" lines are recognised too.
- **Calls:** the meaningless "Tap to call back" is dropped from missed calls.
- `todo.md` gained Phase 4, which lists each suggestion from the export-coverage audit as either existing or new.

## 1.3.0 (2026-10-05)

- **Several chats at once:** pick or drop several exports together, or open a ZIP that holds more than one chat (in folders, or as nested chat ZIPs). A "Chats in these files" list in the sidebar switches between them, and each chat only sees its own media.
- **Starred messages:** star any message (hover on desktop, tap the bubble on a phone). Starred messages show a star by the time, and a panel in the header lists them; click one to jump to it. Stars are kept only while the chat is open and are never saved.
- **Filters:** a date range (From and To) and a sender filter in the sidebar. A bar above the chat says how many messages are shown and clears the filters in one click. Search and jump-to-date only land on visible messages.
- **Reactions:** when an export contains `reacted 👍 to "…"` lines, they become a WhatsApp-style reaction pill under the message they refer to, with a count and who reacted. Normal WhatsApp exports don't include reactions.
- **Group avatars:** each group member's run of messages starts with an avatar showing their initials, in the same colour as their name.
- **Photo viewer:** rotate photos 90° with the new button or the `R` key; zoom and panning still work while rotated.
- **Keyboard:** `/` jumps to search. `Esc` also closes the starred panel.
- **Faster opening:** ZIP files are unzipped in a background worker, so the page stays responsive. Pages opened straight from disk use the main thread, as before.
- **Project files:** added `todo.md` (work list by priority, with what existed and what's new), `deferred.md` (what's out of scope and why), `PROJECT_RULES.md`, and agent guides in `.claude/skills/`.

## 1.2.0 (2026-10-05)

- **Events:** WhatsApp exports an event as an empty `Name:` line, without any event details.
  - Before, the viewer showed this line as a grey system notice with just the sender's name.
  - It's now an outgoing or incoming bubble, from the right sender, with a "Message not included in the export" card.
- **Videos:**
  - Portrait videos keep their shape (down to 9:16, up to 400 px tall) instead of being letterboxed in a landscape box.
  - Before the first play, a video shows WhatsApp's thumbnail layout: a play button, a video icon with the length, and the time overlaid. The full controls appear once it plays.
- **Stickers:** shown at WhatsApp's size, 190 px on desktop and 150 px on phones.

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
