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
import {
  // CheckCircleOutlined,
  GithubOutlined,
  FileTextOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { Card, Button, Space, Typography } from 'antd';
import './index.scss';
import { getAppContext } from '@/utils';
const appContext = getAppContext();
import { version } from '../../../package.json';
import {
  APP_NAME_ZH,
  APP_HOME,
  APP_REPOSITORY,
  APP_DOCS,
} from '@/constant/vars';
import logo from '../../../public/logo.png?inline';
import { Base64 } from 'js-base64';

const { Title, Paragraph, Link } = Typography;

export default function Welcome() {
  useEffect(() => {}, []);

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className='welcome-page'>
      <Card className='welcome-card'>
        <div className='welcome-header'>
          <img src={logo} className='success-icon' />
          <Title level={2}>{APP_NAME_ZH}</Title>
          <Paragraph type='secondary'>COMMUNITY EDITION</Paragraph>
        </div>

        <Paragraph className='welcome-description'>
          欢迎使用{` `}
          {APP_NAME_ZH}，您已成功安装并启动项目。
        </Paragraph>

        <div className='welcome-links'>
          <Card className='link-card'>
            <Space direction='vertical' size='large' style={{ width: '100%' }}>
              {/* 开源地址 */}
              <div className='link-item'>
                <Space
                  direction='vertical'
                  size='small'
                  style={{ width: '100%' }}
                >
                  <Title level={4}>
                    <GithubOutlined /> 开源地址
                  </Title>
                  <Paragraph>查看源代码、提交 Issue 或贡献代码</Paragraph>
                  <Button
                    type='primary'
                    icon={<GithubOutlined />}
                    onClick={() => handleLinkClick(`${APP_REPOSITORY}`)}
                  >
                    访问 GitHub
                  </Button>
                </Space>
              </div>

              {/* 开发文档 */}
              <div className='link-item'>
                <Space
                  direction='vertical'
                  size='small'
                  style={{ width: '100%' }}
                >
                  <Title level={4}>
                    <FileTextOutlined /> 开发文档
                  </Title>
                  <Paragraph>了解项目架构、API 说明和开发指南</Paragraph>
                  <Button
                    type='primary'
                    icon={<FileTextOutlined />}
                    onClick={() => handleLinkClick(`${APP_DOCS}`)}
                  >
                    查看文档
                  </Button>
                </Space>
              </div>

              {/* 测试页面 */}
              <div className='link-item'>
                <Space
                  direction='vertical'
                  size='small'
                  style={{ width: '100%' }}
                >
                  <Title level={4}>
                    <ExperimentOutlined /> 试一试
                  </Title>
                  <Paragraph>
                    查看第一个文件预览样例，这是一篇 docx 文档
                  </Paragraph>
                  <Button
                    type='primary'
                    icon={<ExperimentOutlined />}
                    onClick={() =>
                      handleLinkClick(
                        `${appContext}/preview/view?data=${Base64.encode(
                          JSON.stringify({
                            path: '/opt/fileview/assets/sample.docx',
                            watermark: {
                              value: '在线文件预览\nbasemetas.cn',
                            },
                          }),
                        )}`,
                      )
                    }
                  >
                    查看样例
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>
        </div>

        <div className='welcome-footer'>
          <Paragraph type='secondary'>
            <Link onClick={() => handleLinkClick(`${APP_HOME}`)}>
              {APP_NAME_ZH} v{version}
            </Link>
          </Paragraph>
        </div>
      </Card>
    </div>
  );
}
