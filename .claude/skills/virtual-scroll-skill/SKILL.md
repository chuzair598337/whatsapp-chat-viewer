---
name: virtual-scroll-skill
description: Use when changing how chat rows render or scroll. Covers the VL virtual list, row heights, makeRow, filters, jumping to a message, and anything that adds or removes rows.
---

# Virtual list

The chat never renders every message. `VL` in `js/viewer.js` keeps only the rows near the viewport, about 30, positioned absolutely inside `#layer` with `transform: translateY(...)`. `#spacer` gives the scroller its full height.

## Data flow

1. **`buildItems()` in `js/app.js`** turns `S.msgs` into `S.items`, a flat list of these item types:
   - `{type: 'date'}`: a day separator;
   - `{type: 'sys'}`: a system pill;
   - `{type: 'msg', m, i, first, showName, ...}`: a message.

   It also builds:
   - `S.m2i[i]`, the item index for message `i`, or `-1` when a filter hides it;
   - `S.dateIdx`, the date item for each item.

   Filters are applied here, by `passes(m)`.
2. **`VL.set(items, target)`** estimates every row's height with `estimate(item, width)` and builds a Fenwick tree (`Fenwick`) of the heights. It then renders around `target`: `{i, off}`, `{i, center: true}` or `{bottom: true}`.
3. **`VL.update()`** finds the first visible item with `fw.find(scrollTop)`, creates the missing rows with `makeRow(item, index)`, measures them, and fixes estimates with `fw.add`. It removes rows that scrolled away.

## Rules

- **Estimate close to the real height.** When a row type changes height (a new badge, a reaction pill, a card), update `estimate()` too. Bad estimates make the scrollbar jump.
- **When a rendered row changes height later** (an image loads, a video learns its size), call `VL.remeasure(index)`. It adjusts the tree and keeps the reading position anchored.
- **To redraw visible rows in place**, for example after search highlights or a "which one is you" change, use `VL.refresh()`. For a single row, rebuild it with `makeRow`, swap it into `VL.nodes`, and call `VL.remeasure(k)` (see `toggleStar`).
- **Width changes go through `VL.relayout()`**, which re-estimates the rows and keeps the position.
- **Handle row clicks with delegation** on `layer`, not with listeners per row. Rows are recycled.
- **Keep work out of the hot path.** Never query layout (`offsetHeight`, `getBoundingClientRect`) inside a loop over all items. Only rendered rows may be measured. `makeRow` must stay cheap: no decoding, no network, nothing synchronous over about 1 ms. Hand heavy work (waveforms, posters, PDF thumbnails) to the lazy queues in `viewer.js`.
- **Jumping:** go through `S.m2i`. If it's `-1`, the message is filtered out. Clear the filters first (`jumpToMsg` does this), then `VL.scrollTo(S.m2i[i], 'center')`.

## Checks after a change

- **60,000-message chat:**
  - scroll from top to bottom and back;
  - jump to dates;
  - check that the DOM holds about 30 rows and nothing jumps.
- **Rows that grow after load:** photos, videos, PDFs and the reaction badge. The reading position must hold.
- **Filters:** with a filter on, search and jump-to-date must only land on visible messages.
- **Phone width (390 px):** no horizontal scrolling.
