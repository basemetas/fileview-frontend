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

// import { log } from '@/utils';

// 单个 text item 的字符映射
interface TextCharMap {
  pageIndex: number;
  itemIndex: number;
  charIndex: number;
  char: string;
}

// 单个高亮块（viewport 空间）
export interface HighlightRect {
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  globalIndex?: number; // 全局索引，用于标识当前匹配
}

// 一次搜索命中
export interface SearchMatch {
  pageIndex: number;
  text: string;
  charMaps: TextCharMap[];
  rects: HighlightRect[];
}

export class SearchController {
  private pdf: any;
  // eslint-disable-next-line no-unused-vars
  private getPage: (pageIndex: number) => Promise<any>;
  // eslint-disable-next-line no-unused-vars
  private getViewport: (pageIndex: number, scale: number) => any;

  private pageTextCache = new Map<number, any>();
  private matches: SearchMatch[] = [];
  private currentIndex = -1;
  private currentRenderScale: number = 1.0; // 当前渲染缩放比例

  constructor(
    pdf: any,
    // eslint-disable-next-line no-unused-vars
    getPage: (pageIndex: number) => Promise<any>,
    // eslint-disable-next-line no-unused-vars
    getViewport: (pageIndex: number, scale: number) => any,
  ) {
    this.pdf = pdf;
    this.getPage = getPage;
    this.getViewport = getViewport;
  }

  /* ---------------- 搜索入口 ---------------- */

  async search(keyword: string): Promise<SearchMatch[]> {
    this.clear();
    if (!keyword) return [];

    const pageCount = this.pdf.numPages;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      await this.searchPage(pageIndex, keyword);
    }

    this.currentIndex = this.matches.length ? 0 : -1;
    return this.matches;
  }

  /* ---------------- 单页搜索 ---------------- */

  private async searchPage(pageIndex: number, keyword: string) {
    const textItems = await this.getPageText(pageIndex);
    if (!textItems.length) return;

    const fullText = textItems.map((i: any) => i.str).join('');
    let index = 0;

    while ((index = fullText.indexOf(keyword, index)) !== -1) {
      const charMaps = this.mapChars(
        pageIndex,
        textItems,
        index,
        keyword.length,
      );

      const rects = this.buildRects(pageIndex, charMaps);
      this.matches.push({
        pageIndex,
        text: keyword,
        charMaps,
        rects,
      });

      index += keyword.length;
    }
  }

  /* ---------------- 文本缓存 ---------------- */

  private async getPageText(pageIndex: number) {
    if (this.pageTextCache.has(pageIndex)) {
      return this.pageTextCache.get(pageIndex);
    }

    const page = await this.getPage(pageIndex);
    const textContent = await page.getTextContent({
      disableCombineTextItems: false,
    });

    this.pageTextCache.set(pageIndex, textContent.items);
    return textContent.items;
  }

  /* ---------------- 字符映射 ---------------- */

  private mapChars(
    pageIndex: number,
    items: any[],
    start: number,
    length: number,
  ): TextCharMap[] {
    const maps: TextCharMap[] = [];
    let offset = 0;

    for (let i = 0; i < items.length; i++) {
      const str = items[i].str;
      for (let j = 0; j < str.length; j++) {
        if (offset >= start && offset < start + length) {
          maps.push({
            pageIndex,
            itemIndex: i,
            charIndex: j,
            char: str[j],
          });
        }
        offset++;
      }
    }

    return maps;
  }

  /* ---------------- Rect 构建 ---------------- */

  private buildRects(
    pageIndex: number,
    charMaps: TextCharMap[],
  ): HighlightRect[] {
    const viewport = this.getViewport(pageIndex, this.currentRenderScale);
    const items = this.pageTextCache.get(pageIndex);

    const rects: HighlightRect[] = [];
    let lastItem = -1;
    let currentRect: HighlightRect | null = null;

    for (const map of charMaps) {
      const item = items[map.itemIndex];
      // eslint-disable-next-line no-unused-vars
      const [_a, _b, _c, _d, e, f] = item.transform;
      const [x, y] = viewport.convertToViewportPoint(e, f);

      const charWidth = (item.width * viewport.scale) / item.str.length;
      const baseHeight = item.height * viewport.scale;
      const lineHeightFactor = 1.3; // 与文本层的 line-height 保持一致
      const actualHeight = baseHeight * lineHeightFactor;

      const left = x + charWidth * map.charIndex;
      const top = y - baseHeight - (actualHeight - baseHeight) * 0.1; // 补偿 top 偏移

      if (map.itemIndex !== lastItem) {
        currentRect = {
          pageIndex,
          left,
          top,
          width: charWidth,
          height: actualHeight,
        };
        rects.push(currentRect);
      } else if (currentRect) {
        currentRect.width += charWidth;
      }

      lastItem = map.itemIndex;
    }

    return rects;
  }

  /* ---------------- 跳转控制 ---------------- */

  next(): SearchMatch | null {
    if (!this.matches.length) return null;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    return this.matches[this.currentIndex];
  }

  prev(): SearchMatch | null {
    if (!this.matches.length) return null;
    this.currentIndex =
      (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    return this.matches[this.currentIndex];
  }

  getCurrent(): SearchMatch | null {
    return this.matches[this.currentIndex] || null;
  }

  getAllMatches(): SearchMatch[] {
    return this.matches;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getMatchCount(): number {
    return this.matches.length;
  }

  /* ---------------- 生命周期 ---------------- */

  clear() {
    this.matches = [];
    this.currentIndex = -1;
  }

  setRenderScale(scale: number) {
    this.currentRenderScale = scale;
  }

  onScaleChange(newRenderScale?: number) {
    if (newRenderScale !== undefined) {
      this.currentRenderScale = newRenderScale;
    }
    // 重新计算 rect，不重新搜索
    this.matches.forEach((m) => {
      m.rects = this.buildRects(m.pageIndex, m.charMaps);
    });
  }
}
