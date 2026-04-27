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

import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import 'antd/dist/antd.css';
import './App.scss';
import Debug from '@/pages/debug';
import Welcome from '@/pages/welcome';
import View from '@/pages/view';
import NotFound from '@/pages/notfound';
import { getAppContext } from '@/utils';
const appContext = getAppContext();
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';

message.config({
  top: 100,
  duration: 2,
  maxCount: 3,
});

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route
            index
            element={<Navigate to={`${appContext}/preview/welcome`} replace />}
          />
          <Route
            path={`${appContext}`}
            element={<Navigate to={`${appContext}/preview/welcome`} replace />}
          />

          <Route path={`${appContext}/preview/debug`} element={<Debug />} />
          <Route path={`${appContext}/preview/view`} element={<View />} />
          <Route path={`${appContext}/preview/welcome`} element={<Welcome />} />

          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
