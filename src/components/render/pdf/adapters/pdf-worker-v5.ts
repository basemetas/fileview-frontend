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

/**
 * PDF.js v5 Worker URL 加载器
 * 用于 Chrome >= 92 的现代浏览器
 *
 * v5 版本的 worker 文件需要单独编译并放置在 public/vendor/pdfjs-v5/ 目录下
 * 编译后路径为: {context}/vendor/pdfjs-v5/pdf.worker.min.mjs
 */

import { getAppContext } from '@/utils';
const webPrefix = getAppContext() + '/preview';

// 构建时间戳，用于打破浏览器缓存
const BUILD_TIMESTAMP = __BUILD_TIMESTAMP__;

// 缓存 worker URL
let cachedWorkerUrl: string | null = null;

/**
 * 获取 PDF.js v5 Worker URL
 * @returns Worker URL 字符串
 */
export const getPdfV5WorkerUrl = (): string => {
  if (cachedWorkerUrl) {
    return cachedWorkerUrl;
  }

  // public 目录下的文件编译后直接在根路径
  // 所以 public/vendor/pdfjs-v5/xxx.js -> {context}/vendor/pdfjs-v5/xxx.js
  // 添加构建时间戳避免浏览器缓存问题
  cachedWorkerUrl =
    webPrefix + '/vendor/pdfjs-v5/pdf.worker.min.js?t=' + BUILD_TIMESTAMP;

  return cachedWorkerUrl;
};

/**
 * 预加载 PDF.js v5 Worker
 * 用于提前加载 worker 文件，减少首次渲染延迟
 */
export const preloadPdfV5Worker = (): void => {
  const workerUrl = getPdfV5WorkerUrl();

  // 使用 link preload 预加载 worker
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'worker';
  link.href = workerUrl;
  document.head.appendChild(link);
};

export default getPdfV5WorkerUrl;
