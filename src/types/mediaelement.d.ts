declare module 'mediaelement' {
  export interface MediaElementPlayerOptions {
    features?: string[];
    audioWidth?: string | number;
    audioHeight?: number;
    stretching?: string;
    pluginPath?: string;
    success?: (mediaElement: any, domNode: HTMLElement) => void;
    error?: (mediaElement?: any) => void;
  }

  export default class MediaElementPlayer {
    constructor(element: HTMLMediaElement, options?: MediaElementPlayerOptions);
    play(): void;
    pause(): void;
    setVolume(volume: number): void;
    setCurrentTime(time: number): void;
    remove(): void;
  }
}
