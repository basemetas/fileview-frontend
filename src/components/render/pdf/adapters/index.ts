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
 * PDF 适配器工厂
 * 根据浏览器版本自动选择合适的 PDF.js 版本
 * - Chrome >= 92: 使用 PDF.js v5（更好的性能和新特性）
 * - 其他浏览器: 使用 PDF.js v2（更好的兼容性）
 */

import { pdfV5Supported, chromeVersion } from '@/utils/device';
import { log } from '@/utils';
import type { IPdfAdapter } from './types';
// 注意：v2 和 v5 适配器都使用动态导入，实现真正的按需加载

// 导出类型
export type {
  IPdfAdapter,
  IPdfLoadOptions,
  IDocumentProxy,
  IPageProxy,
  IViewport,
  ITextContent,
} from './types';

// 缓存的适配器实例
let cachedAdapter: IPdfAdapter | null = null;
let adapterVersion: 'v2' | 'v5' | null = null;

/**
 * 获取当前使用的适配器版本
 */
export const getAdapterVersion = (): 'v2' | 'v5' | null => {
  return adapterVersion;
};

/**
 * 获取 PDF 适配器
 * 根据浏览器版本自动选择合适的适配器
 *
 * @returns PDF 适配器实例
 */
export const getPdfAdapter = async (): Promise<IPdfAdapter> => {
  // 如果已经缓存，直接返回
  if (cachedAdapter) {
    return cachedAdapter;
  }

  // 根据浏览器支持情况选择适配器
  if (pdfV5Supported) {
    try {
      log.debug(
        `[PDF 工厂] 检测到 Chrome ${chromeVersion}，尝试加载 PDF.js v5`,
      );
      // 动态导入 v5 适配器
      const { getPdfAdapterV5 } = await import('./pdf-adapter-v5');
      cachedAdapter = await getPdfAdapterV5();
      adapterVersion = 'v5';
      log.debug('[PDF 工厂] PDF.js v5 适配器加载成功');
    } catch (error) {
      log.warn('[PDF 工厂] PDF.js v5 加载失败，回退到 v2:', error);
      // 动态导入 v2 适配器
      const { getPdfAdapterV2 } = await import('./pdf-adapter-v2');
      cachedAdapter = await getPdfAdapterV2();
      adapterVersion = 'v2';
    }
  } else {
    log.debug(`[PDF 工厂] 浏览器不支持 PDF.js v5，使用 v2 版本`);
    // 动态导入 v2 适配器
    const { getPdfAdapterV2 } = await import('./pdf-adapter-v2');
    cachedAdapter = await getPdfAdapterV2();
    adapterVersion = 'v2';
  }

  return cachedAdapter!;
};

/**
 * 预加载 PDF 适配器
 * 用于提前加载资源，减少首次渲染延迟
 */
export const preloadPdfAdapter = (): void => {
  if (pdfV5Supported) {
    // 预加载 v5 worker
    import('./pdf-adapter-v5')
      .then(({ PdfAdapterV5 }) => {
        const adapter = new PdfAdapterV5();
        adapter.preload?.();
      })
      .catch(() => {
        // 预加载失败不影响正常使用
      });
  }
};

/**
 * 重置适配器（用于测试或强制重新加载）
 */
export const resetPdfAdapter = (): void => {
  cachedAdapter = null;
  adapterVersion = null;
};

// v2 和 v5 适配器都使用动态导入，不在此处静态导出
// 如需使用适配器，请使用 getPdfAdapter() 或动态导入:
// const { getPdfAdapterV2 } = await import('./pdf-adapter-v2');
// const { getPdfAdapterV5 } = await import('./pdf-adapter-v5');
