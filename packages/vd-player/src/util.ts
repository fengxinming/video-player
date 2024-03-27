function noop(...args: any[]): void;
function noop() {}

const isNaN = Number.isNaN || function<T> (value: T): boolean {
  // eslint-disable-next-line no-self-compare
  return value !== value && typeof value === 'number';
};

function isPromiseLike<T>(value: T) {
  return value && typeof value === 'object' && typeof (value as any).then === 'function';
}

export function forOwn<T>(
  obj: Record<string, T>,
  iteratee: (value: T, key: string, obj: Record<string, T>) => any | void
): void;
export function forOwn(
  obj: any,
  iteratee: (value: any, key: string, ctx: any) => any | void,
  context?: any
): void {
  obj && Object.entries(obj).forEach(([key, value]) => {
    iteratee(value, key, context ?? obj);
  });
}

const PROTOCOL = /^([a-z][a-z\d+\-.]*:)?\/\//i;
export function isAbsoluteURL<T> (url: T): boolean;
export function isAbsoluteURL(url: any): boolean {
  return PROTOCOL.test(url);
}

const aTest = typeof document !== 'undefined' && document.createElement('a');
export function toAbsoluteURL(url: string): string {
  if (!isAbsoluteURL(url) && aTest) {
    aTest.href = url;
    url = aTest.href;
    aTest.href = '';
  }
  return url;
}

const _initialGuid = 3;
let _guid = _initialGuid;
function newGUID() {
  return _guid++;
}

function getGUID(type: string) {
  return `vp_${type}_${newGUID()}`;
}


function silencePromise(value: PromiseLike<any>) {
  if (isPromiseLike(value)) {
    value.then(null, noop);
  }
}

function notImplementedError(method: string, instance: any, extra?: {[key: string]: any}) {
  const err = new Error(
    `${typeof instance === 'string' ? instance : instance.constructor.name}.${method} not implemented yet.`
  );
  err.name = 'NotImplementedError';
  Object.assign(err, extra);
  return err;
}

// 限制在最大最小值区间
function clamp(number: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, isNaN(number) ? min : number));
}

function throttle(func: (...a: any[]) => any, wait: number): (...args: any[]) => void {
  let last = window.performance.now();

  const throttled = function (): void {
    const now = window.performance.now();
    if (now - last >= wait) {
      func.apply(this, arguments as unknown as any[]);
      last = now;
    }
  };

  return throttled;
}

function debounce(func: (...a: any[]) => any, wait: number, immediate?: boolean, context: any = window) {
  let timeout: number | null = null;

  const cancel = () => {
    context.clearTimeout(timeout);
    timeout = null;
  };

  const debounced = function () {
    const self = this;
    const args = arguments as unknown as any[];

    let later: any = function () {
      timeout = null;
      later = null;
      if (!immediate) {
        func.apply(self, args);
      }
    };

    if (!timeout && immediate) {
      func.apply(self, args);
    }

    context.clearTimeout(timeout);
    timeout = context.setTimeout(later, wait);
  };

  debounced.cancel = cancel;

  return debounced;
}

function formatTime(seconds: number): string {
  let display = '';

  if (isNaN(seconds) || seconds === Infinity) {
    display = '-:-';
  }
  else {
    seconds = seconds < 0 ? 0 : seconds;
    const s: number = Math.floor(seconds % 60);
    const m: number = Math.floor(seconds / 60 % 60);
    const h: number = Math.floor(seconds / 3600);

    display += h > 0 ? `${h}:` : '';
    display += `${(h && m < 10) ? `0${m}` : m}:`;
    display += s < 10 ? `0${s}` : s;
  }
  return display;
}

function capitalize(name: string): string {
  return name.replace(/./, (n) => n.toLocaleUpperCase());
}

export {
  capitalize,
  clamp,
  debounce,
  formatTime,
  getGUID,
  notImplementedError,
  silencePromise,
  throttle
};
