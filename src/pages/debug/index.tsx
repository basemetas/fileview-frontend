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

import React, { useEffect } from 'react';
import { Typography } from 'antd';
import qs from 'qs';
import {
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
  CodeOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import './index.scss';
import {
  getAppContext,
  isMobile,
  isPhone,
  isPad,
  isTouchSupported,
} from '@/utils';
const appContext = getAppContext();

const { Title } = Typography;

// 文件类型定义
interface FileItem {
  name: string;
  url: string;
  icon: React.ReactElement;
  badge?: string; // 可选标记（如：加密标识）
  options?: any;
}

interface FileGroup {
  title: string;
  files: FileItem[];
}

// 示例文件分组（带状态标记）
const FILE_GROUPS: FileGroup[] = [
  {
    title: '特殊场景',
    files: [
      {
        name: 'sample 特殊文件名%=&.docx',
        url: 'https://test.moqisoft.com/sample 特殊文件名%=&.docx?name=nanjing daxue&title=南京 大学',
        icon: <FileWordOutlined />,
      },
      {
        name: 'OFD文件',
        url: 'https://test.moqisoft.com/test.ofd?index=3',
        badge: '嵌入模式',
        options: {
          mode: 'embed',
        },
        icon: <FilePdfOutlined />,
      },
    ],
  },
  {
    title: '加密文档',
    files: [
      {
        name: '加密 DOCX 文件',
        url: 'https://test.moqisoft.com/JIAMI-123.docx',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 DOC 文件',
        url: 'https://test.moqisoft.com/jiami-123.doc',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 XLSX 文件',
        url: 'https://test.moqisoft.com/jiami-123.xlsx',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 XLS 文件',
        url: 'https://test.moqisoft.com/jiami-123.xls',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 PPTX 文件',
        url: 'https://test.moqisoft.com/jiami-123.pptx',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 PPT 文件',
        url: 'https://test.moqisoft.com/jiami-123.ppt',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 PDF 文件',
        url: 'https://test.moqisoft.com/jiami-123.pdf',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 ZIP 文件',
        url: 'https://test.moqisoft.com/epub%E9%97%AE%E9%A2%98%E5%88%86%E6%9E%90-%E5%AF%86%E7%A0%81123.zip',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 WPS 文件',
        url: 'https://test.moqisoft.com/jiami-123.wps',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 WPT 文件',
        url: 'https://test.moqisoft.com/jiami-123.wpt',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 ET 文件',
        url: 'https://test.moqisoft.com/jiami-123.et',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 ETT 文件',
        url: 'https://test.moqisoft.com/jiami-123.ett',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 DPS 文件',
        url: 'https://test.moqisoft.com/jiami-123.dps',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
      {
        name: '加密 DPT 文件',
        url: 'https://test.moqisoft.com/jiami-123.dpt',
        icon: <FileWordOutlined />,
        badge: '加密(密码123)',
      },
    ],
  },
  {
    title: '文档/脑图/流程图',
    files: [
      {
        name: 'DOC 文件',
        url: 'https://test.moqisoft.com/sample.doc',
        icon: <FileWordOutlined />,
      },
      {
        name: 'DOCX 文件',
        url: 'https://test.moqisoft.com/%E4%BA%A7%E5%93%81%E4%BB%8B%E7%BB%8D.docx',
        icon: <FileWordOutlined />,
      },
      {
        name: 'WPS 文件',
        url: 'https://test.moqisoft.com/%E6%96%87%E6%A1%A3%E6%9D%83%E9%99%90%E5%8F%8A%E5%86%85%E5%AE%B9%E7%BC%96%E8%BE%91%E6%96%B9%E6%A1%88%E5%BB%BA%E8%AE%AE.wps',
        icon: <FileWordOutlined />,
      },
      {
        name: 'WPT 文件',
        url: 'https://test.moqisoft.com/%E6%96%87%E6%A1%A3%E6%9D%83%E9%99%90%E5%8F%8A%E5%86%85%E5%AE%B9%E7%BC%96%E8%BE%91%E6%96%B9%E6%A1%88%E5%BB%BA%E8%AE%AE.wpt',
        icon: <FileWordOutlined />,
      },
      {
        name: 'RTF 文件',
        url: 'https://test.moqisoft.com/123.rtf',
        icon: <FileWordOutlined />,
      },
      {
        name: 'PPTX 文件',
        url: 'https://test.moqisoft.com/蓝色大气年终汇报PPT模板.pptx',
        icon: <FilePdfOutlined />,
      },
      {
        name: 'PDF 文件',
        url: 'https://test.moqisoft.com/25.pdf',
        icon: <FilePdfOutlined />,
        // badge: 'PDF',
      },
      {
        name: 'OFD 文件',
        url: 'https://test.moqisoft.com/test.ofd',
        icon: <FilePdfOutlined />,
      },
      {
        name: 'MD 文件',
        url: 'https://test.moqisoft.com/example.md',
        icon: <FileWordOutlined />,
      },
      {
        name: 'EPUB 文件',
        url: 'https://test.moqisoft.com/人类简史（多看）V1.0.epub',
        icon: <FileWordOutlined />,
      },
      {
        name: 'XMIND 文件',
        url: 'https://test.moqisoft.com/B%20C%20G%20%E7%9F%A9%E9%98%B5.xmind',
        icon: <CodeOutlined />,
      },
      {
        name: 'XMIND 文件',
        url: 'https://test.moqisoft.com/%E4%B8%AD%E5%BF%83%E4%B8%BB%E9%A2%98.xmind',
        icon: <CodeOutlined />,
      },
      {
        name: 'BPMN 文件',
        url: 'https://test.moqisoft.com/diagram.bpmn',
        icon: <CodeOutlined />,
      },
      {
        name: 'VSD 文件',
        url: 'https://test.moqisoft.com/MVPSession1SimpleTimeline.vsd',
        icon: <CodeOutlined />,
      },
      {
        name: 'VSDX 文件',
        url: 'https://test.moqisoft.com/tf16403429.vsdx',
        icon: <CodeOutlined />,
      },
      {
        name: 'DRAWIO 文件',
        url: 'https://test.moqisoft.com/test.drawio',
        icon: <CodeOutlined />,
      },
    ],
  },
  {
    title: '表格',
    files: [
      {
        name: 'XLSX 文件',
        url: 'https://test.moqisoft.com/excel.xlsx',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'XLSX 文件（图表图片）',
        url: 'https://test.moqisoft.com/pic-chart.xlsx',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'XLSX 文件（公式）',
        url: 'https://test.moqisoft.com/%E5%85%AC%E5%BC%8F.xlsx',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'XLSX 文件（引用）',
        url: 'https://test.moqisoft.com/%E5%85%AC%E5%BC%8F-%E5%B8%A6%E5%BC%95%E7%94%A8.xlsx',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'XLS 文件（复杂公式）',
        url: 'https://test.moqisoft.com/%E5%A4%8D%E6%9D%82%E5%85%AC%E5%BC%8F.xls',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'XLS 文件',
        url: 'https://test.moqisoft.com/考勤报表_20240301-20240331.xls',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'XLT 文件',
        url: 'https://test.moqisoft.com/考勤报表_20240301-20240331.xlt',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'ET 文件',
        url: 'https://test.moqisoft.com/考勤报表_20240301-20240331.et',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'ETT 文件',
        url: 'https://test.moqisoft.com/考勤报表_20240301-20240331.ett',
        icon: <FileExcelOutlined />,
      },
      {
        name: 'CSV 文件',
        url: 'https://test.moqisoft.com/考勤报表_20240301-20240331.csv',
        icon: <FileExcelOutlined />,
      },
    ],
  },
  {
    title: '图片',
    files: [
      {
        name: 'PNG 文件',
        url: 'https://test.moqisoft.com/%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F%E7%AD%89%E7%89%88%E6%9C%AC.png',
        icon: <FileImageOutlined />,
      },
      {
        name: 'BMP 文件',
        url: 'https://test.moqisoft.com/1111.bmp',
        icon: <FileImageOutlined />,
      },
      {
        name: 'TIFF 文件',
        url: 'https://test.moqisoft.com/Sample-Tiff-File-download-for-Testing.tiff',
        icon: <FileImageOutlined />,
      },
      {
        name: 'PSD 文件',
        url: 'https://test.moqisoft.com/%E8%BD%AC%E7%9B%98%E5%BA%95%E5%9B%BE.psd',
        icon: <FileImageOutlined />,
      },
      {
        name: 'SVG 文件',
        url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
        icon: <FileImageOutlined />,
      },
      {
        name: 'TGA 文件',
        url: 'https://test.moqisoft.com/earth.tga',
        icon: <FileImageOutlined />,
      },
      {
        name: 'WMF 文件',
        url: 'https://test.moqisoft.com/sample.wmf',
        icon: <FileImageOutlined />,
      },
      {
        name: 'EMF 文件',
        url: 'https://test.moqisoft.com/example.emf',
        icon: <FileImageOutlined />,
      },
    ],
  },
  {
    title: '代码及文本',
    files: [
      {
        name: 'JSON 文件',
        url: 'https://test.moqisoft.com/playlist.json',
        icon: <CodeOutlined />,
      },
      {
        name: 'TXT 文件',
        url: 'https://test.moqisoft.com/%E4%B9%90%E5%98%89%E4%B9%90%E6%B4%BB%E5%8A%A8%E6%B5%8B%E7%AE%97.txt',
        icon: <CodeOutlined />,
      },
      {
        name: 'GITIGNORE 文件',
        url: 'https://test.moqisoft.com/.gitignore',
        icon: <CodeOutlined />,
      },
      {
        name: 'JS 文件',
        url: 'https://test.moqisoft.com/vitest.config.js',
        icon: <CodeOutlined />,
      },
      {
        name: 'TS 文件',
        url: 'https://test.moqisoft.com/event.ts',
        icon: <CodeOutlined />,
      },
      {
        name: 'YML 文件',
        url: 'https://test.moqisoft.com/docker-compose.yml',
        icon: <CodeOutlined />,
      },
      {
        name: 'CMD 文件',
        url: 'https://test.moqisoft.com/mvnw.cmd',
        icon: <CodeOutlined />,
      },
      {
        name: 'XML 文件',
        url: 'https://test.moqisoft.com/pom.xml',
        icon: <CodeOutlined />,
      },
      {
        name: 'JAVA 文件',
        url: 'https://test.moqisoft.com/Application.java',
        icon: <CodeOutlined />,
      },
      {
        name: 'HTML 文件',
        url: 'https://test.moqisoft.com/example.html',
        icon: <CodeOutlined />,
      },
      {
        name: 'VUE 文件',
        url: 'https://test.moqisoft.com/Main.vue',
        icon: <CodeOutlined />,
      },
      {
        name: 'TSX 文件',
        url: 'https://test.moqisoft.com/options.tsx',
        icon: <CodeOutlined />,
      },
      {
        name: 'SCSS 文件',
        url: 'https://test.moqisoft.com/common.scss',
        icon: <CodeOutlined />,
      },
      {
        name: 'SH 文件',
        url: 'https://test.moqisoft.com/docker-build.sh',
        icon: <CodeOutlined />,
      },
      {
        name: 'LOG 文件',
        url: 'https://test.moqisoft.com/bootstrap.log',
        icon: <CodeOutlined />,
      },
    ],
  },
  {
    title: '压缩包/可执行文件/二进制文件',
    files: [
      {
        name: '文件组合',
        url: 'https://test.moqisoft.com/%E6%96%87%E4%BB%B6%E7%BB%84%E5%90%88.7z',
        icon: <FileZipOutlined />,
      },
      // https://test.moqisoft.com/%E5%9B%BE.rar
      {
        name: '打不开的 RAR 文件',
        url: 'https://test.moqisoft.com/%E5%9B%BE.rar',
        icon: <FileZipOutlined />,
      },
      {
        name: 'ZIP 文件',
        url: 'https://test.moqisoft.com/sample_archivea.zip',
        icon: <FileZipOutlined />,
      },
      {
        name: 'RAR 文件',
        url: 'https://test.moqisoft.com/sample1.rar',
        icon: <FileZipOutlined />,
      },
      {
        name: '7Z 文件',
        url: 'https://test.moqisoft.com/Typroa_Activation_Script2.7z',
        icon: <FileZipOutlined />,
      },
      {
        name: 'TGZ 文件',
        url: 'https://test.moqisoft.com/elasticsearch.tgz',
        icon: <FileZipOutlined />,
      },
      {
        name: 'TAR 文件',
        url: 'https://test.moqisoft.com/test_data.tar',
        icon: <FileZipOutlined />,
      },
      {
        name: 'TAR.GZ 文件',
        url: 'https://test.moqisoft.com/test_data.tar.gz',
        icon: <FileZipOutlined />,
      },
      {
        name: 'JAR 文件',
        url: 'https://test.moqisoft.com/commons-chain-1.1.jar',
        icon: <FileZipOutlined />,
      },
      {
        name: 'GZ 文件',
        url: 'https://test.moqisoft.com/alternatives.log.2.gz',
        icon: <FileZipOutlined />,
      },
      {
        name: 'EXE 文件',
        url: 'https://test.moqisoft.com/Visual%20Studio%20Code%20Installer.exe',
        icon: <FileZipOutlined />,
      },
    ],
  },
  {
    title: '音视频',
    files: [
      {
        name: 'MP4 文件',
        url: 'https://test.moqisoft.com/%E5%8D%96%E6%8A%AB%E8%90%A8%E7%9A%84%E5%B0%8F%E5%A5%B3%E5%AD%A9-%E6%B3%B0%E5%9B%BD%E7%BE%8E%E9%A3%9F.mp4',
        icon: <VideoCameraOutlined />,
      },
      {
        name: 'MP3 文件',
        url: 'https://test.moqisoft.com/file_example_MP3_1MG.mp3',
        icon: <VideoCameraOutlined />,
      },
      {
        name: 'OGG 文件',
        url: 'https://test.moqisoft.com/file_example_OOG_1MG.ogg',
        icon: <VideoCameraOutlined />,
      },
    ],
  },
  {
    title: 'CAD及3D',
    files: [
      {
        name: 'DXF 文件',
        url: 'https://test.moqisoft.com/PC1080.dxf',
        icon: <CodeOutlined />,
      },
      {
        name: 'DWG 文件',
        url: 'https://test.moqisoft.com/14553569321165-1%20Bed%20apartment%20plan.dwg',
        icon: <CodeOutlined />,
      },
      {
        name: 'DWG 文件(字体缺失)',
        url: 'https://test.moqisoft.com/%E5%AD%97%E4%BD%93%E7%BC%BA%E5%A4%B1.dwg',
        icon: <CodeOutlined />,
      },
      {
        name: 'GLB 文件',
        url: 'https://test.moqisoft.com/Astronaut.glb',
        icon: <CodeOutlined />,
      },
      {
        name: '3DM 文件',
        url: 'https://test.moqisoft.com/Pistons.3dm',
        icon: <CodeOutlined />,
      },
    ],
  },
];

export default function Test() {
  useEffect(() => {}, []);

  return (
    <div className={'debug-page'}>
      <div className={'debug-content'}>
        <Title level={2} className={'debug-title'}>
          文件预览系统调试入口
        </Title>
        <div className={'device-info'}>
          <span>isPhone: {JSON.stringify(isPhone)}</span>
          <span>isPad: {JSON.stringify(isPad)}</span>
          <span>isTouchSupported: {JSON.stringify(isTouchSupported)}</span>
          <span>isMobile: {JSON.stringify(isMobile)}</span>
        </div>

        {FILE_GROUPS.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={{ marginTop: groupIndex === 0 ? '40px' : '32px' }}
          >
            <Title
              level={5}
              style={{
                marginBottom: '16px',
                textAlign: 'left',
                color: '#1890ff',
                fontWeight: 600,
              }}
            >
              {group.title}
            </Title>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                margin: '0 -4px',
              }}
            >
              {group.files.map((file, index) => {
                const { options, name, url } = file;
                const queryString = qs.stringify({
                  ...options,
                  displayName: encodeURIComponent(name),
                  watermark: encodeURIComponent(
                    options?.watermark || '在线文件预览\nbasemetas.cn',
                  ),
                  url,
                  // mode: 'embed',
                });
                // console.log(queryString);
                const previewUrl = `
                  ${appContext}/preview/view?${queryString} 
                `;
                // console.log(previewUrl);
                const decodedUrl = encodeURIComponent(file.url);
                return (
                  <div
                    key={index}
                    style={{
                      width: 'calc(8.333% - 8px)',
                      minWidth: '80px',
                      padding: '0 4px',
                      marginBottom: '8px',
                    }}
                  >
                    <a
                      href={previewUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      title={decodedUrl}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 4px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          height: '100%',
                          backgroundColor: '#fff',
                          transition: 'all 0.3s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#1890ff';
                          e.currentTarget.style.boxShadow =
                            '0 2px 8px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#d9d9d9';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {file.badge && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              backgroundColor: '#ff4d4f',
                              color: '#fff',
                              fontSize: '10px',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              zIndex: 1,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            {file.badge}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '18px',
                            marginBottom: '4px',
                            color: '#1890ff',
                          }}
                        >
                          {file.icon}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            lineHeight: '1.2',
                          }}
                        >
                          {file.name}
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
