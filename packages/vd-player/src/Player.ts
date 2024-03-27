
import keycode from 'keycode';

import { Component } from './Component';
import { BigPlayButton } from './components/BigPlayButton';
import { ControlBar } from './components/ControlBar';
import { LoadingSpinner } from './components/LoadingSpinner';
import {
  createElement,
  createStyleElement,
  setCssText
} from './dom';
// import { Overlay } from './components/Overlay';
import fullscreenApi from './fullscreenApi';
import logFactory from './logFactory';
import { getTech } from './Tech';
import {
  IPlayer,
  ITech,
  OPlayerPlugin,
  PlayerEvent,
  PlayerFixedOptions,
  PlaySource,
  TechConstructor,
  TechEvent,
  TPlayerPlugin,
  TPlaySource,
  TPreload
} from './typings';
import {
  capitalize,
  forOwn,
  getGUID,
  silencePromise
} from './util';

const logger = logFactory.getLogger('Component');

const TECH_EVENTS_RETRIGGER = [
  'abort',
  'emptied',
  'progress',
  'stalled',
  'suspend',

  'durationchange',
  'ended',
  'error',
  'fullscreenchange',
  'fullscreenerror',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'resize',
  'seeked',
  'seeking',
  'stop',
  'timeupdate',
  'volumechange',
  'waiting'
];

const TECH_EVENTS_SUBSCRIPTION = [
  'ratechange'
];

const OPTS_MAPPING = {
  autoplay(bool: boolean): boolean {
    return !!bool;
  },
  loop(bool: boolean): boolean {
    return !!bool;
  },
  muted(bool: boolean): boolean {
    return !!bool;
  },
  playbackRate(val: number): number | null {
    val = +val;
    return typeof val === 'number' ? val : null;
  },
  preload(val: TPreload): TPreload | null {
    switch (val) {
      case 'none':
      case 'metadata':
      case 'auto':
      case '':
        return val;
    }
    return null;
  },
  volume(val: number): number | null {
    val = +val;
    return typeof val === 'number' ? val : null;
  }
};

const GETTER_MAPPING = {
  duration: NaN,
  ended: false,
  isFullscreen: null,
  isFullWindow: null,
  isLive: false,
  networkState: 0,
  paused: true,
  readyState: 0,
  videoHeight: 0,
  videoWidth: 0
};

const ATTRS_MAPPING = [
  'aspectRatio',
  'controls',
  'fill',
  'fluid',
  'hasStarted',
  'height',
  'playbackRates',
  'scrubbing',
  'techOrder',
  'userActive',
  'width'
];

function initStyleEl(): HTMLElement {
  const styleEl = createStyleElement('vp-styles-dimensions');
  const defaultsStyleEl = document.querySelector('.vp-styles-defaults');
  const head = document.getElementsByTagName('head')[0];
  head.insertBefore(styleEl, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
  return styleEl;
}

function checkOptions(options: PlayerFixedOptions): PlayerFixedOptions {
  const { techOrder } = options;
  if (!techOrder || !techOrder.length) {
    throw new Error('No techOrder specified.');
  }

  return options;
}

function clearTechClass(
  config: string | TechConstructor | [string | TechConstructor, any]
): [TechConstructor, any] {
  let Tech: TechConstructor = config as TechConstructor;
  let techConfig: any;

  if (Array.isArray(config)) {
    Tech = config[0] as TechConstructor;
    techConfig = config[1];
  }

  if (typeof Tech === 'string') {
    Tech = getTech(Tech);
  }

  return [Tech, techConfig];
}

function techCall(tech: ITech | null, method: string, arg?: any): any {
  if (tech) {
    return tech[method](arg);
  }

  logger.warn(`Call "${method}", but no tech was specified.`);
}

function techGet(tech: ITech | null, method: string, defaultValue?: any): any {
  return tech && tech[method]
    ? tech[method]()
    : defaultValue;
}

function makeActionPromise(
  player: IPlayer,
  eventName: string,
  action: (resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: any) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    function offHandler() {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      player.off('error', errorHandler);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      player.off(eventName, onHandler);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      player.off('dispose', offHandler);
    }
    function onHandler() {
      offHandler();
      resolve();
    }
    function errorHandler(evt: PlayerEvent<unknown, IPlayer>) {
      offHandler();
      reject(evt.error);
    }

    player.once(eventName, onHandler);
    player.once('dispose', offHandler);
    player.once('error', errorHandler);

    action(resolve, reject);
  });
}

class Controller {
  aspectRatio!: string;
  controls!: boolean;
  fill!: boolean;
  fluid!: boolean;
  isFullscreen: boolean = false;
  isFullWindow: boolean = false;
  hasStarted: boolean = false;
  height: number = 0;
  playbackRates: number[] = [];
  techOrder!: Array<[TechConstructor, any]>;
  ref: Player;
  scrubbing: boolean = false;
  userActive: boolean = false;
  width: number = 0;

  readonly autoplay!: boolean;
  readonly loop!: boolean;
  readonly muted!: boolean;
  readonly playbackRate!: number;
  readonly preload!: TPreload;
  readonly volume!: number;

  setAutoplay!: (bool: boolean) => void;
  setLoop!: (bool: boolean) => void;
  setMuted!: (bool: boolean) => void;
  setPlaybackRate!: (val: number) => void;
  setPreload!: (val: TPreload) => void;
  setVolume!: (val: number) => void;

  private _docOrigOverflow: string = '';
  private _isPendingPlay: boolean = false;
  private _userActivity: boolean = false;
  private readonly _styleEl: HTMLElement;

  constructor(ref: Player) {
    this.ref = ref;

    this._styleEl = initStyleEl();

    if (fullscreenApi.requestFullscreen) {
      const documentFullscreenChange = (e: Event | PlayerEvent<Player>) => {
        const targetPlayer = (e.target as any).player;
        if (targetPlayer && targetPlayer !== this) {
          return;
        }

        const { el } = ref;
        let isFs = (document as any)[fullscreenApi.fullscreenElement] === el;
        if (!isFs) {
          isFs = el.matches(`:${fullscreenApi.fullscreen}`);
        }

        this.setFullscreen(isFs);
      };
      document.addEventListener(fullscreenApi.fullscreenchange, documentFullscreenChange, false);
      ref.on(fullscreenApi.fullscreenchange, documentFullscreenChange as any);
    }
  }

  _createTech(TechClass: TechConstructor, techOpts?: any): ITech {
    const tech = new TechClass(this.ref, techOpts);
    const { ref } = this;
    ref.el.prepend(tech.createElement());
    ref.tech = tech;

    forOwn(OPTS_MAPPING, (fn, key) => {
      ref[key] = ref.opts[key];
    });

    TECH_EVENTS_RETRIGGER.forEach((eventName) => {
      tech.on(eventName, this[`_handleTech${capitalize(eventName)}`]);
    });

    TECH_EVENTS_SUBSCRIPTION.forEach((eventName) => {
      tech.on(eventName, (evt) => {
        ref.emit({ type: eventName, target: tech, originalEvent: evt });
      });
    });
    return tech;
  }

  _error(err: Error | null): void {
    const { ref } = this;
    if (!err) {
      ref.removeClass('vp-error');
      return;
    }

    ref.addClass('vp-error');
    ref.removeClass('vp-waiting', 'vp-seeking');

    ref.emit({ type: 'error', error: err });
  }

  _fullWindowOnEscKey = (evt: KeyboardEvent): void => {
    if (keycode.isEventKey(evt, 'Esc') && this.isFullscreen) {
      if (!this.isFullWindow) {
        this.ref.exitFullscreen();
      }
      else {
        this.exitFullWindow();
      }
    }
  };

  _listenForUserActivity = (): void => {
    const { ref } = this;

    this.setUserActive(true);

    let mouseInProgress;
    let lastMoveX;
    let lastMoveY;
    const handleActivity = () => {
      this._userActivity = true;
    };

    const handleMouseMove = function (e) {
      // 阻止频繁的 mousemove 触发
      if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
        lastMoveX = e.screenX;
        lastMoveY = e.screenY;
        handleActivity();
      }
    };

    const handleMouseDown =  () => {
      handleActivity();
      ref.clearInterval(mouseInProgress);
      mouseInProgress = ref.setInterval(handleActivity, 250);
    };

    const handleMouseUpAndMouseLeave =  () => {
      handleActivity();
      ref.clearInterval(mouseInProgress);
    };

    const { el } = ref;
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseup', handleMouseUpAndMouseLeave);
    el.addEventListener('mouseleave', handleMouseUpAndMouseLeave);

    let inactivityTimeout = ref.opts.inactivityTimeout;
    const controlBar = ref.getChild('controlBar');
    if (controlBar) {
      const controlBarEL = controlBar.el;
      controlBarEL.addEventListener('mouseenter', () => {
        inactivityTimeout = 0;
      });
      controlBarEL.addEventListener('mouseleave', () => {
        inactivityTimeout = ref.opts.inactivityTimeout;
      });
    }

    el.addEventListener('keydown', handleActivity);
    el.addEventListener('keyup', handleActivity);

    let inactivityTimer;

    ref.setInterval(() => {
      if (!this._userActivity) {
        return;
      }

      this._userActivity = false;
      this.setUserActive(true);

      ref.clearTimeout(inactivityTimer);

      if (inactivityTimeout <= 0) {
        return;
      }

      inactivityTimer = ref.setTimeout(() => {
        if (!this._userActivity) {
          this.setUserActive(false);
        }
      }, inactivityTimeout);
    }, 250);
  };

  // ========================== 处理tech事件绑定
  _handleTechAbort() {
    // empty
  }

  _handleTechEmptied() {
    // empty
  }

  _handleTechProgress() {
    // empty
  }

  _handleTechStalled() {
    // empty
  }

  _handleTechSuspend() {
    // empty
  }

  _handleTechDurationchange = () => {
    const { ref } = this;
    if (ref.isLive) {
      ref.addClass('vp-live');
    }
    else {
      ref.removeClass('vp-live');
    }
    ref.emit('durationchange');
  };

  _handleTechEnded = () => {
    const { ref } = this;

    ref.addClass('vp-ended');
    ref.removeClass('vp-waiting');

    if (ref.loop) {
      ref.currentTime = 0;
      ref.play();
    }
    else if (!ref.paused) {
      ref.pause();
    }

    ref.emit('ended');
  };

  _handleTechError = (e: TechEvent<Player>) => {
    const error: Error = e.error;
    this._error(error);
  };

  // 全屏
  _handleTechFullscreenchange = (e, data: any) => {
    if (data) {
      this.setFullscreen(data.isFullscreen);
    }
  };

  // 全屏错误
  _handleTechFullscreenerror = (e, err: Error) => {
    this.ref.emit({ type: 'fullscreenerror', error: err || e as unknown as Error });
  };

  _handleTechLoadeddata() {

  }

  // 加载完媒体信息
  _handleTechLoadedmetadata = () => {
    this.updateStyleEl();
    this.ref.emit('loadedmetadata');
  };

  // 开始加载请求
  _handleTechLoadstart = () => {
    const { ref } = this;

    ref.removeClass('vp-stop', 'vp-ended', 'vp-seeking');
    // 清理错误
    this._error(null);

    if (ref.paused) {
      if (!this._isPendingPlay) {
        ref.hasStarted = false;
      }
    }
    ref.emit('loadstart');

    if (this._isPendingPlay) {
      ref.play();
      this._isPendingPlay = false;
    }
  };

  // 暂停
  _handleTechPause = () => {
    const { ref } = this;

    ref.removeClass('vp-playing');
    ref.addClass('vp-paused');

    ref.emit('pause');
  };

  // 播放
  _handleTechPlay = () => {
    const { ref } = this;

    ref.removeClass('vp-ended', 'vp-paused');
    ref.addClass('vp-playing');
    ref.hasStarted = true;

    ref.emit('play');
  };

  // 播放中
  _handleTechPlaying = () => {
    const { ref } = this;

    ref.removeClass('vp-waiting');
    ref.emit('playing');
  };

  _handleTechResize() {
    this.ref.emit('resize');
  }

  // seek结束
  _handleTechSeeked = () => {
    const { ref } = this;

    ref.removeClass('vp-seeking');
    ref.emit('seeked');
  };

  // seek
  _handleTechSeeking = () => {
    const { ref } = this;

    ref.addClass('vp-seeking');
    ref.emit('seeking');
  };

  // 停止播放
  _handleTechStop = () => {
    const { ref } = this;

    ref.addClass('vp-stop');
    ref.removeClass('vp-waiting', 'vp-live', 'vp-ended');

    // this.hasStarted = false;
    ref.emit('stop');
  };

  // 时间改变
  _handleTechTimeupdate = () => {
    this.ref.emit('timeupdate');
  };

  // 声音改变
  _handleTechVolumechange = () => {
    this.ref.emit('volumechange');
  };

  // 缓冲
  _handleTechWaiting = () => {
    const { ref } = this;

    ref.addClass('vp-waiting');
    ref.emit('waiting');

    // const timeWhenWaiting = this.currentTime;
    // const timeUpdateListener = () => {
    //   if (timeWhenWaiting !== this.currentTime) {
    //     this.removeClass('vp-waiting');
    //     this.off('timeupdate', timeUpdateListener);
    //   }
    // };

    // this.on('timeupdate', timeUpdateListener);
  };

  enterFullWindow(): void {
    this.setFullscreen(true);
    this.isFullWindow = true;
    this._docOrigOverflow = document.documentElement.style.overflow;

    document.addEventListener('keydown', this._fullWindowOnEscKey, false);
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('vp-full-window');

    this.ref.emit('enterFullWindow');
  }

  exitFullWindow(): void {
    this.setFullscreen(false);
    this.isFullWindow = false;

    document.removeEventListener('keydown', this._fullWindowOnEscKey);

    document.documentElement.style.overflow = this._docOrigOverflow;

    document.body.classList.remove('vp-full-window');

    this.ref.emit('exitFullWindow');
  }

  loadTechByType(type: string): ITech | null {
    // 匹配合适的Tech
    const { techOrder } = this;

    for (let i = 0, len = techOrder.length; i < len; i++) {
      const [CurrentTech] = techOrder[i];
      if (CurrentTech && CurrentTech.isSupported() && CurrentTech.canPlayType(type)) {
        return this.loadTechByIndex(i);
      }
    }

    return null;
  }

  loadTechByIndex(index: number): ITech | null {
    const [techClass, techOpts] = this.techOrder[index];

    // 无效Tech
    if (!techClass) {
      return null;
    }

    this.unloadTech();
    return this._createTech(techClass, techOpts);
  }

  resolveSource(source: TPlaySource, autoplay: boolean): Promise<void> {
    if (!source) {
      throw new Error('No source specified.');
    }

    const { ref } = this;

    // 显示loading
    ref.addClass('vp-waiting');

    let playSource: PlaySource | Promise<PlaySource> = source as PlaySource;
    if (typeof source === 'function') {
      playSource = source();
    }

    this._isPendingPlay = autoplay;

    return Promise.resolve(playSource).then((resolvedSource: PlaySource) => {
      let { tech } = ref;

      // 不同类型的source，需要重新加载tech
      if (!tech || !(tech.constructor as TechConstructor).canPlayType(resolvedSource.type)) {
        tech = this.loadTechByType(resolvedSource.type);
      }

      if (!tech) {
        logger.error('Loaded invalid tech.');
        return;
      }

      ref.emit('loadedtech');

      tech.setSource(resolvedSource);

      // 非自动播放或者非预加载
      if (autoplay && !(this.autoplay || this.preload !== 'none')) {
        tech.load();
      }
    }).catch((e) => {
      this._error(e);
      throw e;
    });
  }

  unloadTech(): void {
    const { ref } = this;
    const { tech } = ref;
    if (tech) {
      tech.dispose();
      ref.tech = null;
    }
  }

  updateStyleEl = (): void => {
    let width;
    let height;
    let aspectRatio;
    let idClass;

    const { ref } = this;

    const _aspectRatio = this.aspectRatio;
    if (_aspectRatio && _aspectRatio !== 'auto') {
      aspectRatio = _aspectRatio;
    }
    else if (ref.videoWidth > 0) {
      aspectRatio = `${ref.videoWidth}:${ref.videoHeight}`;
    }
    else {
      aspectRatio = '16:9';
    }

    const ratioParts = aspectRatio.split(':');
    const ratioMultiplier = parseFloat(ratioParts[1]) / parseFloat(ratioParts[0]);
    const { width: _width, height: _height } = this;

    if (_width !== 0) {
      width = _width;
    }
    else if (_height !== 0) {
      width = _height / ratioMultiplier;
    }
    else {
      width = ref.videoWidth || 300;
    }

    if (_height !== 0) {
      height = _height;
    }
    else {
      height = width * ratioMultiplier;
    }

    const { id } = ref;
    if ((/^[^a-zA-Z]/).test(id)) {
      idClass = `dimensions-${id}`;
    }
    else {
      idClass = `${id}-dimensions`;
    }

    ref.addClass(idClass);

    setCssText(this._styleEl, `
      .${idClass} {
        width: ${width}px;
        height: ${height}px;
      }
      .${idClass}.vp-fluid {
        padding-top: ${ratioMultiplier * 100}%;
      }
    `);
  };

  setAspectRatio(ratio: string): void {
    if (typeof ratio !== 'string' || ratio === this.aspectRatio) {
      return;
    }

    if (!(/^\d+:\d+$/).test(ratio)) {
      throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
    }
    this.aspectRatio = ratio;
    this.setFluid(true);
    this.updateStyleEl();
  }

  setFill(bool: boolean): void {
    bool = !!bool;

    if (bool === this.fill) {
      return;
    }

    this.fill = !!bool;

    const { ref } = this;
    if (bool) {
      ref.addClass('vp-fill');
      this.setFluid(false);
    }
    else {
      ref.removeClass('vp-fill');
    }
  }

  setFluid(bool: boolean): void {
    bool = !!bool;
    if (bool === this.fluid) {
      return;
    }

    this.fluid = !!bool;

    const { ref } = this;
    ref.off(['playerreset', 'resize'], this.updateStyleEl);
    if (bool) {
      ref.addClass('vp-fluid');
      this.setFill(false);
      ref.on(['playerreset', 'resize'], this.updateStyleEl);
    }
    else {
      ref.removeClass('vp-fluid');
    }

    this.updateStyleEl();
  }

  setControls(bool: boolean): void {
    bool = !!bool;

    if (bool === this.controls) {
      return;
    }

    this.controls = bool;

    const { ref } = this;
    if (bool) {
      ref.removeClass('vp-controls-disabled');
      ref.addClass('vp-controls-enabled');
      ref.once('play', this._listenForUserActivity);
    }
    else {
      ref.removeClass('vp-controls-enabled');
      ref.addClass('vp-controls-disabled');
      ref.off('play', this._listenForUserActivity);
    }
  }

  setFullscreen(bool: boolean): void {
    const oldValue = this.isFullscreen;
    this.isFullscreen = bool;

    const { ref } = this;

    if (bool !== oldValue && fullscreenApi.prefixed) {
      ref.emit('fullscreenchange');
    }

    if (bool) {
      ref.addClass('vp-fullscreen');
      return;
    }
    ref.removeClass('vp-fullscreen');
  }

  setDimension(dimension: string, value?: any): void {
    if (value === '' || value === 'auto') {
      (this as any)[dimension] = 0;
      this.updateStyleEl();
      return;
    }

    const parsedVal = parseFloat(value);

    if (isNaN(parsedVal)) {
      logger.error(`Improper value "${value}" supplied for for ${dimension}`);
      return;
    }

    (this as any)[dimension] = parsedVal;
    this.updateStyleEl();
  }

  setHeight(val: number) {
    this.setDimension('height', val);
  }

  setWidth(val: number) {
    this.setDimension('width', val);
  }

  setHasStarted(bool: boolean) {
    bool = !!bool;

    if (bool === this.hasStarted) {
      return;
    }

    this.hasStarted = bool;

    const { ref } = this;
    if (bool) {
      ref.addClass('vp-has-started');
    }
    else {
      ref.removeClass('vp-has-started');
    }
  }

  setPlaybackRates(rates: number[]) {
    if (!Array.isArray(rates)) {
      rates = [];
    }
    this.playbackRates = rates;
    this.ref.emit('rateschange');
  }

  setScrubbing(scrubbing: boolean) {
    scrubbing = !!scrubbing;

    if (scrubbing === this.scrubbing) {
      return;
    }

    this.scrubbing = scrubbing;
    const { ref } = this;
    if (scrubbing) {
      ref.addClass('vp-scrubbing');
    }
    else {
      ref.removeClass('vp-scrubbing');
    }

    techCall(ref.tech, 'setScrubbing', scrubbing);
  }

  setTechOrder(config: any): void {
    this.techOrder = config.map(clearTechClass);
  }

  setUserActive(bool: boolean): void {
    bool = !!bool;

    if (bool === this.userActive) {
      return;
    }

    this.userActive = bool;
    this._userActivity = bool;

    const { ref } = this;

    if (bool) {
      ref.removeClass('vp-user-inactive');
      ref.addClass('vp-user-active');
      ref.emit('useractive');
    }
    else {
      ref.removeClass('vp-user-active');
      ref.addClass('vp-user-inactive');
      ref.emit('userinactive');
    }
  }
}

export class Player extends Component<PlayerFixedOptions> implements IPlayer {
  id!: string;
  installedPlugins: TPlayerPlugin[] = [];

  autoplay!: boolean;
  loop!: boolean;
  muted!: boolean;
  playbackRate!: number;
  preload!: TPreload;
  volume!: number;

  aspectRatio!: string;
  controls!: boolean;
  fill!: boolean;
  fluid!: boolean;
  hasStarted!: boolean;
  height!: number;
  playbackRates!: number[];
  scrubbing!: boolean;
  tech!: ITech | null;
  techOrder!: Array<[TechConstructor, any]>;
  userActive!: boolean;
  width!: number;

  readonly duration!: number;
  readonly ended!: boolean;
  readonly isFullscreen!: boolean;
  readonly isFullWindow!: boolean;
  readonly isLive!: boolean;
  readonly networkState!: number;
  readonly paused!: boolean;
  readonly readyState!: number;
  readonly videoHeight!: number;
  readonly videoWidth!: number;

  private readonly _controller: Controller;

  constructor(opts: any) {
    super('player', null as unknown as any, checkOptions(Object.assign({
      autoplay: false,
      controls: true,
      fill: false,
      fluid: false,
      fullscreen: {
        options: {
          navigationUI: 'hide'
        }
      },
      height: 0,
      id: getGUID('player'),
      inactivityTimeout: 2000,
      logLevel: 'INFO',
      loop: false,
      muted: false,
      playbackRate: 1,
      playbackRates: [],
      preload: 'metadata',
      volume: 1,
      width: 0
    }, opts)));

    const options = this.opts;
    logFactory.setLevel(options.logLevel);

    this.player = this;
    const { el } = this;
    (el as any).player = this;

    const controller = new Controller(this);
    this._controller = controller;

    [
      'id',
      'controls',
      'width',
      'height',
      'fill',
      'fluid',
      'aspectRatio',
      'techOrder'
    ].forEach((attr) => {
      this[attr] = options[attr];
    });

    let rates = options.playbackRates;
    if (!Array.isArray(rates)) {
      rates = [];
    }
    controller.playbackRates = rates;

    this.initChildren([
      { name: 'controlBar', component: ControlBar },
      // { name: 'overlay', component: Overlay },
      { name: 'loadingSpinner', component: LoadingSpinner },
      { name: 'bigPlayButton', component: BigPlayButton }
    ]);
  }

  get currentTime(): number {
    return techGet(this.tech, 'currentTime', 0);
  }

  get playbackRateSupported(): boolean {
    const { tech } = this;
    return !!tech
      && tech.supportsPlaybackRate()
      && this.playbackRates.length > 0;
  }

  get source(): TPlaySource | undefined {
    return this.opts.source;
  }

  set currentTime(val: number) {
    techCall(this.tech, 'setCurrentTime', val);
  }

  set source(val: TPlaySource) {
    this.opts.source = val;
  }

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vd-player vp-paused'
    });
  }

  dispose(): Promise<void> {
    this.unmount();
    return new Promise((resolve, reject) => {
      const { tech } = this;
      if (!tech) {
        resolve();
        return;
      }

      function offHandler() {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        tech!.off('error', errorHandler);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        tech!.off('dispose', disposeHandler);
      }
      function disposeHandler() {
        offHandler();
        resolve();
      }
      function errorHandler(evt: PlayerEvent<unknown, ITech>) {
        offHandler();
        reject(evt.error);
      }

      tech.once('dispose', offHandler);
      tech.once('error', errorHandler);

      this._controller.unloadTech();
    });
  }

  enterFullWindow(): this {
    this._controller.enterFullWindow();
    return this;
  }

  exitFullscreen(): Promise<void> {
    const me = this;
    const { _controller } = this;

    return new Promise((resolve, reject) => {
      function offHandler() {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        me.off('fullscreenerror', errorHandler);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        me.off('fullscreenchange', changeHandler);
      }
      function changeHandler() {
        offHandler();
        resolve();
      }
      function errorHandler(evt: PlayerEvent<unknown, Player>) {
        offHandler();
        reject(evt.error);
      }

      me.once('fullscreenchange', changeHandler);
      me.once('fullscreenerror', errorHandler);

      const { exitFullscreen } = fullscreenApi;
      if (exitFullscreen) {
        const promise = (document as any)[exitFullscreen]();

        if (promise) {
          silencePromise(promise.then(() => _controller.setFullscreen(false)));
          promise.then(offHandler, offHandler);
          promise.then(resolve, reject);
        }
      }
      else if (techGet(me.tech, 'supportsFullScreen') && !me.opts.preferFullWindow) {
        me.tech!.exitFullScreen();
      }
      else {
        this.exitFullWindow();
      }
    });
  }

  exitFullWindow(): this {
    this._controller.exitFullWindow();
    return this;
  }

  load(): Promise<void> {
    return techCall(this.tech, 'load');
  }

  mount(parentEl: Element | string | null): Element {
    if (!parentEl) {
      throw new Error('No element specified.');
    }
    else if (typeof parentEl === 'string') {
      parentEl = document.querySelector(parentEl);
    }
    if (!parentEl) {
      throw new Error('Unknown selector specified.');
    }

    (parentEl).appendChild(this.el);

    return (parentEl);
  }

  pause(): Promise<void> {
    const { tech } = this;
    if (tech) {
      return makeActionPromise(this, 'pause', (resolve) => {
        if (this.paused) {
          resolve();
          return;
        }
        tech.pause();
      });
    }

    logger.warn('Call "pause", but no tech was specified.');
    return Promise.resolve();
  }

  play(): Promise<void> {
    return makeActionPromise(this, 'play', (resolve) => {
      // 传入新的source就重新加载
      if (!this.tech) {
        this._controller.resolveSource(this.source as TPlaySource, true);
      }
      else if (this.paused) {
        this.tech.play();
      }
      else {
        resolve();
      }
    });
  }

  preloadTech(index: number): void {
    this._controller.loadTechByIndex(index);
  }

  requestFullscreen(fullscreenOptions?: FullscreenOptions): Promise<void> {
    const me = this;
    const { _controller } = this;

    return new Promise((resolve, reject) => {
      function offHandler() {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        me.off('fullscreenerror', errorHandler);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        me.off('fullscreenchange', changeHandler);
      }
      function changeHandler() {
        offHandler();
        resolve();
      }
      function errorHandler(evt: PlayerEvent<unknown, Player>) {
        offHandler();
        reject(evt.error);
      }

      me.once('fullscreenchange', changeHandler);
      me.once('fullscreenerror', errorHandler);

      if (!fullscreenOptions) {
        fullscreenOptions = this.opts.fullscreen || {};
      }

      const { requestFullscreen } = fullscreenApi;
      if (requestFullscreen) {
        const promise = (this.el as any)[requestFullscreen](fullscreenOptions);
        if (promise) {
          promise.then(
            () => _controller.setFullscreen(true),
            () => _controller.setFullscreen(false)
          );
          promise.then(offHandler, offHandler);
          promise.then(resolve, reject);
        }
      }
      else if (techGet(this.tech, 'supportsFullScreen') && !this.opts.preferFullWindow) {
        this.tech!.enterFullScreen();
      }
      else {
        this.enterFullWindow();
      }
    });
  }

  start(source?: TPlaySource): Promise<void> {
    // 传入新的source就重新加载
    if (source) {
      this.source = source;
    }
    else {
      source = this.source;
    }

    return this.stop()
      .then(() => {
        return this._controller.resolveSource(source as TPlaySource, true);
      });
  }

  stop(): Promise<void> {
    const { tech } = this;
    if (tech) {
      return makeActionPromise(this, 'stop', () => {
        tech.stop();
      });
    }

    return Promise.resolve();
  }

  unmount() {
    const { el } = this;
    const { parentNode } = el;
    if (parentNode) {
      parentNode.removeChild(el);
    }

    return parentNode;
  }

  use(plugin: TPlayerPlugin, ...options: any[]) {
    const { installedPlugins } = this;
    if (installedPlugins.indexOf(plugin) > -1) {
      logger.warn('Plugin has already been applied to target player.');
    }
    else if (plugin && typeof (plugin as OPlayerPlugin).install === 'function') {
      installedPlugins.push(plugin);
      (plugin as OPlayerPlugin).install(this, ...options);
    }
    else if (typeof plugin === 'function') {
      installedPlugins.push(plugin);
      (plugin)(this, ...options);
    }
    else {
      logger.warn(
        'A plugin must either be a function or an object with an "install" '
          + 'function.'
      );
    }
    return this;
  }
}

forOwn(OPTS_MAPPING, (fn, key) => {
  const method = `set${capitalize(key)}`;

  Object.defineProperty(Player.prototype, key, {
    configurable: true,
    enumerable: false,
    get(): any {
      return techGet(this.tech, key, this.opts[key]);
    },
    set(val: any) {
      val = fn(val as never);
      if (val === null) {
        return;
      }

      const { tech } = this;
      if (tech && val !== this[key]) {
        tech[method](val);
      }
    }
  });
});


forOwn(GETTER_MAPPING, (val, attr) => {
  Object.defineProperty(Player.prototype, attr, {
    configurable: true,
    enumerable: true,
    get: val === null
      ? function () {
        return this._controller[attr];
      }
      : function () {
        return techGet(this.tech, attr, val);
      }
  });
});

ATTRS_MAPPING.forEach((attr) => {
  Object.defineProperty(Player.prototype, attr, {
    configurable: true,
    enumerable: true,
    get() {
      return this._controller[attr];
    },
    set(val: any) {
      this._controller[`set${capitalize(attr)}`](val);
    }
  });
});

let style = document.querySelector('.vp-styles-defaults');

if (!style) {
  style = createStyleElement('vp-styles-defaults');
  const head = document.getElementsByTagName('head')[0];

  if (head) {
    head.insertBefore(style, head.firstChild);
  }

  setCssText(style, `
.vd-player {
  width: 300px;
  height: 150px;
}
.vp-fluid {
  padding-top: 56.25%
}
`);
}
