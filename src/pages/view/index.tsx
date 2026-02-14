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

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Entry from '@/components/entry';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useLoading } from '@/hooks/loading';
import { log, autoFixedURI } from '@/utils';
import { Base64 } from 'js-base64';
import { IRequestData, IMode } from '@/types';

export default function View() {
  const [searchParams] = useSearchParams();
  const [requestData, setRequestData] = useState<IRequestData | null>(null);
  const { showLoadingError } = useLoading();
  const [loadingError, setLoadingError] = useState<boolean>(false); // Changed from useState to match the hook

  // 获取 url 参数,base64 解码
  const safeBase64Decode = (str: string) => {
    if (!str) return '';
    try {
      return Base64.decode(str);
    } catch (e) {
      console.error('Base64 decode failed:', e);
      return '';
    }
  };

  // const uuu = autoFixedURI(searchParams.get('url') || '');
  // console.log('uuu', uuu);

  const url = decodeURIComponent(autoFixedURI(searchParams.get('url') || '')); // 默认为空
  const path = decodeURIComponent(autoFixedURI(searchParams.get('path') || '')); // 默认为空
  const fileName = decodeURIComponent(
    autoFixedURI(searchParams.get('fileName')?.trim() || ''),
  ); // 默认为空
  const displayName = decodeURIComponent(
    autoFixedURI(searchParams.get('displayName')?.trim() || ''),
  ); // 展示用文件名,默认为空
  const watermark = decodeURIComponent(
    autoFixedURI(searchParams.get('watermark')?.trim() || ''),
  ); // 水印,默认为空

  // 模式，默认为 normal
  const mode: IMode =
    searchParams.get('mode')?.trim() === 'embed'
      ? IMode.embed
      : searchParams.get('mode')?.trim() === 'sign'
        ? IMode.sign
        : IMode.normal;
  const searchParamsData = searchParams.get('data') || '';

  // 处理参数
  useEffect(() => {
    if (searchParamsData) {
      // 解析url的data
      try {
        const jsonStr = safeBase64Decode(searchParamsData || '');
        log.debug('jsonStr', jsonStr);
        const decodeed = JSON.parse(jsonStr);
        log.debug('data 参数解析成功', decodeed);

        setRequestData(decodeed);
      } catch (error) {
        // 参数解析失败
        log.error('data 参数解析失败', searchParamsData);
        setLoadingError(true);
        showLoadingError('参数错误', '请检查参数后重试');
      }
    } else {
      // 解析 url 参数
      const data: IRequestData = {
        url: url && decodeURIComponent(autoFixedURI(url)),
      };
      path && (data.path = path);
      fileName && (data.fileName = fileName);
      displayName && (data.displayName = displayName);
      watermark && (data.watermark = { value: watermark });
      mode && (data.mode = mode);
      setRequestData(data);
      log.debug('url 参数解析成功', data);
    }
  }, [
    searchParamsData,
    url,
    path,
    fileName,
    displayName,
    mode,
    showLoadingError,
    watermark,
  ]);

  useEffect(() => {
    log.info('requestData', requestData);
    if (!requestData) return;
    const { url, path } = requestData || ({} as { url: string; path: string });
    if (!url && !path) {
      setLoadingError(true);
      showLoadingError('参数错误', '请检查参数后重试');
    }
  }, [requestData, showLoadingError]);

  // 屏蔽浏览器的 Ctrl + 滚轮及 Ctrl + 加减缩放
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === '+' ||
          e.key === '=' ||
          e.key === '-' ||
          e.key === '_' ||
          e.key === '0' ||
          e.key === 'p' ||
          e.key === 'P')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return loadingError
    ? null
    : requestData && (
        <ErrorBoundary>
          <Entry {...requestData} />
        </ErrorBoundary>
      );
}
