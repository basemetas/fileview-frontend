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
 * PDF.js v2 适配器
 * 用于兼容 Chrome 60+ 的旧版浏览器
 * 使用 pdfjs-dist 2.4.456 版本
 */

import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';
import pdfWorkerUrl from '../pdf-worker';
import type {
  IPdfAdapter,
  IPdfLoadOptions,
  IDocumentLoadingTask,
  IPasswordResponses,
} from './types';
import { log } from '@/utils';

/**
 * PDF.js v2 适配器实现
 */
export class PdfAdapterV2 implements IPdfAdapter {
  readonly version = 'v2' as const;

  private initialized = false;

  /**
   * 获取密码响应常量
   */
  get PasswordResponses(): IPasswordResponses {
    return {
      NEED_PASSWORD: pdfjsLib.PasswordResponses.NEED_PASSWORD,
      INCORRECT_PASSWORD: pdfjsLib.PasswordResponses.INCORRECT_PASSWORD,
    };
  }

  /**
   * 初始化适配器
   * 设置 worker URL
   */
  init(): void {
    if (this.initialized) return;

    // 设置 PDF.js worker URL
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    this.initialized = true;
    log.debug('[PDF v2] 适配器初始化完成');
  }

  /**
   * 加载 PDF 文档
   * @param options 加载选项
   * @returns 文档加载任务
   */
  getDocument(options: IPdfLoadOptions): IDocumentLoadingTask {
    this.init();
    return pdfjsLib.getDocument(options) as unknown as IDocumentLoadingTask;
  }

  /**
   * 获取 TextLayerBuilder 类
   */
  getTextLayerBuilder(): any {
    return (pdfjsViewer as any).TextLayerBuilder;
  }

  /**
   * 获取 EventBus 类
   */
  getEventBus(): any {
    return (pdfjsViewer as any).EventBus;
  }
}

// 单例实例
let instance: PdfAdapterV2 | null = null;

/**
 * 获取 PDF v2 适配器实例
 */
export const getPdfAdapterV2 = (): Promise<IPdfAdapter> => {
  if (!instance) {
    instance = new PdfAdapterV2();
    instance.init();
  }
  return Promise.resolve(instance);
};

export default PdfAdapterV2;
