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

// 是否是手机
const isPhoneFun = (): boolean => {
  // 优先使用 CSS 像素（逻辑分辨率）
  const width =
    window.innerWidth || document.documentElement.clientWidth || screen.width;
  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    screen.height;
  const minSide = Math.min(width, height);

  // 手机逻辑宽度通常 < 768px
  if (minSide >= 768) return false;

  // 触摸点判断（保留）
  if (navigator.maxTouchPoints <= 0) return false;

  // 排除桌面设备（更精确）
  const ua = navigator.userAgent.toLowerCase();
  const isDesktop =
    /windows|macintosh|linux/.test(ua) &&
    !/mobile|android|iphone|ipad/.test(ua);
  if (isDesktop) return false;

  return true;
};

// 是否是 Pad（iPad + Android Pad + Huawei MatePad）
const isPadFun = (): boolean => {
  if (isPhoneFun()) return false;

  const ua = navigator.userAgent || '';

  // 1️⃣ iPad UA（老 iPad / 早期 iPadOS）
  if (/iPad/.test(ua)) return true;

  // 2️⃣ iPadOS 13+ 在桌面模式会变成 Mac UA
  //    只要 Mac 且支持多点触控，就算 iPad
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints >= 1) {
    return true;
  }

  // 3️⃣ 其他 Android Pad / MatePad
  if (navigator.maxTouchPoints <= 1) return false;

  const isCoarsePointer =
    window.matchMedia?.('(pointer: coarse)').matches ?? false;

  if (isCoarsePointer) return true;

  // 4️⃣ 尺寸兜底
  const minSide = Math.min(
    window.visualViewport?.width ?? window.innerWidth,
    window.visualViewport?.height ?? window.innerHeight,
  );

  return minSide >= 600;
};

// 是否支持触摸
const isTouchSupportedFun = () => {
  return navigator.maxTouchPoints > 0;
};

// 检查是否为移动端（手机和pad都是移动端）
const isMobileFun = () => {
  return isPhoneFun() || isPadFun();
};

/**
 * 获取 Chrome 浏览器版本号
 * @returns Chrome 版本号，如果不是 Chrome 则返回 -1
 */
const getChromeVersion = (): number => {
  const ua = navigator.userAgent;

  // 检查是否是 Chrome 浏览器（排除 Edge、Opera 等 Chromium 内核浏览器）
  // Chrome UA 示例: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36
  const chromeMatch = ua.match(/Chrome\/(\d+)/);

  if (chromeMatch) {
    // 排除 Edge (Edg/)
    if (ua.includes('Edg/')) return -1;
    // 排除 Opera (OPR/)
    if (ua.includes('OPR/')) return -1;
    // 排除 Brave (Brave/)
    if (ua.includes('Brave/')) return -1;

    return parseInt(chromeMatch[1], 10);
  }

  return -1;
};

/**
 * 检查是否支持动态导入 ES 模块
 * 某些浏览器（如小米浏览器）可能不支持通过 import() 加载 ES 模块
 * @returns true 如果支持动态导入 ES 模块
 */
const supportsDynamicImport = (): boolean => {
  try {
    // 检测是否支持动态 import()
    // 使用 new Function 避免语法错误导致脚本中断
    new Function('return import("data:text/javascript,export default 1")')();
    return true;
  } catch {
    return false;
  }
};

/**
 * 检查是否支持 ES 模块 Worker
 * PDF.js v5 使用 new Worker(..., { type: "module" }) 加载 worker
 * 某些浏览器（如小米浏览器）可能不支持此特性
 * @returns true 如果支持 ES 模块 Worker
 */
const supportsModuleWorker = (): boolean => {
  try {
    // 尝试创建一个 ES 模块类型的 Worker
    // 使用 data URL 避免网络请求
    const worker = new Worker('data:text/javascript,export default 1', {
      type: 'module',
    });
    worker.terminate();
    return true;
  } catch {
    return false;
  }
};

/**
 * 检查是否支持 PDF.js v5
 * PDF.js v5 需要 Chrome >= 92：
 * - Chrome >= 92: 支持顶层 await、私有类字段等基础特性
 * - Chrome >= 93: 原生支持 ReadableStream 异步迭代（已通过 polyfill 兼容 < 93）
 * - Chrome >= 119: 原生支持 Promise.withResolvers（已通过 polyfill 兼容 < 119）
 * - Chrome >= 125: 原生支持 ArrayBuffer.transferToFixedLength（已通过 polyfill 兼容 < 125）
 * - Chrome >= 128: 原生支持 Promise.try（已通过 polyfill 兼容 < 128）
 * 注意：pdf_viewer.js 原始使用了正则 /v 标志（Chrome 112+），
 * 已通过源码改写替换为等价的 /u 正则，不再需要 /v 支持
 * 同时需要支持动态导入 ES 模块和 ES 模块 Worker
 * @returns true 如果支持 PDF.js v5
 */
const supportsPdfV5 = (): boolean => {
  // 首先检查是否支持动态导入 ES 模块
  // 这是加载 PDF.js v5 的必要条件
  if (!supportsDynamicImport()) {
    return false;
  }

  // 检查是否支持 ES 模块 Worker
  // PDF.js v5 使用此特性加载 worker
  if (!supportsModuleWorker()) {
    return false;
  }

  // 检查必要的 JavaScript 特性
  // 这些特性是 PDF.js v5 的关键依赖
  try {
    // 检查是否支持私有类字段
    new Function('class A { #x = 1; get x() { return this.#x; } }');
  } catch {
    return false;
  }

  // 注意：Promise.try（Chrome 128+）、Promise.withResolvers（Chrome 119+）、
  // ReadableStream.prototype[Symbol.asyncIterator]（Chrome 93+）、
  // ArrayBuffer.prototype.transferToFixedLength（Chrome 125+）、
  // Uint8Array.prototype.toHex 等运行时 API 已通过 polyfill 注入到
  // pdf.js / pdf.worker.js 中，不需要浏览器版本门槛
  //
  // 正则 /v 标志（Chrome 112+）已通过源码改写替换为等价的 /u 正则，
  // pdf_viewer.js 中不再使用 /v 标志

  const version = getChromeVersion();

  // 对于 Chrome 浏览器，按版本号判断
  // Chrome >= 92 支持顶层 await、私有类字段等基础特性
  if (version > 0) {
    return version >= 92;
  }

  // 对于非 Chrome 浏览器，如果通过了上面的特性检测，也支持 v5
  return true;
};

export const isMobile = isMobileFun();
export const isPhone = isPhoneFun();
export const isPad = isPadFun();
export const isTouchSupported = isTouchSupportedFun();
export const chromeVersion = getChromeVersion();
export const pdfV5Supported = supportsPdfV5();
