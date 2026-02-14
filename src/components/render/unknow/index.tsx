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

import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import { useEffect } from 'react';
import { renderProps } from '@/types';

export default function UnknowRender(props: renderProps) {
  const { hideLoading } = useLoading();
  const { error } = props;

  useEffect(() => {
    hideLoading();
  }, [hideLoading]);
  return (
    <div className={styles.unknowPage}>
      <Result
        icon={<FrownOutlined />}
        title={'不支持的文件类型'}
        subTitle={error || `抱歉，系统暂不支持该类型文件的预览`}
        extra={
          <Button type={'primary'} onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    </div>
  );
}
