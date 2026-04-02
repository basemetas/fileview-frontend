/* eslint-disable no-unused-vars */
/**
 * PDF.js v5 类型声明文件
 * 用于支持 Chrome >= 92 的现代浏览器
 */

declare module 'pdfjs-dist-v5' {
  export const GlobalWorkerOptions: {
    workerSrc: string | false;
  };

  export function getDocument(src: any): PDFDocumentLoadingTask;

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
    onPassword?: (
      updateCallback: (password: string) => void,
      reason: number,
    ) => void;
    destroy(): void;
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): void;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number; rotation?: number }): PDFPageViewport;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }): { promise: Promise<void> };
    getTextContent(params?: {
      disableCombineTextItems?: boolean;
    }): Promise<PDFTextContent>;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
    scale: number;
    rotation: number;
    clone(params?: { scale?: number; rotation?: number }): PDFPageViewport;
    convertToViewportPoint(x: number, y: number): [number, number];
  }

  export interface PDFTextContent {
    items: PDFTextItem[];
    styles: Record<string, PDFTextStyle>;
    lang: string | null;
  }

  export interface PDFTextItem {
    str: string;
    dir: string;
    transform: number[];
    width: number;
    height: number;
    fontName: string;
    hasEOL: boolean;
  }

  export interface PDFTextStyle {
    fontFamily: string;
    ascent: number;
    descent: number;
  }

  export const Util: {
    transform(m1: number[], m2: number[]): number[];
  };

  export const PasswordResponses: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };

  export const VerbosityLevel: {
    ERRORS: number;
    WARNINGS: number;
    INFOS: number;
  };

  export function setVerbosityLevel(level: number): void;
}

declare module 'pdfjs-dist-v5/web/pdf_viewer' {
  export class EventBus {
    constructor();
    on(eventName: string, listener: (...args: any[]) => void): void;
    off(eventName: string, listener: (...args: any[]) => void): void;
    dispatch(eventName: string, data?: any): void;
  }

  export class PDFLinkService {
    constructor(options: { eventBus: EventBus });
    setViewer(viewer: PDFViewer): void;
    setDocument(pdfDocument: any): void;
  }

  export class PDFFindController {
    constructor(options: { eventBus: EventBus; linkService: PDFLinkService });
    executeCommand(command: string, options?: any): void;
  }

  export class PDFViewer {
    constructor(options: {
      container: HTMLElement;
      eventBus: EventBus;
      linkService: PDFLinkService;
      findController?: PDFFindController;
      textLayerMode?: number;
      removePageBorders?: boolean;
    });
    setDocument(pdfDocument: any): void;
    currentScaleValue: string | number;
    currentPageNumber: number;
    pagesCount: number;
    scrollPageIntoView(params: { pageNumber: number }): void;
  }

  export class TextLayerBuilder {
    constructor(options: {
      textLayerDiv: HTMLDivElement;
      pageIndex: number;
      viewport: any;
      enhanceTextSelection?: boolean;
      eventBus?: EventBus;
    });
    setTextContent(textContent: any): void;
    render(): void;
    cancel(): void;
  }
}
