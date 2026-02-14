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

import { useEffect, useRef, useCallback } from 'react';
import { loadJS } from '@/utils';
import { renderProps, IMode } from '@/types';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import { getFileArrayBuffer } from '@/api';
import Footer from '@/components/footer';
import { getAppContext, log } from '@/utils';
const webPrefix = getAppContext() + '/preview';

export default function XmindRender(props: renderProps) {
  const { src, fileName, displayName = '', mode = IMode.normal } = props;
  const containerRef = useRef(null);
  const { hideLoading, showLoadingError } = useLoading();

  // 加载资源
  const loadExternalResources = async () => {
    return new Promise((resolve) => {
      Promise.all([loadJS(`${webPrefix}/vendor/xmind/xmind-embed-viewer.js`)])
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    });
  };

  const getArrayBuffer = useCallback(async () => {
    if (!src) return;

    return getFileArrayBuffer(src);
  }, [src]);

  const init = useCallback(async () => {
    await loadExternalResources();
    const viewer = new (window as any).XMindEmbedViewer({
      el: containerRef.current,
    });
    viewer.setStyles({
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    });
    viewer.addEventListener('sheets-load', function () {
      hideLoading();
    });
    getArrayBuffer()
      .then(async (file) => {
        viewer.load(file);
        // hideLoading();
      })
      .catch((error) => {
        showLoadingError(undefined, error.message);
        log.error('获取文件内容失败:', error.message);
      });
  }, [getArrayBuffer, hideLoading, showLoadingError]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div
        className={styles.pageCanvas}
        ref={containerRef}
        id='xmind-render'
      ></div>
      <Footer {...props} />
    </div>
  );
}
