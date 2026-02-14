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
 * 对 URL 及其参数自动编码
 * 如果 URL 或参数中存在 空格、中文、&、=、?、#、% 等特殊字符，则进行编码
 * @param url - 需要编码的完整 URL
 * @returns 编码后的 URL
 */
export function autoFixedURI(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    // 分离 URL 的基础部分和查询参数部分
    const urlParts = url.split('?');
    const baseUrl = urlParts[0];
    const queryString = urlParts[1];

    // 编码基础 URL 路径部分（保留协议和域名）
    let encodedBaseUrl = baseUrl;
    const protocolMatch = baseUrl.match(/^(https?:\/\/[^\/]+)(.*)$/);

    if (protocolMatch) {
      // 保留协议和域名，只编码路径部分
      const origin = protocolMatch[1];
      const pathname = protocolMatch[2];

      if (pathname && needsEncoding(pathname)) {
        // 分段编码路径，保留斜杠
        const pathSegments = pathname.split('/').map((segment) => {
          return needsEncoding(segment) ? encodeURIComponent(segment) : segment;
        });
        encodedBaseUrl = origin + pathSegments.join('/');
      }
    } else if (needsEncoding(baseUrl)) {
      // 相对路径的情况
      const pathSegments = baseUrl.split('/').map((segment) => {
        return needsEncoding(segment) ? encodeURIComponent(segment) : segment;
      });
      encodedBaseUrl = pathSegments.join('/');
    }

    // 如果没有查询参数，直接返回
    if (!queryString) {
      return encodedBaseUrl;
    }

    // 编码查询参数
    const params = queryString.split('&');
    const encodedParams = params.map((param) => {
      const [key, value] = param.split('=');

      if (!value) {
        // 只有 key 没有 value 的情况
        return needsEncoding(key) ? encodeURIComponent(key) : key;
      }

      const encodedKey = needsEncoding(key) ? encodeURIComponent(key) : key;
      const encodedValue = needsEncoding(value)
        ? encodeURIComponent(value)
        : value;

      return `${encodedKey}=${encodedValue}`;
    });

    return `${encodedBaseUrl}?${encodedParams.join('&')}`;
  } catch (error) {
    console.error('URL encoding failed:', error);
    return url;
  }
}

/**
 * 检查字符串是否需要编码
 * @param str - 待检查的字符串
 * @returns 是否需要编码
 */
function needsEncoding(str: string): boolean {
  if (!str) return false;

  // 检查是否包含：空格、中文、&、=、?、#、% 等需要编码的字符
  const needsEncodingRegex = /[\s\u4e00-\u9fa5&=?#%]/;

  // 如果字符串已经被编码过，不再重复编码
  if (isAlreadyEncoded(str)) {
    return false;
  }

  return needsEncodingRegex.test(str);
}

/**
 * 检查字符串是否已经被编码
 * @param str - 待检查的字符串
 * @returns 是否已编码
 */
function isAlreadyEncoded(str: string): boolean {
  try {
    return str !== decodeURIComponent(str);
  } catch {
    return false;
  }
}
