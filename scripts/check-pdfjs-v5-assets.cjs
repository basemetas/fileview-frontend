/* eslint-env node */
/*
 * Copyright 2026 BaseMetas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const vendorDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '../public/vendor/pdfjs-v5');
const version = JSON.parse(
  fs.readFileSync(path.join(vendorDir, 'version.json'), 'utf8'),
);

for (const name of [
  'wasm/openjpeg.wasm',
  'wasm/openjpeg_nowasm_fallback.js',
  'wasm/LICENSE_OPENJPEG',
  'wasm/LICENSE_PDFJS_OPENJPEG',
]) {
  assert.ok(version.files.includes(name), `PDF.js resource not listed: ${name}`);
  assert.ok(
    fs.statSync(path.join(vendorDir, name)).size > 0,
    `PDF.js resource is empty: ${name}`,
  );
}

const wasm = fs.readFileSync(path.join(vendorDir, 'wasm/openjpeg.wasm'));
assert.equal(
  wasm.subarray(0, 8).toString('hex'),
  '0061736d01000000',
  'Invalid OpenJPEG WebAssembly binary',
);
console.log(`PDF.js ${version.version} decoder resources verified: ${vendorDir}`);
