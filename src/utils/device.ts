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

export const isMobile = isMobileFun();
export const isPhone = isPhoneFun();
export const isPad = isPadFun();
export const isTouchSupported = isTouchSupportedFun();
