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
 * PDF 适配器 Hook
 * 封装 PDF 适配器的获取和使用逻辑
 */

import { useState, useEffect, useRef } from 'react';
import { getPdfAdapter, getAdapterVersion } from '../adapters';
import type {
  IPdfAdapter,
  IDocumentProxy,
  IDocumentLoadingTask,
} from '../adapters/types';
import { log } from '@/utils';

interface UsePdfAdapterResult {
  adapter: IPdfAdapter | null;
  version: 'v2' | 'v5' | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * PDF 适配器 Hook
 * 自动根据浏览器版本加载合适的适配器
 */
export const usePdfAdapter = (): UsePdfAdapterResult => {
  const [adapter, setAdapter] = useState<IPdfAdapter | null>(null);
  const [version, setVersion] = useState<'v2' | 'v5' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAdapter = async () => {
      try {
        setIsLoading(true);
        const pdfAdapter = await getPdfAdapter();

        if (mounted) {
          setAdapter(pdfAdapter);
          setVersion(getAdapterVersion());
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAdapter();

    return () => {
      mounted = false;
    };
  }, []);

  return { adapter, version, isLoading, error };
};

interface UsePdfDocumentOptions {
  url: string;
  password?: string;
  enabled?: boolean;
}

interface UsePdfDocumentResult {
  document: IDocumentProxy | null;
  isLoading: boolean;
  error: Error | null;
  loadingTask: IDocumentLoadingTask | null;
}

/**
 * PDF 文档加载 Hook
 * 封装 PDF 文档的加载逻辑
 */
export const usePdfDocument = (
  adapter: IPdfAdapter | null,
  options: UsePdfDocumentOptions,
): UsePdfDocumentResult => {
  const { url, password, enabled = true } = options;

  const [document, setDocument] = useState<IDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingTaskRef = useRef<IDocumentLoadingTask | null>(null);

  useEffect(() => {
    if (!adapter || !url || !enabled) {
      setDocument(null);
      setError(null);
      return;
    }

    let mounted = true;

    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 销毁之前的文档
        if (loadingTaskRef.current) {
          loadingTaskRef.current.destroy();
        }

        // 创建新的加载任务
        const task = adapter.getDocument({ url, password });
        loadingTaskRef.current = task;

        // 等待文档加载完成
        const pdfDocument = await task.promise;

        if (mounted) {
          setDocument(pdfDocument);
          setError(null);
          log.debug(`[PDF] 文档加载成功，共 ${pdfDocument.numPages} 页`);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setDocument(null);
          log.error('[PDF] 文档加载失败:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      mounted = false;
      // 清理加载任务
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
        loadingTaskRef.current = null;
      }
    };
  }, [adapter, url, password, enabled]);

  return {
    document,
    isLoading,
    error,
    loadingTask: loadingTaskRef.current,
  };
};

export default usePdfAdapter;
