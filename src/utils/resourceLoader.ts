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

// utils/resourceLoader.ts - 完整修复版
import log from './logger';

// 构建时间戳，用于打破浏览器缓存
const BUILD_TIMESTAMP = __BUILD_TIMESTAMP__;

interface LoadOptions {
  type?: 'js' | 'css';
  id?: string;
  attributes?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface ResourceCache {
  [url: string]: {
    promise: Promise<void>;
    element: HTMLElement;
    loaded: boolean;
    error?: Error;
  };
}

const resourceCache: ResourceCache = {};

class ResourceLoadError extends Error {
  constructor(
    message: string,
    // eslint-disable-next-line no-unused-vars
    public url: string,
    // eslint-disable-next-line no-unused-vars
    public type: string,
  ) {
    super(message);
    this.name = 'ResourceLoadError';
  }
}

class ResourceTimeoutError extends Error {
  constructor(url: string, type: string, timeout: number) {
    super(`Load ${type} timeout: ${url} after ${timeout}ms`);
    this.name = 'ResourceTimeoutError';
  }
}

// 安全的属性设置函数
function setElementAttributes(
  element: HTMLElement,
  attributes?: Record<string, string>,
): void {
  if (!attributes || typeof attributes !== 'object') {
    return;
  }

  try {
    Object.entries(attributes).forEach((entry) => {
      const key = entry[0];
      const value = entry[1];
      if (key && key !== 'undefined' && value !== undefined && value !== null) {
        element.setAttribute(key, String(value));
      }
    });
  } catch (error) {
    log.warn('Failed to set element attributes:', error);
  }
}

export async function loadJS(
  url: string,
  options: Omit<LoadOptions, 'type'> = {},
): Promise<void> {
  // 添加构建时间戳打破缓存（仅对本地 vendor 资源）
  const urlWithTimestamp = url.includes('vendor/')
    ? `${url}${url.includes('?') ? '&' : '?'}t=${BUILD_TIMESTAMP}`
    : url;

  const id = options.id || `js-${btoa(url).slice(0, 10)}`;
  const attributes = options.attributes || {};
  const retryCount = options.retryCount || 2;
  const retryDelay = options.retryDelay || 1000;

  // 检查缓存（使用原始 URL 作为缓存键）
  if (resourceCache[url] && resourceCache[url].loaded) {
    return;
  }

  if (resourceCache[url] && !resourceCache[url].loaded) {
    return resourceCache[url].promise;
  }

  const loadWithRetry = async (attempt = 0): Promise<void> => {
    try {
      await loadResource(urlWithTimestamp, {
        ...options,
        type: 'js' as const,
        id,
        attributes, // 确保传递 attributes
      });
    } catch (error) {
      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return loadWithRetry(attempt + 1);
      }
      throw error;
    }
  };

  resourceCache[url] = {
    promise: loadWithRetry(),
    element: document.createElement('script'),
    loaded: false,
  };

  return resourceCache[url].promise;
}

export async function loadCSS(
  url: string,
  options: Omit<LoadOptions, 'type'> = {},
): Promise<void> {
  // 添加构建时间戳打破缓存（仅对本地 vendor 资源）
  const urlWithTimestamp = url.includes('vendor/')
    ? `${url}${url.includes('?') ? '&' : '?'}t=${BUILD_TIMESTAMP}`
    : url;

  const id = options.id || `css-${btoa(url).slice(0, 10)}`;
  const attributes = options.attributes || {};
  const retryCount = options.retryCount || 2;
  const retryDelay = options.retryDelay || 1000;

  // 检查缓存（使用原始 URL 作为缓存键）
  if (resourceCache[url] && resourceCache[url].loaded) {
    return;
  }

  if (resourceCache[url] && !resourceCache[url].loaded) {
    return resourceCache[url].promise;
  }

  const loadWithRetry = async (attempt = 0): Promise<void> => {
    try {
      await loadResource(urlWithTimestamp, {
        ...options,
        type: 'css' as const,
        id,
        attributes, // 确保传递 attributes
      });
    } catch (error) {
      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return loadWithRetry(attempt + 1);
      }
      throw error;
    }
  };

  resourceCache[url] = {
    promise: loadWithRetry(),
    element: document.createElement('link'),
    loaded: false,
  };

  return resourceCache[url].promise;
}

// 内部加载实现 - 修复版本
async function loadResource(
  url: string,
  options: LoadOptions & { type: 'js' | 'css' },
): Promise<void> {
  // 提供安全的默认值
  const type = options.type;
  const id = options.id || `${type}-${Date.now()}`;
  const attributes = options.attributes || {};
  const timeout = options.timeout || 60000;

  return new Promise((resolve, reject) => {
    // 超时处理
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new ResourceTimeoutError(url, type, timeout));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (element) {
        element.onload = null;
        element.onerror = null;
      }
    };

    let element: HTMLScriptElement | HTMLLinkElement;

    try {
      if (type === 'js') {
        const scriptElement = document.createElement('script');
        scriptElement.id = id;
        scriptElement.src = url;
        scriptElement.type = 'text/javascript';
        scriptElement.async = true;
        element = scriptElement;
      } else {
        const linkElement = document.createElement('link');
        linkElement.id = id;
        linkElement.href = url;
        linkElement.rel = 'stylesheet';
        linkElement.type = 'text/css';
        element = linkElement;
      }

      // 安全地设置属性
      setElementAttributes(element, attributes);

      element.onload = () => {
        cleanup();
        if (resourceCache[url]) {
          resourceCache[url].loaded = true;
        }
        resolve();
      };

      element.onerror = () => {
        cleanup();
        const error = new ResourceLoadError(
          `Failed to load ${type} resource: ${url}`,
          url,
          type,
        );
        if (resourceCache[url]) {
          resourceCache[url].error = error;
        }
        reject(error);
      };

      // 添加到文档
      if (type === 'js') {
        document.head.appendChild(element);
      } else {
        const firstScript = document.head.querySelector('script');
        if (firstScript) {
          document.head.insertBefore(element, firstScript);
        } else {
          document.head.appendChild(element);
        }
      }

      // 更新缓存中的元素引用
      if (resourceCache[url]) {
        resourceCache[url].element = element;
      }
    } catch (error) {
      cleanup();
      reject(
        new ResourceLoadError(
          `Failed to create ${type} element: ${error}`,
          url,
          type,
        ),
      );
    }
  });
}
