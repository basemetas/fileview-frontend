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

import { useRef, useEffect, useContext, Suspense, useState } from 'react';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';
import styles from './index.module.scss';
import WaterMarker from '@/components/watermarker';

import { log } from '@/utils';
import AppContext from '@/context';
import { EventType, IMode } from '@/types';

// 高亮矩形接口
interface HighlightRect {
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  globalIndex?: number; // 全局索引，用于标识当前匹配
}

interface TextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

interface TextContent {
  items: TextItem[];
  styles: any;
  lang: string | null;
}

interface PageInfo {
  pageNum: number;
  viewport: any;
  rendered: boolean;
  canvas?: HTMLCanvasElement;
  textContent?: TextContent;
}

interface PageComponentProps {
  maxPages?: number;
  pageInfo: PageInfo;
  scale: number;
  rotation?: number;
  isPhone: boolean;
  isPortrait?: boolean;
  containerWidth: number;
  pdfDoc: any | null;
  renderScale?: number; // 当前 canvas 渲染时的 scale
  highlightRects?: HighlightRect[]; // 搜索高亮区域
  currentMatchIndex?: number; // 当前匹配的全局索引
}

const Page = (props: PageComponentProps) => {
  const {
    maxPages,
    pageInfo,
    scale,
    isPhone,
    renderScale = 1.0,
    pdfDoc,
    highlightRects = [],
    currentMatchIndex = -1,
  } = props;
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const textLayerBuilderRef = useRef<any>(null);

  const {
    permission,
    watermark,
    mode = IMode.normal,
  } = useContext(AppContext);
  const finalPermission = {
    print: true,
    download: true,
    copy: true,
    search: true,
    fullscreen: true,
    ...permission,
  };

  // 过滤当前页面的高亮区域
  const pageHighlights = highlightRects.filter(
    (rect) => rect.pageIndex === pageInfo.pageNum - 1,
  );

  // 使用 TextLayerBuilder 渲染文字层
  useEffect(() => {
    // 如果不允许复制,不渲染文字层
    if (!finalPermission.copy) {
      return;
    }

    if (
      !textLayerRef.current ||
      !pageInfo.textContent ||
      !pdfDoc ||
      !pageInfo.rendered
    ) {
      return;
    }

    // 保存当前的文本选中状态（基于文本内容和索引）
    const selection = window.getSelection();
    let savedSelectionData: {
      text: string;
      startIndex: number;
      endIndex: number;
    } | null = null;

    if (selection && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);

        // 检查是否为跨页选中：起始和结束节点是否都在当前页面内
        const isWithinCurrentPage =
          textLayerRef.current.contains(range.startContainer) &&
          textLayerRef.current.contains(range.endContainer);

        if (isWithinCurrentPage) {
          const selectedText = selection.toString();
          if (selectedText) {
            // 计算选中文本在整个文本层中的起始和结束索引
            const preRange = document.createRange();
            preRange.selectNodeContents(textLayerRef.current);
            preRange.setEnd(range.startContainer, range.startOffset);
            const startIndex = preRange.toString().length;
            const endIndex = startIndex + selectedText.length;

            savedSelectionData = {
              text: selectedText,
              startIndex,
              endIndex,
            };
          }
        } else {
          // 跨页选中，主动清除选中状态，避免重渲染后产生错误选区
          const hasPartialSelection =
            textLayerRef.current.contains(range.startContainer) ||
            textLayerRef.current.contains(range.endContainer);

          if (hasPartialSelection) {
            selection.removeAllRanges();
            log.debug(`第${pageInfo.pageNum}页检测到跨页选中，已清除选中状态`);
          }
        }
      } catch (error) {
        log.warn('保存文本选中状态失败:', error);
      }
    }

    // 清空之前的内容
    textLayerRef.current.innerHTML = '';

    // 计算文字层专用的 Viewport (始终 0 旋转，基于当前 renderScale)
    const textViewport = pageInfo.viewport.clone({
      scale: renderScale,
      rotation: 0,
    });

    try {
      // 从 pdfjs-dist/web/pdf_viewer 获取 TextLayerBuilder 和 EventBus
      const TextLayerBuilder = (pdfjsViewer as any).TextLayerBuilder;
      const EventBus = (pdfjsViewer as any).EventBus;

      if (!TextLayerBuilder) {
        log.warn('TextLayerBuilder 不可用');
        return;
      }

      // 创建独立的 EventBus 实例（消除警告）
      const eventBus = EventBus ? new EventBus() : undefined;

      // 创建 TextLayerBuilder 实例
      textLayerBuilderRef.current = new TextLayerBuilder({
        textLayerDiv: textLayerRef.current,
        pageIndex: pageInfo.pageNum - 1,
        viewport: textViewport,
        enhanceTextSelection: true,
        eventBus: eventBus,
      });

      // 设置文本内容并渲染
      textLayerBuilderRef.current.setTextContent(pageInfo.textContent);
      textLayerBuilderRef.current.render();

      // 渲染完成后,调整所有 span 的样式以确保选中高度正确
      setTimeout(() => {
        if (textLayerRef.current) {
          const spans = textLayerRef.current.querySelectorAll('span');
          spans.forEach((span: HTMLElement) => {
            // 获取当前 fontSize
            const computedStyle = window.getComputedStyle(span);
            const fontSize = parseFloat(computedStyle.fontSize);

            // 设置 line-height 为 fontSize 的 1.5 倍,确保选中背景完整覆盖
            span.style.lineHeight = `${fontSize * 1.5}px`;
            // 调整 top 位置补偿 line-height 增加的高度
            const currentTop = parseFloat(span.style.top || '0');
            span.style.top = `${currentTop - fontSize * 0.2}px`;
          });

          // 恢复文本选中状态
          if (savedSelectionData && savedSelectionData.text) {
            try {
              const selection = window.getSelection();
              if (selection && textLayerRef.current) {
                // 获取整个文本层的文本内容
                const fullText = textLayerRef.current.textContent || '';

                // 验证选中文本是否匹配
                const extractedText = fullText.substring(
                  savedSelectionData.startIndex,
                  savedSelectionData.endIndex,
                );

                if (extractedText === savedSelectionData.text) {
                  // 创建一个 TreeWalker 来遍历所有文本节点
                  const walker = document.createTreeWalker(
                    textLayerRef.current,
                    NodeFilter.SHOW_TEXT,
                    null,
                  );

                  let currentIndex = 0;
                  let startNode: Node | null = null;
                  let startOffset = 0;
                  let endNode: Node | null = null;
                  let endOffset = 0;

                  let node: Node | null;
                  while ((node = walker.nextNode())) {
                    const nodeLength = node.textContent?.length || 0;

                    // 找到起始节点
                    if (
                      !startNode &&
                      currentIndex + nodeLength > savedSelectionData.startIndex
                    ) {
                      startNode = node;
                      startOffset =
                        savedSelectionData.startIndex - currentIndex;
                    }

                    // 找到结束节点
                    if (
                      !endNode &&
                      currentIndex + nodeLength >= savedSelectionData.endIndex
                    ) {
                      endNode = node;
                      endOffset = savedSelectionData.endIndex - currentIndex;
                      break;
                    }

                    currentIndex += nodeLength;
                  }

                  if (startNode && endNode) {
                    const range = document.createRange();
                    range.setStart(startNode, startOffset);
                    range.setEnd(endNode, endOffset);

                    selection.removeAllRanges();
                    selection.addRange(range);
                    log.debug(`恢复文本选中: 第${pageInfo.pageNum}页`);
                  }
                }
              }
            } catch (error) {
              log.warn('恢复文本选中失败:', error);
            }
          }
        }
      }, 0);

      log.debug(`TextLayerBuilder 渲染完成: 第${pageInfo.pageNum}页`);
    } catch (error) {
      log.error('TextLayerBuilder 渲染失败:', error);
    }

    return () => {
      // 清理
      if (textLayerBuilderRef.current?.cancel) {
        textLayerBuilderRef.current.cancel();
      }
    };
  }, [
    pageInfo.textContent,
    pageInfo.rendered,
    pageInfo.pageNum,
    renderScale,
    pageInfo.viewport,
    pdfDoc,
    finalPermission.copy,
  ]);

  // 计算 0 旋转下的尺寸
  const baseViewport = pageInfo.viewport.clone({ scale: 1.0, rotation: 0 });
  const displayWidth = baseViewport.width * scale;
  const displayHeight = baseViewport.height * scale;

  const renderWidth = baseViewport.width * renderScale;
  const renderHeight = baseViewport.height * renderScale;

  // 容器始终基于 0 旋转尺寸
  const finalWidth = displayWidth;
  const finalHeight = displayHeight;

  // 计算 CSS 缩放比例：当前 scale / 渲染时的 scale
  const cssScale = scale / renderScale;

  // 将 Canvas ref 暴露给父组件，供 IntersectionObserver 使用
  useEffect(() => {
    if (canvasRef.current && pageRef.current) {
      // 将 canvas 存储在 pageRef 的自定义属性中
      (pageRef.current as any).__canvas = canvasRef.current;
    }
  }, []);

  return (
    <div
      ref={pageRef}
      className='pdf-page'
      data-page={pageInfo.pageNum}
      style={{
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
        margin: '0 auto', // 移除外层 margin，由父容器控制
        position: 'relative',
        backgroundColor: 'white',
        boxShadow: isPhone
          ? '0 1px 5px rgba(0,0,0,0.1)'
          : '0 2px 10px rgba(0,0,0,0.1)',
        boxSizing: 'content-box',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          transform: `scale(${cssScale})`,
          transformOrigin: 'top left',
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
        }}
      />

      {/* 搜索高亮层 - 只在页面渲染完成后显示 */}
      {pageInfo.rendered && pageHighlights.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${renderWidth}px`,
            height: `${renderHeight}px`,
            transform: `scale(${cssScale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        >
          {pageHighlights.map((rect, index) => {
            // 通过全局索引判断是否为当前匹配
            const isCurrent = rect.globalIndex === currentMatchIndex;

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${rect.left}px`,
                  top: `${rect.top}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backgroundColor: isCurrent
                    ? 'rgba(255, 140, 0, 0.5)' // 当前匹配：橙色
                    : 'rgba(255, 255, 0, 0.3)', // 其他匹配：黄色
                  border: isCurrent
                    ? '2px solid rgba(255, 100, 0, 0.9)' // 当前匹配：深橙色边框
                    : '1px solid rgba(255, 200, 0, 0.8)', // 其他匹配：浅黄色边框
                  boxShadow: isCurrent
                    ? '0 0 8px rgba(255, 140, 0, 0.6)'
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            );
          })}
        </div>
      )}

      {/* 文字层 - 使用 TextLayerBuilder */}
      {finalPermission.copy && (
        <div
          ref={textLayerRef}
          className={`${styles.textLayer} textLayer`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${renderWidth}px`,
            height: `${renderHeight}px`,
            transform: `scale(${cssScale})`,
            transformOrigin: 'top left',
            pointerEvents: 'auto',
            zIndex: 10,
            overflow: 'hidden',
          }}
        />
      )}

      {/* 覆盖层，水印等 */}
      {watermark.value && (
        <WaterMarker pageWidth={finalWidth} pageHeight={finalHeight} />
      )}

      {/* 加载中覆盖层 */}
      {!pageInfo.rendered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pageInfo.rendered ? 'transparent' : '#f8f9fa',
            color: '#6c757d',
            fontSize: isPhone ? '12px' : '14px',
            border: pageInfo.rendered ? 'none' : '1px dashed #dee2e6',
            opacity: pageInfo.rendered ? 0 : 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            zIndex: 2000,
          }}
        >
          {!pageInfo.rendered && `第 ${pageInfo.pageNum} 页 - 加载中...`}
        </div>
      )}
    </div>
  );
};

export default Page;
