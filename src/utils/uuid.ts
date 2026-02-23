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

import { v4 as uuidv4 } from 'uuid';

const key = 'fv-clientId';

// 从 cookie 中获取 clientId
const getCookie = (name: string): string | null => {
  const matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' +
        // eslint-disable-next-line no-useless-escape
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
        '=([^;]*)',
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : null;
};

// 设置 cookie（不设置 expires，关闭浏览器后失效）
const setCookie = (name: string, value: string): void => {
  // 使用当前路径，而不是根目录
  const path = window.location.pathname;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}`;
};

let clientId = getCookie(key);
if (!clientId) {
  clientId = uuidv4();
  // 写 cookie（会话级别，关闭浏览器后失效）
  setCookie(key, clientId);
}

export { clientId };
