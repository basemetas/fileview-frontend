/*
 * Copyright 2025 BaseMetas
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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';
// Chrome 60 兼容: ReadableStream 和 Promise.allSettled polyfill
import 'web-streams-polyfill/dist/ponyfill';
// @ts-ignore
import promiseAllSettled from 'promise.allsettled';
promiseAllSettled.shim();
// DOMMatrix polyfill for Chrome 60
import DOMMatrixPolyfill from 'dommatrix';
if (typeof DOMMatrix === 'undefined') {
  (window as any).DOMMatrix = DOMMatrixPolyfill;
}
// ResizeObserver polyfill for Chrome 60
import ResizeObserver from 'resize-observer-polyfill';
if (typeof (window as any).ResizeObserver === 'undefined') {
  (window as any).ResizeObserver = ResizeObserver;
}
// Element.toggleAttribute polyfill for Chrome 60
if (!Element.prototype.toggleAttribute) {
  Element.prototype.toggleAttribute = function (name: string, force?: boolean) {
    if (force !== void 0) force = !!force;
    if (this.hasAttribute(name)) {
      if (force) return true;
      this.removeAttribute(name);
      return false;
    }
    if (force === false) return false;
    this.setAttribute(name, '');
    return true;
  };
}
// HTMLSlotElement.assignedElements polyfill for Chrome 60
if (
  typeof HTMLSlotElement !== 'undefined' &&
  !HTMLSlotElement.prototype.assignedElements
) {
  Object.defineProperty(HTMLSlotElement.prototype, 'assignedElements', {
    value: function (options?: { flatten?: boolean }) {
      const nodes = this.assignedNodes(options);
      return nodes.filter((node: Node) => node.nodeType === Node.ELEMENT_NODE);
    },
  });
}
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.scss';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
