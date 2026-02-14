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
 * 根据文件名/路径推断语言
 * @param {string} filename - 文件名或文件路径
 * @returns {string} highlight.js 的语言 key
 */
export const detectLanguage = (filename: string) => {
  if (!filename) return 'plaintext';

  // 获取扩展名（小写，不带 .）
  const ext = filename ? filename.split('.').pop()?.toLowerCase() : undefined;

  const map: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'xml',
    htm: 'xml',
    xml: 'xml',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    markdown: 'markdown',
    py: 'python',
    java: 'java',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    hpp: 'cpp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    kt: 'kotlin',
    swift: 'swift',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    sql: 'sql',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    vue: 'vue',
    dart: 'dart',
  };

  // 修复：确保 ext 不为 undefined 时才访问 map
  return (ext && map[ext]) || 'plaintext';
};
