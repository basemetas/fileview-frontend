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

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './index.module.scss';
import { renderProps, IMode } from '@/types';
import { useLoading } from '@/hooks/loading';
import Footer from '@/components/footer';
import { log } from '@/utils';

// 根据文件扩展名获取 MIME 类型
const getMimeType = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop();
  const videoTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    ogv: 'video/ogg',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    mkv: 'video/x-matroska',
    m3u8: 'application/x-mpegURL',
  };
  return videoTypes[ext || ''] || 'video/mp4';
};

export default function VideoRender(props: renderProps) {
  const { src, fileName, displayName = '', mode = IMode.normal } = props;
  const { hideLoading, showLoadingError } = useLoading();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const mimeType = getMimeType(fileName);

  useEffect(() => {
    log.debug(fileName);

    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      responsive: true,
      fill: true,
      language: 'zh-CN',
      controlBar: {
        playToggle: true,
        volumePanel: {
          inline: false,
        },
        currentTimeDisplay: true,
        timeDivider: true,
        durationDisplay: true,
        progressControl: true,
        playbackRateMenuButton: true,
        fullscreenToggle: true,
      },
    });

    playerRef.current = player;

    player.ready(function () {
      log.debug('Player is ready');
    });

    player.on('loadedmetadata', function () {
      hideLoading();
    });

    player.on('error', function () {
      const error = player.error();
      log.debug('Player error:', error);
      showLoadingError(undefined, error?.message || '视频加载失败');
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [fileName, src, hideLoading, showLoadingError]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas}>
        <div className={styles.videoContainer}>
          <div className={styles.video} data-vjs-player>
            <video ref={videoRef} className='video-js vjs-big-play-centered'>
              <source src={src} type={mimeType} />
            </video>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
}
