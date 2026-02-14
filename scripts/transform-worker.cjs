const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const inputFile = path.join(__dirname, '../public/vendor/pdf.worker.original.js');
const outputFile = path.join(__dirname, '../public/vendor/pdf.worker.min.js');

// 确保 vendor 目录存在
const vendorDir = path.dirname(inputFile);
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true });
}

// 复制源文件
if (!fs.existsSync(sourceFile)) {
  console.error('✗ PDF.js worker 源文件不存在，请确保 pdfjs-dist 已安装');
  process.exit(1);
}

console.log('转换 PDF.js Worker 以兼容 Chrome 60...');
fs.copyFileSync(sourceFile, inputFile);

let code = fs.readFileSync(inputFile, 'utf-8');

// 在 worker 文件开头注入 Promise.allSettled polyfill
const polyfill = `
if (!Promise.allSettled) {
  Promise.allSettled = function(promises) {
    return Promise.all(promises.map(function(p) {
      return Promise.resolve(p).then(
        function(value) { return { status: 'fulfilled', value: value }; },
        function(reason) { return { status: 'rejected', reason: reason }; }
      );
    }));
  };
}
`;

code = polyfill + code;

const result = babel.transformSync(code, {
  presets: [
    ['@babel/preset-env', {
      targets: {
        chrome: '60'
      },
      modules: false
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-unicode-property-regex', { useUnicodeFlag: false }]
  ],
  compact: true,
  comments: false
});

fs.writeFileSync(outputFile, result.code, 'utf-8');

const originalSize = (fs.statSync(inputFile).size / 1024).toFixed(2);
const transformedSize = (fs.statSync(outputFile).size / 1024).toFixed(2);

console.log(`✓ 转换完成: ${originalSize}KB → ${transformedSize}KB`);
console.log(`✓ 输出: ${outputFile}`);
