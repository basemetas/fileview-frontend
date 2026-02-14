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

import JSZip from 'jszip';
import { log } from '@/utils';

interface XmindTopic {
  id?: string;
  title?: string;
  text?: string;
  branch?: any;
  markers?: any;
  attributedTitle?: any;
  customWidth?: any;
  position?: any;
  image?: any;
  notes?: any;
  children?: {
    attached?: XmindTopic[];
    detached?: XmindTopic[];
  };
  topics?: XmindTopic[];
  detached?: XmindTopic[];
}

interface MindElixirNode {
  id: string;
  topic: string;
  expanded: boolean;
  _raw: {
    branch?: any;
    markers?: any;
    attributedTitle?: any;
    customWidth?: any;
    position?: any;
    image?: any;
    notes?: any;
  };
  children: MindElixirNode[];
  _isFloating?: boolean;
  _position?: any;
}

interface XmindSheet {
  class?: string;
  rootTopic?: XmindTopic;
  floatingTopics?: XmindTopic[];
  root?: XmindTopic;
  root_topic?: XmindTopic;
  workbook?: {
    sheets?: XmindSheet[];
    children?: XmindSheet[];
  };
  sheets?: XmindSheet[];
}

export const loadAndConvert = async (url: string) => {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('下载失败 ' + resp.status);
  const buf = await resp.arrayBuffer();
  const sheets = await parseXmindZipArrayBuffer(buf);
  log.debug('转换得到的 sheets（MindElixir JSON）:', sheets);
  return sheets;
};

function genId(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * 解析单个 topic(递归),支持 children.attached 和 children.detached
 * 为浮动节点设置 _isFloating: true,并保留 position/image/notes 等字段
 */
function parseTopic(topic: XmindTopic | null): MindElixirNode | null {
  if (!topic) return null;
  const node: MindElixirNode = {
    id: topic.id || genId('t'),
    topic: topic.title || topic.text || '',
    // 你可以把原始字段保存到自定义字段,方便后续调试/渲染
    expanded: false,
    _raw: {
      branch: topic.branch,
      markers: topic.markers,
      attributedTitle: topic.attributedTitle,
      customWidth: topic.customWidth,
      position: topic.position,
      image: topic.image,
      notes: topic.notes,
    },
    children: [],
  };

  // 处理 attached 子节点（常规子节点）
  const attached =
    (topic.children && topic.children.attached) || topic.topics || [];
  if (Array.isArray(attached)) {
    for (const ch of attached) {
      const childNode = parseTopic(ch);
      if (childNode) node.children.push(childNode);
    }
  }

  // 处理 detached（浮动节点） —— 这里我们**不在每个节点内部**递归 detached，
  // 通常 detached 出现在 rootTopic 的 children.detached（作为浮动节点集合）
  // 但如果出现于任意 topic，也一并处理并标记为浮动
  const detached =
    (topic.children && topic.children.detached) || topic.detached || [];
  if (Array.isArray(detached)) {
    for (const f of detached) {
      const fn = parseTopic(f);
      if (fn) {
        fn._isFloating = true;
        // 保留位置信息到顶级可用字段
        if (f.position) fn._position = f.position;
        node.children.push(fn);
      }
    }
  }

  return node;
}

/**
 * 把一个 sheet 的 JSON 转为 MindElixir 根节点对象
 * sheetObj 可能是：
 *  - { class: 'sheet', rootTopic: {...}, floatingTopics: [...] }
 *  - 或者就是 rootTopic（老格式）
 */
function convertSheetToMindElixir(
  sheetObj: XmindSheet | XmindTopic | null,
): MindElixirNode | null {
  let rootTopic: XmindTopic | null = null;
  let floating: XmindTopic[] = [];

  if (!sheetObj) return null;

  if ('rootTopic' in sheetObj && sheetObj.rootTopic) {
    rootTopic = sheetObj.rootTopic;
    // 新版某些 sheet 把浮动节点放在 sheet.floatingTopics
    if (Array.isArray(sheetObj.floatingTopics))
      floating = sheetObj.floatingTopics;
  } else if (
    'class' in sheetObj &&
    sheetObj.class === 'sheet' &&
    sheetObj.rootTopic
  ) {
    rootTopic = sheetObj.rootTopic;
    if (Array.isArray(sheetObj.floatingTopics))
      floating = sheetObj.floatingTopics;
  } else if (
    ('class' in sheetObj && sheetObj.class === 'topic') ||
    'title' in sheetObj ||
    'children' in sheetObj
  ) {
    // 可能直接是一个 topic 对象
    rootTopic = sheetObj as XmindTopic;
  } else {
    // 兜底：尝试 rootTopic 字段名变体
    const sheet = sheetObj as XmindSheet;
    rootTopic = sheet.root || sheet.root_topic || null;
  }

  if (!rootTopic) return null;

  const rootNode = parseTopic(rootTopic);
  if (!rootNode) return null;

  // 把 sheet-level floating topics 也加入为 children（并标记）
  if (Array.isArray(floating) && floating.length) {
    for (const ft of floating) {
      const fn = parseTopic(ft);
      if (fn) {
        fn._isFloating = true;
        if (ft.position) fn._position = ft.position;
        rootNode.children.push(fn);
      }
    }
  }

  // 另外：在一些 content.json 的样本里，rootTopic.children.detached 包含浮动节点，
  // parseTopic 已把 detached 加入 rootNode.children 并标记 _isFloating。
  return rootNode;
}

/**
 * 主入口：接受已经解析的 contentJson（对象或数组），返回 MindElixir sheets 数组
 * 支持：
 *  - contentJson 是数组（sheet 列表）
 *  - contentJson.sheets 是数组
 *  - contentJson.rootTopic 单一 sheet
 */
export function parseContentJson(contentJson: any): MindElixirNode[] {
  const sheets: MindElixirNode[] = [];

  // 如果是字符串，先 JSON.parse
  if (typeof contentJson === 'string') {
    try {
      contentJson = JSON.parse(contentJson);
    } catch (e) {
      throw new Error('contentJson 不是有效的 JSON 字符串');
    }
  }

  if (Array.isArray(contentJson)) {
    // 例如：你上传的 content.json 就是数组形式（每个元素为 sheet） — 参考你的文件示例。:contentReference[oaicite:1]{index=1}
    for (const s of contentJson) {
      const converted = convertSheetToMindElixir(s);
      if (converted) sheets.push(converted);
    }
  } else if (Array.isArray(contentJson.sheets)) {
    for (const s of contentJson.sheets) {
      const converted = convertSheetToMindElixir(s);
      if (converted) sheets.push(converted);
    }
  } else if (contentJson.rootTopic) {
    const converted = convertSheetToMindElixir(contentJson);
    if (converted) sheets.push(converted);
  } else {
    // 兜底：有些文件把多个 sheet 放在 contentJson.workbook 或其他字段
    const maybeSheets =
      contentJson.workbook?.sheets || contentJson.workbook?.children || null;
    if (Array.isArray(maybeSheets)) {
      for (const s of maybeSheets) {
        const converted = convertSheetToMindElixir(s);
        if (converted) sheets.push(converted);
      }
    } else {
      throw new Error(
        '无法识别 content.json 格式（既不是 array，也没有 sheets 或 rootTopic 字段）',
      );
    }
  }

  return sheets;
}

/**
 * 辅助：从 .xmind zip arrayBuffer 读取 content.json 并解析（浏览器端用）
 * 需要 JSZip 可用（取消注释顶部 import）
 */
export async function parseXmindZipArrayBuffer(
  arrayBuffer: ArrayBuffer,
): Promise<MindElixirNode[]> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  // 支持 content.json、content/index.json、content.xml（但这里只解析 JSON）
  let contentStr: string | null = null;
  const contentFile = zip.file('content.json');
  const contentIndexFile = zip.file('content/index.json');

  if (contentFile) {
    contentStr = await contentFile.async('text');
  } else if (contentIndexFile) {
    contentStr = await contentIndexFile.async('text');
  } else if (zip.file('content.xml')) {
    // 若只有 content.xml 可用，这里不做 xml -> json 转换（可以扩展）
    throw new Error(
      '仅检测到 content.xml；当前函数期待 content.json（XMind25）或 content/index.json',
    );
  } else {
    throw new Error(
      '无法在 xmind zip 中找到 content.json 或 content/index.json',
    );
  }

  return parseContentJson(contentStr);
}
