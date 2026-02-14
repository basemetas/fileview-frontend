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
    public url: string,
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
    Object.entries(attributes).forEach(([key, value]) => {
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
  const {
    id = `js-${btoa(url).slice(0, 10)}`,
    attributes = {},
    retryCount = 2,
    retryDelay = 1000,
  } = options;

  // 检查缓存
  if (resourceCache[url] && resourceCache[url].loaded) {
    return;
  }

  if (resourceCache[url] && !resourceCache[url].loaded) {
    return resourceCache[url].promise;
  }

  const loadWithRetry = async (attempt = 0): Promise<void> => {
    try {
      await loadResource(url, {
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
  const {
    id = `css-${btoa(url).slice(0, 10)}`,
    attributes = {},
    retryCount = 2,
    retryDelay = 1000,
  } = options;

  // 检查缓存
  if (resourceCache[url] && resourceCache[url].loaded) {
    return;
  }

  if (resourceCache[url] && !resourceCache[url].loaded) {
    return resourceCache[url].promise;
  }

  const loadWithRetry = async (attempt = 0): Promise<void> => {
    try {
      await loadResource(url, {
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
  const {
    type,
    id = `${type}-${Date.now()}`,
    attributes = {},
    timeout = 60000,
  } = options;

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
