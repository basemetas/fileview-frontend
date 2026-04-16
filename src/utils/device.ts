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
  if (navigator.maxTouchPoints <= 0) return false;

  const minSide = Math.min(screen.width, screen.height);
  if (minSide >= 600) return false;

  // 排除桌面 UA（极少数）
  const ua = navigator.userAgent.toLowerCase();
  if (/windows|macintosh|linux/.test(ua)) return false;

  return true;
};

// 是否是 Pad（iPad + Android Pad + Huawei MatePad）
const isPadFun = (): boolean => {
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
 * PDF.js v5 需要 Chrome >= 92（支持顶层 await、私有类字段等特性）
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

  const version = getChromeVersion();

  // 对于 Chrome 浏览器，严格按版本号判断
  // Chrome >= 92 才支持 v5
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
