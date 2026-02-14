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

import { useEffect, useRef, useCallback } from 'react';
import { renderProps, IMode } from '@/types';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { useLoading } from '@/hooks/loading';
import styles from './index.module.scss';

import { detectLanguage, log } from '@/utils';
import { getFileTextContent } from '@/api';
import Footer from '@/components/footer';

export default function HighlightRender(props: renderProps) {
  const { src, fileName = '', displayName = '', mode = IMode.normal } = props;
  const { hideLoading, showLoadingError } = useLoading();
  let language = detectLanguage(fileName);

  // 适配 vue 文件为 html
  if (fileName.endsWith('.vue')) {
    language = 'html';
  }

  const codeRef = useRef<HTMLElement>(null);

  const getTextContent = useCallback(async () => {
    if (!src) return;

    return getFileTextContent(src);
  }, [src]);

  useEffect(() => {
    getTextContent()
      .then((textContent) => {
        hideLoading();
        if (codeRef.current) {
          codeRef.current.textContent = textContent;
          hljs.highlightElement(codeRef.current);
        }
      })
      .catch((error) => {
        showLoadingError(undefined, error.message);
        log.error('获取文本内容失败:', error.message);
      });
  }, [src, language, getTextContent, showLoadingError, hideLoading]);

  return (
    <div className={styles.singlePageContainer}>
      <div className={styles.singlePage}>
        {mode === IMode.normal && (
          <div className={styles.header}>{displayName || fileName}</div>
        )}
        <div className={styles.codePreview}>
          <pre>
            <code ref={codeRef} className={`language-${language}`}></code>
          </pre>
        </div>
      </div>
      <div className={styles.fixMaginCollapse}></div>
      <Footer {...props} />
    </div>
  );
}
