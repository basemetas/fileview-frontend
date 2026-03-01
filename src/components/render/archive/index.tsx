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

import React, {
  useEffect,
  useState,
  useCallback,
  Suspense,
  useContext,
} from 'react';
import { renderProps, IMode } from '@/types';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import { Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getArchiveTree } from '@/api';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import AppContext from '@/context';

import { getArchiveRenderData, formatBytes, log } from '@/utils';
import Entry from '@/components/entry';
import Footer from '@/components/footer';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

interface DataType {
  key: React.Key;
  fullPath?: string;
  isDirectory?: boolean; // 是否是目录
  name?: string; // 文件名
  size?: number; // 文件大小
  lastModified?: string; // 修改时间
}

export default function ArchiveRender(props: renderProps) {
  const { originalFilePath = '', src = '', displayName = '' } = props;
  const { permission, watermark, mode = IMode.normal } = useContext(AppContext);
  const { hideLoading, showLoadingError } = useLoading();
  const [fileName, setFileName] = useState('');

  // 全量数据
  const [fullData, setFullData] = useState(null);
  // 压缩包路径 filePath
  const [archiveFilePath, setArchiveFilePath] = useState('');
  // 当前层级渲染 fullPath
  // const [currentFullPath, setCurrentFullPath] = useState('');
  // 当前层级渲染列表
  const [currentRenderList, setCurrentRenderList] = useState<any>([]);

  const getTree = useCallback(
    async (src: string) => {
      if (!src) {
        showLoadingError('文件预览错误', '文档参数丢失');
        return;
      }

      try {
        const tree = await getArchiveTree(src);
        hideLoading();
        return tree || {};
      } catch (error: any) {
        showLoadingError('获取文件内容失败', error.message);
        log.error('获取目录树失败:', error.message);
      }
    },
    [hideLoading, showLoadingError],
  );

  const openDirectory = useCallback((fullPath: string, fullData) => {
    // 目录继续打开
    const tempFullPath = fullPath;
    const data = getArchiveRenderData(fullData, tempFullPath);
    log.debug('返回数据 ', data);

    // 如果不为顶层目录，则追加返回上一层
    if (tempFullPath != '') {
      const tempData = [
        {
          key: 'back',
          name: '...(上级目录)',
          fullPath: tempFullPath,
        },
        ...data,
      ];
      setCurrentRenderList(tempData);
    } else {
      setCurrentRenderList(data);
    }
  }, []);

  const columns: ColumnsType<DataType> = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (text, record) => {
        const { key, isDirectory, fullPath } = record;
        return (
          <a
            onClick={() => {
              if ('back' === key && fullPath) {
                const parentPath = fullPath.replace(/[^/]+\/?$/, '');
                openDirectory(parentPath, fullData);
                return;
              } else if (isDirectory && fullPath && fullData) {
                openDirectory(fullPath, fullData);
                return;
              }
              // 文件弹窗预览
              Modal.info({
                content: (
                  <Suspense
                    fallback={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%',
                          width: '100%',
                        }}
                      ></div>
                    }
                  >
                    <Entry
                      isRoot={false}
                      path={`${archiveFilePath}/${fullPath}`}
                      watermark={watermark}
                      permission={permission}
                    />
                  </Suspense>
                ),
                icon: null,
                closable: true,
                className: 'full-info-modal',
              });
            }}
          >
            {'back' !== key &&
              (isDirectory ? (
                <FolderOutlined className={styles.icon} />
              ) : (
                <FileOutlined className={styles.icon} />
              ))}
            {text}
          </a>
        );
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      render: (text) => <div>{text ? formatBytes(text) : '-'}</div>,
    },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      width: 260,
      render: (text) => (
        <div>
          {text &&
            dayjs(text.replace('CST', 'UTC+8')).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      ),
    },
  ];

  useEffect(() => {
    getTree(src).then((tree) => {
      const { fileName, entries = [], filePath } = tree;
      setFullData(entries);
      setArchiveFilePath(filePath);
      const data = getArchiveRenderData(entries, '');
      log.debug('返回数据 ', data);
      setCurrentRenderList(data);
      setFileName(fileName);
    });
  }, [originalFilePath, src, getTree]);

  return (
    <div className={styles.singlePageContainer}>
      <div className={styles.singlePage}>
        {mode === IMode.normal && (
          <div className={styles.header}>{displayName || fileName}</div>
        )}
        <div className={styles.zipPreview}>
          <Table
            columns={columns}
            dataSource={currentRenderList}
            size='small'
            bordered={false}
            pagination={false}
          />
        </div>
      </div>
      <div className={styles.fixMaginCollapse}></div>
      <Footer {...props} />
    </div>
  );
}
