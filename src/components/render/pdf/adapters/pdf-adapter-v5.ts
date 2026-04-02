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
 * PDF.js v5 适配器
 * 用于 Chrome >= 92 的现代浏览器
 * 动态加载 pdfjs-dist v5 版本（按需加载）
 */

import type {
  IPdfAdapter,
  IPdfLoadOptions,
  IDocumentLoadingTask,
  IPasswordResponses,
} from './types';
import { getPdfV5WorkerUrl } from './pdf-worker-v5';
import { log, getAppContext } from '@/utils';
const webPrefix = getAppContext() + '/preview';

// 动态加载的 PDF.js v5 模块类型
interface PdfV5Module {
  GlobalWorkerOptions: {
    workerSrc: string | false;
  };
  // eslint-disable-next-line no-unused-vars
  getDocument(src: any): IDocumentLoadingTask;
  PasswordResponses: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };
}

interface PdfV5ViewerModule {
  TextLayerBuilder: any;
  EventBus: any;
}

/**
 * PDF.js v5 适配器实现
 * 注意：v5 适配器需要异步初始化，请使用 getPdfAdapterV5() 获取已初始化的实例
 */
export class PdfAdapterV5 implements IPdfAdapter {
  readonly version = 'v5' as const;

  private _initialized = false;
  private _pdfjsLib: PdfV5Module | null = null;
  private _pdfjsViewer: PdfV5ViewerModule | null = null;
  private _initPromise: Promise<void> | null = null;

  /**
   * 获取密码响应常量
   */
  get PasswordResponses(): IPasswordResponses {
    if (!this._pdfjsLib) {
      // 返回默认值，避免在初始化前抛出错误
      return {
        NEED_PASSWORD: 1,
        INCORRECT_PASSWORD: 2,
      };
    }
    return {
      NEED_PASSWORD: this._pdfjsLib.PasswordResponses.NEED_PASSWORD,
      INCORRECT_PASSWORD: this._pdfjsLib.PasswordResponses.INCORRECT_PASSWORD,
    };
  }

  /**
   * 初始化适配器
   * 动态加载 PDF.js v5 模块
   */
  async init(): Promise<void> {
    // 如果已经在初始化中，返回同一个 Promise
    if (this._initPromise) {
      return this._initPromise;
    }

    // 如果已经初始化完成，直接返回
    if (this._initialized) {
      return;
    }

    this._initPromise = this._doInit();
    try {
      await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }

  /**
   * 实际的初始化逻辑
   */
  private async _doInit(): Promise<void> {
    try {
      // 动态加载 PDF.js v5 核心模块
      // public 目录下的文件编译后直接在根路径
      // 所以 public/vendor/pdfjs-v5/xxx.js -> {context}/vendor/pdfjs-v5/xxx.js
      const pdfjsModule = await import(
        /* webpackChunkName: "pdfjs-v5" */
        /* @vite-ignore */
        `${webPrefix}/vendor/pdfjs-v5/pdf.js` as string
      );

      this._pdfjsLib = pdfjsModule;

      // 设置 Worker URL
      if (this._pdfjsLib) {
        this._pdfjsLib.GlobalWorkerOptions.workerSrc = getPdfV5WorkerUrl();
      }

      // 动态加载 PDF.js v5 viewer 模块
      const viewerModule = await import(
        /* webpackChunkName: "pdfjs-v5-viewer" */
        /* @vite-ignore */
        `${webPrefix}/vendor/pdfjs-v5/pdf_viewer.js` as string
      );

      this._pdfjsViewer = viewerModule;

      this._initialized = true;
      log.debug('[PDF v5] 适配器初始化完成');
    } catch (error) {
      log.error('[PDF v5] 适配器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载 PDF 文档
   * @param options 加载选项
   * @returns 文档加载任务
   */
  getDocument(options: IPdfLoadOptions): IDocumentLoadingTask {
    // 同步返回一个代理对象，实际加载在内部异步进行
    if (!this._pdfjsLib) {
      // 如果尚未初始化，抛出错误提示用户先调用 init()
      throw new Error(
        '[PDF v5] 适配器未初始化，请先调用 init() 或使用 getPdfAdapterV5()',
      );
    }

    return this._pdfjsLib.getDocument(options);
  }

  /**
   * 获取 TextLayerBuilder 类
   */
  getTextLayerBuilder(): any {
    if (!this._pdfjsViewer) {
      throw new Error('[PDF v5] viewer 模块未加载，请先调用 init()');
    }
    return this._pdfjsViewer.TextLayerBuilder;
  }

  /**
   * 获取 EventBus 类
   */
  getEventBus(): any {
    if (!this._pdfjsViewer) {
      throw new Error('[PDF v5] viewer 模块未加载，请先调用 init()');
    }
    return this._pdfjsViewer.EventBus;
  }

  /**
   * 预加载资源
   * 注意：不预加载 worker，让 PDF.js 自己管理 worker 加载
   * 避免重复加载（preload + 实际使用）
   */
  preload(): void {
    // PDF.js 会在设置 workerSrc 时自动加载 worker
    // 不需要额外预加载
  }
}

// 单例实例
let instance: PdfAdapterV5 | null = null;

/**
 * 获取 PDF v5 适配器实例（已初始化）
 */
export const getPdfAdapterV5 = async (): Promise<IPdfAdapter> => {
  if (!instance) {
    instance = new PdfAdapterV5();
    await instance.init();
  }
  return instance;
};

export default PdfAdapterV5;
