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
import { renderProps, IMode } from '@/types';
import { loadJS, loadCSS } from '@/utils';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import { getAppContext, log } from '@/utils';
import Papa from 'papaparse';
// @ts-ignore - jschardet 没有类型定义
import jschardet from 'jschardet';
// @ts-ignore - luckyexcel.esm.js 没有类型定义
import LuckyExcelModule from './luckyexcel.esm.js';
const webPrefix = getAppContext() + '/preview';
// 声明 luckysheet 全局变量
declare const luckysheet: any;
import WaterMarker from '@/components/watermarker';
import Topbar from '@/components/topbar';

export default function CellRender(props: renderProps) {
  const {
    fileName,
    src,
    displayName = '',
    mode = IMode.normal,
    renderType = '',
  } = props;
  const containerRef = useRef(null);
  const { hideLoading } = useLoading();

  const isCsv =
    fileName?.toLocaleLowerCase().endsWith('.csv') ||
    src?.toLocaleLowerCase().endsWith('.csv');

  // 处理 CSV 文件
  const handleCsv = async (url: string) => {
    try {
      const resp = await fetch(url, { credentials: 'omit' });
      if (!resp.ok) {
        log.error('Fetch failed:', resp.status, resp.statusText);
        hideLoading();
        return;
      }

      const buf = await resp.arrayBuffer();

      // 1. 取前 1KB 做采样
      const sampleBytes = new Uint8Array(buf, 0, 1024);

      // ⚡ 关键：先用 latin1 解码为单字节字符串
      const sampleStr = new TextDecoder('latin1').decode(sampleBytes);

      // 2. jschardet 检测
      let detect = jschardet.detect(sampleStr);
      let encoding = 'utf-8'; // 默认
      if (detect.encoding) {
        encoding = detect.encoding.toLowerCase();
        if (encoding === 'gb2312') encoding = 'gbk'; // 常见别名修正
      }
      log.debug('检测到编码:', encoding);

      // 3. 用真实编码解码整个文件
      const decoder = new TextDecoder(encoding);
      const csvText = decoder.decode(buf);

      // 解析 CSV
      const result = Papa.parse(csvText, { skipEmptyLines: true });
      const rows = result.data; // 二维数组

      // 转换为 celldata
      const celldata = [];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < (rows[r] as any[]).length; c++) {
          celldata.push({
            r,
            c,
            v: (rows[r] as any[])[c], // 单元格的值
          });
        }
      }

      const exportJson = [
        {
          celldata,
          row: rows.length,
          column: (rows[0] as any[]).length,
        },
      ];

      log.debug('CSV parsed successfully in main thread');
      createLuckysheet(exportJson, true);
      hideLoading();
    } catch (error) {
      log.error('Failed to parse CSV:', error);
      hideLoading();
    }
  };

  // 处理 Excel 文件
  const handleExcel = async (url: string) => {
    try {
      // LuckyExcelModule 已经是默认导出，使用 as any 忽略类型检查
      const LuckyExcel = LuckyExcelModule as any;

      const resp = await fetch(url, { credentials: 'omit' });
      if (!resp.ok) {
        log.error('Fetch failed:', resp.status, resp.statusText);
        hideLoading();
        return;
      }

      const ab = await resp.arrayBuffer();
      const data = new Uint8Array(ab);

      LuckyExcel.transformExcelToLucky(data, (exportJson: any) => {
        log.debug('Excel parsed successfully in main thread');
        createLuckysheet(exportJson, false);
        hideLoading();
      });
    } catch (error) {
      log.error('Failed to parse Excel:', error);
      hideLoading();
    }
  };
  const loadExternalResources = async () => {
    return new Promise((resolve) => {
      Promise.all([
        loadCSS(`${webPrefix}/vendor/luckysheet/luckysheet.css`),
        loadCSS(`${webPrefix}/vendor/luckysheet/iconfont.css`),
        loadJS(`${webPrefix}/vendor/jquery/jquery-3.6.0.min.js`),
      ])
        .then(() => {
          Promise.all([
            loadJS(`${webPrefix}/vendor/jquery/jquery.mousewheel.min.js`),
            loadJS(`${webPrefix}/vendor/luckysheet/luckysheet.umd.js`),
          ])
            .then(() => {
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
        })
        .catch(() => {
          resolve(false);
        });
    });
  };

  // 加载资源
  const createLuckysheet = (exportJson: any, isCsv: boolean) => {
    luckysheet.create({
      container: 'luckysheet', // luckysheet is the container id
      data: !isCsv ? exportJson.sheets : exportJson,
      // title: exportJson.info.name,

      // --- UI 隐藏 ---
      showinfobar: false, // 隐藏顶部信息栏
      showtoolbar: false, // 隐藏工具栏
      showtoolbarConfig: {
        findAndReplace: false, // 禁用查找替换功能
      },
      showstatisticBar: false, // 隐藏底部统计信息栏
      sheetFormulaBar: false, // 隐藏公式栏
      functionButton: '', // 隐藏"更多"按钮
      userInfo: false, // 不显示用户信息

      // --- 禁止交互 ---
      allowCopy: false, // 禁止复制
      allowEdit: false, // 禁止编辑
      allowUpdate: false, // 禁止修改（含粘贴）
      enableAddRow: false, // 禁止新增行
      enableAddCol: false, // 禁止新增列
      enableSheetSwitch: false, // 禁止切换/新增 sheet
      enablePage: true, // 禁止分页

      // --- 禁止右键菜单 ---
      showRightClickMenu: false, // 禁止右键菜单
      cellRightClickConfig: {
        copy: false,
        copyAs: false,
        paste: false,
        insertRow: false,
        insertColumn: false,
        deleteRow: false,
        deleteColumn: false,
        deleteCell: false,
        hideRow: false,
        hideColumn: false,
        rowHeight: false,
        columnWidth: false,
        clear: false,
        matrix: false,
        sort: false,
        filter: false,
        chart: false,
        image: false,
        link: false,
      },

      // --- 禁止 sheet 相关操作 ---
      sheetRightClickConfig: {
        delete: false, // 删除
        copy: false, // 复制
        rename: false, //重命名
        color: false, //更改颜色
        hide: false, //隐藏，取消隐藏
        move: false, //向左移，向右移
      },
      showsheetbarConfig: {
        add: false, //新增sheet
        menu: isCsv ? false : true, //sheet管理菜单
        sheet: isCsv ? false : true, //sheet页显示
      },

      // --- 禁止排序筛选 ---
      enableSort: false, // 禁止排序
      enableFilter: false, // 禁止筛选

      // --- 表头设置 ---
      rowHeaderWidth: 46, // 行号列宽度
      columnHeaderHeight: 20, // 列号行高度
    });
  };

  // 搜索功能
  type CellKey = string;
  interface HighlightCache {
    bg: string | null;
  }
  const highlightCache = useRef(new Map<CellKey, HighlightCache>());
  function cellKey(row: number, col: number, sheet?: number) {
    const s = sheet ?? luckysheet.getSheet()?.index;
    return `${s}:${row}:${col}`;
  }
  function highlightCell(row: number, col: number, bg = '#FFE58F') {
    const key = cellKey(row, col);
    const currentSheet = luckysheet.getSheet();
    if (!currentSheet || !currentSheet.data || !currentSheet.data[row]) return;

    const cell = currentSheet.data[row][col];
    if (!highlightCache.current.has(key)) {
      highlightCache.current.set(key, {
        bg: cell?.bg ?? null,
      });
    }

    if (!cell) {
      currentSheet.data[row][col] = { bg };
    } else {
      cell.bg = bg;
    }
    luckysheet.refresh();
  }
  function clearAllHighlights() {
    for (const [key, cache] of highlightCache.current.entries()) {
      const [, row, col] = key.split(':').map(Number);
      const currentSheet = luckysheet.getSheet();
      if (currentSheet && currentSheet.data && currentSheet.data[row]) {
        const cell = currentSheet.data[row][col];
        if (cell) {
          cell.bg = cache.bg;
        }
      }
    }
    highlightCache.current.clear();
    luckysheet.refresh();
  }
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchIndex, setSearchIndex] = useState<number>(0);
  const highlight = (index: number, rs?: any[]) => {
    const dataList = rs || searchResults;
    const item = dataList[index];
    if (!item) return;

    // 1. 兼容多种属性名 (r,c 或 row,column)
    const row = item.row !== undefined ? item.row : item.r;
    const column = item.column !== undefined ? item.column : item.c;
    if (row === undefined || column === undefined) return;

    // 2. 获取工作表实时状态
    const file = luckysheet.getluckysheetfile();
    const sheet = file.find((s: any) => s.status === 1) || file[0];
    const { visibledatarow, visibledatacolumn } = sheet;

    if (!visibledatarow || !visibledatacolumn) return;

    // 3. 从 DOM 获取真实的滚动位置和容器尺寸
    const $ = (window as any).$;
    const scrollTop = $('#luckysheet-scrollbar-y').scrollTop() || 0;
    const scrollLeft = $('#luckysheet-scrollbar-x').scrollLeft() || 0;

    const $container = $('#luckysheet');
    const viewWidth = $container.width() || 0;
    const viewHeight = $container.height() || 0;

    // 表头尺寸
    const ch =
      sheet.columnHeaderHeight !== undefined ? sheet.columnHeaderHeight : 20;
    const rw = sheet.rowHeaderWidth !== undefined ? sheet.rowHeaderWidth : 46;

    // 4. 计算单元格在数据区域中的绝对位置（不含表头偏移）
    const cellTop = row === 0 ? 0 : visibledatarow[row - 1];
    const cellBottom = visibledatarow[row];
    const cellLeft = column === 0 ? 0 : visibledatacolumn[column - 1];
    const cellRight = visibledatacolumn[column];

    // 5. 精确可见性判断
    // 必须在滚动偏移量之后，且在视口可用高度（扣除表头和滚动条余量）之内
    const isVisible =
      cellTop >= scrollTop &&
      cellBottom <= scrollTop + (viewHeight - ch - 20) &&
      cellLeft >= scrollLeft &&
      cellRight <= scrollLeft + (viewWidth - rw - 20);

    // 6. 不可见才滚动
    if (!isVisible) {
      luckysheet.scroll({
        targetRow: row,
        targetColumn: column,
      });
    }

    // 7. 延迟选中确保滚动逻辑优先
    setTimeout(() => {
      luckysheet.setRangeShow({
        row: [row, row],
        column: [column, column],
      });
    }, 10);

    // 8. 高亮单元格
    clearAllHighlights();
    highlightCell(row, column);
  };
  const handleSearch = (keyword: string) => {
    const rs = luckysheet.find(keyword, {
      regEx: false, // 是否正则匹配
      wholeWord: false, // 是否全词匹配
      matchCase: false, // 是否区分大小写
      includeHidden: true, // 是否搜索隐藏行列
      searchDirection: 0, // 0: 向下搜索, 1: 向上搜索
    });
    setSearchResults(rs);
    setTimeout(() => {
      setSearchIndex(0);
      highlight(0, rs);
    }, 300);
  };

  const handleSearchNext = () => {
    if (searchIndex < searchResults.length - 1) {
      const index = searchIndex + 1;
      setSearchIndex(index);
      highlight(index);
    }
  };

  const handleSearchPrev = () => {
    if (searchIndex > 0) {
      const index = searchIndex - 1;
      setSearchIndex(index);
      highlight(index);
    }
  };
  // 搜索功能

  useEffect(() => {
    const init = async () => {
      await loadExternalResources();

      if (isCsv) {
        handleCsv(src || '');
      } else {
        handleExcel(src || '');
      }
    };

    init();
  }, [src, fileName, isCsv, hideLoading]);

  // 屏蔽 luckysheet 的 Ctrl+F 快捷键，在 document 层级捕获阶段拦截
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlF = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f';

      if (isCtrlF) {
        const container = document.getElementById('luckysheet');
        // 只在焦点在 luckysheet 容器内时拦截
        if (container && container.contains(document.activeElement)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // 阻止同一元素上的其他监听器
          return false;
        }
      }
    };

    // 在 document 层级的捕获阶段监听，最高优先级
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>
          <div className={styles.fileName}>{displayName || fileName}</div>
          <Topbar
            renderType={renderType}
            containerRef={containerRef}
            previewUrl={src}
            onSearch={(keyword) => {
              console.log('onSearch:', keyword);
              handleSearch(keyword);
            }}
            onSearchClose={() => {
              console.log('onSearchClose');
              // 清除高亮
              clearAllHighlights();
              setSearchResults([]);
              setSearchIndex(0);
            }}
            onSearchNext={() => {
              console.log('onSearchNext');
              handleSearchNext();
            }}
            onSearchPrev={() => {
              console.log('onSearchPrev');
              handleSearchPrev();
            }}
            canSearchNext={
              searchResults.length > 0 && searchIndex < searchResults.length - 1
            }
            canSearchPrev={searchResults.length > 0 && searchIndex > 0}
          />
        </div>
      )}
      <div className={styles.pageCanvas} id='luckysheet' ref={containerRef}>
        {/* 覆盖层，水印等 */}
        <WaterMarker fullPage />
      </div>
    </div>
  );
}
