import {
  capitalize,
  Emitter,
  getGUID,
  logFactory,
  PlaySource,
  Tech,
  toAbsoluteURL
} from 'vd-player';

const logger = logFactory.getLogger('tech-html5');

const TEST_VID = document.createElement('video');
const track = document.createElement('track');

track.kind = 'captions';
track.srclang = 'en';
track.label = 'English';
TEST_VID.appendChild(track);

function triggerEvents<T>(
  emitter: T,
  bindFn: string,
  events: string[],
  tech: Emitter,
) {
  events.forEach((eventType) => {
    emitter[bindFn](eventType, (evt) => {
      tech.emit({ type: eventType, target: emitter, originalEvent: evt });
    });
  });
}

export function resolveSrc(source: PlaySource): Promise<string> {
  const { src } = source;
  let newSrc: string | Promise<string> = src as string;
  if (typeof src === 'function') {
    newSrc = src();
  }
  return Promise.resolve(newSrc);
}

export function reset(el: HTMLVideoElement): void {
  const sources = el.querySelectorAll('source');
  let i = sources.length;

  while (i--) {
    el.removeChild(sources[i]);
  }

  try {
    const { src } = el;
    if (src) {
      URL.revokeObjectURL(src);
    }
  }
  catch (e) {
    // not url object
  }

  el.removeAttribute('src');

  try {
    el.load();
  }
  catch (e) {
    // not supported
  }
}

export function pause(el: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (!el.paused) {
      const handlePause = (err?: any) => {
        el.removeEventListener('pause', handlePause);
        el.removeEventListener('error', handlePause);
        resolve(err);
      };

      el.addEventListener('pause', handlePause);
      el.addEventListener('error', handlePause);
      el.pause();
    }
    else {
      resolve();
    }
  });
}

export function stop(el: HTMLVideoElement): Promise<void> {
  return pause(el).then(() => {
    reset(el);
  });
}

export class Html5<T> extends Tech<T> {
  el!: HTMLVideoElement;
  source: PlaySource | null = null;

  static canPlayType(type: string): CanPlayTypeResult {
    return TEST_VID.canPlayType(type);
  }

  static isSupported(): boolean {
    try {
      TEST_VID.volume = 0.5;
    }
    catch (e) {
      return false;
    }

    return !!(TEST_VID && TEST_VID.canPlayType);
  }

  currentTime(): number {
    return this.el.currentTime;
  }

  createElement(): HTMLVideoElement {
    const { player } = this;
    const el = document.createElement('video');
    el.setAttribute('id', getGUID('tech_html5'));
    el.setAttribute('class', 'vp-tech');
    el.setAttribute('preload', player.preload);

    triggerEvents<HTMLVideoElement>(
      el,
      'addEventListener',
      [
        'canplay',
        'durationchange',
        'ended',
        'loadedmetadata',
        'loadstart',
        'pause',
        'play',
        'playing',
        'ratechange',
        'seeked',
        'seeking',
        'timeupdate',
        'volumechange',
        'waiting'
      ],
      this,
    );

    el.addEventListener('error', (err) => {
      this.emit({
        type: 'error',
        error: err,
        target: el,
        originalEvent: err
      });
    });

    this.el = el;
    return el;
  }

  dispose(): Promise<void> {
    const { el } = this;

    return pause(el).then(() => {
      el.remove();

      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      el.removeAttribute('src');

      try {
        el.load();
      }
      catch (e) {
        // not supported
      }

      this.emit('dispose');
      this.removeAllListeners();
    });
  }

  load(): Promise<void> {
    const { source } = this;
    if (!source) {
      const err = new Error('Play source not specified');
      logger.error(err);
      throw err;
    }
    return resolveSrc(source).then((url) => this._loadUrl(toAbsoluteURL(url)));
  }

  pause(): void {
    pause(this.el);
  }

  play(): void {
    const { el } = this;
    if (!el.src) {
      this._resolveSrc(this.source as PlaySource).then((url) => {
        el.src = url;
        el.play();
      });
    }

    el.play();
  }

  setCurrentTime(seconds: number): void {
    const el = this.el;
    if (this.scrubbing && el.fastSeek) {
      el.fastSeek(seconds);
    }
    else {
      el.currentTime = seconds;
    }
  }

  setSource(source: PlaySource): void {
    this.source = source;

    const { player } = this;
    if (player.autoplay || player.preload !== 'none') {
      this._resolveSrc(source).then((url) => {
        this._setSrc(url);
      });
    }
  }

  stop(): Promise<void> {
    return stop(this.el).then(() => {
      this.emit('stop');
    });
  }

  _loadUrl(url: string): void {
    const { el } = this;
    el.src = url;
    el.load();
  }

  _resolveSrc(source: PlaySource): Promise<string> {
    return resolveSrc(source).then(toAbsoluteURL);
  }

  _setSrc(url: string): void {
    this.el.src = url;
  }
}

function defineMethods(proto: any, methods: string[], hasSetter?: boolean) {
  methods.forEach((attr) => {
    (Html5.prototype as any)[attr] = function (): any {
      return this.el[attr];
    };

    if (hasSetter) {
      (Html5.prototype as any)[`set${capitalize(attr)}`] = function (
        val: any,
      ): void {
        this.el[attr] = val;
      };
    }
  });
}

defineMethods(
  Html5.prototype,
  ['autoplay', 'loop', 'muted', 'playbackRate', 'preload', 'volume'],
  true,
);

defineMethods(Html5.prototype, [
  'currentTime',
  'duration',
  'ended',
  'networkState',
  'paused',
  'readyState',
  'videoHeight',
  'videoWidth'
]);
