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

import renderTypesMapping from '../constant/renderTypesMapping';

export const getRenderType = (options: {
  previewFileFormat: string;
  originalFileFormat: string;
  status: string;
}): string => {
  let renderType = 'unknown';

  if (options.status === 'NOT_SUPPORTED') return renderType;

  Object.keys(renderTypesMapping).forEach((key) => {
    if (
      renderTypesMapping[key as keyof typeof renderTypesMapping].includes(
        options.previewFileFormat,
      ) ||
      renderTypesMapping[key as keyof typeof renderTypesMapping].includes(
        options.originalFileFormat,
      )
    ) {
      renderType = key;
    }
  });

  return renderType;
};
