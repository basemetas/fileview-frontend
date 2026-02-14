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

import { log } from '@/utils';

/*

data 示例

[
    {
      "name": "sample_archive",
      "fullPath": "sample_archive/",
      "isDirectory": true,
      "size": 0,
      "lastModified": "Tue Oct 28 14:23:11 CST 2025",
      "children": [
        {
          "name": "config.json",
          "fullPath": "sample_archive/config.json",
          "isDirectory": false,
          "size": -1,
          "fileType": "JSON",
          "compressionMethod": "DEFLATED",
          "crc": -1,
          "lastModified": "Thu Sep 25 17:40:28 CST 2025"
        },
        {
          "name": "subfolder.zip",
          "fullPath": "sample_archive/subfolder.zip",
          "isDirectory": false,
          "size": -1,
          "fileType": "ZIP Archive",
          "compressionMethod": "DEFLATED",
          "crc": -1,
          "lastModified": "Tue Oct 28 08:41:32 CST 2025"
        },
        {
          "name": "subfolder1",
          "fullPath": "sample_archive/subfolder1/",
          "isDirectory": true,
          "size": 0,
          "lastModified": "Tue Oct 28 14:23:16 CST 2025",
          "children": [
            {
              "name": "subfolder1",
              "fullPath": "sample_archive/subfolder1/subfolder1/",
              "isDirectory": true,
              "size": 0,
              "lastModified": "Tue Oct 28 14:22:58 CST 2025",
              "children": [
                {
                  "name": "nested_file.txt",
                  "fullPath": "sample_archive/subfolder1/subfolder1/nested_file.txt",
                  "isDirectory": false,
                  "size": -1,
                  "fileType": "Text",
                  "compressionMethod": "DEFLATED",
                  "crc": -1,
                  "lastModified": "Thu Sep 25 17:40:46 CST 2025"
                },
                {
                  "name": "文件夹1",
                  "fullPath": "sample_archive/subfolder1/subfolder1/文件夹1/",
                  "isDirectory": true,
                  "size": 0,
                  "lastModified": "Tue Oct 28 14:22:58 CST 2025",
                  "children": [
                    {
                      "name": "文件夹!",
                      "fullPath": "sample_archive/subfolder1/subfolder1/文件夹1/文件夹!/",
                      "isDirectory": true,
                      "size": 0,
                      "lastModified": "Tue Oct 28 14:22:58 CST 2025",
                      "children": [
                        {
                          "name": "文件夹!",
                          "fullPath": "sample_archive/subfolder1/subfolder1/文件夹1/文件夹!/文件夹!/",
                          "isDirectory": true,
                          "size": 0,
                          "lastModified": "Tue Oct 28 14:22:58 CST 2025",
                          "children": [
                            {
                              "name": "我们需要创建一个方法来解析这种复合路径格式，并递归解压嵌套的压缩文件。.txt",
                              "fullPath": "sample_archive/subfolder1/subfolder1/文件夹1/文件夹!/文件夹!/我们需要创建一个方法来解析这种复合路径格式，并递归解压嵌套的压缩文件。.txt",
                              "isDirectory": false,
                              "size": -1,
                              "fileType": "Text",
                              "compressionMethod": "DEFLATED",
                              "crc": -1,
                              "lastModified": "Mon Oct 27 16:18:40 CST 2025"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "name": "test_document.txt",
          "fullPath": "sample_archive/test_document.txt",
          "isDirectory": false,
          "size": -1,
          "fileType": "Text",
          "compressionMethod": "DEFLATED",
          "crc": -1,
          "lastModified": "Thu Sep 25 17:40:16 CST 2025"
        }
      ]
    }
  ]

*/

/**
 * 根据路径获取压缩文件的数据
 * @param data 压缩文件的树形数据结构
 * @param fullPath 可选的完整路径，用于定位特定节点
 * @returns 如果提供了 fullPath，返回匹配的节点数组；否则返回完整数据
 */
export const getArchiveRenderData = (data: any[], fullPath?: string): any[] => {
  log.debug('getArchiveRenderData => fullPath', fullPath);

  // 格式化节点数据，移除 children 字段
  const formatNode = (node: any) => {
    // eslint-disable-next-line no-unused-vars
    const { fullPath: _fullPath, children, ...rest } = node;
    // return rest;
    return {
      ...rest,
      fullPath: _fullPath,
      key: _fullPath,
    };
  };

  // 格式化节点数组，移除所有 children 字段
  const formatNodes = (nodes: any[]) => {
    return nodes.map(formatNode);
  };

  // 如果没有提供路径，返回格式化后的完整数据
  if (!fullPath) {
    return formatNodes(data);
  }

  // 标准化路径：确保以 / 结尾（目录）或不以 / 结尾（文件）
  const normalizedPath = fullPath.trim();

  // 递归搜索函数
  const findNode = (nodes: any[], targetPath: string): any | null => {
    for (const node of nodes) {
      // 精确匹配当前节点的完整路径
      if (node.fullPath === targetPath) {
        return node;
      }

      // 如果当前节点是目录且有子节点，递归搜索
      if (node.isDirectory && node.children && node.children.length > 0) {
        // 检查目标路径是否在当前节点的子树中（路径前缀匹配优化）
        if (targetPath.startsWith(node.fullPath)) {
          const result = findNode(node.children, targetPath);
          if (result) {
            return result;
          }
        }
      }
    }
    return null;
  };

  // 执行搜索
  const foundNode = findNode(data, normalizedPath);

  // 如果找到节点，返回包含该节点的数组
  if (foundNode) {
    // 如果是目录且有子节点，返回其子节点（格式化后）
    if (foundNode.isDirectory && foundNode.children) {
      return formatNodes(foundNode.children);
    }
    return [formatNode(foundNode)];
  }

  // 未找到匹配节点，返回空数组
  return [];
};
