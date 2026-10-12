# Changelog

## Unreleased (on `development`)

From the responsive UI audit of 1.11.0 (`/mnt/project-files/audit/responsive-audit.md` in the project) and the maintainer's follow-ups.

### Search counts every match; pages fit small iPhones

- **Search counts every match, not every message.** Searching "Develop" in the sample chat showed "1 of 1" for one message with five highlighted matches; it now shows "1 of 5", and ↑ ↓, `Enter` / `Shift+Enter` and `F3` / `Ctrl+G` step one match at a time, through every match in a message before the next message. Only the current match is a darker orange (with a ring), and the chat scrolls to it, also inside a long message. A message found only by its sender, nickname or file name counts once. Still one pass with no layout reads, so a 60,000-message chat searches as fast as before.
- **Fixed on iPhone:** focusing the search field, a nickname or a date filter zoomed the page in and left it shifted and cut off at the left (for example "articipants and nicknames"). Fields on touch screens now use 16 px text, so Safari doesn't zoom; pinch zoom is still allowed.
- **Fixed on phones:** opening Starred messages made the page 30 px wider for a moment, so phone browsers zoomed out or let the page pan. The page now never scrolls sideways, and closing a dialog or the tour resets any page scroll left behind.
- **Fixed on small phones:** the tour's last card (and any long one) ran off the bottom of the screen with its buttons cut off. The card now fits the visible area, its text scrolls and the buttons stay in view.

### Media types with no items

- **Media, links and docs** in the side panel shows a tile only for the kinds the chat has: no more "Videos 0", "Audio 0" or "Contacts 0". All shows only when something does, and the tiles wrap into full rows with no gaps.
- The gallery's chips leave out kinds with nothing in them too. If the open chip's kind has nothing in the next chat, it goes back to All. `1` to `8` pick the first to eighth chip shown.
- A chat with no media, links or docs (a text-only chat, or a .txt export without its files) says so in the side panel instead of showing empty tiles, and hides **View all**. The gallery, still in the ⋮ menu and on `M`, shows an empty state with no chips or Sort button. Text in English, Urdu and Arabic.

### Messages that never loaded

- **Clearer card for "Waiting for this message":** when a message never finished loading on the phone that exported the chat, WhatsApp writes "Waiting for this message. This may take a while." in its place. The viewer showed that line as a grey, italic bubble with a ⊘ icon, which looked like the viewer itself was stuck. It now shows a card like the one for events: an hourglass, **Message wasn't loaded** and "This message never finished loading on the phone that exported the chat, so its content isn't in the export.", in English, Urdu and Arabic, with the sender's name, avatar and time kept.
- The parser treats these lines as their own kind (`waiting`) on iPhone and Android, with or without the invisible U+200E mark, for "… This may take a while.", "… Check your phone." and the bare line, and for the Spanish, Portuguese, French, German, Italian and Indonesian wording.
- Search no longer matches the notice's wording; a starred one is listed as "Message wasn't loaded"; Copy still copies the line as exported. It counts as a message (with no words) in Statistics.
- The sample chat has one (14 March, 8:17 AM), and the tour's "Edited, deleted and replies" card mentions it.

### Phone viewer header

- **Photo viewer on phones:** the header is now a Back arrow, the sender with a one-line date and the position, and a ⋮ button. ⋮ opens a sheet from the bottom with Go to message, Rotate, Fit (while zoomed in), Star, Copy caption, Download and Share, so the header is no longer crowded. This replaces the bottom bar with Rotate and Download. Tablets and computers keep the full header with ✕, and every keyboard shortcut works as before.
- **PDF viewer on phones:** the same Back, title and page count, and ⋮ with Zoom out, Zoom in, Fit and Download, instead of the zoom buttons along the bottom.

### Notched phones, keyboard focus and contrast

- **Notched phones:** safe-area insets on every side. The notch, rounded corners and home indicator no longer cover the ☰ button, the header avatar, the drawer, the starred panel, the edges of sheets, the photo and PDF viewers' ✕ and ‹ › buttons, or the last message in the chat.
- **Keyboard and the drawer (tablets and phones):** the closed drawer can no longer be reached with Tab or Shift+Tab, and the chat behind an open drawer is out of reach too. Opening the drawer moves focus to its ✕; closing it, from ✕, `Esc`, the backdrop, or by picking a participant, a date or a chat, returns focus to ☰ instead of losing it.
- **The ☰ button** now says whether the side panel is showing (`aria-expanded`) from the start and after every change, no longer reads "Show chat details" on a computer when the panel is already showing, and its tooltip names the `[` shortcut.
- **Visible keyboard focus:** a green ring on items in the ⋮ menu and the message and gallery menus, and a solid green grip on the side panel's edge.
- **Contrast:** white text on primary buttons is 4.9:1 (darker green) in light mode, and dark text on green in dark mode; the time on your own messages in dark mode goes from 2.6:1 to 4.9:1.
- **Reduced motion:** the loading bar shows a still, full-width bar instead of freezing at about a third.
- Side panel section headings are all green ("Jump to date" was the only green one); only the counts are grey.
- The chat card's **Open chat** button is now **Open another chat**, as in the ⋮ menu, in English, Urdu and Arabic.

### Urdu and Arabic

- **Fixed in Urdu and Arabic:** the photo viewer's counter read "7 / 3" for "3 of 7" and its time read "AM 8:14"; both now read left to right, after a localized date (MODALS-5).
- **Fixed in Urdu and Arabic:** zooming a PDF showed the blank right edge of the page. The pages are now laid out left to right, and zooming in or out keeps the middle of the view where it was, in every language (MODALS-6).
- **Fixed in Urdu and Arabic:** shortcut keys such as `⌘O` and `⌘F` showed as "O⌘" and "F⌘" in What's new and the tour's last card. The popup and the tour now keep any key combination left to right (`ltrKeys` in `js/viewer.js`), the tour's Urdu and Arabic text isolates them itself, and the release skill tells future notes to do the same (START-7).
- **Fixed in Urdu and Arabic:** an English chat title in the header was cut at its start ("…nd Hiking Crew"); the header and side panel titles now take their direction from their text, so it is cut at its end and still sits on the right (CROSS-10).
- **Chats list in Urdu and Arabic:** the current chat's green bar is on the right, Latin chat and file names are cut at their end, and the File fact always shows the file's size and format, shortening only its name (SIDE-9).
- The side panel's subtitle ("for WhatsApp exports, offline") stays on one line with an ellipsis in every language, so it no longer grows past its header in Arabic or wraps at 360 px (SIDE-8).

### Touch screens

- **Bigger tap targets on touch screens.** On phones and tablets, header and toolbar buttons, the floating ↓ button, dialog, footer and tour buttons and the start screen's language buttons are 44 px; search ↑ ↓ ✕ and the date and sender fields are 40 px; menu items have more room. Small buttons inside messages and tables (voice note speed, Read more, a link card's Copy, the message ⌄, View all, statistics sort headers) look the same but get an invisible 44 px tap area, so messages don't change size. Computers with a mouse look exactly as before.
- **Search options on touch tablets** now get the labelled Match case, Whole word and Regex row under the field, as on phones (landscape phones keep the compact toggles).
- **Media, links and docs on touch screens:** 40 px tabs, 44 px row buttons, and photo and video tiles show their ⋮ options button instead of needing a long-press.
- **Side panel grip** is always visible on touch screens wider than 1024 px, with a wider strip to drag.
- **Settings on touch-only phones and tablets** no longer shows the Keyboard shortcuts and Single-key shortcuts rows, and the guided tour skips its keyboard step there.
- **Fixed:** the chat search field showed the browser's own ✕ next to the app's Close ✕; only the Close button is shown now (`Esc` clears the text).

### Short screens and phones on their side

- **Phones on their side and other short screens** (under 500 px tall) get a layout of their own. The chat header is 48 px, the sample chat's note is one line with its button beside it, the search bar and scroll buttons are smaller, and the sample note hides while searching, so a phone at 844×390 shows about 310 px of chat instead of 257 (CROSS-2, CHAT-2).
- **Fixed:** the ⋮ menu ran off short screens, so Keyboard shortcuts (and in Urdu and Arabic, Help and guided tour) couldn't be reached. It now scrolls and is more compact on short screens (CROSS-1).
- **Fixed:** Recent searches ran off short screens and covered the whole chat with an on-screen keyboard open. The list now stops above the bottom of the screen and scrolls, with its heading kept (CHAT-1).
- **Fixed:** "Which one is you?" showed no full name on a phone on its side, so the first step couldn't be done. On short screens the sheet uses the full height and the whole sheet scrolls as one list (MODALS-1).
- **Sheets use the whole height on a phone on its side** instead of a small floating card: Settings and Media, links and docs fill the screen, others reach top to bottom, with tighter headers and footers. The welcome dialog shows both choices without scrolling (MODALS-2, START-12).
- **Media, links and docs on a phone on its side:** full screen, the title, chips and buttons in one row, and six tiles per row (MODALS-3).
- **Side panel on short screens:** the chat's avatar sits beside its name and the list of chats is capped at 40% of the height, so the chat card shows (SIDE-7).
- **PDF viewer: fit width or fit page.** The Fit button (and `0`) now switches between fitting the page width and fitting the whole page, and names what it will do next. A phone on its side opens a PDF on the whole page (MODALS-12).
- **Filter bar on phones:** one line with … and a ✕ to clear, instead of up to three lines; the sample chat's note steps aside while a filter is on, on phones and short screens (CHAT-4).
- The Urdu sample chat note has more line spacing (CHAT-11).
- The name search in "Which one is you?" and Participants and nicknames stays at the top while the list scrolls, and on touch screens the nickname fields are 44 px tall (MODALS-11).

### Breakpoints and large screens

- **Two panes from 1024 px**, so an iPad in landscape gets the side panel beside the chat. The side panel's width now follows the window (300 px at 1024 px up to 420 px on big monitors) instead of a fixed 380 px, so the chat no longer loses 380 px at once; dragging still sets it. Widening the window closes an open drawer, so it doesn't reappear when the window narrows again.
- **One phone breakpoint, 640 px, everywhere.** Media, links and docs, the search toggles and stickers switched at 600 px while everything else switched at 640 px.
- **Bubbles no longer get narrower as the window gets wider** (they dropped from 504 to 350 px between 640 and 641 px). On big monitors photos and videos show at up to 400 px and link cards at 360 px, and the jump-to-first and jump-to-latest buttons sit by the message column instead of the far edge of the pane.
- **Fixed:** in Urdu and Arabic the jump buttons moved to the left and covered the received messages; they stay on the right, as the chat is left to right.
- **Starred messages** sits inside the app: from 1200 px it is a third column and the chat narrows beside it, narrower it slides over the chat, and on phones it fills the screen (it left a 10 px strip of chat, and on big monitors it floated outside the app). A starred location now shows "Location" instead of an empty line.
- **Fixed:** Chat statistics was wider than 360 and 375 px phones and scrolled sideways.
- **Fixed:** the confirmation dialog and What's new ignored their own widths (440 px instead of 380 and 480).
- The start screen is wider (680 px) with slightly larger text from 1600 px.
- Sample chat: no new lines; the existing Trip report message, photos, location and starred messages show these changes.

### Text size

- **Settings › Text size** (audit CROSS-4): Small (90%), Default (100%), Large (115%), Larger (130%) or Largest (150%). It scales the chat's text only, including messages, names, times, quotes, link cards, polls, notices, date pills and Read more, and Urdu and Arabic text with them. Photos, videos and stickers keep their size. Rows are measured again straight away, so nothing overlaps and you stay at the same place in the chat. It is remembered on this device (`cv-text-size`) and applied when the app starts. The pick sheet shows each choice at its size. In English, Urdu and Arabic.
- **Keys:** `+` and `-` in the chat make the text one step bigger or smaller, with a notification that names the new size. They are single keys, so Settings › Single-key shortcuts turns them off. `Ctrl` / `⌘` with `+`, `-` and `0` are left to the browser's page zoom. The Text size row shows the keys on a computer, and they are in the Keyboard shortcuts list.
- **Fixed:** the chat list measured rows in whole pixels, so at some text sizes, and with some Urdu lines, a row could overlap the next one by a pixel. Rows are now measured to the fraction.
- The guided tour's Settings step and the Settings privacy note mention the text size, in English, Urdu and Arabic.
- Sample chat: no new line. The setting applies to every message already in it; open the sample chat, then Settings › Text size, or press `+`.

### Tour, viewers and chat polish

- **The guided tour fits every screen.** The card is never taller than the screen: its text scrolls (also with `↑` `↓`) and Skip, Back and Next stay in view, so the last card's **Finish** can be reached on a phone on its side and on short phones such as an iPhone 8 in Safari (375×553 visible). On short phones the card also gets shorter, rather than covering the highlight, when there is room above or below it. The card no longer covers what it points at: it tries below, above and each side of the highlight, gets narrower (down to 260 px) to fit beside it, or sits at the top or bottom edge, and on short screens the chat steps scroll the message near the top. On tablets the sidebar steps put the card next to the open side panel instead of over it.
- **Tour, Settings step:** the card sits next to the Settings sheet when there is room; otherwise only **You are** is highlighted, with the card below it, so the card no longer covers the Settings it describes (also with the wider two-column Settings on large screens). Highlights are cut to the box that scrolls them, so they no longer run past the bottom of the sheet.
- **Tour, Voice notes and audio step:** it highlights the music file and the voice note just before it, instead of a 600 px stretch from the first voice note. The sample chat is unchanged (the five voice notes and the music file stay where they were), so the Autoplay run still ends at the music file.
- **Drag and drop:** the "Drop your WhatsApp export here" box is a solid panel with a folder icon, up to 520 px wide, instead of white text over the dimmed chat.
- **Photo viewer on phones:** the top bar keeps the sender's name and the date on one line; Rotate and Download move to a bar at the bottom, and Fit shows only while zoomed in. The position ("7 / 9") no longer reverses in Urdu and Arabic.
- **Photo viewer:** swiping across a video now moves to the next or previous item on phones, except over the video's controls bar.
- **Sample chat:** its video and GIF show "Loading…" while they are recorded on the device, instead of "Not in this ZIP", and the side panel no longer counts them as missing meanwhile.
- **The time on photos and videos** sits on a small dark pill, so it reads on light photos.
- **Chat header on phones:** the summary shows the date range first (it used to be cut off after the message count), and hovering it shows the whole line.

## 1.12.0 (2026-10-12)

- **Media, links and docs uses the whole screen on a laptop or desktop.** From 1100 px wide the gallery opens wider (up to 1180 px). When it is 640 px or wider, each Links, Documents, Audio and Contacts row shows all of its options as buttons, with tooltips, instead of hiding them behind ⋮: Go to message, Open (or Open link, View contact), Star or Unstar, Copy caption, Copy contact details, Copy link, Download and Share where the browser can share. Right-click, long-press and `Shift+F10` still open the menu. From 900 px the rows sit in two columns, the audio players fill their column, and the photo grid fits as many tiles as the width allows. Phones are unchanged: rows keep only ⋮.
- **Photo and video views.** On **Photos** and **Videos**, a new View button in the gallery header shows them as a **List** (thumbnail, caption or file name, type, size, sender and date, with the same options as other rows), a **Small grid**, a **Medium grid** (the default, as before) or a **Large grid**. Press `V` in the gallery to switch to the next view. The choice is remembered on this device (`cv-gallery-view`) and can also be set in **Settings › Photos and videos in Media**. In English, Urdu and Arabic.
- **Less empty space on large screens.** The app now stretches to 1920 px before it stops (it stopped at 1680 px, leaving grey bands on a 1920 px screen). From 1100 px, Settings opens wider with **Chats** beside **This chat** and **Help**, and the Keyboard shortcuts list opens wider in two columns. Phones and tablets look the same as before.
- The guided tour's Media, links and docs step mentions the row buttons on larger screens and the View button, in English, Urdu and Arabic.
- Sample chat: a second contact card, "Ridge Loop Guide", from Ayesha Khan on 16 March (9:17 AM), so Contacts shows two columns on a laptop, and a route sheet PDF from Hamza Iqbal on 3 April (8:15 AM) in Documents.
- **Starred messages look like the chat.** The Starred messages panel now shows each message as a chat bubble on the chat's background: your messages on the right in green, everyone else's on the left, as in the chat (also in Urdu and Arabic). Above each bubble are the sender's avatar, **Sender ▸ Recipient** and the date; inside are the text, a thumbnail of a photo, GIF, sticker or video, or an icon for voice notes, documents, polls, calls and other messages, then a star and the time. Tapping a bubble still jumps to the message, and a star button beside it unstars it.
- **Export and import starred messages.** Stars are kept only while the tab is open, so the panel has **Export** (`E`), which saves them to a small `.json` file on your device, **Import** (`L`), which stars the same messages again when you open that chat another time, and **Save as text** for a readable copy. A note in the panel says whether the stars have been exported. A starred file can also be dropped on the chat, or opened together with the chat export. Nothing is uploaded or stored.
- **Leaving with unsaved stars asks first.** Closing or reloading the tab with stars that were never exported shows the browser's "Leave site?" warning, and switching chats in the side panel and back keeps each chat's stars while the tab is open.
- The guided tour's ⋮ menu step mentions Export and Import, in English, Urdu and Arabic.
- Sample chat: a new message from Bilal Ahmed (you) on 3 April (8:32 AM) about starring, exporting and importing.

## 1.11.0 (2026-10-11)

- **Keyboard shortcuts for every major action**, with `⌘` on a Mac and `Ctrl` on Windows and Linux. You can open a chat (`Ctrl+O` / `⌘O`), search (`Ctrl+F` / `⌘F` or `/`), open Settings (`Ctrl+,` or `Ctrl+Shift+S`, `⌘,` or `⇧⌘S` on a Mac) and download a photo or PDF (`Ctrl+S` / `⌘S`). Single keys open the gallery (`M`), starred messages (`*`), Select (`X`), statistics (`I`), nicknames (`P`) and jump to date (`D`), and `[` shows or hides the side panel. `J` / `K` move between messages, `Ctrl+Home` / `Ctrl+End` (`⌘↑` / `⌘↓`) jump to the first or latest message, and `Alt+↓` / `Alt+↑` switch chats. On a focused message, `S` stars it, `Ctrl+C` copies it, `Enter` opens its photo, PDF or contact, `Space` plays its voice note and `←` / `→` skip 5 seconds. In search, `F3` and `Ctrl+G` step through matches. In the photo viewer, `G` goes to the message and `Space` plays a video; in a PDF, `Page Down` and `Page Up` turn pages; in the gallery, `1` to `8` switch tabs. Keys the browser needs (new tab, zoom, back, reload, print and so on) are left alone.
- **A Keyboard shortcuts list.** Press `?` (or `Ctrl+/` / `⌘/`) any time, or open it from Settings › Help, the ⋮ menu, or the link on the start screen. It is grouped by where each key works and shown in English, Urdu or Arabic. On a computer, the ⋮ menu and the message menu show each item's key, and buttons name theirs in the tooltip.
- **Settings › Single-key shortcuts** (on by default) turns off the shortcuts that are one key without Ctrl, ⌘ or Alt, for screen reader and voice control users. It is remembered on this device (`cv-single-keys`).
- **Fixed:** the search button's tooltip said "Ctrl+F" on a Mac, and letter shortcuts such as `Ctrl+F` could miss with an Urdu or Arabic keyboard layout (keys are now matched by their position as well).
- The guided tour has a new step on the Keyboard shortcuts row in Settings, and the last card and the ⋮ menu step mention the list, in English, Urdu and Arabic.
- Sample chat: a new message from Sana Mirza on 3 April (8:30 AM) about `?`, `J`, `K`, `S` and `Ctrl+C`.
- For contributors: every shortcut lives in `js/components/shortcuts-list.js`, with rules in PROJECT_RULES.md ("Keyboard shortcuts"), a new `keyboard-shortcuts-skill`, and `node tests/shortcuts.test.js`.
- **What's new after each update.** The first time the app opens after a new version, a popup lists what's new, improved and fixed in it, with green, blue and amber badges, in English, Urdu and Arabic. It shows once per version on each device (remembered as `cv-seen-version`); someone who skipped versions sees each one they missed, up to three. First-time users don't see it, since they get the tour. It waits for any open dialog, the tour or loading to finish. **Settings › About** opens it again with every version's notes. To try it on `development`, open the app in a browser that has used it before but not since this change (it shows 1.10.0), or delete `cv-seen-version` and reload.
- The guided tour's Settings step mentions What's new under About, in English, Urdu and Arabic.
- Releases now add their What's new notes to `js/release-notes.js` (`.claude/skills/release-skill`), and the GitHub Pages deploy checks them first (`tests/release-notes.test.js`).

## 1.10.0 (2026-10-11)

- **"Which one is you?" can be closed when opened from Settings.** From Settings → **You are** it now has a ✕ in its header and a **Cancel** button, and `Esc` or a tap outside closes it too, keeping who you were. When a new chat opens it stays mandatory as before: no ✕ or Cancel, and `Esc` or a tap outside doesn't close it.
- **Tap a participant to filter by them.** In the side panel's **Participants** list, tapping a person sets the **Sender** filter to them, so only their messages show, and their row is highlighted. Tapping the same person again goes back to **Everyone**. On tablets and phones, picking a sender this way or from the Sender menu also closes the side panel and shows the chat; on a computer the docked panel stays as it is. The rest of the sender filter works as before. The tour's filters step mentions it, in English, Urdu and Arabic. Sample chat: a new message from Usman Tariq on 3 April (8:28 AM); tap his name under Participants.
- **Autoplay voice messages (Settings, off by default).** When a voice message plays to its end, the next message plays too if it is a voice message that comes straight after it, whoever sent it, like WhatsApp. A text, link, photo, music file or notice in between ends the run, and pausing a note stops it. The next note scrolls into view when it is off screen. Remembered on this device (`cv-autoplay`). Works through the iPhone Web Audio fallback as well.
- **Autoplay button in Media, links and docs.** On **Audio**, a new button in the header (before Sort, on phones and computers) turns autoplay on or off, with a notification. While it is on, each audio that ends starts the next one in the list, voice notes and music files alike, in the list's sort order. It is the same switch as the Settings option.
- **Seeking only on the note that is playing.** In the chat and in Media, links and docs, tapping or dragging a waveform (or a music file's seek bar) moves the position only on the note that is playing or paused part-way. On any other note a tap does nothing and a swipe scrolls, so a stray touch while scrolling no longer starts a note from the middle. Start a note with its play button. Try it on the five voice notes on 16 March.
- The guided tour's Voice notes, Media, links and docs, and Settings steps mention autoplay and seeking, in English, Urdu and Arabic.
- Sample chat: three more voice notes on 16 March (9:16 AM) from Ayesha and Bilal, so five play in a row, and the music file after them ends the run.

## 1.9.0 (2026-10-10)

- **Search text is selected after a search,** found or not, so typing again starts a new search without clearing the field first: after Enter, after picking a recent search, and when you click or tab back into the field. It isn't selected while you type.
- **Search options: Match case, Whole word and Regex.** Three toggles in the search bar, like a code editor's: **Aa** finds only the same upper and lower case, **ab** finds whole words only (so "develop" no longer finds "developer" or "development", and it works for Urdu and Arabic words too), and **.\*** searches with a regular expression. They combine, and the highlights, the "n of N" counter and ↑ ↓ follow them. An active toggle is filled green with a green outline; an inactive one is a grey glyph. On phones they get their own row under the search field, with their names. `Alt+C`, `Alt+W` and `Alt+R` switch them from the keyboard. An invalid regular expression shows "Invalid pattern" instead of a count. Sample chat: three new messages on 3 April (8:24 to 8:26 AM) from Faisal, Ayesha and Bilal; try `develop` with **ab**, `Develop` with **Aa**, `TRL-\d+` with **.\***, and `سب` with **ab**.
- **The guided tour covers the 1.8.0 features and the new search options.** The Search step mentions Match case, Whole word, Regex and recent searches; Media, links and docs mentions each item's options and Go to message; Settings mentions nicknames and the Online link previews switch; Links describes the logo cards and the opt-in previews instead of saying no preview is shown. The English ⋮ menu step no longer says the theme and language are in that menu or that messages are starred by hovering (the Urdu and Arabic steps already said the right thing). In English, Urdu and Arabic.
- Docs: the features page lists the Online link previews setting among what is stored, the right script order, and the tour's new topics; the README mentions the gallery's options and Go to message.

## 1.8.0 (2026-10-10)

- **Nicknames for anyone in the chat.** Settings → **Participants and nicknames** lists everyone who wrote, each with a nickname field and a **Reset** button that brings back the exported name. A nickname replaces the name everywhere the viewer shows a sender: above messages, avatars, reactions, the side panel, filters, starred messages, statistics, the photo viewer, the gallery, copied messages and a one-to-one chat's title. Search finds people by either name. **Which one is you?**, shown when a chat opens, has a ✎ button in its header that turns the list into optional nickname fields (labelled with each exported name) with **Cancel** and **Save**, so nicknames can be set right away. Nicknames are remembered on this device for that chat only. Sample chat: a new member saved as `+1 555 0142` says "Zain here", so try giving them a nickname.
- **Recent searches.** Focusing the search bar shows your last 7 searches under it, newest first, narrowing as you type. Click one to run it again, its ✕ to remove just that one, or **Clear all** to remove every search after you confirm (↓ ↑ and `Delete` work from the keyboard, `Esc` closes the list). Searches are saved when you press Enter or use the ↑ ↓ buttons, and kept on this device.
- **"Which one is you?" is mandatory.** It has no ✕ any more, and Esc or a tap outside doesn't close it; **Show chat** confirms. In a group the person with the most messages is now selected by default (it was only marked as suggested).
- "1 messages" now reads "1 message" in **Which one is you?** and the nickname list.
- The start screen and the tour's last card now say **the chat** isn't saved, since settings, nicknames and recent searches are remembered.
- **Options for each item in Media, links and docs.** Long-press an item on a phone, right-click it on a computer, press its ⋮ button or use Shift+F10. The menu is a plain list of options with no title:
  - **Go to message**, which closes the gallery, scrolls the chat to that message and flashes it (clearing a filter that hides it);
  - **View**, **Open**, **Play/Pause**, **View contact** or **Open link**, by type;
  - **Star / Unstar** the message, with a small star on the items of starred messages;
  - **Copy caption**, **Copy contact details** or **Copy link**;
  - **Download**, and **Share** where the browser supports it.
- The rows' separate **Show in chat** button is now **Go to message** in that menu.
- **Phones show only ⋮ on each row.** On screens 600 px wide or less, the copy, open and download buttons on links, documents, audio and contacts rows are gone, leaving more room for the text; they are all in the ⋮ list. Tablets and computers keep the quick buttons next to ⋮.
- **Go to message in the photo viewer:** a new button in its top bar closes the viewer (and the gallery) and jumps to the photo's message.
- Sample chat: a captioned group photo from Kamran Shah (3 April), to try the options and Copy caption.
- **Link cards with official logos.** Links in the chat and in Media > Links now show the site's real logo on its brand colour for about 100 widely used sites (YouTube, TikTok, Instagram, Facebook, X, WhatsApp, Telegram, Google, Maps, Drive, Docs, Sheets, Slides, Forms, Meet, Gmail, Spotify, GitHub, Wikipedia, Zoom and more), bundled from Simple Icons (CC0), so nothing is fetched. Sites with no free-to-use logo (Microsoft Excel, Word, PowerPoint, OneDrive, Teams, LinkedIn, Amazon, Canva, ChatGPT, Daraz) get a plain icon in their brand colour, and government and university sites get their own icons.
- **Each card says what the link is,** worked out from the address: a YouTube Short, an Instagram reel, a TikTok video by @name, a WhatsApp channel or group invite, a Google search, a OneDrive folder, a short link and so on. Media > Links shows the same next to the site's name.
- **Every link in a message gets its own card,** up to three, instead of only the first.
- **Online link previews (Settings, off by default).** When turned on, YouTube, Vimeo, Instagram, TikTok, Spotify, SoundCloud, Dailymotion, Facebook video and Google Docs, Sheets, Slides and Forms links get a button that plays or shows the content inside the chat on a tap, YouTube links show their thumbnail, and titles load from each site's own oEmbed service (chat and Media > Links). Only the link is sent, and only to that site; the page's security policy allows just those sites. With the switch off, nothing is fetched, as before.
- Sample chat: new messages on 2 April (from Omar, Bilal, Ayesha and Sara) with YouTube Shorts, TikTok, Instagram, Google Sheets and Forms, a `.gov.pk` site, a WhatsApp channel, a share.google link, OneDrive Excel and bit.ly links, plus a Spotify playlist and a TikTok video link (from Omar) for the online players. The sample's video IDs are made up, so with online previews on, their players say the video is unavailable; try a real link from your own chat.
- **Voice notes and audio files play on iPhone again.** iPhone Safari would show the pause button but stay at 0:00 with no sound and a `–:––` length. The player now checks that playback really starts; if it doesn't within 2.5 seconds, or the browser can't play the format, the note is decoded and played through Web Audio (same seek, pause and speed controls), and every later note goes straight to Web Audio. Voice-note lengths now show before the first play on iPhone too, taken from the decoded waveform. The sample chat has a second voice note (Omar Farooq, 9:16 AM 16 March) to test switching between notes.

## 1.7.0 (2026-10-07)

- **Urdu in the chat uses the Urdu font in every language.** Any Urdu line in a message, a sender name, the chat title or a system notice is drawn in Jameel Noori Nastaleeq when it is installed, else the bundled Noto Nastaliq Urdu, also when the interface is in English or Arabic.
- **Arabic interface language.** Settings → Language (and the start screen) now offers **العربية** next to English and اردو, right to left like Urdu, with every label translated. The chat itself is still never translated.
- **Arabic in the chat uses an Arabic font.** Arabic text (Qur'anic verses, duas, Arabic messages) is drawn in **Noto Naskh Arabic**, bundled under the SIL Open Font License. The app tells Urdu from Arabic by their letters (ٹ ڈ ڑ ں ے ہ ی ک گ for Urdu, ة ي ك ى for Arabic, and vowel marks for Qur'anic text); text that could be either follows the chat's main language.
- **Mixed messages:** English, Urdu and Arabic in one message, or in one line, each get their own font, and each line keeps its own direction.
- **Hide or show the side panel on large screens.** The ☰ button in the chat header now hides the side panel on desktop too, giving the chat the full width, and shows it again. On phones and tablets it opens the drawer as before.
- **Message menu, like WhatsApp's long-press menu.** Long-press a message on a phone, right-click it on a computer, or use the ⌄ button that appears on hover (or Shift+F10 on a focused message). It offers:
  - **Star / Unstar** on every message;
  - **Copy** the whole message exactly as exported (a poll copies its question and options; a contact card has **Copy contact details**);
  - **Copy link** when the message has one;
  - **View photo**, **Open document** (PDF) and **View contact**, by type;
  - **Download** for each attached photo, video, voice note, sticker, document or contact card;
  - **Share** through the device's share sheet, where the browser has one. It stands in for WhatsApp's Forward; Reply, Forward and Delete need a live chat, so they aren't offered.
- **Sorting in Media, links and docs.** A sort button in the gallery header: newest or oldest first, name A–Z or Z–A, and largest or smallest first (size isn't offered for links). Month headings show only for date sorts.
- **Search bar on large screens** now opens under the chat header, as on phones, instead of in the side panel.
- **Search bar on phones:** the results-list button is gone, and a clear ✕ close button sits at the end of the bar. It closes and clears the search.
- **Esc** closes the dialog on top (for example the sort sheet over the gallery), not the one under it.
- **Gap under the last message.** The chat now leaves a 28 px gap under its last message, so with date filters on (or at the end of any chat) it no longer sits flush with the bottom edge.
- **iPhone HEIC photos show in every browser.** Outside Safari they are decoded with a bundled HEIC decoder (libheif, WebAssembly, loaded only when a chat has one; nothing is fetched) and shown in the chat, the photo viewer and the gallery. Download still saves the original `.heic`; the dev preview, which can't save `.heic`, saves the photo as a `.jpg`. A HEIC that can't be decoded still gets the file card.
- **The star no longer appears on hover.** Hovering a message shows only the ⌄ menu button, as in WhatsApp Web; Star and Unstar are in the message menu.
- **Select messages.** ⋮ → **Select messages** (or **Select** in a message's menu) lets you pick whole messages by tapping them, scrolling as you go, as in WhatsApp. The header turns into a bar with the count and **Star**, **Copy** and **Share** for all of them at once; ✕ or Esc ends it.
- **The side panel's search is gone.** Search is the bar under the chat header on every screen.
- **Resize the side panel** by dragging the grip at the middle of its edge (280 px to half the window, at most 640 px), with the arrow keys on the grip, or double-click it to reset.
- **The app's own text isn't selectable** any more: the side panel, header, banners, menus and buttons. Messages and fields still are.
- **New notifications.** Every short message the app shows (copied, starred, a file that couldn't be read, a download the preview can't save, and so on) is now a notification card at the top right, coloured and marked by kind: success (green ✓), information (blue i), warning (amber !) and error (red ✕). Several stack under each other (a repeat of the same message stacks too instead of replacing it), each has a ✕ to close it, and they close on their own (errors stay longest). Built on the bundled Notyf library (MIT), restyled to match the app, with screen-reader announcements in every language. On phones they span the top of the screen.
- **The message menu shows only its options**, without the sender and time, and lines up with the right edge of the message for sent and received messages alike.
- **Share is only offered where it works.** Inside a page that can't open the share sheet (such as the dev preview on a phone) the option is left out; if sharing is refused anyway, the message is copied instead.
- **The message menu opens under its message**, lined up with the bubble and only as wide as its options. Near the bottom of the window the chat scrolls up to make room; at the very end of the chat the menu opens above the message. It used to stretch across the whole window on computers.
- **Chat statistics:** the charts (busiest days, by weekday, by hour of day) now come right after the totals, and **Messages by person** moves below them.
- **Messages by person sorts by any column.** Tap Person, Messages, Share, Words or Media to sort; tap again to reverse. It now lists everyone, not just the top 50.
- **Documentation reorganised.** `todo.md` and `deferred.md` moved into `docs/` next to `features.md`. `docs/todo.md` now lists only requested work that isn't built yet (nothing, right now); finished work is described in `docs/features.md`, which was checked against the code and now covers everything in the app (the ⋮ menu, notifications, HEIC, the current sample chat and tour) and nothing that was removed. The rules, `CLAUDE.md`, the agent skills and the README were brought up to date, with new rules for notifications and for keeping the docs in step.
- The tour's ⋮ menu step no longer mentions the hover star or the theme and language, which now live in Settings; the "Which one is you?" dialog says you can change it later in Settings.
- **Sample chat:** an Arabic verse with its Urdu translation in one message, and an Arabic group message, to try the fonts, search and the message menu.

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
