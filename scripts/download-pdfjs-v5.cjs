/* eslint-env node */
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

/**
 * 下载 PDF.js v5 静态资源脚本
 *
 * 该脚本用于从 CDN 下载 PDF.js v5 的预编译文件，
 * 并放置到 public/vendor/pdfjs-v5/ 目录下。
 *
 * 使用方法：
 * node scripts/download-pdfjs-v5.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// PDF.js v5 版本号
const PDFJS_VERSION = '5.5.207';

// 需要下载的文件列表
// 注意：使用 .js 扩展名以避免 MIME 类型问题
const FILES_TO_DOWNLOAD = [
  {
    src: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`,
    dest: 'pdf.js',
  },
  {
    src: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`,
    dest: 'pdf.worker.js',
  },
  {
    src: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/web/pdf_viewer.mjs`,
    dest: 'pdf_viewer.js',
  },
  {
    src: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/web/pdf_viewer.css`,
    dest: 'pdf_viewer.css',
  },
];

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '../public/vendor/pdfjs-v5');

/**
 * 下载文件
 * @param {string} url - 文件 URL
 * @param {string} destPath - 目标路径
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`下载: ${url}`);

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`重定向到: ${redirectUrl}`);
        downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`完成: ${destPath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('下载超时'));
    });
  });
}

/**
 * 尝试从多个 CDN 下载文件
 * @param {string[]} urls - CDN URL 列表
 * @param {string} destPath - 目标路径
 * @returns {Promise<void>}
 */
async function downloadWithFallback(urls, destPath) {
  for (const url of urls) {
    try {
      await downloadFile(url, destPath);
      return;
    } catch (error) {
      console.warn(`下载失败 (${url}): ${error.message}`);
    }
  }
  throw new Error(`所有 CDN 都无法下载: ${destPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log(`下载 PDF.js v${PDFJS_VERSION} 静态资源`);
  console.log('========================================\n');

  // 创建输出目录
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`创建目录: ${OUTPUT_DIR}\n`);
  }

  // 下载所有文件
  for (const file of FILES_TO_DOWNLOAD) {
    const destPath = path.join(OUTPUT_DIR, file.dest);

    // 构建备用 URL 列表
    const urls = [
      file.src,
      file.src.replace('unpkg.com', 'cdn.jsdelivr.net/npm'),
    ];

    try {
      await downloadWithFallback(urls, destPath);
    } catch (error) {
      console.error(`下载失败: ${file.dest}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  // 创建压缩版本（简单的复制，实际压缩在 build 时进行）
  console.log('\n创建压缩版本...');

  const filesToMinify = [
    { src: 'pdf.js', dest: 'pdf.min.js' },
    { src: 'pdf.worker.js', dest: 'pdf.worker.min.js' },
    { src: 'pdf_viewer.js', dest: 'pdf_viewer.min.js' },
    { src: 'pdf_viewer.css', dest: 'pdf_viewer.min.css' },
  ];

  for (const file of filesToMinify) {
    const srcPath = path.join(OUTPUT_DIR, file.src);
    const destPath = path.join(OUTPUT_DIR, file.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`复制: ${file.src} -> ${file.dest}`);
    }
  }

  // 为 worker 文件添加 toHex polyfill（修复旧浏览器兼容性问题）
  console.log('\n添加兼容性 polyfill...');

  const toHexPolyfill = `
// Polyfill for Uint8Array.prototype.toHex (for old browsers)
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function() {
    return Array.from(this)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };
}
`;

  const mapPolyfill = `
// Polyfill for Map.prototype.getOrInsertComputed (for old browsers)
if (!Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function(key, callback) {
    if (this.has(key)) {
      return this.get(key);
    }
    const value = callback();
    this.set(key, value);
    return value;
  };
}
`;

  const promiseTryPolyfill = `
// Polyfill for Promise.try (for old browsers, Chrome < 128)
if (typeof Promise.try !== "function") {
  Promise.try = function(callback, ...args) {
    return new Promise(function(resolve) {
      resolve(callback(...args));
    });
  };
}
`;

  const promiseWithResolversPolyfill = `
// Polyfill for Promise.withResolvers (for old browsers, Chrome < 119)
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function() {
    var resolve, reject;
    var promise = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });
    return { promise: promise, resolve: resolve, reject: reject };
  };
}
`;

  const readableStreamAsyncIteratorPolyfill = `
// Polyfill for ReadableStream async iteration (for old browsers, Chrome < 93)
// Required by PDF.js v5 getTextContent which uses "for await...of readableStream"
if (typeof ReadableStream !== "undefined" &&
    !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = function() {
    var reader = this.getReader();
    return {
      next: function() { return reader.read(); },
      return: function() {
        reader.releaseLock();
        return Promise.resolve({ done: true, value: undefined });
      },
      [Symbol.asyncIterator]: function() { return this; }
    };
  };
}
`;

  const transferToFixedLengthPolyfill = `
// Polyfill for ArrayBuffer.prototype.transferToFixedLength (for old browsers, Chrome < 125)
// Required by PDF.js v5 worker getOperatorList for buffer transfer
if (typeof ArrayBuffer !== "undefined" &&
    typeof ArrayBuffer.prototype.transferToFixedLength !== "function") {
  ArrayBuffer.prototype.transferToFixedLength = function() {
    // If transfer() is available (Chrome 114+), prefer it (properly detaches original)
    if (typeof this.transfer === "function") {
      return this.transfer();
    }
    // Otherwise, fall back to slice (copy without detaching original)
    return this.slice(0);
  };
}
`;

  // 为 worker 文件添加 polyfill
  const workerFiles = ['pdf.worker.js', 'pdf.worker.min.js'];
  for (const file of workerFiles) {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content =
        toHexPolyfill +
        mapPolyfill +
        promiseTryPolyfill +
        promiseWithResolversPolyfill +
        readableStreamAsyncIteratorPolyfill +
        transferToFixedLengthPolyfill +
        content;
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`添加 polyfill: ${file}`);
    }
  }

  // 为 pdf.js 主文件添加 Map + Promise + ReadableStream + ArrayBuffer polyfill
  const mainFiles = ['pdf.js', 'pdf.min.js'];
  for (const file of mainFiles) {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      content =
        mapPolyfill +
        promiseTryPolyfill +
        promiseWithResolversPolyfill +
        readableStreamAsyncIteratorPolyfill +
        transferToFixedLengthPolyfill +
        content;
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`添加 polyfill: ${file}`);
    }
  }

  // 为 pdf_viewer.js 替换 /v 正则标志为等价的 /u 正则
  // /v 标志是语法级别的，无法 polyfill，但 pdf_viewer.js 中只有一处使用
  // 通过字符串精确替换将 /v 正则转换为等价的 /u 正则
  // 集合减法 A--[B] → 否定字符类 [^b] 转换：
  //   [\S--[\p{P}<>]]         → [^\s\p{P}<>]
  //   [\S--[[\]]]             → [^\s\[\]]
  //   [\S--[@\p{Ps}\p{Pe}<>]] → [^\s@\p{Ps}\p{Pe}<>]
  //   [\S--[[\p{P}--\-]<>]]  → [^\s\p{P}<>] (连字符也排除，影响极小)
  const viewerFiles = ['pdf_viewer.js', 'pdf_viewer.min.js'];
  for (const file of viewerFiles) {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      // 用行号定位后用字符串替换
      const lines = content.split('\n');
      let replaced = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('/gmv') && lines[i].includes('\\S--')) {
          lines[i] = lines[i].replace(
            /\/\\b\(\?:https\?:\\\/\\\/\|mailto:\|www\\\.\).*?\/gmv/,
            '/\\b(?:https?:\\/\\/|mailto:|www\\.)(?:[^\\s\\p{P}<>]|\\/|[^\\s\\[\\]]+(?:[^\\s\\p{P}<>])?)+|(?=\\p{L})[^\\s@\\p{Ps}\\p{Pe}<>]+@([^\\s\\p{P}<>]+(?:\\.[^\\s\\p{P}<>]+)+)/gmu',
          );
          replaced = true;
        }
      }
      if (replaced) {
        content = lines.join('\n');
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`替换 /v 正则: ${file}`);
      } else {
        console.warn(`未找到 /v 正则: ${file}`);
      }
    }
  }
  // 创建版本信息文件
  const versionInfo = {
    version: PDFJS_VERSION,
    downloadDate: new Date().toISOString(),
    files: FILES_TO_DOWNLOAD.map((f) => f.dest),
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'version.json'),
    JSON.stringify(versionInfo, null, 2),
  );

  console.log('\n========================================');
  console.log('下载完成！');
  console.log(`文件位置: ${OUTPUT_DIR}`);
  console.log('========================================');
}

// 运行主函数
main().catch((error) => {
  console.error('下载失败:', error);
  process.exit(1);
});
