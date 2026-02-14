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

import { createContext } from 'react';
import { WaterMarkProps, PermissionProps } from '@/types';

// 鍒涘缓 Context锛屽彲璁剧疆榛樿鍊?
const AppContext = createContext({
  mode: 'normal' as string,
  permission: {} as PermissionProps,
  watermark: {} as WaterMarkProps,
  componentProps: {} as any,
});
export default AppContext;
