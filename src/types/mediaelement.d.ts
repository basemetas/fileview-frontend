declare module 'mediaelement' {
  export interface MediaElementPlayerOptions {
    features?: string[];
    audioWidth?: string | number;
    audioHeight?: number;
    stretching?: string;
    pluginPath?: string;
    // eslint-disable-next-line no-unused-vars
    success?: (mediaElement: any, domNode: HTMLElement) => void;
    // eslint-disable-next-line no-unused-vars
    error?: (mediaElement?: any) => void;
  }

  export default class MediaElementPlayer {
    // eslint-disable-next-line no-unused-vars
    constructor(element: HTMLMediaElement, options?: MediaElementPlayerOptions);
    play(): void;
    pause(): void;
    // eslint-disable-next-line no-unused-vars
    setVolume(volume: number): void;
    // eslint-disable-next-line no-unused-vars
    setCurrentTime(time: number): void;
    remove(): void;
  }
}
