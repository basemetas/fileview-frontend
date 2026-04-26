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

export { loadCSS, loadJS } from './resourceLoader';
export { detectLanguage } from './detectLanguage';
export {
  default as request,
  get,
  post,
  longPolling,
  axiosInstance,
} from './request';
export { getComponentLoader } from './componentLoader';
export { getRenderType } from './renderTypes';
export { getArchiveRenderData } from './getArchiveRenderData';
export { getAppContext, getApiContext, getWebPrefix } from './getContext';
export { clientId } from './uuid';
export { formatBytes } from './formatBytes';
export { default as log } from './logger';
export { autoFixedURI } from './autoFixedURI';
export { isMobile, isPhone, isPad, isTouchSupported } from './device';
export { isWasmBulkMemorySupported } from './wasmFeatureDetect';
