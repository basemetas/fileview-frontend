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

import { useState } from 'react';
import { Button, Space } from 'antd';

/**
 * 测试组件 - 用于验证 ErrorBoundary 功能
 * 使用方法：
 * 1. 在需要测试的页面导入此组件
 * 2. 将其放在 ErrorBoundary 内部
 * 3. 点击按钮触发错误
 */

// 故意抛出错误的组件
const ThrowError = () => {
  throw new Error('这是一个测试错误：组件渲染时抛出异常');
  return <div>这段代码永远不会执行</div>;
};

export const ErrorBoundaryTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  if (shouldThrow) {
    return <ThrowError />;
  }

  return (
    <div
      style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}
    >
      <h3>ErrorBoundary 测试工具</h3>
      <p>点击下面的按钮来测试错误边界功能：</p>
      <Space>
        <Button type='primary' danger onClick={() => setShouldThrow(true)}>
          触发渲染错误
        </Button>
        <Button onClick={() => setClickCount((prev) => prev + 1)}>
          正常点击测试 (已点击 {clickCount} 次)
        </Button>
      </Space>
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: '#fff',
          borderRadius: '4px',
        }}
      >
        <p>
          <strong>说明：</strong>
        </p>
        <ul>
          <li>
            点击"触发渲染错误"会立即抛出异常，ErrorBoundary 会捕获并显示兜底界面
          </li>
          <li>点击"正常点击测试"验证正常功能不受影响</li>
          <li>触发错误后可以使用兜底界面的"刷新页面"或"返回上一页"按钮恢复</li>
        </ul>
      </div>
    </div>
  );
};

// 异步错误测试组件（注意：ErrorBoundary 无法捕获异步错误）
export const AsyncErrorTest = () => {
  const handleAsyncError = () => {
    setTimeout(() => {
      throw new Error('异步错误：ErrorBoundary 无法捕获此类错误');
    }, 100);
  };

  return (
    <div
      style={{
        padding: '20px',
        background: '#fff3cd',
        borderRadius: '8px',
        marginTop: '16px',
      }}
    >
      <h4>⚠️ 异步错误测试（ErrorBoundary 无法捕获）</h4>
      <Button onClick={handleAsyncError}>触发异步错误（不会被捕获）</Button>
      <p style={{ marginTop: '8px', fontSize: '12px', color: '#856404' }}>
        注意：此按钮会在控制台抛出错误，但 ErrorBoundary
        无法捕获异步代码中的错误
      </p>
    </div>
  );
};

export default ErrorBoundaryTest;
