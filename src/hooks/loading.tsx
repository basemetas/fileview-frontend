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

import { useEffect } from 'react';
import { Spin, Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import ReactDOM from 'react-dom';

// 全局单例容器引用
let loadingContainer: HTMLDivElement | null = null;
let isLoadingShown = false;

// 创建或获取loading容器
const getOrCreateContainer = () => {
  if (!loadingContainer) {
    loadingContainer = document.createElement('div');
    loadingContainer.id = 'global-loading-container';
    loadingContainer.style.position = 'fixed';
    loadingContainer.style.top = '0';
    loadingContainer.style.left = '0';
    loadingContainer.style.width = '100vw';
    loadingContainer.style.height = '100vh';
    loadingContainer.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    loadingContainer.style.display = 'flex';
    loadingContainer.style.justifyContent = 'center';
    loadingContainer.style.alignItems = 'center';
    loadingContainer.style.zIndex = '9999';
  }
  return loadingContainer;
};

// 显示loading
const showLoading = () => {
  // 如果已经显示，则直接返回
  if (isLoadingShown) {
    return;
  }
  const container = getOrCreateContainer();

  // 渲染loading组件
  ReactDOM.render(
    <Spin
      indicator={
        <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />
      }
      size={'large'}
    />,
    container,
  );

  // 添加到DOM中
  if (!container.parentElement) {
    document.body.appendChild(container);
  }

  isLoadingShown = true;
};

// 显示加载失败
const showLoadingError = (title?: string, subTitle?: string) => {
  // 隐藏可能正在显示的loading
  if (isLoadingShown && loadingContainer) {
    // ReactDOM.unmountComponentAtNode(loadingContainer);
    hideLoading();
  }

  const container = getOrCreateContainer();

  // 渲染错误结果组件
  ReactDOM.render(
    <Result
      status={'error'}
      title={title || '文件预览失败'}
      subTitle={subTitle || '不支持的格式或加载错误，请稍后重试'}
      extra={[
        <button
          key={'retry'}
          onClick={hideLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          关闭
        </button>,
      ]}
    />,
    container,
  );

  // 添加到DOM中
  if (!container.parentElement) {
    document.body.appendChild(container);
  }

  isLoadingShown = true;
};

// 隐藏loading
const hideLoading = () => {
  if (!isLoadingShown || !loadingContainer) {
    return;
  }

  // 从DOM中移除
  ReactDOM.unmountComponentAtNode(loadingContainer);
  if (loadingContainer.parentElement) {
    loadingContainer.parentElement.removeChild(loadingContainer);
  }

  // 重置状态
  loadingContainer = null;
  isLoadingShown = false;
};

// 自定义hook
export const useLoading = () => {
  // 确保组件卸载时清理
  useEffect(() => {
    return () => {
      hideLoading();
    };
  }, []);

  return {
    showLoading,
    hideLoading,
    showLoadingError,
  };
};
