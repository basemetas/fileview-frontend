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

import { useEffect, useState, useCallback } from 'react';
import { renderProps, IMode } from '@/types';
import { marked } from 'marked';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import { getFileTextContent } from '@/api';
import Footer from '@/components/footer';
import { log } from '@/utils';

// 默认样式
import 'github-markdown-css/github-markdown.css';

// 代码高亮
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// 数学公式
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MarkdownRender(props: renderProps) {
  const { src, fileName = '', displayName = '', mode = IMode.normal } = props;
  const [html, setHtml] = useState('');
  const { hideLoading, showLoadingError } = useLoading();

  const getTextContent = useCallback(async () => {
    if (!src) return;

    return getFileTextContent(src);
  }, [src]);

  const init = useCallback(
    async (textContent) => {
      if (!textContent) return;

      const renderer = new marked.Renderer();

      // --- 链接渲染：http/https 打开新标签 ---
      renderer.link = ({ href, tokens }) => {
        const text = tokens
          .map((t) => (typeof t === 'string' ? t : t.raw || ''))
          .join('');
        if (href?.startsWith('http')) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="external-link">${text || href}</a>`;
        }
        return `<a href="${href}">${text || href}</a>`;
      };

      // --- 代码块高亮 ---
      renderer.code = ({ text, lang }) => {
        const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(text, { language: validLang }).value;
        return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
      };

      // --- marked 配置 ---
      marked.setOptions({
        renderer,
        gfm: true,
        breaks: false, // ✅ 关键：关闭自动换行，避免 <br> 插入公式内
      });

      let md = textContent || '';

      // ✅ 处理高亮文本
      md = md.replace(
        /==(.+?)==/g,
        (_: string, text: string) => `<mark>${text}</mark>`,
      );

      // 1️⃣ 先保护代码块和行内代码，避免误处理 $
      const codeBlocks: string[] = [];
      const inlineCodes: string[] = [];
      md = md.replace(/```[\s\S]*?```/g, (m: string) => {
        const i = codeBlocks.push(m) - 1;
        return `@@CODEBLOCK${i}@@`;
      });
      md = md.replace(/`[^`\n]*`/g, (m: string) => {
        const i = inlineCodes.push(m) - 1;
        return `@@INLINECODE${i}@@`;
      });

      // 2️⃣ 先渲染块级公式 $$...$$
      md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_: string, tex: string) =>
        katex.renderToString(tex.trim(), {
          throwOnError: false,
          displayMode: true,
        }),
      );

      // 3️⃣ 再渲染行内公式 $...$
      md = md.replace(
        /(^|[^$])\$([^$\n]+?)\$([^$]|$)/g,
        (_m: string, pre: string, tex: string, post: string) =>
          `${pre}${katex.renderToString(tex.trim(), { throwOnError: false })}${post}`,
      );

      // 4️⃣ 恢复代码块/行内代码
      md = md.replace(
        /@@INLINECODE(\d+)@@/g,
        (_: string, i: string) => inlineCodes[+i],
      );
      md = md.replace(
        /@@CODEBLOCK(\d+)@@/g,
        (_: string, i: string) => codeBlocks[+i],
      );

      // 5️⃣ 用 marked 转成 HTML
      const htmlResult = marked(md) as string;

      setHtml(htmlResult);

      hideLoading();
    },
    [hideLoading],
  );

  useEffect(() => {
    getTextContent()
      .then((textContent) => {
        init(textContent);
      })
      .catch((error) => {
        // 加载失败
        showLoadingError(undefined, error.message);
        log.error('获取文本内容失败:', error.message);
      });
  }, [src, init, getTextContent, showLoadingError]);

  return (
    <div className={styles.singlePageContainer}>
      <div className={styles.singlePage}>
        {mode === IMode.normal && (
          <div className={styles.header}>{displayName || fileName}</div>
        )}
        <div
          className={classnames('markdown-body', styles.markdownPreview)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className={styles.fixMaginCollapse}></div>
      <Footer {...props} />
    </div>
  );
}
