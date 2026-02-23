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

import { useEffect } from 'react';
import TgaLoader from 'tga-js';
import { renderProps, IMode } from '@/types';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import Footer from '@/components/footer';

const TgaRender = (props: renderProps) => {
  const { src, fileName, displayName = '', mode = IMode.normal } = props;
  const { hideLoading } = useLoading();
  useEffect(() => {
    if (!src) return;
    const tga = new TgaLoader();
    tga.open(src, () => {
      document.getElementById('tga-render')?.appendChild(tga.getCanvas());
    });
    hideLoading();
  }, [hideLoading, src]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas}>
        <div className={styles['tga-render-container']}>
          <div id='tga-render'></div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
};

export default TgaRender;
