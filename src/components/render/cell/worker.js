/*
 * Copyright 2025 MyGroup
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

import LuckyExcel from '/public/vendor/luckysheet/luckyexcel.esm.js';
import Papa from 'papaparse';
import jschardet from 'jschardet';
import { log } from '@/utils';

self.onmessage = async e => {
  const { url, type } = e.data;

  log.debug('Worker received URL:', url);

  const resp = await fetch(url);

  if (!resp.ok) {
    self.postMessage({ type: 'error', payload: 'Failed to fetch file.' });
    return;
  }

  if (type === 'csv') {
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
      for (let c = 0; c < rows[r].length; c++) {
        celldata.push({
          r,
          c,
          v: rows[r][c], // 单元格的值
        });
      }
    }

    self.postMessage({
      type: 'done',
      fileType: type,
      data: [
        {
          celldata,
          row: rows.length,
          column: rows[0].length,
        },
      ],
    });
    return;
  } else if (type === 'xlsx') {
    // 获取文件内容
    const ab = await resp.arrayBuffer();
    const data = new Uint8Array(ab);
    // 解析 Excel
    LuckyExcel.transformExcelToLucky(data, function (exportJson) {
      // log.debug('luckysheetData:', exportJson);
      self.postMessage({ type: 'done', fileType: type, data: exportJson });
    });
  }
  // const ab = await resp.arrayBuffer();
  // const data = new Uint8Array(ab);

  // // 解析 Excel
  // LuckyExcel.transformExcelToLucky(data, function (exportJson) {
  //   // log.debug('luckysheetData:', exportJson);
  //   self.postMessage({ type: 'done', data: exportJson });
  // });
};
