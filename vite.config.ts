/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { fileURLToPath, URL } from 'node:url';
import { minify } from 'terser';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { networkInterfaces } from 'node:os';

// 获取非 localhost 的 IPv4 地址（优先选择常规局域网IP，避免VPN/代理虚拟网卡）
function getLocalIPv4(): string {
  const nets = networkInterfaces();
  const candidates: { name: string; address: string; priority: number }[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // 跳过内部地址和 IPv6
      if (net.family === 'IPv4' && !net.internal) {
        let priority = 0;
        const lowerName = name.toLowerCase();

        // 常规以太网/Wi-Fi网卡优先级最高
        if (
          lowerName.includes('ethernet') ||
          lowerName.includes('wi-fi') ||
          lowerName.includes('wlan') ||
          lowerName.includes('en0') ||
          lowerName.includes('eth0')
        ) {
          priority = 3;
        }
        // 跳过明显的VPN/虚拟网卡（优先级最低或直接排除）
        else if (
          lowerName.includes('vpn') ||
          lowerName.includes('virtual') ||
          lowerName.includes('vmware') ||
          lowerName.includes('vbox') ||
          lowerName.includes('hyper-v') ||
          lowerName.includes('tap') ||
          lowerName.includes('tun') ||
          lowerName.includes('utun') ||
          lowerName.includes('ppp')
        ) {
          continue; // 直接跳过VPN和虚拟网卡
        }
        // 其他物理网卡
        else {
          priority = 2;
        }

        // 常规局域网IP段（192.168.x.x, 10.x.x.x, 172.16-31.x.x）优先级加成
        if (
          net.address.startsWith('192.168.') ||
          net.address.startsWith('10.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(net.address)
        ) {
          priority += 1;
        }

        candidates.push({ name, address: net.address, priority });
      }
    }
  }

  // 按优先级排序，返回优先级最高的IP
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.priority - a.priority);
    console.log(
      `[Vite] 选择网卡: ${candidates[0].name} (${candidates[0].address})`,
    );
    return candidates[0].address;
  }

  return '0.0.0.0'; // 降级方案
}

// 监听端口
const PORT = 8700;

// 压缩 public/vendor 文件的插件
function compressVendorFiles() {
  return {
    name: 'compress-vendor-files',
    async closeBundle() {
      const vendorDir = path.resolve(__dirname, 'dist/vendor');
      if (!fs.existsSync(vendorDir)) return;

      const compressFile = async (filePath: string) => {
        const ext = path.extname(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        let compressed = content;

        try {
          if (ext === '.js') {
            // JS 文件压缩：只去除空行和多余空格，不做变量替换
            const result = await minify(content, {
              compress: {
                defaults: false, // 禁用默认压缩选项
                dead_code: false, // 不删除无用代码
                unused: false, // 不删除未使用的变量
              },
              mangle: false, // 不混淆变量名
              format: {
                comments: false, // 删除所有注释，包括头部注释(!...)
                beautify: false, // 不美化输出
              },
            });
            compressed = result.code || content;
          } else if (ext === '.css') {
            // CSS 文件简单压缩：去除空行、多余空格和注释
            compressed = content
              .replace(/\/\*!?[\s\S]*?\*\//g, '') // 删除注释，包括头部注释(/*!...)
              .replace(/\n\s*\n/g, '\n') // 删除空行
              .replace(/\s+/g, ' ') // 合并多余空格
              .replace(/\s*([{}:;,])\s*/g, '$1') // 删除符号周围空格
              .trim();
          }

          if (compressed && compressed !== content) {
            const originalSize = Buffer.byteLength(content, 'utf-8');
            const compressedSize = Buffer.byteLength(compressed, 'utf-8');
            const savings = ((1 - compressedSize / originalSize) * 100).toFixed(
              2,
            );
            console.log(
              `✓ Compressed ${path.relative(vendorDir, filePath)}: ${(originalSize / 1024).toFixed(2)}KB → ${(compressedSize / 1024).toFixed(2)}KB (${savings}% saved)`,
            );
            fs.writeFileSync(filePath, compressed, 'utf-8');
          }
        } catch (error) {
          console.warn(`✗ Failed to compress ${filePath}:`, error);
        }
      };

      const processDirectory = async (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await processDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (ext === '.js' || ext === '.css') {
              await compressFile(fullPath);
            }
          }
        }
      };

      console.log('\n🗜️  Compressing vendor files...');
      await processDirectory(vendorDir);
      console.log('✅ Vendor files compression completed\n');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          [
            '@babel/plugin-transform-unicode-property-regex',
            { useUnicodeFlag: false },
          ],
        ],
      },
    }),
    legacy({
      targets: ['chrome >= 60'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true,
      polyfills: [
        'es.symbol',
        'es.array.filter',
        'es.promise',
        'es.promise.finally',
        'es/map',
        'es/set',
        'es.array.for-each',
        'es.object.define-properties',
        'es.object.define-property',
        'es.object.get-own-property-descriptor',
        'es.object.get-own-property-descriptors',
        'es.object.keys',
        'es.object.to-string',
        'web.dom-collections.for-each',
        'esnext.global-this',
        'esnext.string.match-all',
      ],
    }),
    // 在构建时压缩 vendor 文件
    command === 'build' && compressVendorFiles(),
  ].filter(Boolean),
  css: {
    modules: {
      // CSS Modules 配置
      localsConvention: 'camelCase', // 支持驼峰命名
      generateScopedName: '[name]_[local]_[hash:base64:5]', // 生成的类名格式
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // 自定义 Less 变量，用于覆盖 antd 主题色
          // 'primary-color': '#f00',
          // 'text-color': '#3D4757',
          // 'heading-color': '#3D4757',
        },
      },
      scss: {
        // SCSS 预处理器选项
        additionalData: `@charset "UTF-8";`,
      },
    },
  },
  server: {
    host: getLocalIPv4(),
    port: PORT,
    open: true,
    proxy: {
      '/preview/api': {
        target: 'http://localhost:8184',
        // changeOrigin: true,
        // 示例：/preview/api → /preview
        // rewrite: path => path.replace(/^\/preview\/api/, '/preview'),
      },
      '^/.+/preview/api': {
        target: 'http://localhost:8184',
        // changeOrigin: true,
        // 示例：/abc/preview/api → /preview
        rewrite: (path) =>
          path.replace(/^\/[^\/]+\/preview\/api/, '/preview/api'),
      },
      // 本地静态资源：直接访问本地 fonts 和 vendor，跳过代理
      '^/.+/(fonts|vendor)': {
        bypass(req, res, options) {
          const path = req.url || '';
          // 提取 /fonts 或 /vendor 路径
          const match = path.match(/\/(fonts|vendor)\/.+$/);
          if (match) {
            return match[0]; // 返回 /fonts/xxx 或 /vendor/xxx
          }
          return null;
        },
      },
    },
  },
  build: {
    target: 'es2015',
    cssTarget: 'chrome60',
    // 分块大小限制，超过 500KB 的分块会被警告
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 配置 chunk 文件名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(css|scss)$/.test(assetInfo.name || '')) {
            return 'css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
  assetsInclude: ['**/*.worker.js'],
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      target: 'es2015',
    },
  },
}));
