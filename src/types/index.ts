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

/* eslint-disable no-unused-vars */

export enum IDisplayMode {
  // 单页模式
  SinglePage = 'single',
  // 双页模式
  DoublePage = 'double',
}

export const defaultBrushOptions = {
  color: '#000000',
  size: 2,
  eraserSize: 0,
};

export const defaultTextOptions = {
  color: '#000000',
  size: 12,
};

export const defaultShapeOptions = {
  color: '#000000',
  type: 'circle', // rect, circle, line
};

export enum ToolType {
  // 无
  None = 'none',
  // 画笔
  Brush = 'brush',
  // 文本
  Text = 'text',
  // 形状
  Shape = 'shape',
  // 签名
  Signature = 'signature',
  // 图章
  Stamp = 'stamp',
}

export enum EventType {
  // 正在签批状态变化，进入和退出
  Signing = 'Signing',
  // 签批工具类型变化
  SignToolTypeChange = 'SignToolTypeChange',
  // 签批工具设置变化
  SignToolOptionsChange = 'SignToolOptionsChange',
  // 签批保存
  SignSave = 'SignSave',
  // 签批保存响应
  SignSaveResponse = 'SignSaveResponse',
  // 获取签批页面 json 数据
  SignGetPageData = 'SignGetPageData',
  // 获取签批页面 json 数据响应
  SignGetPageDataResponse = 'SignGetPageDataResponse',
  // 获取签批图片内容
  SignGetImageData = 'SignGetImageData',
  // 获取签批图片内容响应
  SignGetImageDataResponse = 'SignGetImageDataResponse',
  // 签批下载
  SignDownload = 'SignDownload',
  // 签名选择
  SignatureSelected = 'SignatureSelected',
  // 页面变化
  PageChange = 'PageChange',
  // 历史记录
  HistoryChange = 'HistoryChange',
  // 撤销
  Undo = 'Undo',
  // 重做
  Redo = 'Redo',
}

export enum IMode {
  normal = 'normal', // 普通模式
  embed = 'embed', // 嵌入模式
  sign = 'sign', // 签批模式
}

export interface IRequestData {
  url?: string;
  path?: string;
  fileName?: string;
  displayName?: string;
  mode?: IMode;
  watermark?: WaterMarkProps;
  permission?: PermissionProps;
  // 是否是根组件
  isRoot?: boolean;
}

export interface WaterMarkProps {
  // 是否满页水印，默认为 false，即只水印当前元素内容区域
  fullPage?: boolean;
  // 文字内容，支持使用 \\n 换行，建议不超过2行
  value?: string;
  // 水印颜色，支持 rgba 和 hax 颜色（如：#ff0000）
  fillstyle?: string;
  // 字号和字体
  font?: string;
  // 旋转角度，支持正负 120° 以内
  rotate?: number;
  // 水平间隔
  horizontal?: number;
  // 垂直间隔
  vertical?: number;
  // 整体透明度，0-1 之间的数字。默认为1，全不透明
  opacity?: number;
  // 页面宽度（用于生成完整平铺图）
  pageWidth?: number;
  // 页面高度（用于生成完整平铺图）
  pageHeight?: number;
}

export interface IEntryProps extends IRequestData {}

export interface renderProps {
  isRoot?: boolean; // 是否是根组件
  renderType?: string; // 渲染类型
  displayName?: string; // 文件展示名
  fileName: string; // 文件名，必需
  src?: string; // http 访问的文件流地址，pdf、音视频等需要
  originalFilePath?: string; // 内部文件相对路径
  originalFileFormat?: string; // 原始文件格式
  previewFileFormat?: string; // 预览文件格式
  type?: 'video' | 'audio'; // 文件类型，音频或视频
  error?: string;
  mode?: IMode;
}

export interface PermissionProps {
  // 是否允许打印
  print?: boolean;
  // 是否允许下载
  download?: boolean;
  // 是否允许复制
  copy?: boolean;
  // 是否允许搜索
  search?: boolean;
  // 是否允许全屏
  fullscreen?: boolean;
  // 是否允许旋转
  rotate?: boolean;
  // 是否允许双页
  doublePage?: boolean;
  // 是否允许缩放
  zoom?: boolean;
  // 是否允许开启缩略图
  thumbnail?: boolean;
  // 页面限制，0 表示无限制
  pageLimit?: number;
}
