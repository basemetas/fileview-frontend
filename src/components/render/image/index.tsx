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

import React, { useEffect, useRef } from 'react';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import styles from './index.module.scss';
import { renderProps, IMode } from '@/types';
import { useLoading } from '@/hooks/loading';
import { log } from '@/utils';
import Footer from '@/components/footer';

const ImageViewer = (props: renderProps) => {
  const { src, fileName, displayName = '', mode = IMode.normal } = props;
  const { hideLoading, showLoadingError } = useLoading();
  const imgRef = useRef<HTMLImageElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化 Viewer.js
  useEffect(() => {
    if (src) {
      hideLoading();
    } else {
      return showLoadingError(undefined, '文件预览地址不存在');
    }

    if (imgRef.current && !viewerRef.current) {
      viewerRef.current = new Viewer(imgRef.current, {
        // 查看器配置
        title: false,
        toolbar: {
          zoomIn: 1,
          zoomOut: 1,
          oneToOne: 1,
          reset: 1,
          prev: 0,
          play: 0,
          next: 0,
          rotateLeft: 1,
          rotateRight: 1,
          flipHorizontal: 1,
          flipVertical: 1,
        },
        viewed: () => {
          log.debug('图片被查看');
          // 对原图容器应用高斯模糊
          if (containerRef.current) {
            containerRef.current.style.filter = 'blur(20px)';
          }
        },
        hidden: () => {
          // 查看器隐藏时的回调
          // 移除原图容器的高斯模糊
          if (containerRef.current) {
            containerRef.current.style.filter = 'none';
          }
        },
      });
    }

    // 清理函数
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [hideLoading, showLoadingError, src]);

  // 打开查看器
  const openViewer = () => {
    if (viewerRef.current) {
      viewerRef.current.show();
    }
  };

  // 处理图片加载完成
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // 获取原始图片尺寸
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // 设置样式为原始尺寸
    if (naturalWidth > 0 && naturalHeight > 0) {
      // 只设置宽高中较大的那个值，另一个设为auto防止变形
      if (naturalWidth >= naturalHeight) {
        img.style.width = `${naturalWidth}px`;
        img.style.height = 'auto';
      } else {
        img.style.width = 'auto';
        img.style.height = `${naturalHeight}px`;
      }
    } else {
      // SVG 在低版本浏览器中可能无法获取尺寸，设置默认尺寸
      img.style.width = '100%';
      img.style.height = 'auto';
    }
    log.debug('图片加载完成');
  };

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas}>
        <div ref={containerRef} className={styles['image-viewer-container']}>
          <img
            ref={imgRef}
            src={src}
            alt={fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              minWidth: '30%',
              minHeight: '30%',
              width: 'auto',
              height: 'auto',
              cursor: 'pointer',
            }}
            onClick={openViewer}
            onLoad={handleImageLoad}
          />
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
};

export default ImageViewer;
