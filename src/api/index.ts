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

import {
  post,
  get,
  longPolling,
  getApiContext,
  log,
  autoFixedURI,
} from '@/utils';
const apiContext = getApiContext();

/**
  mode值枚举：
  DIRECT，表示直接预览，在此模式下，Status 有三个状态：SUCCESS、FAILED、NOT_SUPPORTED
  CONVERT ，表示需要转换，在此模式下，Status 有四个状态：CONVERTING、SUCCESS、FAILED、NOT_SUPPORTED

  Status值枚举
  "SUCCESS"：表示直接预览/转换地址生成成功
  "CONVERTING"：表示正在转换中
  "NOT_SUPPORTED"：表示不支持的文件类型
  "NOT_FOUND"：表示文件未找到
  "FAILED"：表示直接预览/转换地址生成失败
  "PASSWORD_REQUIRED": 表示需要密码
  "PASSWORD_INCORRECT": 表示密码错误
* */
const FINISHED_STATUS_ENUM = [
  'FAILED',
  'NOT_SUPPORTED',
  'NOT_FOUND',
  'SUCCESS',
  'PASSWORD_REQUIRED',
  'PASSWORD_INCORRECT',
];

// 请求转换文件,兼容网络和本地文件
// 内部执行长轮询
export async function requestConvertFile(options: {
  networkFileUrl?: string;
  originalFilePath?: string;
  fileName?: string;
}): Promise<any> {
  const { networkFileUrl, originalFilePath, fileName } = options;
  if (!networkFileUrl && !originalFilePath) {
    return {
      code: 400,
      message: '参数缺失，请检查后重试。',
      data: null,
    };
  }

  // const endpointUrl = originalFilePath
  //   ? `${apiContext}/preview/localFile`
  //   : `${apiContext}/preview/netFile`;
  const endpointUrl = networkFileUrl
    ? `${apiContext}/netFile`
    : `${apiContext}/localFile`;

  const data = {
    fileName: fileName !== '' ? fileName : undefined,
  } as any;
  if (networkFileUrl) {
    data.networkFileUrl = autoFixedURI(networkFileUrl);
  } else {
    data.srcRelativePath =
      originalFilePath !== '' ? originalFilePath : undefined;
  }
  return new Promise((resolve, reject) => {
    post(endpointUrl, data)
      .then((res) => {
        const { code, data: responseData, message } = res.data;

        const { status, fileId } = responseData;

        // code非0，或状态为 SUCCESS、NOT_SUPPORTED、FAILED，直接返回错误信息
        if (code !== 0 || FINISHED_STATUS_ENUM.includes(status)) {
          return resolve({ code, data: responseData, message });
        }

        // 下载中、转换中的，需要启动长轮询，前端30秒超时（服务端超时需要小于30秒）
        standardLongPolling({ networkFileUrl, originalFilePath, fileId })
          .then((res2) => {
            log.debug('longPolling 返回');
            return resolve(res2.data);
          })
          .catch((err) => {
            reject(err);
            log.error(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// 长轮询
export async function standardLongPolling(options: {
  networkFileUrl?: string;
  originalFilePath?: string;
  fileId: string;
}) {
  const { fileId } = options;
  return longPolling({
    url: `${apiContext}/status/poll`,
    method: 'POST',
    data: {
      // networkFileUrl: networkFileUrl !== '' ? networkFileUrl : undefined,
      // srcRelativePath: originalFilePath !== '' ? originalFilePath : undefined,
      fileId: fileId !== '' ? fileId : undefined,
    },
    maxAttempts: 100, // 最大轮询次数
    successCondition: (responseData) => {
      // 轮询认为服务端处理结束的判断
      const {
        data: {
          data: { status },
        },
      } = responseData;
      return FINISHED_STATUS_ENUM.includes(status);
    },
  });
}

// 验证密码
export async function verifyPassword({
  originalFilePath,
  password,
}: {
  originalFilePath: string;
  password: string;
}): Promise<any> {
  const url = `${apiContext}/password/unlock`;
  return new Promise((resolve, reject) => {
    // 真实 API 请求（生产环境下使用）
    post<string>(url, { password, originalFilePath })
      .then((res: any) => {
        const {
          code,
          data: { valid = false },
          message,
        } = res.data;
        if (code !== 0 || !valid) {
          reject({ code, valid, message, t: Date.now() });
          return;
        }
        resolve({ code, valid, message, t: Date.now() });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// 请求文本内容
export async function getFileTextContent(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    get<string>(url, {
      responseType: 'text',
    })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// 请求arrayBuffer
export async function getFileArrayBuffer(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
    })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// 请求压缩包结构
export async function getArchiveTree(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    get<ArrayBuffer>(url, {
      responseType: 'json',
    })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
