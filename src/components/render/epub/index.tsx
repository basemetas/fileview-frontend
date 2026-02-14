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

import { useRef, useEffect, useState } from 'react';
import ePub, { Rendition } from 'epubjs';
import { renderProps, IMode } from '@/types';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import Footer from '@/components/footer';
import { log } from '@/utils';

export default function EpubRender(props: renderProps) {
  const { fileName, src, displayName = '', mode = IMode.normal } = props;
  const viewerRef = useRef<HTMLDivElement>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const { hideLoading, showLoadingError } = useLoading();

  // 根据窗口宽度判断是否使用双页模式
  const getSpreadMode = () => {
    const width = window.innerWidth;
    // 宽度小于 1024px 时使用单页，否则自动（可能双页）
    return width < 1024 ? 'none' : 'auto';
  };

  useEffect(() => {
    if (!viewerRef.current || !src) return;

    // 初始化 EPUB 书籍
    const newBook = ePub(src);

    // 在 DOM 元素上渲染书籍
    const newRendition = newBook.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: getSpreadMode(), // 根据窗口宽度设置单页/双页
      flow: 'paginated',
    });

    // TODO: 添加加载失败处理逻辑，目前的 catch 都不会触发
    newBook.ready.then(hideLoading).catch(showLoadingError);
    newBook.opened
      .then(() => log.debug('EPUB 打开成功'))
      .catch((err) => log.error('EPUB 打开失败', err));

    // 显示第一页
    newRendition.display();
    setRendition(newRendition);

    // 获取书籍元数据
    // newBook.loaded.metadata.then((_meta: any) => {
    //   // Metadata 已加载但暂未使用
    // });

    // 监听窗口大小变化，动态调整单页/双页模式
    const handleResize = () => {
      if (newRendition) {
        const newSpread = getSpreadMode();
        newRendition.spread(newSpread);
      }
    };

    // 监听键盘事件，左右方向键翻页
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        // 左方向键：上一页
        event.preventDefault();
        if (newRendition) newRendition.prev();
      } else if (event.key === 'ArrowRight') {
        // 右方向键：下一页
        event.preventDefault();
        if (newRendition) newRendition.next();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (newRendition) {
        newRendition.destroy();
      }
    };
  }, [hideLoading, showLoadingError, src]);

  // 翻页方法
  const nextPage = () => {
    if (rendition) rendition.next();
  };

  const prevPage = () => {
    if (rendition) rendition.prev();
  };

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas}>
        <div className={styles['epub-container']}>
          {/* 内容区域 */}
          <div className={styles['epub-viewer']} ref={viewerRef}></div>

          <div className={styles['epub-controls']}>
            <button onClick={prevPage}>上一页</button>
            <button onClick={nextPage}>下一页</button>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
}
