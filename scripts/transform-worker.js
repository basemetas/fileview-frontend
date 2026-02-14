const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const inputFile = path.join(__dirname, '../public/vendor/pdf.worker.original.js');
const outputFile = path.join(__dirname, '../public/vendor/pdf.worker.min.js');

console.log('转换 PDF.js Worker 以兼容 Chrome 60...');

const code = fs.readFileSync(inputFile, 'utf-8');

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
