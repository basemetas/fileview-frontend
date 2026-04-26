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

import { lazy, LazyExoticComponent, ComponentType } from 'react';
import { log } from '@/utils';

// 定义组件类型
export type ComponentModule = LazyExoticComponent<ComponentType<any>>;

// 动态懒加载组件的函数
export const getComponentLoader = (type: string): ComponentModule => {
  log.debug(type);
  switch (type) {
    case 'cell':
      return lazy(() => import('@/components/render/cell'));
    case 'image':
      return lazy(() => import('@/components/render/image'));
    case 'highlight':
      return lazy(() => import('@/components/render/highlight'));
    case 'markdown':
      return lazy(() => import('@/components/render/markdown'));
    case 'audio':
      return lazy(() => import('@/components/render/audio'));
    case 'video':
      return lazy(() => import('@/components/render/video'));
    case 'pdf':
      return lazy(() => import('@/components/render/pdf'));
    case 'archive':
      return lazy(() => import('@/components/render/archive'));
    case 'tga':
      return lazy(() => import('@/components/render/tga'));
    case 'xmind':
      return lazy(() => import('@/components/render/xmind'));
    case 'bpmn':
      return lazy(() => import('@/components/render/bpmn'));
    case 'epub':
      return lazy(() => import('@/components/render/epub'));
    case 'cad':
      return lazy(() => import('@/components/render/dwg'));
    case 'drawio':
      return lazy(() => import('@/components/render/drawio'));
    case 'threed':
      return lazy(() => import('@/components/render/threed'));
    default:
      return lazy(() => import('@/components/render/unknow'));
  }
};
