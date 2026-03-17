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

// CDN 地址列表（按优先级排序）
const CDN_URLS = [
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`,
];

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
