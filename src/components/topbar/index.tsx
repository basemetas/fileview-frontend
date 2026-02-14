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

import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  memo,
} from 'react';
import {
  PrinterOutlined,
  // PlaySquareOutlined,
  FullscreenOutlined,
  SearchOutlined,
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SplitCellsOutlined,
  // ReadOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
  EditOutlined,
  SaveOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Input, Button, message, Dropdown } from 'antd';
import styles from './index.module.scss';
import { log, isMobile } from '@/utils';
import AppContext from '@/context';
import SignTools from './components/sign-tools';
import {
  EventType,
  ToolType,
  defaultBrushOptions,
  defaultTextOptions,
  defaultShapeOptions,
  IMode,
  IDisplayMode,
} from '@/types';

interface TopbarProps {
  maxPages?: number;
  currentPage?: number;
  scale?: number;
  renderType: string;
  pdfDoc?: any | null;
  // eslint-disable-next-line no-unused-vars
  onSearch?: (keyword: string) => void;
  onSearchClose?: () => void;
  onSearchNext?: () => void;
  onSearchPrev?: () => void;
  canSearchNext?: boolean;
  canSearchPrev?: boolean;
  // eslint-disable-next-line no-unused-vars
  onRotate?: (direction: 'left' | 'right') => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  previewUrl?: string;
  displayMode?: IDisplayMode.SinglePage | IDisplayMode.DoublePage;
  // eslint-disable-next-line no-unused-vars
  onDisplayModeChange?: (
    mode: IDisplayMode.SinglePage | IDisplayMode.DoublePage,
  ) => void;
  // isMobile?: boolean;
}

const Topbar = ({
  maxPages = 1,
  renderType = '',
  containerRef,
  previewUrl,
  onSearch,
  onSearchClose,
  onSearchNext,
  onSearchPrev,
  canSearchNext = false,
  canSearchPrev = false,
  onRotate,
  displayMode = IDisplayMode.SinglePage,
  onDisplayModeChange,
  // isMobile = false,
}: TopbarProps) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const { permission, mode = IMode.normal } = useContext(AppContext);

  // 使用 useMemo 缓存 finalPermission，避免每次渲染创建新对象
  const finalPermission = useMemo(
    () => ({
      print: true,
      download: true,
      copy: true,
      search: true,
      fullscreen: true,
      pageLimit: 0,
      rotate: true,
      doublePage: true,
      zoom: true,
      ...permission,
    }),
    [permission],
  );

  useEffect(() => {
    log.debug('权限配置:', finalPermission);
  }, [finalPermission]);

  // 缓存打印函数
  const handlePrint = useCallback(() => {
    if (!previewUrl) {
      message.warning('请等待PDF加载完成');
      return;
    }

    const PRINT_IFRAME_ID = 'pdf-print-iframe';

    // 查找或创建iframe
    let iframe = document.getElementById(PRINT_IFRAME_ID) as HTMLIFrameElement;

    if (!iframe) {
      // 不存在则创建新的
      iframe = document.createElement('iframe');
      iframe.id = PRINT_IFRAME_ID;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    // 设置src并加载
    iframe.src = previewUrl;

    // 等待PDF加载完成后执行打印
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (error) {
          log.error('打印失败:', error);
          message.error('打印失败');
        }
      }, 0);
    };
  }, [previewUrl]);

  // 缓存全屏函数
  const handleFullscreen = useCallback(() => {
    if (!containerRef?.current) return;

    const element = containerRef.current;

    if (!document.fullscreenElement) {
      // 进入全屏
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }, [containerRef]);

  // 缓存下载函数
  const handleDownload = useCallback(() => {
    log.warn('预留功能入口');
  }, []);

  // 缓存切换搜索函数
  const toggleSearch = useCallback(() => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchKeyword('');
    }
  }, [searchVisible]);

  const isOffice = ['pdf', 'cell', 'csv'].includes(renderType);

  // 可打印
  const canPrint = finalPermission.print && renderType === 'pdf' && !isMobile;
  // 可搜索
  const canSearch = finalPermission.search && isOffice;
  // 可下载
  const canDownload = finalPermission.download && isOffice && !isMobile;
  // 可旋转
  const canRotate = finalPermission.rotate && renderType === 'pdf' && !isMobile;
  // 可双页显示
  const canDoublePage =
    finalPermission.doublePage && renderType === 'pdf' && !isMobile;
  // 可全屏
  const canFullscreen =
    finalPermission.fullscreen && renderType === 'pdf' && !isMobile;

  // 监听 Ctrl+F 快捷键
  useEffect(() => {
    if (!canSearch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (!searchVisible) {
          setSearchVisible(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canSearch, searchVisible]);

  // 监听 F11 快捷键
  useEffect(() => {
    if (!canFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 触发全屏播放
      if (e.key === 'F11') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canFullscreen, handleFullscreen]);

  // 监听 Ctrl+P 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P 触发打印或阻止默认行为
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (canPrint) {
          handlePrint();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canPrint, handlePrint]);

  return (
    <>
      <div className={styles.topIconButton}>
        {/* 搜索按钮 */}
        {canSearch && (
          <Button
            title='搜索'
            className={styles.button}
            icon={<SearchOutlined title='搜索' className={styles.icon} />}
            onClick={toggleSearch}
          />
        )}

        {/* 打印按钮 */}
        {canPrint && (
          <Button
            title='打印'
            className={styles.button}
            icon={<PrinterOutlined title='打印' className={styles.icon} />}
            onClick={handlePrint}
          />
        )}

        {/* 全屏播放按钮 */}
        {canFullscreen && (
          <Button
            title='全屏'
            className={styles.button}
            icon={<FullscreenOutlined title='全屏' className={styles.icon} />}
            onClick={handleFullscreen}
          />
        )}

        {/* 下载按钮 */}
        {canDownload && (
          <Button
            title='下载'
            className={styles.button}
            icon={<DownloadOutlined title='下载' className={styles.icon} />}
            onClick={handleDownload}
          />
        )}

        {/* 逆时针旋转按钮 */}
        {canRotate && (
          <Button
            title='逆时针旋转'
            className={styles.button}
            icon={
              <RotateLeftOutlined title='逆时针旋转' className={styles.icon} />
            }
            onClick={() => onRotate?.('left')}
          />
        )}

        {/* 顺时针旋转按钮 */}
        {canRotate && (
          <Button
            title='顺时针旋转'
            className={styles.button}
            icon={
              <RotateRightOutlined title='顺时针旋转' className={styles.icon} />
            }
            onClick={() => onRotate?.('right')}
          />
        )}

        {/* 双页显示按钮 */}
        {canDoublePage && (
          <Button
            title={
              displayMode === IDisplayMode.SinglePage ? '双页显示' : '单页显示'
            }
            className={styles.button}
            icon={
              <SplitCellsOutlined
                title={
                  displayMode === IDisplayMode.SinglePage
                    ? '双页显示'
                    : '单页显示'
                }
                className={styles.icon}
              />
            }
            onClick={() => {
              const newMode =
                displayMode === IDisplayMode.SinglePage
                  ? IDisplayMode.DoublePage
                  : IDisplayMode.SinglePage;
              onDisplayModeChange?.(newMode);
              log.debug(`切换显示模式: ${newMode}`);
            }}
          />
        )}
      </div>

      {/* 搜索输入框 */}
      {searchVisible && (
        <div className={styles.searchBar}>
          <Input
            placeholder='请输入搜索关键词'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => {
              // 如果已有搜索结果且允许跳转下一个，则跳转；否则执行搜索
              if (canSearchNext) {
                onSearchNext?.();
              } else {
                onSearch?.(searchKeyword);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                toggleSearch();
                onSearchClose?.();
              }
            }}
            autoFocus
            className={styles.searchInput}
          />
          <Button
            title='上一个'
            disabled={!canSearchPrev}
            className={styles.button}
            icon={<UpOutlined className={styles.icon} title='上一个' />}
            onClick={() => {
              onSearchPrev?.();
            }}
          />
          <Button
            title='下一个'
            disabled={!canSearchNext}
            className={styles.button}
            icon={<DownOutlined className={styles.icon} title='下一个' />}
            onClick={() => {
              onSearchNext?.();
            }}
          />
          <Button
            title='关闭'
            className={styles.button}
            icon={<CloseOutlined className={styles.icon} title='关闭' />}
            onClick={() => {
              toggleSearch();
              onSearchClose?.();
            }}
          />
        </div>
      )}
    </>
  );
};

export default memo(Topbar);
