<div align="center">
  <h1> BaseMetas Fileview 在线文件预览引擎-前端项目</h1>
  <p>新一代通用型在线文件预览引擎，全格式覆盖，跨平台，零依赖</p>
  <a href="https://hub.docker.com/r/basemetas/fileview/tags"><img alt="Docker Image Version (tag)" src="https://img.shields.io/docker/v/basemetas/fileview/latest"></a>
  <a href="https://github.com/BaseMetas/fileview/blob/main/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/BaseMetas/fileview"></a>
  <a href="https://hub.docker.com/r/basemetas/fileview/tags"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/basemetas/fileview"></a>
  <a href="https://github.com/BaseMetas/fileview-frontend/graphs/contributors"><img src="https://img.shields.io/github/contributors/BaseMetas/fileview-frontend?style=flat-square" alt="contributors"></a>
  <a href="https://github.com/BaseMetas/fileview-frontend/commits"><img src="https://img.shields.io/github/commit-activity/w/BaseMetas/fileview-frontend?style=flat-square" alt="commit activity"></a>
  <a href="https://github.com/BaseMetas/fileview-frontend"><img src="https://img.shields.io/github/actions/workflow/status/basemetas/fileview-frontend/lint.yml?branch=main&style=flat-square&label=lint" alt="lint"></a>
</div>

## 项目主仓库

https://github.com/BaseMetas/fileview


## 软件版本

- [Node.js 22+](https://nodejs.org/)
- [React 17](https://reactjs.org/)
- [Ant Design 4](https://ant.design/)

## 浏览器支持

- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+

## 使用到的开源项目

本项目基于以下开源库构建，感谢每一位开发者对开源事业的支持

### 核心框架

- [React](https://github.com/facebook/react) - 用户界面构建库
- [React Router](https://github.com/remix-run/react-router) - React 路由管理
- [Vite](https://github.com/vitejs/vite) - 下一代前端构建工具
- [TypeScript](https://github.com/microsoft/TypeScript) - JavaScript 的类型化超集

### UI 组件库

- [Ant Design](https://github.com/ant-design/ant-design) - 企业级 UI 设计语言和 React 组件库
- [Ant Design Icons](https://github.com/ant-design/ant-design-icons) - Ant Design 图标库

### 文件预览库

- [PDF.js](https://github.com/mozilla/pdf.js) - PDF 文档渲染
- [EPUB.js](https://github.com/futurepress/epub.js) - EPUB 电子书阅读
- [bpmn-js](https://github.com/bpmn-io/bpmn-js) - BPMN 流程图查看和编辑
- [X-Viewer](https://www.npmjs.com/package/@x-viewer/core) - CAD DXF/DWG 文件查看
- [Mind Elixir](https://github.com/ssshooter/mind-elixir-core) - XMind 数据解析与思维导图渲染
- [XMind Embed Viewer](https://github.com/xmindltd/xmind-embed-viewer) - XMind 文件查看
- [Three.js](https://github.com/mrdoob/three.js) - 3D 图形库
- [ViewerJS](https://github.com/fengyuanchen/viewerjs) - 图片查看器
- [tga-js](https://github.com/vthibault/tga.js) - TGA 图片格式支持
- [Video.js](https://github.com/videojs/video.js) - HTML5 视频播放器
- [Luckysheet](https://github.com/dream-num/Luckysheet) - 在线 Excel 表格
- [Drawio](https://github.com/jgraph/drawio) - 在线绘图工具
- [Xmind](https://github.com/xmindltd/xmind) - Xmind 文件查看（通过自定义解析器）

### Markdown 和代码高亮

- [Marked](https://github.com/markedjs/marked) - Markdown 解析器
- [marked-highlight](https://github.com/markedjs/marked-highlight) - Marked 高亮插件
- [Highlight.js](https://github.com/highlightjs/highlight.js) - 代码语法高亮
- [highlightjs-line-numbers.js](https://github.com/wcoder/highlightjs-line-numbers.js) - 代码行号插件
- [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css) - GitHub 风格 Markdown 样式
- [KaTeX](https://github.com/KaTeX/KaTeX) - 数学公式渲染

### 文件处理

- [JSZip](https://github.com/Stuk/jszip) - ZIP 文件处理
- [PapaParse](https://github.com/mholt/PapaParse) - CSV 解析
- [jschardet](https://github.com/aadsm/jschardet) - 字符编码检测

### 工具库

- [jQuery](https://github.com/jquery/jquery) - JavaScript 库
- [Axios](https://github.com/axios/axios) - HTTP 客户端
- [Day.js](https://github.com/iamkun/dayjs) - 轻量级日期处理库
- [classnames](https://github.com/JedWatson/classnames) - CSS 类名工具
- [UUID](https://github.com/uuidjs/uuid) - UUID 生成器
- [Core-js](https://github.com/zloirock/core-js) - JavaScript 标准库 polyfill
- [regenerator-runtime](https://github.com/facebook/regenerator) - async/await 运行时支持
- [MediaElement.js](https://github.com/mediaelement/mediaelement) - HTML5媒体播放器
- [dommatrix](https://github.com/chrvadala/dommatrix) - DOM矩阵变换
- [js-base64](https://github.com/dankogai/js-base64) - Base64编码解码
- [promise.allsettled](https://github.com/es-shims/Promise.allSettled) - Promise.allSettled polyfill
- [qs](https://github.com/ljharb/qs) - 查询字符串解析
- [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill) - ResizeObserver polyfill
- [rhino3dm](https://github.com/mcneel/rhino3dm) - 3D几何库
- [web-streams-polyfill](https://github.com/MattiasBuelens/web-streams-polyfill) - Web Streams API polyfill

### 开发工具

- [ESLint](https://github.com/eslint/eslint) - JavaScript 代码检查工具
- [Prettier](https://github.com/prettier/prettier) - 代码格式化工具
- [Sass](https://github.com/sass/dart-sass) - CSS 预处理器
- [Terser](https://github.com/terser/terser) - JavaScript 压缩工具
- [Mock.js](https://github.com/nuysoft/Mock) - 数据模拟工具
- [vite-plugin-mock](https://github.com/vbenjs/vite-plugin-mock) - Vite Mock 插件
- [patch-package](https://github.com/ds300/patch-package) - NPM 包补丁工具

### 许可证

本项目源码文件头部已统一添加 **Apache License, Version 2.0** 声明，整体亦遵循 Apache-2.0 开源许可证。

> 使用、修改和分发本项目时，请遵守 Apache License 2.0 的相关条款。