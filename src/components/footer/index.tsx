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

import { renderProps } from '@/types';
import styles from './index.module.scss';
import { APP_NAME_EN, APP_HOME } from '@/constant/vars';

// eslint-disable-next-line no-unused-vars
const Footer = (_props: renderProps) => {
  return (
    <div className={styles.footer}>
      文件预览由
      <a
        style={{
          padding: '0 5px',
        }}
        href={`${APP_HOME}`}
        target='_blank'
        rel='noreferrer'
      >
        {APP_NAME_EN}
      </a>
      驱动
    </div>
  );
};

export default Footer;
