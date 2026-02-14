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

import { Modal, Input } from 'antd';
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './index.module.scss';
import { LockOutlined } from '@ant-design/icons';
import { log } from '@/utils';

const PasswordModal = (props: {
  visible: boolean; // 密码弹窗显示状态
  errorMsg?: string; // 密码错误提示信息
  onSubmit: (password: string) => void; // 密码提交回调
}) => {
  const { visible, errorMsg, onSubmit } = props;
  log.debug('PasswordModal', visible, errorMsg);

  // 密码可见状态
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  // 密码错误提示信息
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>(
    errorMsg ? errorMsg : '',
  );
  // 输入的密码
  const [password, setPassword] = useState<string>('');
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false); // 确认按钮loading状态
  const passwordInput = useRef<any>(null);

  useEffect(() => {
    log.debug('密码弹窗显示状态：', visible);
    if (visible) {
      setPassword('');
      setPasswordErrorMsg(errorMsg ? errorMsg : '');
      setConfirmLoading(false);
      passwordInput.current?.focus();
    }
  }, [visible, passwordInput, errorMsg]);

  const handlePasswordSubmit = useCallback(() => {
    const password = passwordInput.current?.input?.value || '';
    log.debug('提交密码：', password);
    // 空校验
    if (!password || password.trim() === '') {
      //   setPasswordError(true);
      setPasswordErrorMsg('请输入密码');
      return; // 空密码不执行回调
    }
    setConfirmLoading(true);
    onSubmit(password);
  }, []);

  return (
    <Modal
      open={visible}
      title={
        <>
          <LockOutlined style={{ marginRight: 8 }} />
          文件已加密
        </>
      }
      mask={false}
      confirmLoading={confirmLoading}
      onOk={() => {
        log.debug('点击了确定按钮');
        handlePasswordSubmit();
      }}
      onCancel={() => {}}
      className={styles.passwordModal}
      closable={false}
      keyboard={false}
      maskClosable={false}
      cancelButtonProps={{ disabled: true }}
      okText='确定'
      cancelText='取消'
    >
      <div className={styles.passwordTip}>该文件已加密，请输入密码查看</div>
      <Input.Password
        ref={passwordInput}
        placeholder='请输入密码'
        status={passwordErrorMsg ? 'error' : ''}
        value={password}
        visibilityToggle={{
          visible: passwordVisible,
          onVisibleChange: setPasswordVisible,
        }}
        onChange={(e) => {
          setPassword(e.target.value);
          //   setPasswordError(false);
          setPasswordErrorMsg('');
        }}
      />
      {passwordErrorMsg && (
        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
          {passwordErrorMsg}
        </div>
      )}
    </Modal>
  );
};

export default PasswordModal;
