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

/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.less' {
  const content: Record<string, string>;
  export default content;
}

// TGA 图像加载器类型声明
declare module 'tga-js' {
  export default class TgaLoader {
    constructor();
    // eslint-disable-next-line no-unused-vars
    open(url: string, callback: () => void): void;
    getCanvas(): HTMLCanvasElement;
  }
}

// LuckyExcel 模块类型声明（作为 URL 导入）
declare module '*.esm.js' {
  const url: string;
  export default url;
}

// LuckyExcel 特定模块声明
declare module './components/render/cell/luckyexcel.esm.js' {
  const url: string;
  export default url;
}

// PDF.js v5 模块类型声明（动态加载）
// 使用通配符声明以支持动态路径
declare module '**/pdfjs-v5/pdf.js' {
  export const GlobalWorkerOptions: {
    workerSrc: string | false;
  };
  // eslint-disable-next-line no-unused-vars
  export function getDocument(src: any): any;
  export const PasswordResponses: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };
}

declare module '**/pdfjs-v5/pdf_viewer.js' {
  export class TextLayerBuilder {
    // eslint-disable-next-line no-unused-vars
    constructor(options: {
      textLayerDiv: HTMLDivElement;
      pageIndex: number;
      viewport: any;
      enhanceTextSelection?: boolean;
      eventBus?: any;
    });
    // eslint-disable-next-line no-unused-vars
    setTextContent(textContent: any): void;
    render(): void;
    cancel(): void;
  }
  export class EventBus {
    constructor();
    // eslint-disable-next-line no-unused-vars
    on(eventName: string, listener: (...args: any[]) => void): void;
    // eslint-disable-next-line no-unused-vars
    off(eventName: string, listener: (...args: any[]) => void): void;
    // eslint-disable-next-line no-unused-vars
    dispatch(eventName: string, data?: any): void;
  }
}
