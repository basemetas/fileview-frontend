/* eslint-disable no-unused-vars */
declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: {
    workerSrc: string | false;
  };

  export function getDocument(src: any): any;

  export interface PDFPageProxy {
    getViewport(params: { scale: number; rotation?: number }): any;
    render(params: any): any;
    getTextContent(): Promise<any>;
  }

  export const Util: {
    transform(m1: number[], m2: number[]): number[];
  };

  export const PasswordResponses: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };
}

declare module 'pdfjs-dist/web/pdf_viewer' {
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
