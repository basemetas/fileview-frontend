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

import { renderProps, IMode } from '@/types';
import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import styles from './index.module.scss';
import Page from './components/page';
import Siderbar from './components/sidebar';
import Topbar from '@/components/topbar';
import { useLoading } from '@/hooks/loading';
import pdfWorkerUrl from './pdf-worker';
import { Pagination, Select, Button } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import Footer from '@/components/footer';
import PasswordModal from '@/components/password';
import { log, isPhone, isMobile } from '@/utils';
import {
  SearchController,
  SearchMatch,
  HighlightRect,
} from './SearchController';
import AppContext from '@/context';
import { IDisplayMode } from '@/types';
import classNames from 'classnames';

// 设置 PDF.js worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// 扩展 PageInfo 接口以包含文本内容
interface PageInfo {
  pageNum: number;
  viewport: any;
  rendered: boolean;
  canvas?: HTMLCanvasElement;
  textContent?: any; // 使用 any 类型避免类型冲突
}

const PdfViewer = (props: renderProps) => {
  const {
    src,
    fileName,
    displayName = '',
    mode = IMode.normal,
    renderType = '',
    isRoot = true,
  } = props;

  // 页面数限制
  const { permission = {} } = useContext(AppContext);
  const {
    pageLimit = 0,
    zoom: allowZoom = true,
    thumbnail: allowThumbnail = true,
  } = permission;

  const containerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLDivElement>(null); // 指向 .pageCanvas，用于滚轮缩放
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  // 初始缩放比例设为 1.0，后续根据 PDF 实际宽度调整
  const [scale, setScale] = useState<number>(1.0);
  const initialScaleSet = useRef<boolean>(false); // 标记是否已设置初始缩放
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false); // 默认隐藏侧边栏
  const observerRef = useRef<IntersectionObserver | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());
  const renderedPagesRef = useRef<Set<number>>(new Set()); // 记录已成功渲染的页面
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
  const pagesRef = useRef<PageInfo[]>([]); // 使用 ref 存储 pages
  const scaleRef = useRef<number>(1.0); // 锁定渲染时的 scale
  const currentRenderScaleRef = useRef<Map<number, number>>(new Map()); // 记录每个页面渲染时的 scale
  const { showLoading, hideLoading, showLoadingError } = useLoading();
  // const [password, setPassword] = useState<string>('');

  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>(''); // 密码错误提示信息
  const [passwordModalVisible, setPasswordModalVisible] =
    useState<boolean>(false); // 密码弹窗显示状态
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false); // 全屏状态
  const [rotation, setRotation] = useState<number>(0); // 旋转角度
  const [displayMode, setDisplayMode] = useState<
    IDisplayMode.SinglePage | IDisplayMode.DoublePage
  >(IDisplayMode.SinglePage); // 显示模式：单页/双页
  const [autoRotateLandscape] = useState<boolean>(true); // 自动旋转横向页面

  // 搜索相关状态
  const searchControllerRef = useRef<SearchController | null>(null);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [highlightRects, setHighlightRects] = useState<HighlightRect[]>([]);

  // 移动端滚动显示/隐藏 fixedBottom
  const showFixedBottom = false;

  // 等待密码输入，验证密码并发起新的轮询，返回结果
  const waitVerifyPassword = useCallback(() => {
    log.debug('等待密码输入');
    hideLoading();
    setPasswordErrorMsg(''); // 重置错误消息
    setPasswordModalVisible(true); // 显示弹窗
  }, [hideLoading]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange,
      );
      document.removeEventListener(
        'mozfullscreenchange',
        handleFullscreenChange,
      );
      document.removeEventListener(
        'msfullscreenchange',
        handleFullscreenChange,
      );
    };
  }, []);

  // 加载PDF文档
  let pdfInstance: any | null = null;
  const loadPdf = useCallback(
    async (password?: string) => {
      log.debug('Loading PDF...');
      const options = { url: src, password };
      try {
        const loadingTask = pdfjsLib.getDocument(options);

        // pdfjs-dist 2.4.456: 监听密码事件
        loadingTask.onPassword = (
          // eslint-disable-next-line no-unused-vars
          _updatePassword: (password: string) => void,
          reason: number,
        ) => {
          log.debug('onPassword triggered, reason:', reason);

          // 触发密码输入弹窗
          waitVerifyPassword();

          // reason: 1=NEED_PASSWORD, 2=INCORRECT_PASSWORD
          if (reason === 2) {
            log.debug('密码错误');
            setPasswordErrorMsg('密码错误');
          } else if (reason === 1) {
            log.debug('PDF需要密码');
          }

          // 注意: 这里不调用 updatePassword，等待用户输入
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
        pdfInstance = await loadingTask.promise;
        setPdfDoc(pdfInstance);

        // 根据 pageLimit 限制渲染页数
        const totalPages = pdfInstance.numPages;
        const maxPages =
          pageLimit > 0 ? Math.min(pageLimit, totalPages) : totalPages;

        // 预计算页面的viewport信息和文本内容，只处理允许的页数
        const pageInfos: PageInfo[] = [];
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const page = await pdfInstance.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.0 }); // pdfjs-dist 2.x

          // 获取页面文本内容
          let textContent: any | undefined;
          try {
            textContent = await page.getTextContent();
          } catch (error) {
            log.warn(`获取第${pageNum}页文本内容失败:`, error);
          }

          pageInfos.push({
            pageNum,
            viewport,
            rendered: false,
            textContent,
          });
        }
        setPages(pageInfos);
        pagesRef.current = pageInfos; // 同步更新 ref

        // 根据第一页的宽度和容器宽度计算合适的缩放比例
        if (!initialScaleSet.current && pageInfos.length > 0) {
          const containerWidth =
            containerRef.current?.clientWidth || window.innerWidth;
          const firstPageWidth = pageInfos[0].viewport.width;
          // 计算适合容器宽度的缩放比例，留出一些边距（-20px）
          const fitScale = (containerWidth - 20) / firstPageWidth;

          // 单页模式：最大 150%，但不能超出屏幕
          // 移动端：限制在 0.5-2.0 范围
          let initialScale;
          if (isPhone) {
            initialScale = Math.max(0.5, Math.min(fitScale, 2.0));
          } else {
            // PC 端单页：取 fitScale 和 1.5 中的较小值，确保不超出
            initialScale = Math.max(0.5, Math.min(fitScale, 1.5));
          }

          setScale(initialScale);
          scaleRef.current = initialScale;
          initialScaleSet.current = true;
        }

        hideLoading();
      } catch (error: any) {
        // pdfjs-dist 2.4.456: 详细日志分析
        log.debug(
          'Caught error:',
          error,
          'Type:',
          typeof error,
          'Code:',
          error?.code,
          'Name:',
          error?.name,
        );

        // 检查是否是密码错误 (兼容多种格式)
        const isPasswordError =
          error?.name === 'PasswordException' ||
          error?.code === 1 || // NEED_PASSWORD
          error?.code === 2 || // INCORRECT_PASSWORD
          (error?.message &&
            String(error.message).toLowerCase().includes('password'));

        if (isPasswordError) {
          // 触发密码输入弹窗
          waitVerifyPassword();

          // 安全获取 PasswordResponses 常量
          const incorrectCode =
            pdfjsLib.PasswordResponses?.INCORRECT_PASSWORD ?? 2;
          const needCode = pdfjsLib.PasswordResponses?.NEED_PASSWORD ?? 1;

          if (error?.code === incorrectCode) {
            log.debug('密码错误');
            setPasswordErrorMsg('密码错误');
          } else if (error?.code === needCode) {
            log.debug('PDF需要密码');
          } else {
            log.debug('其他密码相关错误');
          }
        } else {
          log.error('PDF加载失败:', error);
          showLoadingError();
        }
      }
    },
    [waitVerifyPassword, showLoading, src, pageLimit, hideLoading],
  );

  // 缓存 handlePasswordSubmit，避免每次渲染创建新函数
  const handlePasswordSubmit = useCallback(
    (password) => {
      log.debug('开始验证密码...');
      setPasswordModalVisible(false);
      // 显示loading状态
      showLoading();

      // 验证密码
      // setPassword(password);
      loadPdf(password);
    },
    [loadPdf, showLoading],
  );

  useEffect(() => {
    if (!src) return;

    loadPdf();

    return () => {
      if (pdfInstance) {
        pdfInstance.destroy();
      }
    };
  }, [loadPdf, pdfInstance, src]); // 移除scale依赖，避免重复加载

  // 初始化搜索控制器
  useEffect(() => {
    if (pdfDoc && pages.length > 0 && !searchControllerRef.current) {
      searchControllerRef.current = new SearchController(
        pdfDoc,
        (pageIndex: number) => pdfDoc.getPage(pageIndex + 1),
        (pageIndex: number, scale: number) => {
          const page = pagesRef.current[pageIndex];
          if (!page) return null;
          return page.viewport.clone({ scale, rotation: 0 });
        },
      );
      // 设置初始 renderScale
      searchControllerRef.current.setRenderScale(scale);
      log.debug('搜索控制器已初始化');
    }
  }, [pdfDoc, pages.length, scale]);

  // 注意: viewport 只在初始加载时计算，scale 变化时不重新计算 viewport
  // 这样可以避免不必要的重复渲染和闪烁问题

  // 同步更新 pagesRef
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  // 渲染页面的函数
  const renderPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc) return;

      // 如果正在渲染，或者已以当前比例渲染过此页面，跳过
      if (renderingRef.current.has(pageNum)) return;

      const renderedScale = currentRenderScaleRef.current.get(pageNum);
      if (
        renderedPagesRef.current.has(pageNum) &&
        renderedScale === scaleRef.current
      )
        return;

      renderingRef.current.add(pageNum);

      try {
        const targetScale = scaleRef.current; // 捕获当前目标缩放比例，防止渲染过程中变化
        // 从 pagesRef 获取最新的 viewport
        const pageInfo = pagesRef.current.find((p) => p.pageNum === pageNum);
        if (!pageInfo) {
          renderingRef.current.delete(pageNum);
          return;
        }

        const page = await pdfDoc.getPage(pageNum);

        // 获取设备像素比
        const pixelRatio = window.devicePixelRatio || 1;

        // 使用捕获的 targetScale 计算 viewport
        const viewport = page.getViewport({ scale: targetScale });

        // 计算高分辨率 canvas 尺寸
        const newWidth = Math.floor(viewport.width * pixelRatio);
        const newHeight = Math.floor(viewport.height * pixelRatio);

        // 1. 创建离屏 canvas 进行渲染，避免直接修改主 canvas 导致闪烁和跳动
        const scratchCanvas = document.createElement('canvas');
        scratchCanvas.width = newWidth;
        scratchCanvas.height = newHeight;
        const scratchContext = scratchCanvas.getContext('2d', {
          alpha: false,
        })!;

        // 2. 在离屏 canvas 上配置并渲染
        // 注意：先填充白色背景，然后使用变换矩阵让 PDF.js 正确渲染
        scratchContext.fillStyle = '#ffffff';
        scratchContext.fillRect(0, 0, newWidth, newHeight);

        // 创建高分辨率的 viewport 用于渲染
        const renderViewport = page.getViewport({
          scale: targetScale * pixelRatio,
        });

        await page.render({
          canvasContext: scratchContext,
          viewport: renderViewport,
        }).promise;

        // 3. 渲染完成后，再替换主 canvas 的内容
        // 只有在渲染成功后才更新 scale 记录
        currentRenderScaleRef.current.set(pageNum, targetScale);

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          log.debug(
            `[页面渲染] 第 ${pageNum} 页 Canvas 尺寸变化`,
            `从 ${canvas.width}x${canvas.height} → ${newWidth}x${newHeight}`,
          );
          canvas.width = newWidth;
          canvas.height = newHeight;
        }

        // 设置 canvas 显示尺寸为 viewport 尺寸（CSS 尺寸）
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const mainContext = canvas.getContext('2d', { alpha: false })!;
        mainContext.drawImage(scratchCanvas, 0, 0);

        // 4. 标记为已渲染并同步状态
        renderedPagesRef.current.add(pageNum);

        // 总是更新页面状态，确保 renderScale 等属性同步到子组件
        setPages((prev) => {
          const pageIndex = prev.findIndex((p) => p.pageNum === pageNum);
          if (pageIndex !== -1) {
            const newPages = [...prev];
            newPages[pageIndex] = {
              ...prev[pageIndex],
              rendered: true,
              canvas,
            };
            return newPages;
          }
          return prev;
        });
      } catch (error) {
        log.error(`渲染页面${pageNum}失败:`, error);
        renderedPagesRef.current.delete(pageNum);
      } finally {
        renderingRef.current.delete(pageNum);
      }
    },
    [pdfDoc],
  );

  // 同步更新 scaleRef
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // 缩放防抖控制
  const scaleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScalingRef = useRef(false); // 标记是否正在缩放
  const scrollDuringScaleRef = useRef(false); // 标记缩放期间是否发生滚动

  // 监听scale变化，触发重新渲染
  useEffect(() => {
    if (!pages.length || !pdfDoc) return;

    // 同步更新 scaleRef
    scaleRef.current = scale;

    // [DEBUG] Scale 变化日志
    log.debug(
      `[Scale 变化] scale: ${scale}`,
      `displayMode: ${displayMode}`,
      `pages.length: ${pages.length}`,
    );

    // 清除之前的防抖计时器
    if (scaleDebounceRef.current) {
      clearTimeout(scaleDebounceRef.current);
    }

    // 标记正在缩放
    isScalingRef.current = true;

    // 使用防抖避免缩放过程中频繁渲染
    scaleDebounceRef.current = setTimeout(() => {
      // 清除缩放标记
      isScalingRef.current = false;

      // 等待 DOM 更新后再触发渲染
      setTimeout(() => {
        requestAnimationFrame(() => {
          const visiblePages =
            containerRef.current?.querySelectorAll('.pdf-page');
          visiblePages?.forEach((pageEl) => {
            const pageNum = parseInt(pageEl.getAttribute('data-page') || '0');
            const canvas = pageEl.querySelector('canvas') as HTMLCanvasElement;
            const rect = pageEl.getBoundingClientRect();
            // 只重渲染可见区域内的页面
            if (canvas && rect.top < window.innerHeight && rect.bottom > 0) {
              renderPage(pageNum, canvas);
            }
          });
        });
      }, 0);
    }, 150); // 减少到150ms，更快响应

    return () => {
      if (scaleDebounceRef.current) {
        clearTimeout(scaleDebounceRef.current);
      }
    };
  }, [scale, renderPage, pages.length, pdfDoc, displayMode]);

  // 设置Intersection Observer
  useEffect(() => {
    if (!pages.length) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 使用节流来避免频繁触发状态更新
    let updateTimeout: ReturnType<typeof setTimeout> | null = null;
    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let scrollStopTimeout: ReturnType<typeof setTimeout> | null = null;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 检测是否正在滚动
        if (scrollTimeout) clearTimeout(scrollTimeout);
        isScrolling = true;
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 150);

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(
              entry.target.getAttribute('data-page') || '0',
            );
            // 使用自定义属性获取 Canvas，避免 querySelector 导致获取到新创建的 Canvas
            const canvas = (entry.target as any).__canvas as HTMLCanvasElement;

            // 缩放过程中标记发生了滚动
            if (isScalingRef.current) {
              scrollDuringScaleRef.current = true;
              return;
            }

            // 只渲染尚未渲染或 scale 已变化的页面
            const renderedScale = currentRenderScaleRef.current.get(pageNum);
            if (
              canvas &&
              (!renderedPagesRef.current.has(pageNum) ||
                renderedScale !== scaleRef.current)
            ) {
              // 滚动时使用 requestIdleCallback 或延迟渲染，避免阻塞
              if (isScrolling) {
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(() => renderPage(pageNum, canvas), {
                    timeout: 500,
                  });
                } else {
                  setTimeout(() => renderPage(pageNum, canvas), 100);
                }
              } else {
                renderPage(pageNum, canvas);
              }
            }
          }
        });

        // 滚动停止后，如果缩放期间发生了滚动，立即重渲染可见页面
        if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
        scrollStopTimeout = setTimeout(() => {
          if (scrollDuringScaleRef.current) {
            scrollDuringScaleRef.current = false;
            requestAnimationFrame(() => {
              const visiblePages =
                containerRef.current?.querySelectorAll('.pdf-page');
              visiblePages?.forEach((pageEl) => {
                const pageNum = parseInt(
                  pageEl.getAttribute('data-page') || '0',
                );
                const canvas = pageEl.querySelector(
                  'canvas',
                ) as HTMLCanvasElement;
                const rect = pageEl.getBoundingClientRect();
                const renderedScale =
                  currentRenderScaleRef.current.get(pageNum);
                // 重渲染可见且scale不匹配的页面
                if (
                  canvas &&
                  rect.top < window.innerHeight &&
                  rect.bottom > 0 &&
                  renderedScale !== scaleRef.current
                ) {
                  renderPage(pageNum, canvas);
                }
              });
            });
          }
        }, 200);

        // 找到当前最可见的页面（用于页码显示）- 使用节流避免频繁更新
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          if (updateTimeout) clearTimeout(updateTimeout);

          updateTimeout = setTimeout(() => {
            let pageNum: number;

            if (displayMode === IDisplayMode.DoublePage) {
              // 双页模式：选择可见范围内页码最大的页面（即当前行的第二个页面）
              const pageNums = visibleEntries
                .map((entry) =>
                  parseInt(entry.target.getAttribute('data-page') || '0'),
                )
                .filter((n) => n > 0);

              if (pageNums.length > 0) {
                pageNum = Math.max(...pageNums);
              } else {
                pageNum = currentPage;
              }
            } else {
              // 单页模式：选择可见比例最高的页面
              const mostVisible = visibleEntries.reduce((prev, current) =>
                current.intersectionRatio > prev.intersectionRatio
                  ? current
                  : prev,
              );
              pageNum = parseInt(
                mostVisible.target.getAttribute('data-page') || '1',
              );
            }

            if (pageNum !== currentPage) {
              setCurrentPage(pageNum);
            }
          }, 150); // 150ms 节流
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75], // 减少阈值数量，降低触发频率
        rootMargin: '500px', // 增加预加载区域到500px，提前渲染上下页面
      },
    );

    // 重新观察所有页面
    setTimeout(() => {
      const pageElements = containerRef.current?.querySelectorAll('.pdf-page');
      pageElements?.forEach((el) => observerRef.current?.observe(el));
    }, 100);

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
      observerRef.current?.disconnect();
    };
  }, [pages, renderPage, currentPage, displayMode]);

  // 处理键盘事件
  useEffect(() => {
    if (!allowZoom) return; // allowZoom 为 false 时不监听

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '0') {
        event.preventDefault();
        // 重置为默认缩放比例
        const currentIsMobile = window.innerWidth <= 768;
        if (pages.length > 0) {
          const scrollContainer = containerRef.current;

          // 记录缩放前的滚动位置
          let scrollRatio = 0.5;
          if (scrollContainer) {
            const oldScrollTop = scrollContainer.scrollTop;
            const oldScrollHeight = scrollContainer.scrollHeight;
            const oldClientHeight = scrollContainer.clientHeight;
            scrollRatio =
              oldScrollHeight > oldClientHeight
                ? (oldScrollTop + oldClientHeight / 2) / oldScrollHeight
                : 0.5;
          }

          const containerW =
            containerRef.current?.clientWidth || window.innerWidth;
          const pageWidth = pages[0].viewport.width;
          const baseWidth =
            displayMode === IDisplayMode.DoublePage
              ? pageWidth * 2 + 20
              : pageWidth;
          const fitScale = (containerW - 40) / baseWidth;

          let resetScale;
          if (currentIsMobile) {
            // 移动端：重置为适配缩放
            resetScale = Math.max(0.5, Math.min(fitScale, 2.0));
          } else {
            // PC 端：单页最大 150%，双页最大 100%
            const maxScale =
              displayMode === IDisplayMode.DoublePage ? 1.0 : 1.5;
            resetScale = Math.max(0.5, Math.min(fitScale, maxScale));
          }

          setScale(resetScale);

          // 恢复滚动位置
          if (scrollContainer) {
            requestAnimationFrame(() => {
              const scrollWidth = scrollContainer.scrollWidth;
              const clientWidth = scrollContainer.clientWidth;
              scrollContainer.scrollLeft = Math.max(
                0,
                (scrollWidth - clientWidth) / 2,
              );

              const newScrollHeight = scrollContainer.scrollHeight;
              const newClientHeight = scrollContainer.clientHeight;
              scrollContainer.scrollTop = Math.max(
                0,
                newScrollHeight * scrollRatio - newClientHeight / 2,
              );
            });
          }
        }
      } else if (event.ctrlKey && (event.key === '=' || event.key === '+')) {
        // Ctrl + = 或 Ctrl + + 放大
        event.preventDefault();
        const scrollContainer = containerRef.current;
        if (scrollContainer) {
          const oldScrollTop = scrollContainer.scrollTop;
          const oldScrollHeight = scrollContainer.scrollHeight;
          const oldClientHeight = scrollContainer.clientHeight;
          const scrollRatio =
            oldScrollHeight > oldClientHeight
              ? (oldScrollTop + oldClientHeight / 2) / oldScrollHeight
              : 0.5;

          const newScale = Math.min(scale * 1.2, 5);
          setScale(newScale);

          requestAnimationFrame(() => {
            const scrollWidth = scrollContainer.scrollWidth;
            const clientWidth = scrollContainer.clientWidth;
            scrollContainer.scrollLeft = Math.max(
              0,
              (scrollWidth - clientWidth) / 2,
            );

            const newScrollHeight = scrollContainer.scrollHeight;
            const newClientHeight = scrollContainer.clientHeight;
            scrollContainer.scrollTop = Math.max(
              0,
              newScrollHeight * scrollRatio - newClientHeight / 2,
            );
          });
        } else {
          setScale(Math.min(scale * 1.2, 5));
        }
      } else if (event.ctrlKey && (event.key === '-' || event.key === '_')) {
        // Ctrl + - 缩小
        event.preventDefault();
        const scrollContainer = containerRef.current;
        if (scrollContainer) {
          const oldScrollTop = scrollContainer.scrollTop;
          const oldScrollHeight = scrollContainer.scrollHeight;
          const oldClientHeight = scrollContainer.clientHeight;
          const scrollRatio =
            oldScrollHeight > oldClientHeight
              ? (oldScrollTop + oldClientHeight / 2) / oldScrollHeight
              : 0.5;

          const newScale = Math.max(scale / 1.2, 0.5);
          setScale(newScale);

          requestAnimationFrame(() => {
            const scrollWidth = scrollContainer.scrollWidth;
            const clientWidth = scrollContainer.clientWidth;
            scrollContainer.scrollLeft = Math.max(
              0,
              (scrollWidth - clientWidth) / 2,
            );

            const newScrollHeight = scrollContainer.scrollHeight;
            const newClientHeight = scrollContainer.clientHeight;
            scrollContainer.scrollTop = Math.max(
              0,
              newScrollHeight * scrollRatio - newClientHeight / 2,
            );
          });
        } else {
          setScale(Math.max(scale / 1.2, 0.5));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pages, scale, displayMode, allowZoom]);

  // 处理滚轮缩放
  useEffect(() => {
    if (!pageCanvasRef.current || !allowZoom) return; // allowZoom 为 false 时不监听

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();

        // 获取实际的滚动容器（pageMainContent）
        const scrollContainer = containerRef.current;
        if (!scrollContainer) return;

        // 记录缩放前的滚动位置
        const oldScrollTop = scrollContainer.scrollTop;
        const oldScrollHeight = scrollContainer.scrollHeight;
        const oldClientHeight = scrollContainer.clientHeight;

        // 计算当前视口中心在内容中的相对位置 (0-1)
        const scrollRatio =
          oldScrollHeight > oldClientHeight
            ? (oldScrollTop + oldClientHeight / 2) / oldScrollHeight
            : 0.5;

        const scaleFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newScale = Math.min(Math.max(scale * scaleFactor, 0.5), 5);

        setScale(newScale);

        // 立即调整滚动位置，使用单次 RAF 减少延迟
        requestAnimationFrame(() => {
          // 水平居中
          const scrollWidth = scrollContainer.scrollWidth;
          const clientWidth = scrollContainer.clientWidth;
          const centerScrollLeft = (scrollWidth - clientWidth) / 2;
          scrollContainer.scrollLeft = Math.max(0, centerScrollLeft);

          // 垂直按相对位置调整
          const newScrollHeight = scrollContainer.scrollHeight;
          const newClientHeight = scrollContainer.clientHeight;
          const newScrollTop =
            newScrollHeight * scrollRatio - newClientHeight / 2;
          scrollContainer.scrollTop = Math.max(0, newScrollTop);
        });
      }
    };

    const canvas = pageCanvasRef.current;
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scale, allowZoom]);

  // 监听屏幕方向变化，使用防抖优化性能
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleOrientationChange = () => {
      // 使用防抖，避免 resize 过于频繁触发重渲染
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // 移动端：重新计算最合适的缩放比
        if (isMobile && pages.length > 0) {
          const containerW =
            containerRef.current?.clientWidth || window.innerWidth;
          const pageWidth = pages[0].viewport.width;
          const baseWidth =
            displayMode === IDisplayMode.DoublePage
              ? pageWidth * 2 + 20
              : pageWidth;
          const fitScale = (containerW - 40) / baseWidth;

          // 移动端：限制在 0.5-2.0 范围
          const newScale = Math.max(0.5, Math.min(fitScale, 2.0));
          setScale(newScale);
          log.debug(`屏幕旋转，自动调整缩放比: ${newScale}`);
        }

        // 触发重新渲染以适应新的屏幕方向
        setPages((prev) => [...prev]);
      }, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [pages, displayMode]);

  // 计算适合页面和适合宽度的缩放比例
  const calculateFitScale = useCallback(
    (
      fitType: 'page' | 'width',
      targetMode?: IDisplayMode.SinglePage | IDisplayMode.DoublePage,
    ) => {
      if (pages.length === 0) return 1.0;
      const realDisplayMode = targetMode || displayMode;
      const containerW = containerRef.current?.clientWidth || window.innerWidth;

      // 在双页模式下，基准宽度应该是两页宽度加上间距
      const pageWidth = pages[0].viewport.width;
      const baseWidth =
        realDisplayMode === IDisplayMode.DoublePage
          ? pageWidth * 2 + 20
          : pageWidth;
      const fitScale = (containerW - 40) / baseWidth;

      if (fitType === 'width') {
        // 适合宽度：直接使用计算出的缩放比例
        return Math.max(0.5, Math.min(fitScale, 5));
      } else {
        // 适合页面：考虑高度，取较小值
        const containerH =
          containerRef.current?.clientHeight || window.innerHeight;
        const pageHeight = pages[0].viewport.height;
        const fitHeightScale = (containerH - 60) / pageHeight;
        return Math.max(0.5, Math.min(Math.min(fitScale, fitHeightScale), 5));
      }
    },
    [pages, displayMode],
  );

  // 处理显示模式切换
  const handleDisplayModeChange = useCallback(
    (realDisplayMode: IDisplayMode.SinglePage | IDisplayMode.DoublePage) => {
      // 保存当前 scale，用于预填充
      const oldScale = scale;

      // [DEBUG] 显示模式切换日志
      log.debug(
        `[模式切换] 从 ${displayMode} 切换到 ${realDisplayMode}`,
        `当前 scale: ${oldScale}`,
      );

      // 1. 切换模式前先清空渲染缓存
      // 因为模式切换会导致 Page 组件及其内部 Canvas 重新挂载，旧的渲染内容会丢失
      renderedPagesRef.current.clear();
      // 用旧 scale 预填充，确保首次缩放时能检测到 scale 变化
      pages.forEach((p) => {
        currentRenderScaleRef.current.set(p.pageNum, oldScale);
      });

      setDisplayMode(realDisplayMode);

      // 2. 切换模式后，立即按照新模式重算比例
      const fitScale = calculateFitScale('width', realDisplayMode);

      // [DEBUG] 模式切换时的 fitScale 计算
      log.debug(
        `[模式切换] 新模式下的 fitScale 计算`,
        `realDisplayMode: ${realDisplayMode}`,
        `fitScale: ${fitScale.toFixed(4)}`,
      );

      let newScale;

      if (realDisplayMode === IDisplayMode.DoublePage) {
        // 双页模式：最大 100%，取 fitScale 和 1.0 中的较小值，确保不超出
        newScale = Math.max(0.5, Math.min(fitScale, 1.0));
      } else {
        // 单页模式：最大 150%，取 fitScale 和 1.5 中的较小值，确保不超出
        newScale = Math.max(0.5, Math.min(fitScale, 1.5));
      }

      setScale(newScale);
      log.debug(`模式切换为 ${realDisplayMode}，应用缩放比例: ${newScale}`);
    },
    [calculateFitScale, scale, pages, displayMode],
  );

  // 处理缩放选择
  const handleScaleChange = useCallback(
    (value: string) => {
      if (value === 'auto') {
        // 自动缩放：根据模式和屏幕分辨率计算
        const currentIsMobile = isPhone;
        if (pages.length > 0) {
          const containerW =
            containerRef.current?.clientWidth || window.innerWidth;
          const pageWidth = pages[0].viewport.width;
          const baseWidth =
            displayMode === IDisplayMode.DoublePage
              ? pageWidth * 2 + 20
              : pageWidth;
          const fitScale = (containerW - 40) / baseWidth;

          if (currentIsMobile) {
            setScale(Math.max(0.5, Math.min(fitScale, 2.0)));
          } else {
            // 单页最大 150%，双页最大 100%
            const maxScale =
              displayMode === IDisplayMode.DoublePage ? 1.0 : 1.5;
            setScale(Math.max(0.5, Math.min(fitScale, maxScale)));
          }
        }
      } else if (value === 'page-fit') {
        // 适合页面
        setScale(calculateFitScale('page'));
      } else if (value === 'width-fit') {
        // 适合宽度
        setScale(calculateFitScale('width'));
      } else {
        // 固定百分比
        setScale(parseFloat(value));
      }
    },
    [pages, calculateFitScale, displayMode],
  );

  // 跳转到指定页面的函数
  const jumpToPage = useCallback(
    (pageNum: number) => {
      if (pageNum < 1 || pageNum > pages.length) {
        log.error(`页码超出范围: ${pageNum}，有效范围: 1-${pages.length}`);
        return;
      }

      const pageElement = pageRefsMap.current.get(pageNum);
      if (pageElement) {
        pageElement.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
        setCurrentPage(pageNum);
        // log.debug(`跳转到第 ${pageNum} 页`);
      }
    },
    [pages.length],
  );

  // 处理旋转
  const handleRotate = useCallback((direction: 'left' | 'right') => {
    setRotation((prev) =>
      direction === 'left' ? (prev - 90 + 360) % 360 : (prev + 90) % 360,
    );
  }, []);

  // 记录上一次匹配的页面索引
  const lastMatchPageRef = useRef<number>(-1);
  const [fixedBottomWidth, setFixedBottomWidth] = useState<number | undefined>(
    undefined,
  ); // 底部容器宽度

  // 滚动到匹配位置
  const scrollToMatch = useCallback(
    (match: SearchMatch) => {
      const scrollContainer = containerRef.current;

      if (!scrollContainer || !match.rects.length) return;

      const targetPageNum = match.pageIndex + 1;
      const isCrossPage =
        lastMatchPageRef.current !== -1 &&
        lastMatchPageRef.current !== match.pageIndex;

      // 更新上一次匹配页面索引
      lastMatchPageRef.current = match.pageIndex;

      // 等待页面渲染后检查可见性并滚动
      setTimeout(
        () => {
          const pageElement = pageRefsMap.current.get(targetPageNum);
          if (!pageElement) {
            // 如果跨页但页面元素未找到，先跳转到页面
            if (isCrossPage) {
              jumpToPage(targetPageNum);
            }
            return;
          }

          const firstRect = match.rects[0];
          const containerRect = scrollContainer.getBoundingClientRect();

          // 计算高亮在页面中的相对位置（考虑 CSS 缩放）
          const baseViewport = pagesRef.current[
            match.pageIndex
          ]?.viewport.clone({ scale: 1.0, rotation: 0 });
          if (!baseViewport) return;

          const renderScale =
            currentRenderScaleRef.current.get(targetPageNum) || scale;
          const cssScale = scale / renderScale;

          // 高亮在页面中的实际像素位置
          const highlightTop = firstRect.top * cssScale;
          const highlightHeight = firstRect.height * cssScale;

          // 计算高亮在视口中的绝对位置
          const pageOffsetTop = pageElement.offsetTop;
          const highlightAbsoluteTop = pageOffsetTop + highlightTop;
          const highlightAbsoluteBottom =
            highlightAbsoluteTop + highlightHeight;

          // 获取当前滚动位置和视口范围
          const scrollTop = scrollContainer.scrollTop;
          const viewportTop = scrollTop;
          const viewportBottom = scrollTop + containerRect.height;

          // 判断高亮是否在可视范围内（留出一定边距）
          const margin = 50; // 上下留出50px边距
          const isVisible =
            highlightAbsoluteTop >= viewportTop + margin &&
            highlightAbsoluteBottom <= viewportBottom - margin;

          // 不可见时必须滚动（包括跨页和同页不可见的情况）
          if (!isVisible) {
            // 计算目标滚动位置：让高亮区域显示在视口中央偏上
            const targetScrollTop =
              highlightAbsoluteTop - containerRect.height / 3;

            scrollContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth',
            });
          }
        },
        isCrossPage ? 150 : 50,
      ); // 跨页需要更长的等待时间
    },
    [jumpToPage, scale],
  );

  // 搜索处理函数
  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!searchControllerRef.current || !keyword) {
        setSearchMatches([]);
        setCurrentSearchIndex(-1);
        setHighlightRects([]);
        return;
      }

      try {
        log.debug('开始搜索:', keyword);
        const matches = await searchControllerRef.current.search(keyword);
        setSearchMatches(matches);

        if (matches.length > 0) {
          setCurrentSearchIndex(0);
          // 为所有高亮矩形添加全局索引
          const allRects = matches.flatMap((m, matchIndex) =>
            m.rects.map((rect) => ({ ...rect, globalIndex: matchIndex })),
          );
          setHighlightRects(allRects);

          // 滚动到第一个匹配
          const firstMatch = matches[0];
          scrollToMatch(firstMatch);

          log.debug(`搜索完成，找到 ${matches.length} 个匹配`);
        } else {
          setCurrentSearchIndex(-1);
          setHighlightRects([]);
          log.debug('未找到匹配结果');
        }
      } catch (error) {
        log.error('搜索失败:', error);
        setSearchMatches([]);
        setCurrentSearchIndex(-1);
        setHighlightRects([]);
      }
    },
    [scrollToMatch],
  );

  // 下一个搜索结果
  const handleSearchNext = useCallback(() => {
    if (!searchControllerRef.current) return;

    const match = searchControllerRef.current.next();
    if (match) {
      const newIndex = searchControllerRef.current.getCurrentIndex();
      setCurrentSearchIndex(newIndex);

      // 滚动到匹配位置
      scrollToMatch(match);

      log.debug(`跳转到下一个匹配: 第${match.pageIndex + 1}页`);
    }
  }, [scrollToMatch]);

  // 上一个搜索结果
  const handleSearchPrev = useCallback(() => {
    if (!searchControllerRef.current) return;

    const match = searchControllerRef.current.prev();
    if (match) {
      const newIndex = searchControllerRef.current.getCurrentIndex();
      setCurrentSearchIndex(newIndex);

      // 滚动到匹配位置
      scrollToMatch(match);

      log.debug(`跳转到上一个匹配: 第${match.pageIndex + 1}页`);
    }
  }, [scrollToMatch]);

  // 关闭搜索
  const handleSearchClose = useCallback(() => {
    if (searchControllerRef.current) {
      searchControllerRef.current.clear();
    }
    setSearchMatches([]);
    setCurrentSearchIndex(-1);
    setHighlightRects([]);
    log.debug('清除搜索结果');
  }, []);

  // 缩放变化时更新高亮区域
  useEffect(() => {
    if (searchControllerRef.current && searchMatches.length > 0) {
      searchControllerRef.current.onScaleChange(scale);
      // 重新添加全局索引
      const allMatches = searchControllerRef.current.getAllMatches();
      const allRects = allMatches.flatMap((m, matchIndex) =>
        m.rects.map((rect) => ({ ...rect, globalIndex: matchIndex })),
      );
      setHighlightRects(allRects);
    }
  }, [scale, searchMatches.length]);

  // 监听 pageMainContent 宽度变化，同步到 fixedBottom
  useEffect(() => {
    const mainContent = containerRef.current;
    if (!mainContent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setFixedBottomWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(mainContent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 暴露 jumpToPage 方法到 window 对象（可选，用于外部调用）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).jumpToPage = jumpToPage;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).jumpToPage;
      }
    };
  }, [jumpToPage]);

  return (
    <>
      <div
        className={styles.pageContainer}
        style={{
          visibility: passwordModalVisible ? 'hidden' : 'visible',
          backgroundColor: isFullscreen ? '#000000' : undefined,
        }}
      >
        {/* normal 和 sign 模式 需要显示 topbar */}
        {[IMode.normal, IMode.sign].includes(mode) && !isFullscreen && (
          <div className={styles.topbar}>
            <div className={styles.topbarLeft}>
              {allowThumbnail && !isPhone && (
                <Button
                  type='text'
                  icon={<MenuOutlined />}
                  onClick={() => {
                    log.debug('切换侧边栏，当前状态:', sidebarVisible);
                    setSidebarVisible(!sidebarVisible);
                  }}
                  className={styles.sidebarToggle}
                  title={sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}
                />
              )}
              <span className={styles.fileName}>{displayName || fileName}</span>
            </div>

            <Topbar
              isRoot={isRoot}
              renderType={renderType}
              maxPages={pages.length}
              currentPage={currentPage}
              scale={scale}
              pdfDoc={pdfDoc}
              containerRef={containerRef}
              previewUrl={src}
              onRotate={handleRotate}
              displayMode={displayMode}
              onDisplayModeChange={handleDisplayModeChange}
              onSearch={handleSearch}
              onSearchClose={handleSearchClose}
              onSearchNext={handleSearchNext}
              onSearchPrev={handleSearchPrev}
              canSearchNext={currentSearchIndex < searchMatches.length - 1}
              canSearchPrev={currentSearchIndex > 0}
            />
          </div>
        )}
        <div className={styles.pageCanvas} ref={pageCanvasRef}>
          {allowThumbnail && (
            <div
              className={styles.pageSidebar}
              style={{ display: sidebarVisible ? 'block' : 'none' }}
            >
              <Siderbar
                pdfDoc={pdfDoc}
                currentPage={currentPage}
                onPageChange={jumpToPage}
                visible={sidebarVisible}
                maxPages={pages.length}
              />
            </div>
          )}

          <div
            className={classNames(styles.pageMainContent)}
            ref={containerRef}
          >
            {pages &&
              pages.length > 0 &&
              (() => {
                if (displayMode === 'single') {
                  return pages.map((pageInfo) => {
                    // 计算原始尺寸
                    const baseViewport = pageInfo.viewport.clone({
                      scale: 1.0,
                      rotation: 0,
                    });
                    const dw = baseViewport.width * scale;
                    const dh = baseViewport.height * scale;

                    // 判断页面是否为横向（宽高比 > 1.2，避免误判正方形页面）
                    const aspectRatio =
                      baseViewport.width / baseViewport.height;
                    const isLandscape = aspectRatio > 1.2;

                    // 判断是否处于 90/270 度旋转状态
                    const is90 = rotation % 180 !== 0;

                    // 计算布局宽高
                    // 如果启用自动旋转横向页面，且当前页面是横向的，且没有手动旋转，则交换宽高
                    let layoutWidth = dw;
                    let layoutHeight = dh;
                    const needsViewportRotation =
                      autoRotateLandscape && isLandscape && rotation === 0;

                    if (needsViewportRotation) {
                      // 交换宽高
                      layoutWidth = dh;
                      layoutHeight = dw;
                    } else if (is90) {
                      // 手动旋转时交换宽高
                      layoutWidth = dh;
                      layoutHeight = dw;
                    }

                    // 变换逻辑：只对手动旋转应用 CSS transform
                    const transform =
                      rotation !== 0 ? `rotate(${rotation}deg)` : '';

                    return (
                      <div
                        key={pageInfo.pageNum}
                        ref={(el) => {
                          if (el) {
                            pageRefsMap.current.set(pageInfo.pageNum, el);
                          } else {
                            pageRefsMap.current.delete(pageInfo.pageNum);
                          }
                        }}
                        data-page={pageInfo.pageNum}
                        style={{
                          width: `${layoutWidth}px`,
                          height: `${layoutHeight}px`,
                          margin: '20px auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'visible',
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            transform: transform || undefined,
                            transformOrigin: 'center center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Page
                            pageInfo={pageInfo}
                            scale={scale}
                            rotation={rotation}
                            needsViewportRotation={needsViewportRotation}
                            isPhone={isPhone}
                            containerWidth={
                              containerRef.current?.clientWidth ||
                              window.innerWidth
                            }
                            pdfDoc={pdfDoc}
                            renderScale={
                              currentRenderScaleRef.current.get(
                                pageInfo.pageNum,
                              ) || scale
                            }
                            highlightRects={highlightRects}
                            currentMatchIndex={currentSearchIndex}
                          />
                        </div>
                      </div>
                    );
                  });
                } else {
                  // 双页模式逻辑：从第一页开始两两并排 [1,2], [3,4]...
                  const rows = [];
                  for (let i = 0; i < pages.length; i += 2) {
                    const pair = [pages[i]];
                    if (i + 1 < pages.length) {
                      pair.push(pages[i + 1]);
                    }
                    rows.push(pair);
                  }

                  return rows.map((row, rowIndex) => {
                    return (
                      <div
                        key={`row-${rowIndex}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          gap: '20px',
                          margin: '20px auto',
                          width: 'max-content',
                          minWidth: '100%',
                        }}
                      >
                        {row.map((pageInfo) => {
                          const baseViewport = pageInfo.viewport.clone({
                            scale: 1.0,
                            rotation: 0,
                          });
                          const dw = baseViewport.width * scale;
                          const dh = baseViewport.height * scale;

                          // 判断页面是否为横向（宽高比 > 1.2）
                          const aspectRatio =
                            baseViewport.width / baseViewport.height;
                          const isLandscape = aspectRatio > 1.2;

                          // 计算布局宽高
                          // 如果启用自动旋转横向页面，且当前页面是横向的，且没有手动旋转，则交换宽高
                          let layoutWidth = dw;
                          let layoutHeight = dh;
                          const needsViewportRotation =
                            autoRotateLandscape &&
                            isLandscape &&
                            rotation === 0;

                          if (needsViewportRotation) {
                            // 交换宽高
                            layoutWidth = dh;
                            layoutHeight = dw;
                          } else if (rotation % 180 !== 0) {
                            // 手动旋转时交换宽高
                            layoutWidth = dh;
                            layoutHeight = dw;
                          }

                          // 变换逻辑：只对手动旋转应用 CSS transform
                          const transform =
                            rotation !== 0 ? `rotate(${rotation}deg)` : '';

                          return (
                            <div
                              key={pageInfo.pageNum}
                              ref={(el) => {
                                if (el) {
                                  pageRefsMap.current.set(pageInfo.pageNum, el);
                                } else {
                                  pageRefsMap.current.delete(pageInfo.pageNum);
                                }
                              }}
                              data-page={pageInfo.pageNum}
                              style={{
                                width: `${layoutWidth}px`,
                                height: `${layoutHeight}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'visible',
                              }}
                            >
                              <div
                                style={{
                                  transform: transform || undefined,
                                  transformOrigin: 'center center',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Page
                                  maxPages={pages.length}
                                  pageInfo={pageInfo}
                                  scale={scale}
                                  rotation={rotation}
                                  needsViewportRotation={needsViewportRotation}
                                  isPhone={isPhone}
                                  containerWidth={
                                    containerRef.current?.clientWidth ||
                                    window.innerWidth
                                  }
                                  pdfDoc={pdfDoc}
                                  renderScale={
                                    currentRenderScaleRef.current.get(
                                      pageInfo.pageNum,
                                    ) || 1.0
                                  }
                                  highlightRects={highlightRects}
                                  currentMatchIndex={currentSearchIndex}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                }
              })()}
            <div
              className={classNames(
                styles.fixedBottom,
                isMobile && styles.fixedBottomMobile,
                isMobile && showFixedBottom && styles.visible,
              )}
              style={{ width: fixedBottomWidth }}
            >
              <div className={styles.box}>
                <Pagination
                  className={styles.pagination}
                  simple
                  current={currentPage}
                  total={pages.length}
                  pageSize={1}
                  onChange={(page) => {
                    if (displayMode === IDisplayMode.DoublePage) {
                      // 双页模式翻页逻辑：前进/后退都以 2 为步长
                      const delta = page - currentPage;
                      const targetPage =
                        delta > 0
                          ? Math.min(currentPage + 2, pages.length)
                          : Math.max(currentPage - 2, 1);
                      jumpToPage(targetPage);
                    } else {
                      jumpToPage(page);
                    }
                  }}
                />
                {allowZoom && !isMobile && (
                  <div className={styles.zoomIcons}>
                    <ZoomOutOutlined
                      className={styles.zoomIcon}
                      onClick={() => {
                        const scrollContainer = containerRef.current;
                        if (scrollContainer) {
                          const oldScrollTop = scrollContainer.scrollTop;
                          const oldScrollHeight = scrollContainer.scrollHeight;
                          const oldClientHeight = scrollContainer.clientHeight;
                          const scrollRatio =
                            oldScrollHeight > oldClientHeight
                              ? (oldScrollTop + oldClientHeight / 2) /
                                oldScrollHeight
                              : 0.5;

                          const newScale = Math.max(scale / 1.2, 0.5);
                          setScale(newScale);

                          requestAnimationFrame(() => {
                            const scrollWidth = scrollContainer.scrollWidth;
                            const clientWidth = scrollContainer.clientWidth;
                            scrollContainer.scrollLeft = Math.max(
                              0,
                              (scrollWidth - clientWidth) / 2,
                            );

                            const newScrollHeight =
                              scrollContainer.scrollHeight;
                            const newClientHeight =
                              scrollContainer.clientHeight;
                            scrollContainer.scrollTop = Math.max(
                              0,
                              newScrollHeight * scrollRatio -
                                newClientHeight / 2,
                            );
                          });
                        } else {
                          setScale(Math.max(scale / 1.2, 0.5));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <Select
                      value={`${Math.round(scale * 100)}%`}
                      onChange={handleScaleChange}
                      style={{ width: 76 }}
                      dropdownMatchSelectWidth={false}
                      listHeight={400}
                      size='small'
                      options={[
                        { label: '自动缩放', value: 'auto' },
                        { label: '适合页面', value: 'page-fit' },
                        { label: '适合宽度', value: 'width-fit' },
                        { label: '50%', value: '0.5' },
                        { label: '75%', value: '0.75' },
                        { label: '100%', value: '1' },
                        { label: '125%', value: '1.25' },
                        { label: '150%', value: '1.5' },
                        { label: '200%', value: '2' },
                        { label: '300%', value: '3' },
                        { label: '400%', value: '4' },
                      ]}
                    />
                    <ZoomInOutlined
                      className={styles.zoomIcon}
                      onClick={() => {
                        const scrollContainer = containerRef.current;
                        if (scrollContainer) {
                          const oldScrollTop = scrollContainer.scrollTop;
                          const oldScrollHeight = scrollContainer.scrollHeight;
                          const oldClientHeight = scrollContainer.clientHeight;
                          const scrollRatio =
                            oldScrollHeight > oldClientHeight
                              ? (oldScrollTop + oldClientHeight / 2) /
                                oldScrollHeight
                              : 0.5;

                          const newScale = Math.min(scale * 1.2, 5);
                          setScale(newScale);

                          requestAnimationFrame(() => {
                            const scrollWidth = scrollContainer.scrollWidth;
                            const clientWidth = scrollContainer.clientWidth;
                            scrollContainer.scrollLeft = Math.max(
                              0,
                              (scrollWidth - clientWidth) / 2,
                            );

                            const newScrollHeight =
                              scrollContainer.scrollHeight;
                            const newClientHeight =
                              scrollContainer.clientHeight;
                            scrollContainer.scrollTop = Math.max(
                              0,
                              newScrollHeight * scrollRatio -
                                newClientHeight / 2,
                            );
                          });
                        } else {
                          setScale(Math.min(scale * 1.2, 5));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <Footer {...props} />
          </div>
        </div>
      </div>
      {/* 密码输入弹窗 */}
      <PasswordModal
        visible={passwordModalVisible}
        onSubmit={handlePasswordSubmit}
        errorMsg={passwordErrorMsg}
      />
    </>
  );
};

export default PdfViewer;
