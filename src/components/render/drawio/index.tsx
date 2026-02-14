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

import { useEffect, useRef, useState, useCallback } from 'react';
import { renderProps, IMode } from '@/types';
import { loadJS } from '@/utils/resourceLoader';
import styles from './index.module.scss';
import { getFileTextContent } from '@/api';
import { useLoading } from '@/hooks/loading';
import Footer from '@/components/footer';
import { getAppContext, log } from '@/utils';
const webPrefix = getAppContext() + '/preview';

let isViewerScriptLoaded = false;

export default function DrawioRender(props: renderProps) {
  const { fileName, src, displayName = '', mode = IMode.normal } = props;
  const { hideLoading, showLoadingError } = useLoading();
  const containerRef = useRef<HTMLDivElement>(null);
  const lightBoxRef = useRef<HTMLDivElement>(null);
  const [xmlContent, setXmlContent] = useState<string>('');
  const isMountedRef = useRef<boolean>(true);
  const isInitializedRef = useRef<boolean>(false);

  /**
   * 步骤1：获取 Drawio XML 文件内容
   * - 支持 .drawio / .xml 格式
   * - 返回纯文本字符串（不是 Buffer）
   */
  const getTextContent = useCallback(async () => {
    if (!src) return;

    return getFileTextContent(src);
  }, [src]);

  /**
   * 步骤2：加载 Drawio Viewer 脚本
   * - 完全本地化：/vendor/drawio/js/viewer-static.min.js
   * - 禁用外部请求：DRAW_MATH_URL = null
   * - 单例模式：全局只加载一次
   */
  const loadViewerScript = async () => {
    if (isViewerScriptLoaded) {
      log.debug('✅ Viewer script already loaded, skipping...');
      return;
    }

    try {
      log.debug('📦 Loading viewer-static.min.js...');

      // ✅ 完全本地化配置：根据实际情况调整
      // MathJax：已本地化到 /vendor/drawio/math/es5
      (window as any).DRAW_MATH_URL = `${webPrefix}/vendor/drawio/math/es5`; // ✅ 本地 MathJax
      (window as any).PROXY_URL = null; // 代理功能禁用（无需本地化）
      (window as any).STYLE_PATH = `${webPrefix}/vendor/drawio/styles`; // 样式资源
      (window as any).SHAPES_PATH = `${webPrefix}/vendor/drawio/shapes`; // 形状库
      (window as any).STENCIL_PATH = `${webPrefix}/vendor/drawio/stencils`; // 模板库
      (window as any).GRAPH_IMAGE_PATH = `${webPrefix}/vendor/drawio/img`; // 图片资源
      (window as any).mxImageBasePath =
        `${webPrefix}/vendor/drawio/mxgraph/images`; // mxGraph 图片
      (window as any).mxBasePath = `${webPrefix}/vendor/drawio/mxgraph/`; // mxGraph 基础路径

      // 加载本地 viewer 脚本
      await loadJS(`${webPrefix}/vendor/drawio/js/viewer-static.min.js`);

      isViewerScriptLoaded = true;
      log.debug('✅ Viewer script loaded successfully');
    } catch (err) {
      isViewerScriptLoaded = false;
      throw new Error('Failed to load viewer script: ' + err);
    }
  };

  /**
   * 步骤3：初始化 Drawio Viewer
   * - 创建 data-mxgraph 元素
   * - 调用 GraphViewer.processElements()
   * - 渲染图表到容器
   */
  const initViewer = useCallback(async () => {
    if (!xmlContent || !isMountedRef.current || !containerRef.current) {
      return;
    }

    if (isInitializedRef.current) {
      log.warn('⚠️ Viewer already initialized, skipping...');
      return;
    }

    try {
      isInitializedRef.current = true;

      log.debug('🚀 Initializing Drawio Viewer...');

      // 加载脚本（单例）
      await loadViewerScript();

      if (!isMountedRef.current) return;

      // 配置 Viewer 参数（无闪烁全屏模式）
      const mxGraphConfig = {
        xml: xmlContent, // ✅ XML 数据
        highlight: '#0066cc', // 高亮颜色
        nav: true, // 启用导航（平移/缩放）
        resize: true, // 启用自适应
        toolbar: '', // ✅ 完全隐藏工具栏
        lightbox: true, // ✅ 启用灯箱模式
        edit: null, // ✅ 禁用编辑功能
        editable: false, // ✅ 禁用编辑
        'auto-fit': true, // ✅ 自动适配容器
        zoom: 1, // ✅ 初始缩放比例
        'lightbox-fit': true, // 立即适配灯箱
        'toolbar-nohide': true, // 工具栏不隐藏
        'toolbar-position': 'inline', // 工具栏位置
        page: 0, // 页面索引
        'check-visible-state': false, // 不检查可见状态
      };

      // HTML 转义函数（防止 XSS）
      const escapeHTML = (str: string): string => {
        const map: Record<string, string> = {
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;',
          '<': '&lt;',
          '>': '&gt;',
        };
        return str.replace(/[&"'<>]/g, (m) => map[m]);
      };

      // 创建 mxgraph 元素
      const dataAttr = escapeHTML(JSON.stringify(mxGraphConfig));
      const html = `<div class="mxgraph" style="display:none;max-width:100%;border:1px solid transparent;" data-mxgraph="${dataAttr}"></div>`;

      // 插入 DOM
      containerRef.current.innerHTML = html;

      if (!isMountedRef.current) return;

      // 延迟触发渲染（确保 DOM 尺寸已计算）
      const GraphViewer = (window as any).GraphViewer;
      if (!GraphViewer?.processElements) {
        throw new Error('GraphViewer not available');
      }

      log.debug('📚 Processing viewer elements...');
      // Chrome 60 兼容：延迟执行以确保容器尺寸已计算
      setTimeout(() => {
        GraphViewer.processElements();
        log.debug('✅ Drawio Viewer initialized successfully');
      }, 100);

      // ✅ 立即触发灯箱模式（无闪烁）
      setTimeout(() => {
        if (!isMountedRef.current) return;

        try {
          // 查找创建的 mxgraph 元素并触发灯箱模式
          const mxGraphElement =
            containerRef.current?.querySelector('.mxgraph');
          if (mxGraphElement) {
            // Chrome 60 兼容：强制触发容器布局计算
            if (lightBoxRef.current) {
              const width = lightBoxRef.current.offsetWidth;
              const height = lightBoxRef.current.offsetHeight;
              log.warn(`Container size: ${width}x${height}`);
            }

            // 创建 GraphViewer 实例并显示灯箱
            const viewer = new GraphViewer(
              containerRef.current,
              mxGraphElement,
            );

            // 显示灯箱模式
            if (typeof viewer.showLightbox === 'function') {
              const editorUi = viewer.showMyLightbox(lightBoxRef.current);
              log.debug('🔄 Lightbox mode triggered successfully');

              // Chrome 60 兼容：lightbox 显示后强制刷新布局
              setTimeout(() => {
                if (lightBoxRef.current && editorUi) {
                  const container = lightBoxRef.current.querySelector(
                    '.geDiagramContainer',
                  ) as HTMLElement;
                  if (container) {
                    // Chrome 60: 强制设置容器尺寸
                    const parentWidth =
                      lightBoxRef.current.offsetWidth || window.innerWidth;
                    const parentHeight =
                      lightBoxRef.current.offsetHeight || window.innerHeight;

                    container.style.width = parentWidth + 'px';
                    container.style.height = parentHeight + 'px';

                    // Chrome 60: 强制设置 graph container 尺寸
                    const graphContainer = editorUi.editor?.graph?.container;
                    if (graphContainer) {
                      graphContainer.style.width = parentWidth + 'px';
                      graphContainer.style.height = parentHeight + 'px';
                    }

                    const svg = container.querySelector('svg');
                    log.warn(
                      `Set geDiagramContainer: ${container.style.width}, SVG: ${svg ? (svg as SVGElement).style.width : 'not found'}`,
                    );

                    // Chrome 60: 等待 SVG 内容渲染完成再触发 fit 按钮
                    setTimeout(() => {
                      try {
                        // 强制刷新 graph view
                        const graph = editorUi.editor?.graph;
                        if (graph && graph.view) {
                          graph.view.validate();
                        }

                        // 模拟点击工具栏的 fit 按钮
                        const fitButton = lightBoxRef.current?.querySelector(
                          'span[title="Fit"]',
                        ) as HTMLElement;
                        if (fitButton) {
                          fitButton.click();
                          log.debug('✅ Fit button clicked');
                        } else {
                          // 降级：手动调用 fit 方法
                          if (editorUi.lightboxFit) {
                            editorUi.lightboxFit();
                          }
                          if (editorUi.chromelessResize) {
                            editorUi.chromelessResize();
                          }
                          log.debug('✅ Fallback: called lightboxFit()');
                        }
                      } catch (e) {
                        log.error('Fit trigger failed:', e);
                      }
                    }, 10);
                  }
                }
              }, 10);

              return;
            } else {
              log.warn('⚠️ viewer.showLightbox not available');
            }
          } else {
            log.warn('⚠️ mxgraph element not found');
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          log.warn('⚠️ Lightbox trigger failed:', errorMessage);
        }
      }, 200);

      log.debug(
        '✅ Drawio Viewer initialized successfully (lightbox will open directly)',
      );
    } catch (error: any) {
      if (!isMountedRef.current) return;

      // 重置标记以便重试
      isInitializedRef.current = false;

      log.error('❌ Viewer initialization failed:', error.message);
      showLoadingError(undefined, error.message);
    }
  }, [showLoadingError, xmlContent]);

  // Effect 1: 加载 XML 文件
  useEffect(() => {
    isMountedRef.current = true;

    if (src) {
      // fetchXmlContent();
      getTextContent()
        .then((text) => {
          hideLoading();
          // 验证 XML 格式
          if (!text.trim().startsWith('<')) {
            showLoadingError(undefined, '无效的 Drawio 文件格式');
            return;
          }

          setXmlContent(text);
        })
        .catch((error) => {
          showLoadingError(undefined, error.message);
          log.error('获取文本内容失败:', error.message);
        });
    }

    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
    };
  }, [getTextContent, hideLoading, showLoadingError, src]);

  // Effect 2: 初始化 Viewer（XML 加载完成后）
  useEffect(() => {
    if (xmlContent && !isInitializedRef.current) {
      initViewer();
    }
  }, [initViewer, xmlContent]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas} ref={lightBoxRef}>
        <div className={styles.drawioBox} ref={containerRef}></div>
      </div>
      <Footer {...props} />
    </div>
  );
}
