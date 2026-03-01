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

import { useEffect, Suspense, useState, useCallback } from 'react';
import { useLoading } from '@/hooks/loading';

import { requestConvertFile, verifyPassword } from '@/api';
import { getComponentLoader, getRenderType, log } from '@/utils';
import PasswordModal from '@/components/password';
import { IEntryProps, WaterMarkProps, PermissionProps, IMode } from '@/types';
import AppContext from '@/context';

const Entry = (props: IEntryProps) => {
  const { showLoading, hideLoading, showLoadingError } = useLoading();
  const [renderComponent, setRenderComponent] = useState<any>(null);
  const {
    url,
    path,
    fileName,
    displayName,
    mode = IMode.normal,
    watermark,
    isRoot = true,
  } = props;
  log.debug('Entry props', props);
  const [loadingError, setLoadingError] = useState<boolean>(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>(''); // 密码错误提示信息
  const [passwordModalVisible, setPasswordModalVisible] =
    useState<boolean>(false); // 密码弹窗显示状态

  // 规范传参与服务端一致
  const networkFileUrl = url;
  let originalFilePath = path;

  // 最简单的请求文件转换并返回结果
  const requestFileRender = useCallback(async () => {
    showLoading();
    try {
      const result = await requestConvertFile({
        networkFileUrl,
        originalFilePath,
        fileName,
      });

      const {
        data: { status, originalFilePath: serverOriginalFilePath },
      } = result;

      // 缓存 serverFilePath
      // eslint-disable-next-line react-hooks/exhaustive-deps
      originalFilePath = serverOriginalFilePath;

      // 如果返回需要密码
      if (['PASSWORD_REQUIRED', 'PASSWORD_INCORRECT'].includes(status)) {
        return waitVerifyPassword();
      } else {
        return handleResult(result);
      }
    } catch (error: any) {
      log.error('文件转换失败', error.message);
      showLoadingError('文件转换失败', error.message);
      return setLoadingError(true);
    }
  }, []);

  // 等待密码输入,验证密码并发起新的轮询,返回结果
  const waitVerifyPassword = useCallback(() => {
    log.debug('等待密码输入');
    hideLoading();
    setPasswordErrorMsg(''); // 重置错误消息
    setPasswordModalVisible(true); // 显示弹窗
  }, [hideLoading]);

  // 缓存 handlePasswordSubmit，避免每次渲染创建新函数
  const handlePasswordSubmit = useCallback(
    (password) => {
      log.debug('开始验证密码...');

      // 验证密码
      verifyPassword({ password, originalFilePath: originalFilePath || '' })
        .then((result) => {
          log.debug('密码验证结果', result);
          setPasswordModalVisible(false); // 验证成功后关闭弹窗

          // 触发初始转换请求
          requestFileRender();
        })
        .catch((error) => {
          log.error('验证密码失败', error);
          setPasswordErrorMsg('');
          setPasswordErrorMsg(error.message);
        });
    },
    [requestFileRender, originalFilePath],
  );

  // 处理最终结果
  const handleResult = useCallback(
    (result: any) => {
      log.debug('处理最终结果', result);

      const { code, data } = result;

      if (code !== 0) {
        setLoadingError(true);
        return;
      } else {
        // hideLoading();
      }
      const {
        status,
        error,
        originalFileName,
        previewUrl,
        originalFileFormat,
        previewFileFormat,
        originalFilePath,
        srcRelativePath,
      } = data;
      log.debug({
        status,
        error,
        originalFileName,
        previewUrl,
        originalFileFormat,
        previewFileFormat,
        originalFilePath,
        srcRelativePath,
      });

      if (['PASSWORD_REQUIRED', 'PASSWORD_INCORRECT'].includes(status)) {
        return waitVerifyPassword();
      }

      // 如果服务端明确返回了失败
      if (['FAILED'].includes(status)) {
        log.error('文件转换失败 ', error || '');
        // showLoadingError 是全局 UI，不需要检查组件挂载状态
        showLoadingError(undefined, error || '文件转换失败');
        setLoadingError(true);
        return;
      }

      // 根据文件格式判断渲染方式
      const renderType = getRenderType({
        status,
        previewFileFormat,
        originalFileFormat,
      });
      // 根据 renderType 匹配渲染器类型
      const ComponentLoader = getComponentLoader(renderType);
      // log.debug('ComponentLoader', ComponentLoader);

      // TODO: 读取权限配置
      const permission = {
        print: true,
        download: false,
        copy: true,
        search: true,
        fullscreen: true,
        pageLimit: 0,
        rotate: true,
        doublePage: true,
        zoom: true,
        thumbnail: true,
      } as PermissionProps;

      setRenderComponent(
        <AppContext.Provider
          value={{
            mode,
            permission,
            watermark: watermark || ({} as WaterMarkProps),
            componentProps: data as any,
          }}
        >
          <ComponentLoader
            renderType={renderType}
            isRoot={isRoot}
            fileName={originalFileName}
            displayName={displayName}
            type={renderType}
            src={previewUrl}
            srcRelativePath={srcRelativePath}
            originalFilePath={originalFilePath}
            originalFileFormat={originalFileFormat}
            previewFileFormat={previewFileFormat}
            error={error}
            mode={mode}
          />
        </AppContext.Provider>,
      );

      // 设置标题
      document.title = displayName || originalFileName;
    },
    [displayName, mode, waitVerifyPassword, showLoadingError, watermark],
  );

  // debug 参数
  useEffect(() => {
    if (!url && !path) {
      showLoadingError('参数错误', '请检查参数后重试');
      setLoadingError(true);
      return;
    }
    requestFileRender();
  }, [url, path, requestFileRender, showLoadingError]);

  return (
    <>
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
        {!loadingError && renderComponent}
      </Suspense>

      {/* 密码输入弹窗 */}
      <PasswordModal
        visible={passwordModalVisible}
        onSubmit={handlePasswordSubmit}
        errorMsg={passwordErrorMsg}
      />
    </>
  );
};

export default Entry;
