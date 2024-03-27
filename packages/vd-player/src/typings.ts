
import { type TLogLevel } from 'base-log-factory';
import { EEvent, Emitter } from 'eemitt';

export type TPlayerPluginFn = (player: IPlayer, ...opts: any[]) => void;

export type TPlayerPlugin = TPlayerPluginFn | OPlayerPlugin;

export type TPlayerConstructor = new (opts?: PlayerOptions) => IPlayer;

export type ComponentConstructor =
  new (name: string, player: IPlayer, opts?: any) => IComponent;

export type TPlaySourceGet = () => (PlaySource | Promise<PlaySource>);

export type TSrcGet = () => (string | Promise<string>);

export type TPlaySource = TPlaySourceGet | PlaySource;

export type TDirection = 'horz' | 'vert';

export type TPreload = 'none' | 'metadata' | 'auto' | '';

export interface OPlayerPlugin {
  install: TPlayerPluginFn;
}
export interface TechConstructor {
  isSupported: () => boolean;
  canPlayType: (type: string) => string;
  new (player: IPlayer, opts?: any): ITech;
}

export interface IComponent extends Emitter {
  player: IPlayer;
  name: string;
  children: IComponent[];
  parent: IComponent | null;
  el: HTMLElement;
  opts: any;

  onEl(eventName: string | string[], fn: (...args: any[]) => any): this;
  removeAllElListeners(eventName?: any | any[]): this;
  getChild(name: string): IComponent | null;
  initChild(config: ChildConfig, append?: boolean): IComponent;
  appendChild(child: IComponent): IComponent;
  insertBefore(cmp: IComponent, childName: string): IComponent;
  removeChild(name: string): IComponent | null;
  hasClass(className: string): boolean;
  addClass(...tokens: string[]): void;
  removeClass(...tokens: string[]): void;
  toggleClass(token: string, force?: boolean): boolean;
  setAttribute(name: string, val: any): void;
  getAttribute(name: string): null | string;
  removeAttribute(name: string): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface IPlayer extends IComponent {
  readonly id: string;
  readonly duration: number;
  readonly ended: boolean;
  readonly installedPlugins: TPlayerPlugin[];
  readonly isFullscreen: boolean;
  readonly isFullWindow: boolean;
  readonly isLive: boolean;
  readonly networkState: number;
  readonly paused: boolean;
  readonly playbackRateSupported: boolean;
  readonly readyState: number;
  readonly videoHeight: number;
  readonly videoWidth: number;

  aspectRatio: string;
  autoplay: boolean;
  controls: boolean;
  currentTime: number;
  fill: boolean;
  fluid: boolean;
  hasStarted: boolean;
  height: number;
  loop: boolean;
  muted: boolean;
  opts: PlayerOptions;
  playbackRate: number;
  playbackRates: number[];
  preload: TPreload;
  scrubbing: boolean;
  source: TPlaySource | undefined;
  tech: ITech | null;
  techOrder: Array<[TechConstructor, any]>;
  userActive: boolean;
  volume: number;
  width: number;

  dispose(): Promise<void>;
  enterFullWindow(): this;
  exitFullscreen(): Promise<void>;
  exitFullWindow(): this;
  load(): Promise<void>;
  mount(parentEl: Element | string | null): Element;
  unmount(): ParentNode | null;
  pause(): Promise<void>;
  play(source?: TPlaySource | boolean): Promise<void>;
  preloadTech(index: number): void;
  requestFullscreen(fullscreenOptions?: FullscreenOptions): Promise<void>;
  stop(): Promise<void>;
  use(plugin: TPlayerPlugin, ...options: any[]): this;
}

export interface ITech extends Emitter {
  opts: any;
  player: IPlayer;

  currentTime(): number;
  autoplay(): boolean;
  createElement(): HTMLElement;
  dispose(): any;
  duration(): number;
  ended(): boolean;
  enterFullScreen(): any;
  exitFullScreen(): any;
  isLive(): boolean;
  load(): any;
  loop(): boolean;
  muted(): boolean;
  networkState(): number;
  pause(): any;
  paused(): boolean;
  readyState(): number;
  videoHeight(): number;
  videoWidth(): number;
  play(): any;
  playbackRate(): number;
  preload(): TPreload;
  setAutoplay(bool: boolean): void;
  setCurrentTime(val: number): void;
  setLoop(bool: boolean): void;
  setMuted(bool: boolean): void;
  setPlaybackRate(val: number): void;
  setPreload(val: TPreload): void;
  setScrubbing(bool: boolean): void;
  setSource(source: PlaySource): void;
  setVolume(val: number): void;
  stop(): any;
  supportsFullScreen(): boolean;
  supportsPlaybackRate(): boolean;
  volume(): number;
}

export interface ISliderBar extends IComponent {
  throttledUpdate(percent: number): void;
  update(percent: number): void;
}

export interface PlaySource {
  [key: string]: any;
  type: string;
  src: string | TSrcGet;
}

export interface FullscreenApi {
  prefixed: boolean;
  requestFullscreen: string;
  exitFullscreen: string;
  fullscreenElement: string;
  fullscreenEnabled: string;
  fullscreenchange: string;
  fullscreenerror: string;
  fullscreen: string;
}

export interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Pointer {
  x: number;
  y: number;
}

export interface ClientRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ChildConfig {
  name: string;
  component: ComponentConstructor;
  opts?: any;
}

export interface ComponentOptions {
  [key: string]: any;
  visible?: boolean;
}

export interface SliderOptions extends ComponentOptions {
  direction?: TDirection;
}

export interface PlayerOptions extends ComponentOptions{
  [key: string]: any;

  aspectRatio?: string;
  autoplay?: boolean;
  controls?: boolean;
  fill?: boolean;
  fluid?: boolean;
  fullscreen?: FullscreenOptions;
  height?: number;
  inactivityTimeout?: number;
  logLevel?: TLogLevel; // 日志级别
  loop?: boolean;
  muted?: boolean;
  playbackRate?: number;
  playbackRates?: number[];
  preferFullWindow?: boolean;
  preload?: TPreload;
  source?: TPlaySource;
  techOrder: Array<string | TechConstructor | [string | TechConstructor, any]>;
  volume?: number;
  width?: number;
}

export interface PlayerFixedOptions extends PlayerOptions {
  autoplay: boolean;
  controls: boolean;
  fill: boolean;
  fluid: boolean;
  fullscreen: FullscreenOptions;
  height: number;
  inactivityTimeout: number;
  logLevel: TLogLevel;
  loop: boolean;
  muted: boolean;
  playbackRate: number;
  playbackRates: number[];
  preload: TPreload;
  volume: number;
  width: number;
}


/** 内部定义 */
export interface ComponentInner {
  clearingTimersOnDispose: boolean;
  setTimeoutIds: number[];
  setIntervalIds: number[];
  rafIds: number[];
  namedRafs: {[key: string]: number} ;
  elEvents: {[key: string]: (...args: any[]) => any};
}

export { EEvent as TechEvent };
export { EEvent as ComponentEvent };
export { EEvent as PlayerEvent };
export { EEvent, Emitter, TLogLevel };
