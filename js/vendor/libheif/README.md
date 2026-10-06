# libheif (HEIC decoder)

`libheif-bundle.js` is the unmodified `libheif-wasm/libheif-bundle.js` from the npm package
[libheif-js](https://www.npmjs.com/package/libheif-js) 1.23.5 (libheif compiled to WebAssembly, with
the WebAssembly binary embedded, so nothing is fetched).

The viewer loads it only when a chat has a HEIC or HEIF photo the browser can't show itself
(every browser except Safari), and uses it to draw the photo. The downloaded file stays the original.

libheif and libheif-js are licensed under the GNU Lesser General Public License v3.0 (`LICENSE`).
It is a separate file you can swap for another build of the same package.
