/* eslint-disable no-unused-vars */
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
 * PDF 统一接入层类型定义
 * 用于抽象 PDF.js v2 和 v5 的差异，提供统一的 API
 */

/**
 * 视口信息
 */
export interface IViewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
  clone(params?: { scale?: number; rotation?: number }): IViewport;
  convertToViewportPoint(x: number, y: number): [number, number];
}

/**
 * 文本项
 */
export interface ITextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

/**
 * 文本内容
 */
export interface ITextContent {
  items: ITextItem[];
  styles: Record<string, unknown>;
  lang: string | null;
}

/**
 * 页面代理接口
 */
export interface IPageProxy {
  getViewport(params: { scale: number; rotation?: number }): IViewport;
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: IViewport;
  }): { promise: Promise<void> };
  getTextContent(params?: {
    disableCombineTextItems?: boolean;
  }): Promise<ITextContent>;
}

/**
 * 文档代理接口
 */
export interface IDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<IPageProxy>;
  destroy(): void;
}

/**
 * 文档加载任务接口
 */
export interface IDocumentLoadingTask {
  promise: Promise<IDocumentProxy>;
  onPassword?: (
    updateCallback: (password: string) => void,
    reason: number,
  ) => void;
  destroy(): void;
}

/**
 * PDF 加载选项
 */
export interface IPdfLoadOptions {
  url: string;
  password?: string;
}

/**
 * 密码响应常量
 */
export interface IPasswordResponses {
  NEED_PASSWORD: number;
  INCORRECT_PASSWORD: number;
}

/**
 * PDF 适配器接口
 * 定义所有 PDF 操作的抽象方法
 */
export interface IPdfAdapter {
  /**
   * 适配器版本标识
   */
  readonly version: 'v2' | 'v5';

  /**
   * 获取密码响应常量
   */
  readonly PasswordResponses: IPasswordResponses;

  /**
   * 初始化适配器
   * 设置 worker 等配置
   */
  init(): void | Promise<void>;

  /**
   * 加载 PDF 文档
   * @param options 加载选项
   * @returns 文档加载任务
   */
  getDocument(options: IPdfLoadOptions): IDocumentLoadingTask;

  /**
   * 获取 TextLayerBuilder 类
   * 用于渲染文本层
   */
  getTextLayerBuilder(): any;

  /**
   * 获取 EventBus 类
   * 用于事件通信
   */
  getEventBus(): any;

  /**
   * 预加载资源
   * 可选实现，用于提前加载 worker 等资源
   */
  preload?(): void;
}

/**
 * PDF 适配器工厂函数类型
 */
export type PdfAdapterFactory = () => Promise<IPdfAdapter>;
