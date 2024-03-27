import { Emitter } from 'eemitt';

import logFactory from './logFactory';
import { ChildConfig, ComponentInner, ComponentOptions, IComponent, IPlayer } from './typings';
import { forOwn, notImplementedError } from './util';

const logger = logFactory.getLogger('Component');

const cancelMappings = [
  ['namedRafs', 'cancelNamedAnimationFrame'],
  ['rafIds', 'cancelAnimationFrame'],
  ['setTimeoutIds', 'clearTimeout'],
  ['setIntervalIds', 'clearInterval']
];

function clearTimersOnDispose(cmp: Component<any>) {
  const { _ci } = cmp;
  if (_ci.clearingTimersOnDispose) {
    return;
  }

  _ci.clearingTimersOnDispose = true;

  cmp.once('dispose', () => {
    cancelMappings.forEach(([idName, cancelName]) => {
      const s = _ci[idName];
      if (Array.isArray(s)) {
        s.forEach((val) => cmp[cancelName](val));
      }
      else {
        forOwn(s, (val) => cmp[cancelName](val));
      }
    });

    _ci.clearingTimersOnDispose = false;
  });
}

export class Component<T extends ComponentOptions> extends Emitter implements IComponent {
  player: IPlayer;
  name: string;
  children: IComponent[] = [];
  parent: IComponent | null = null;
  el: HTMLElement;
  opts: T;
  _ci: ComponentInner = {
    clearingTimersOnDispose: false, // 销毁时是否清空各种timer
    setTimeoutIds: [], // timeout id
    setIntervalIds: [], // interval id
    rafIds: [], // requestAnimationFrame id
    namedRafs: {}, // requestAnimationFrame name
    elEvents: {} // onEl方法绑定过的事件
  };

  constructor(name: string, player: IPlayer, opts?: T) {
    super();

    if (!opts) {
      opts = {} as T;
    }

    this.name = name;
    this.player = player;
    this.opts = opts;
    this.el = this._createEl(player, opts);

    if (opts.visible === false) {
      this.hide();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _createEl(player: IPlayer, opts: T): HTMLElement {
    throw notImplementedError('_createEl', this);
  }

  _beforeDispose(): any {
    // empty
  }

  initChildren(config: ChildConfig[]): void {
    const currentOpts = this.opts;
    config.forEach((item) => {
      const opt = currentOpts[item.name];
      if (opt !== false) {
        item.opts = Object.assign({}, item.opts, opt);
        this.initChild(item, true);
      }
    });
  }

  onEl(eventName: string | string[], fn: (...args: any[]) => any): this {
    const { el } = this;
    const { elEvents } = this._ci;
    fn = fn.bind(this);
    if (Array.isArray(eventName)) {
      eventName.forEach((name: string) => {
        el.addEventListener(name, fn);
        elEvents[name] = fn;
      });
    }
    else {
      el.addEventListener(eventName, fn);
      elEvents[eventName] = fn;
    }
    return this;
  }

  removeAllElListeners(eventName?: any | any[]): this {
    const { el } = this;
    const { elEvents } = this._ci;
    switch (arguments.length) {
      case 0:
        forOwn(elEvents, (f, n) => {
          el.removeEventListener(n, f);
          delete elEvents[n];
        });
        break;
      case 1:
        forOwn(elEvents, (f, n) => {
          if (n === eventName) {
            el.removeEventListener(n, f);
            delete elEvents[n];
          }
        });
        break;
    }
    return this;
  }

  getChild(name: string): IComponent | null {
    return this.children.find((cmp) => cmp.name === name) || null;
  }

  initChild({ name, component: Cmp, opts }: ChildConfig, append?: boolean): IComponent {
    const child = new Cmp(name, this.player, opts);
    return append ? this.appendChild(child) : child;
  }

  appendChild(child: IComponent): IComponent {
    this.el.appendChild(child.el);
    child.parent = this;
    this.children.push(child);
    return child;
  }

  insertBefore(cmp: IComponent, childName: string): IComponent {
    // 没有参考对象就加在最后
    if (!childName) {
      return this.appendChild(cmp);
    }

    const { children } = this;
    let reference;
    let flag = -1;
    for (let i = 0, l = children.length; i < l; i++) {
      if (children[i].name === childName) {
        reference = children[i];
        flag = i;
        break;
      }
    }
    if (!reference) {
      logger.warn(`Can not find Component by "${childName}", insert "${childName}" as the last component.`);
      return this.appendChild(cmp);
    }

    this.el.insertBefore(cmp.el, reference.el);
    cmp.parent = this;

    children.splice(flag, 0, cmp);
    return cmp;
  }

  removeChild(childName: string): IComponent | null {
    if (!childName) {
      return null;
    }

    const { children } = this;
    let flag = -1;
    let child;
    for (let i = 0, l = children.length; i < l; i++) {
      if (children[i].name === childName) {
        flag = i;
        child = children[i];
        break;
      }
    }
    if (flag === -1) {
      return null;
    }
    this.children.splice(flag, 1);
    child.parent = null;
    return child;
  }

  hasClass(className: string): boolean {
    return this.el.classList.contains(className);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addClass(...tokens: string[]): void {
    const { classList } = this.el;
    // eslint-disable-next-line prefer-spread
    classList.add.apply(classList, arguments as unknown as string[]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeClass(...tokens: string[]): void {
    const { classList } = this.el;
    // eslint-disable-next-line prefer-spread
    classList.remove.apply(classList, arguments as unknown as string[]);
  }

  toggleClass(token: string, force?: boolean): boolean {
    return this.el.classList.toggle(token, force);
  }

  setAttribute(name: string, val: any): void {
    this.el.setAttribute(name, val);
  }

  getAttribute(name: string): null | string {
    return this.el.getAttribute(name);
  }

  removeAttribute(name: string): void {
    return this.el.removeAttribute(name);
  }

  show(): void {
    this.removeClass('vp-hidden');
  }

  hide(): void {
    this.addClass('vp-hidden');
  }

  dispose(): void {
    this._beforeDispose();
    this.children.forEach((cmp) => {
      cmp.dispose();
    });
    this.removeAllElListeners();
    this.emit('dispose');
    this.removeAllListeners();
  }

  setTimeout(fn: () => void, timeout: number): number {
    clearTimersOnDispose(this);

    const timeoutId = window.setTimeout(() => {
      const { setTimeoutIds } = this._ci;
      const idx = setTimeoutIds.indexOf(timeoutId);
      if (idx > -1) {
        setTimeoutIds.splice(idx, 1);
      }
      fn();
    }, timeout);

    this._ci.setTimeoutIds.push(timeoutId);

    return timeoutId;
  }

  clearTimeout(timeoutId: number): number {
    const { setTimeoutIds } = this._ci;
    const idx = setTimeoutIds.indexOf(timeoutId);
    if (idx > -1) {
      setTimeoutIds.splice(idx, 1);
      window.clearTimeout(timeoutId);
    }
    return timeoutId;
  }

  setInterval(fn: () => void, interval: number): number {
    clearTimersOnDispose(this);

    const intervalId = window.setInterval(fn, interval);

    this._ci.setIntervalIds.push(intervalId);

    return intervalId;
  }

  clearInterval(intervalId: number) {
    const { setIntervalIds } = this._ci;
    const idx = setIntervalIds.indexOf(intervalId);
    if (idx > -1) {
      setIntervalIds.splice(idx, 1);
      window.clearInterval(intervalId);
    }

    return intervalId;
  }

  requestAnimationFrame(fn: () => void) {
    clearTimersOnDispose(this);

    const { rafIds } = this._ci;
    const id = window.requestAnimationFrame(() => {
      const idx = rafIds.indexOf(id);
      if (idx > -1) {
        rafIds.splice(idx, 1);
      }
      fn();
    });
    rafIds.push(id);

    return id;
  }

  requestNamedAnimationFrame(name: string, fn: () => void): string | null {
    const { namedRafs } = this._ci;
    if (namedRafs.hasOwnProperty(name)) {
      return null;
    }

    clearTimersOnDispose(this);

    const id = this.requestAnimationFrame(() => {
      fn();
      if (namedRafs.hasOwnProperty(name)) {
        delete namedRafs[name];
      }
    });

    namedRafs[name] = id;

    return name;
  }

  cancelNamedAnimationFrame(name: string): void {
    const { namedRafs } = this._ci;
    if (!namedRafs.hasOwnProperty(name)) {
      return;
    }

    this.cancelAnimationFrame(namedRafs[name]);
    delete namedRafs[name];
  }

  cancelAnimationFrame(id: number) {
    const { rafIds } = this._ci;
    const idx = rafIds.indexOf(id);
    if (idx > -1) {
      rafIds.splice(idx, 1);
      window.cancelAnimationFrame(id);
    }

    return id;

  }
}
