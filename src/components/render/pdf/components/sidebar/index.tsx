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

import { useEffect, useRef, useState } from 'react';
import { FileTextOutlined, UnorderedListOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import { log } from '@/utils';

interface SidebarProps {
  pdfDoc: any | null;
  currentPage: number;
  // eslint-disable-next-line no-unused-vars
  onPageChange: (pageNum: number) => void;
  visible: boolean; // 侧边栏是否可见
  maxPages?: number; // 最大页数限制
}

interface OutlineItem {
  title: string;
  dest: any;
  items?: OutlineItem[];
}

const Siderbar = ({
  pdfDoc,
  currentPage,
  onPageChange,
  visible,
  maxPages,
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<'thumbnail' | 'outline'>(
    'thumbnail',
  );
  const [thumbnails, setThumbnails] = useState<Map<number, HTMLCanvasElement>>(
    new Map(),
  );
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const thumbnailsGeneratedRef = useRef<boolean>(false); // 标记缩略图是否已生成
  const lastScrolledPageRef = useRef<number>(0); // 记录上次滚动到的页码

  // 加载文档大纲
  useEffect(() => {
    if (!pdfDoc) {
      // PDF文档变化时，重置缩略图生成标记和滚动记录
      thumbnailsGeneratedRef.current = false;
      lastScrolledPageRef.current = 0;
      setThumbnails(new Map());
      return;
    }

    const loadOutline = async () => {
      try {
        const outlineData = await pdfDoc.getOutline();
        // 根据 maxPages 过滤大纲项
        if (outlineData && maxPages && maxPages > 0) {
          const filterOutlineByPageLimit = async (
            items: any[],
          ): Promise<any[]> => {
            const filtered = [];
            for (const item of items) {
              let pageIndex = -1;
              if (item.dest) {
                try {
                  let dest = item.dest;
                  if (typeof dest === 'string') {
                    dest = await pdfDoc.getDestination(dest);
                  }
                  if (dest && dest[0]) {
                    const pageRef = dest[0];
                    pageIndex = await pdfDoc.getPageIndex(pageRef);
                  }
                } catch (error) {
                  log.warn('解析大纲项页码失败:', error);
                }
              }

              // 只保留在限制范围内的大纲项
              if (pageIndex === -1 || pageIndex < maxPages) {
                const filteredItem = { ...item };
                // 递归过滤子项
                if (item.items && item.items.length > 0) {
                  filteredItem.items = await filterOutlineByPageLimit(
                    item.items,
                  );
                }
                filtered.push(filteredItem);
              }
            }
            return filtered;
          };

          const filteredOutline = await filterOutlineByPageLimit(outlineData);
          setOutline(filteredOutline);
        } else {
          setOutline(outlineData);
        }
      } catch (error) {
        log.warn('该PDF没有文档大纲:', error);
        setOutline(null);
      }
    };

    loadOutline();
  }, [pdfDoc, maxPages]);

  // 生成缩略图（延迟到侧边栏可见且maxPages有效时）
  useEffect(() => {
    if (!pdfDoc) return;
    if (!visible) return; // 侧边栏不可见时不生成
    if (thumbnailsGeneratedRef.current) return; // 已生成过则跳过
    if (maxPages === undefined || maxPages === 0) return; // 等待有效的maxPages

    const generateThumbnails = async () => {
      thumbnailsGeneratedRef.current = true;
      setLoadingThumbnails(true);
      const newThumbnails = new Map<number, HTMLCanvasElement>();

      try {
        const totalPages = maxPages;
        log.debug(`开始生成缩略图... 总页数: ${totalPages}`);
        const batchSize = 5;
        for (let i = 0; i < totalPages; i += batchSize) {
          const batch = [];
          for (let j = i; j < Math.min(i + batchSize, totalPages); j++) {
            const pageNum = j + 1;
            batch.push(
              (async () => {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.3 }); // 缩略图使用小缩放比例

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', { alpha: false })!;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // 渲染缩略图
                await page.render({
                  canvasContext: context,
                  viewport: viewport,
                }).promise;

                return { pageNum, canvas };
              })(),
            );
          }

          // 等待当前批次完成
          const results = await Promise.all(batch);
          results.forEach(({ pageNum, canvas }) => {
            newThumbnails.set(pageNum, canvas);
          });

          // 更新状态以显示已生成的缩略图（渐进式显示）
          setThumbnails(new Map(newThumbnails));

          // 让出主线程，避免长时间阻塞
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        log.debug(`缩略图生成完成，共${newThumbnails.size}页`);
      } catch (error) {
        log.error('生成缩略图失败:', error);
        thumbnailsGeneratedRef.current = false; // 失败时重置标记
      } finally {
        setLoadingThumbnails(false);
      }
    };

    generateThumbnails();
  }, [pdfDoc, visible, maxPages]); // 依赖visible和maxPages

  // 自动滚动到当前页的缩略图（只在页码变化时滚动）
  useEffect(() => {
    // 当页码变化时，更新缩略图滚动位置
    if (currentPage && currentPage !== lastScrolledPageRef.current) {
      lastScrolledPageRef.current = currentPage; // 记录本次页码

      // 只在缩略图标签页激活时才执行实际滚动
      if (activeTab === 'thumbnail') {
        const thumbnailEl = thumbnailRefs.current.get(currentPage);
        if (thumbnailEl) {
          thumbnailEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }
    }
    // 当切换到缩略图标签时，如果当前页码与记录的不一致，需要滚动到正确位置
    else if (activeTab === 'thumbnail' && currentPage) {
      const thumbnailEl = thumbnailRefs.current.get(currentPage);
      if (thumbnailEl) {
        // 使用 instant 行为，避免每次切换都有动画
        thumbnailEl.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
        });
      }
    }
  }, [currentPage, activeTab]);

  // 当侧边栏显示时，自动修正滚动位置
  useEffect(() => {
    if (visible && currentPage) {
      // 延迟执行，等待DOM渲染完成
      setTimeout(() => {
        if (activeTab === 'thumbnail') {
          const thumbnailEl = thumbnailRefs.current.get(currentPage);
          if (thumbnailEl) {
            thumbnailEl.scrollIntoView({
              behavior: 'instant',
              block: 'nearest',
            });
          }
        }
      }, 0);
    }
  }, [visible]);

  // 处理大纲项点击
  const handleOutlineClick = async (item: OutlineItem) => {
    if (!pdfDoc || !item.dest) return;

    try {
      let dest = item.dest;
      if (typeof dest === 'string') {
        dest = await pdfDoc.getDestination(dest);
      }

      if (dest && dest[0]) {
        const pageRef = dest[0];
        const pageIndex = await pdfDoc.getPageIndex(pageRef);
        onPageChange(pageIndex + 1);
      }
    } catch (error) {
      log.error('跳转大纲失败:', error);
    }
  };

  // 渲染大纲项
  const renderOutlineItem = (item: OutlineItem, level: number = 0) => {
    return (
      <div
        key={item.title}
        className={styles.outlineNested}
        style={{ paddingLeft: level * 12 }}
      >
        <div
          className={styles.outlineItem}
          onClick={() => handleOutlineClick(item)}
          title={item.title}
        >
          {item.title}
        </div>
        {item.items &&
          item.items.map((subItem) => renderOutlineItem(subItem, level + 1))}
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${activeTab === 'thumbnail' ? styles.active : ''}`}
          onClick={() => setActiveTab('thumbnail')}
        >
          <FileTextOutlined /> 缩略图
        </div>
        <div
          className={`${styles.tab} ${activeTab === 'outline' ? styles.active : ''}`}
          onClick={() => setActiveTab('outline')}
        >
          <UnorderedListOutlined /> 目录
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'thumbnail' && (
          <div className={styles.thumbnailList}>
            {loadingThumbnails && (
              <div
                style={{ textAlign: 'center', padding: '20px', color: '#999' }}
              >
                加载中...
              </div>
            )}
            {!loadingThumbnails &&
              Array.from(thumbnails.entries()).map(([pageNum, canvas]) => (
                <div
                  key={pageNum}
                  ref={(el) => {
                    if (el) {
                      thumbnailRefs.current.set(pageNum, el);
                    } else {
                      thumbnailRefs.current.delete(pageNum);
                    }
                  }}
                  className={`${styles.thumbnailItem} ${currentPage === pageNum ? styles.active : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  <canvas
                    className={styles.thumbnailCanvas}
                    ref={(canvasEl) => {
                      if (canvasEl && canvas) {
                        const ctx = canvasEl.getContext('2d');
                        if (ctx) {
                          canvasEl.width = canvas.width;
                          canvasEl.height = canvas.height;
                          ctx.drawImage(canvas, 0, 0);
                        }
                      }
                    }}
                  />
                  <div className={styles.thumbnailLabel}>第 {pageNum} 页</div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'outline' && (
          <div className={styles.outlineList}>
            {outline && outline.length > 0 ? (
              outline.map((item) => renderOutlineItem(item, 0))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <UnorderedListOutlined />
                </div>
                <div>此文档没有目录</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Siderbar;
