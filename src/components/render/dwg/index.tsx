/*
 * Copyright (c) 2025 BaseMetas
 *
 * All rights reserved.
 *
 * This software and its source code are proprietary and confidential to
 * BaseMetas. You may not use, copy, modify, distribute, sublicense, or
 * otherwise exploit this software except with the prior written permission
 * of BaseMetas.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Viewer2d } from '@x-viewer/core';
import { renderProps, IMode } from '@/types';
import { useLoading } from '@/hooks/loading';
import styles from './index.module.scss';
import Footer from '@/components/footer';
import { getWebPrefix, isWasmBulkMemorySupported, log } from '@/utils';
const webPrefix = getWebPrefix();

const DwgViewer = (props: renderProps) => {
  const { fileName, displayName = '', src, mode = IMode.normal } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const { hideLoading, showLoadingError } = useLoading();

  const loadModel = useCallback(
    async (url: string) => {
      // Create a 2D viewer
      const viewerCfg = {
        containerId: 'myCanvas',
        enableSpinner: false,
        enableLayoutBar: false,
      };

      const modelCfg = {
        name: displayName || fileName,
        src: url,
      };
      const fontFiles = [
        `${webPrefix}/vendor/x-viewer/fonts/hztxt.shx`,
        `${webPrefix}/vendor/x-viewer/fonts/simplex.shx`,
        `${webPrefix}/fonts/Roboto-LightItalic.ttf`, // 英文字体
        `${webPrefix}/fonts/fangsong.ttf`, // 中文字体
      ];

      const viewer = new Viewer2d(viewerCfg);
      await viewer.setFont(fontFiles);
      await viewer.loadModel(modelCfg, (event) => {
        const progress = (event.loaded * 100) / event.total;
        console.log(`${event.type}: ${progress}%`);
      });
      viewer.goToHomeView();
    },
    [displayName, fileName],
  );

  useEffect(() => {
    // 检测 WASM Bulk Memory Operations 支持（Chrome 75+, Firefox 72+）
    if (!isWasmBulkMemorySupported()) {
      return showLoadingError(
        '文件预览失败',
        '当前浏览器不支持文件预览所需的特性，请升级浏览器版本',
      );
    }
    if (!containerRef.current || viewerRef.current) return; // 防止双初始化

    // const url = 'https://test.moqisoft.com/PC1080.dxf';
    // const url =
    //   'https://test.moqisoft.com/14553569321165-1%20Bed%20apartment%20plan.dwg';
    // const url =
    //   'https://test.moqisoft.com/%E5%AD%97%E4%BD%93%E7%BC%BA%E5%A4%B1.dwg';
    loadModel(src || ('' as string))
      .then(() => hideLoading())
      .catch((error: any) => {
        log.error('DWG 文件预览失败:', error.message);
        showLoadingError('文件预览失败', error.message);
      });
  }, [hideLoading, loadModel, showLoadingError]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas} ref={containerRef} id='myCanvas'></div>
      <Footer {...props} />
    </div>
  );
};

export default DwgViewer;
