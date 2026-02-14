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
 * 基于 axios 的请求库，支持 mock、拦截器、错误处理、响应数据处理、缓存、超时重试
 * */

import axios from 'axios';
import log from './logger';
import { clientId } from './uuid';

// 定义请求配置接口
export interface RequestConfig {
  // 是否启用缓存
  cache?: boolean;
  // 重试次数
  retry?: number;
  // 重试延迟时间（毫秒）
  retryDelay?: number;
  // 是否启用mock
  mock?: boolean;
  // 超时时间（毫秒）
  timeout?: number;
  // 其他axios配置
  [key: string]: any;
}

// 定义响应数据接口
export interface ResponseData<T = any> {
  code: number;
  data: T;
  message: string;
}

// 定义长轮询配置接口
export interface LongPollingConfig<T = any> extends RequestConfig {
  // 轮询间隔（毫秒）
  interval?: number;
  // 最大轮询次数
  maxAttempts?: number;
  // 成功条件判断函数
  // eslint-disable-next-line no-unused-vars
  successCondition?: (responseData: ResponseData<T>) => boolean;
}

// 缓存存储
const cacheStore: Map<string, any> = new Map();

// 创建axios实例
const axiosInstance = axios.create({
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 X-Client-Id
axiosInstance.interceptors.request.use(
  (config) => {
    // 在请求头中添加 X-Client-Id
    config.headers = config.headers || {};
    config.headers['X-Client-Id'] = clientId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 生成缓存key
const generateCacheKey = (config: any): string => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`;
};

// 检查是否有缓存
const getCache = (key: string): any => {
  return cacheStore.get(key);
};

// 设置缓存
const setCache = (key: string, data: any): void => {
  cacheStore.set(key, data);
};

// 延迟函数
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 核心请求函数
const request = async <T = any>(
  config: RequestConfig,
): Promise<ResponseData<T>> => {
  const {
    cache = false,
    retry = 0,
    retryDelay = 1000,
    timeout,
    ...axiosConfig
  } = config;

  // 如果指定了超时时间，更新axios实例的超时设置
  if (timeout !== undefined) {
    axiosConfig.timeout = timeout;
  }

  // 如果启用缓存，先检查缓存
  if (cache) {
    const cacheKey = generateCacheKey(config);
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  let lastError: any;

  // 重试机制
  for (let i = 0; i <= retry; i++) {
    try {
      const response: any = await axiosInstance.request(axiosConfig as any);

      // 如果启用缓存，保存响应数据到缓存
      if (cache) {
        const cacheKey = generateCacheKey(config);
        setCache(cacheKey, response);
      }

      // 确保返回的数据符合ResponseData格式
      const result: ResponseData<T> = {
        code: response.code || 200,
        data: response.data || response,
        message: response.message || 'success',
      };

      return result;
    } catch (error) {
      lastError = error;

      // 如果不是最后一次重试，等待一段时间后重试
      if (i < retry) {
        await delay(retryDelay);
        log.warn(`Request failed, retrying... (${i + 1}/${retry})`);
      }
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError;
};

// GET请求
export const get = <T = any>(
  url: string,
  config?: RequestConfig,
): Promise<ResponseData<T>> => {
  return request<T>({ method: 'GET', url, ...config });
};

// POST请求
export const post = <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig,
): Promise<ResponseData<T>> => {
  return request<T>({ method: 'POST', url, data, ...config });
};

// PUT请求
export const put = <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig,
): Promise<ResponseData<T>> => {
  return request<T>({ method: 'PUT', url, data, ...config });
};

// DELETE请求
export const del = <T = any>(
  url: string,
  config?: RequestConfig,
): Promise<ResponseData<T>> => {
  return request<T>({ method: 'DELETE', url, ...config });
};

// PATCH请求
export const patch = <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig,
): Promise<ResponseData<T>> => {
  return request<T>({ method: 'PATCH', url, data, ...config });
};

// 长轮询请求函数
export const longPolling = async <T = any>(
  config: LongPollingConfig<T>,
): Promise<ResponseData<T>> => {
  const {
    interval = 1000, // 默认1s轮询间隔
    maxAttempts = 1000, // 默认最多轮询100次
    successCondition,
    timeout = 60000, // 默认60秒超时
    ...requestConfig
  } = config;

  // 如果没有指定成功条件，默认认为code为200时表示成功
  const defaultSuccessCondition = (response: ResponseData<T>): boolean => {
    return response.code === 200;
  };

  const isSuccess = successCondition || defaultSuccessCondition;

  // 创建带超时控制的请求函数
  const requestWithTimeout = async (
    reqConfig: RequestConfig,
  ): Promise<ResponseData<T>> => {
    return new Promise((resolve, reject) => {
      // 设置超时定时器
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      // 发起请求，不使用默认重试机制
      request<T>({
        ...reqConfig,
        retry: 0, // 禁用重试
      })
        .then((response) => {
          // 如果返回数据中包含fileId，则将其添加到请求数据中
          const {
            data: { fileId = '' },
          } = response.data as any;
          fileId && (reqConfig.data = { ...reqConfig.data, fileId });
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await requestWithTimeout(requestConfig);

      // 检查是否满足成功条件
      if (isSuccess(response)) {
        return response;
      }

      // 如果不是最后一次尝试，等待指定间隔后继续轮询
      if (attempt < maxAttempts) {
        await delay(interval);
      }
    } catch (error) {
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxAttempts) {
        throw error;
      }
      // 否则等待指定间隔后继续轮询
      await delay(interval);
    }
  }

  // 达到最大尝试次数仍未成功，抛出错误
  throw new Error(`Long polling failed after ${maxAttempts} attempts`);
};

// 导出axios实例，方便直接使用
export { axiosInstance };

// 默认导出request函数
export default request;
