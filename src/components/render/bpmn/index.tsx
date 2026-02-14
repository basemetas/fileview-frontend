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
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import { renderProps, IMode } from '@/types';
import styles from './index.module.scss';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { useLoading } from '@/hooks/loading';
import { getFileTextContent } from '@/api';
import Footer from '@/components/footer';
import { log } from '@/utils';

const BpmnRender = (props: renderProps) => {
  const { src, fileName, displayName = '', mode = IMode.normal } = props;
  const containerRef = useRef(null);
  const { hideLoading, showLoadingError } = useLoading();

  const getTextContent = useCallback(async (src: string) => {
    if (!src) return;

    return getFileTextContent(src);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    const viewer = new BpmnJS({
      container: containerRef.current,
    });
    getTextContent(src)
      .then((xml) => {
        // log.debug(xml);
        // if (!xml) return;

        hideLoading();

        viewer.importXML(xml).then(({ warnings }) => {
          if (warnings.length) {
            log.warn('Warnings', warnings);
          }
          // access viewer components
          const canvas = viewer.get('canvas') as any;
          const overlays = viewer.get('overlays') as any;

          // zoom to fit full viewport
          canvas.zoom('fit-viewport', 'auto');

          // attach an overlay to a node
          overlays.add('SCAN_OK', 'note', {
            position: {
              bottom: 0,
              right: 0,
            },
            html: '<div class="diagram-note">Mixed up the labels?</div>',
          });

          // add marker
          canvas.addMarker('SCAN_OK', 'needs-discussion');
        });
      })
      .catch((error) => {
        // 加载失败
        showLoadingError('获取文件内容失败', error.message);
        log.error('获取文本内容失败:', error.message);
      });

    return () => viewer.destroy();
  }, [getTextContent, hideLoading, showLoadingError, src]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas} ref={containerRef}></div>
      <Footer {...props} />
    </div>
  );
};

export default BpmnRender;
