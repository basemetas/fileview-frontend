# JPEG2000 preview regression

`jpeg2000.pdf` is a synthetic, single-page PDF containing one lossless
JPEG2000 image (`/JPXDecode`), with red, green, blue and black quadrants.
It contains no document text or external resources.

Open the file in Fileview using a browser that selects the PDF.js v5 adapter.
The whole image should be visible. Without the OpenJPEG resources and
`wasmUrl` configuration, the page renders blank even when the PDF render
promise resolves.

Also check the JavaScript decoder by loading this fixture in an isolated
PDF.js test with `useWasm: false` and the same `wasmUrl`.

Run `npm run build` to check decoder resources before and after bundling.
