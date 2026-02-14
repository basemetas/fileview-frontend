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

import React, { useEffect, useRef, useState } from 'react';
import 'mediaelement/build/mediaelementplayer.min.css';
import 'mediaelement';
import styles from './index.module.scss';
import { IMode, renderProps } from '@/types';
import { useLoading } from '@/hooks/loading';
import Footer from '@/components/footer';
import { log } from '@/utils';

// MediaElement 全局变量声明
declare const MediaElementPlayer: any;

export default function AudioRender(props: renderProps) {
  const { src, fileName, displayName = '', mode = IMode.normal } = props;
  const { hideLoading, showLoadingError } = useLoading();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaElementRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (mediaElementRef.current) {
      if (isPlaying) {
        mediaElementRef.current.pause();
      } else {
        mediaElementRef.current.play();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaElementRef.current) {
      mediaElementRef.current.setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (mediaElementRef.current) {
      const newVolume = volume > 0 ? 0 : 0.3;
      setVolume(newVolume);
      mediaElementRef.current.setVolume(newVolume);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaElementRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    mediaElementRef.current.setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    log.debug(fileName);

    if (!audioRef.current) return;

    new MediaElementPlayer(audioRef.current, {
      features: [],
      audioWidth: '100%',
      audioHeight: 40,
      stretching: 'responsive',
      pluginPath: '/path/to/shims/',
      success: function (mediaElement: any) {
        mediaElementRef.current = mediaElement;

        // 设置初始音量
        mediaElement.setVolume(0.3);

        // 监听事件
        mediaElement.addEventListener('play', () => {
          setIsPlaying(true);
        });

        mediaElement.addEventListener('pause', () => {
          setIsPlaying(false);
        });

        mediaElement.addEventListener('timeupdate', () => {
          setCurrentTime(mediaElement.currentTime);
        });

        mediaElement.addEventListener('loadedmetadata', () => {
          setDuration(mediaElement.duration);
          hideLoading();
          log.debug('MediaElement loaded');
        });

        mediaElement.addEventListener('error', () => {
          log.debug('MediaElement error:', mediaElement.error);
          showLoadingError(undefined, '音频加载失败');
        });
      },
      error: function () {
        showLoadingError(undefined, '音频播放器初始化失败');
      },
    });

    return () => {
      if (mediaElementRef.current) {
        mediaElementRef.current.remove();
        mediaElementRef.current = null;
      }
    };
  }, [fileName, src, hideLoading, showLoadingError]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas}>
        <div className={styles.audioPlayer}>
          <div className={styles.audioPlayerWrapper}>
            <audio
              ref={audioRef}
              src={src}
              preload='metadata'
              style={{ display: 'none' }}
            />
            <div className={styles.controls}>
              <button
                className={styles.playButton}
                onClick={togglePlay}
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className={styles.progressContainer}>
                <div
                  className={styles.progressBar}
                  onClick={handleProgressClick}
                >
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className={styles.timeDisplay}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className={styles.volumeControl}>
                <button
                  className={styles.volumeButton}
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  aria-label={volume > 0 ? '静音' : '取消静音'}
                >
                  {volume > 0 ? '🔊' : '🔇'}
                </button>
                {showVolumeSlider && (
                  <div
                    className={styles.volumeSlider}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <input
                      type='range'
                      min='0'
                      max='1'
                      step='0.01'
                      value={volume}
                      onChange={handleVolumeChange}
                      className={styles.volumeRange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
}
