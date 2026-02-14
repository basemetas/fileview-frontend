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

import { useEffect, useRef } from 'react';
import { DxfViewer } from 'dxf-viewer';
import { renderProps, IMode } from '@/types';
import { setViewerBackground, setViewerLineColor } from './viewerUtils';
import { useLoading } from '@/hooks/loading';
import styles from './index.module.scss';
import Footer from '@/components/footer';
import { getAppContext, log } from '@/utils';
const webPrefix = getAppContext() + '/preview';

const CadViewer = (props: renderProps) => {
  const { fileName, src, displayName = '', mode = IMode.normal } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const { hideLoading, showLoadingError } = useLoading();

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return; // 防止双初始化
    const width = 1200;
    const height = 800;
    // 构造 Viewer
    viewerRef.current = new DxfViewer(containerRef.current, {
      canvasWidth: width,
      canvasHeight: height,
      autoResize: true,
    });

    // 白色背景
    setViewerBackground(viewerRef.current, 0xffffff);

    // 配置字体数组 - DxfViewer只支持TTF文件URL，不支持系统字体名
    // fonts是懒加载的，只在遇到对应字符时才下载，不会一次性加载所有字体
    const fonts = [
      `${webPrefix}/fonts/Roboto-LightItalic.ttf`, // 英文字体
      `${webPrefix}/fonts/fangsong.ttf`, // 中文字体
    ];

    // 加载 DXF 文件，使用官方示例的字体配置
    viewerRef.current
      .Load({
        url: src || '',
        // 使用从官方示例复制的字体文件
        fonts: fonts,
      })
      .then(() => {
        hideLoading();
        // log.debug(viewerRef.current);
        // 自动缩放填充容器
        if (viewerRef.current?.ZoomToFit) {
          viewerRef.current.ZoomToFit();
        }
        // 黑色线条
        setViewerLineColor(viewerRef.current, 0x000000);
      })
      .catch((error: any) => {
        // log.error('DXF 加载失败:', error);
        showLoadingError('文件预览失败', error.message);
        log.error('文件预览失败:', error.message);
      });

    // 卸载清理
    return () => {
      if (viewerRef.current?.dispose) viewerRef.current.dispose();
    };
  }, [hideLoading, showLoadingError, src]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas} ref={containerRef}></div>
      <Footer {...props} />
    </div>
  );
};

export default CadViewer;
