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

// 转换后文件扩展名 previewFileFormat 与渲染器的映射关系
export default {
  bpmn: ['bpmn'],
  cad: ['dxf', 'dwg'],
  drawio: ['drawio'],
  epub: ['epub'],
  tga: ['tga'],
  xmind: ['xmind'],
  pdf: [
    'pdf',
    'ofd',
    'rtf',
    'doc',
    'docx',
    'dot',
    'dotx',
    'wps',
    'dps',
    'et',
    'ett',
    'wpt',
    'pptx',
    'ppt',
    'pot',
    'potx',
    'pps',
    'ppsx',
    'dps',
    'dpt',
    'pptm',
    'potm',
    'ppsm',
  ],
  cell: ['xls', 'xlt', 'et', 'ett', 'xlsx', 'xltx', 'csv', 'xlsm', 'xltm'],
  archive: ['archive', 'zip', 'jar', 'tar', 'tar.gz', 'tgz', 'rar', '7z'],
  image: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'tif',
    'tiff',
    'svg',
    'webp',
    'ico',
  ],
  audio: [
    'm4a',
    'mp3',
    'aac',
    'ac3',
    'au',
    'flac',
    'ogg',
    'wma',
    'wav',
    'aif',
    'aifc',
    'aiff',
  ],
  video: [
    'mp4',
    'm4v',
    'mov',
    'wmv',
    'avi',
    'flv',
    'mkv',
    'webm',
    'mpg',
    'mpeg',
    'm2v',
    'm4p',
    'm4v',
    'mj2',
    'ogv',
    'qt',
    'vob',
  ],
  markdown: ['md', 'markdown'],
  highlight: [
    'txt',
    // JavaScript/TypeScript
    'js',
    'jsx',
    'ts',
    'tsx',
    'mjs',
    'cjs',
    'coffee',
    'litcoffee',
    // HTML/CSS
    'html',
    'htm',
    'css',
    'scss',
    'sass',
    'less',
    // Python
    'py',
    'pyw',
    'pyt',
    'pyx',
    'pyo',
    'rpy',
    'gyp',
    // Ruby
    'rb',
    'rbx',
    'rjs',
    'gemspec',
    'rake',
    'thor',
    'ru',
    // Java
    'java',
    'jsp',
    'jspx',
    'jhtml',
    'tag',
    'jsf',
    // PHP
    'php',
    'php3',
    'php4',
    'php5',
    'phtml',
    'phpt',
    // C/C++
    'c',
    'cpp',
    'cc',
    'cxx',
    'h',
    'hpp',
    'hxx',
    'hh',
    'ino',
    'tcc',
    // C#
    'cs',
    'cshtml',
    'razor',
    // Shell
    'sh',
    'bash',
    'zsh',
    'fish',
    'ksh',
    'csh',
    'tcsh',
    'bashrc',
    'bash_profile',
    // SQL
    'sql',
    'pgsql',
    'sqlite',
    'db',
    'db3',
    'dsql',
    // JSON
    'json',
    'geojson',
    'ldjson',
    // YAML/JSON
    'yaml',
    'yml',
    'mdown',
    'mkd',
    'mkdn',
    'mdwn',
    'mdtxt',
    'rst',
    // Go
    'go',
    'gomod',
    'gohtml',
    // Lua
    'lua',
    'pde',
    // R
    'r',
    'rmd',
    'rnw',
    'rhtml',
    // Rust
    'rs',
    'toml',
    // Swift
    'swift',
    // Dart
    'dart',
    // Kotlin
    'kt',
    'kts',
    'gradle',
    'groovy',
    // Scala
    'scala',
    'sc',
    // Haskell
    'hs',
    'lhs',
    // Objective-C / Swift
    'm',
    'mm',
    'objc',
    'objcpp',
    // Elixir
    'ex',
    'exs',
    // Erlang
    'erl',
    'hrl',
    // Perl
    'pl',
    'pm',
    't',
    'pod',
    // Tcl
    'tcl',
    'tk',
    // Groovy
    'groovy',
    'gvy',
    'gsh',
    'grvy',
    // VHDL
    'vhd',
    'vhdl',
    // LaTeX
    'tex',
    'ltx',
    'bib',
    'cls',
    'sty',
    'ins',
    'dtx',
    // XML
    'xml',
    'xsd',
    'xsl',
    'xslt',
    // Dockerfile
    'Dockerfile',
    // HTML Templates
    'ejs',
    'jade',
    'pug',
    // ASP.NET / Razor
    'cshtml',
    'razor',
    'vbhtml',
    // Vue.js
    'vue',
    // JSON5
    'json5',
    // Markdown (with front matter)
    'mdx',
    // Terraform
    'tf',
    'tfvars',
    // Nginx
    'conf',
    'nginx',
    // HTTP
    'http',
    'rest',
    // GraphQL
    'graphql',
    'gql',
    // Shell script files
    'sh',
    'bash',
    'zsh',
    'fish',
    // Toml
    'toml',
    // CMake
    'cmake',
    // Assembly
    'asm',
    's',
    // JSON Schema
    'schema',
    // HCL (HashiCorp Configuration Language)
    'hcl',
    // Svelte
    'svelte',
    'cmd',
    'bat',
    'ps1',
    'ps',
    'powershell',
    'pwsh',
    'bashrc',
    'bash_profile',
    'profile',
    'npmrc',
    'gitignore',
    'editorconfig',
    'prettierrc',
    'eslintrc',
    'babelrc',
    'jestrc',
    'stylelint',
    'lintstagedrc',
    'prettierignore',
    'log',
  ],
  threed: [
    'glb',
    'gltf',
    'obj',
    'stl',
    'fbx',
    'ply',
    'dae',
    'wrl',
    '3ds',
    '3mf',
    '3dm',
  ],
};
