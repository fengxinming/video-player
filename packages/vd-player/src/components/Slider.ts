
import keycode from 'keycode';

import { Component } from '../Component';
import { UPDATE_REFRESH_INTERVAL } from '../constants';
import {
  blockTextSelection,
  createElement,
  getPercentPointer,
  unblockTextSelection
} from '../dom';
import { isChrome } from '../env';
import { IPlayer, ISliderBar, SliderOptions } from '../typings';
import {
  clamp,
  notImplementedError,
  throttle
} from '../util';

export class Controller {
  ref: Slider<any>;
  player: IPlayer;
  enabled: boolean = false;
  touchStarted: boolean = false;
  calculateValue: (event: MouseEvent | TouchEvent) => number;

  constructor(ref: Slider<any>, player: IPlayer) {
    this.ref = ref;
    this.player = player;

    this.calculateValue = ref.opts.direction === 'vert'
      ? (event: MouseEvent | TouchEvent) => {
        return getPercentPointer(ref.el, event).y;
      }
      : (event: MouseEvent | TouchEvent) => {
        return getPercentPointer(ref.el, event).x;
      };

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleClick = this._handleClick.bind(this);
  }

  enable(): void {
    if (this.enabled) {
      return;
    }

    this._attach();
    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    this._detach();
    this.enabled = false;
  }

  _attach(): void {
    const { ref } = this;
    const { el } = ref;
    el.addEventListener('mousedown', this._handleMouseDown);
    el.addEventListener('touchstart', this._handleMouseDown);
    el.addEventListener('keydown', this._handleKeyDown);
    el.addEventListener('click', this._handleClick, false);

    ref.removeClass('disabled');
    ref.setAttribute('tabindex', 0);
  }

  _detach(): void {
    const { ref } = this;
    const { el } = ref;
    const doc = ref.bar.el.ownerDocument;

    el.removeEventListener('mousedown', this._handleMouseDown);
    el.removeEventListener('touchstart', this._handleMouseDown);
    el.removeEventListener('keydown', this._handleKeyDown);
    el.removeEventListener('click', this._handleClick);

    doc.removeEventListener('mousemove', this._handleMouseMove);
    doc.removeEventListener('mouseup', this._handleMouseUp);
    doc.removeEventListener('touchmove', this._handleMouseMove);
    doc.removeEventListener('touchend', this._handleMouseUp);

    ref.removeAttribute('tabindex');
    ref.addClass('disabled');
  }


  _stepBack(): void {
    throw notImplementedError('stepBack', this);
  }

  _stepForward(): void {
    throw notImplementedError('stepForward', this);
  }

  _handleMouseDown(event: MouseEvent | TouchEvent): any {
    const doc = this.ref.bar.el.ownerDocument;

    if (event.type === 'mousedown') {
      event.preventDefault();
    }

    if (event.type === 'touchstart' && !isChrome) {
      event.preventDefault();
    }
    blockTextSelection();

    doc.addEventListener('mousemove', this._handleMouseMove, false);
    doc.addEventListener('mouseup', this._handleMouseUp, false);
    doc.addEventListener('touchmove', this._handleMouseMove, false);
    doc.addEventListener('touchend', this._handleMouseUp, false);

    this.touchStarted = true;
  }

  _handleMouseMove(event: MouseEvent | TouchEvent): any {
    if (this.touchStarted) {
      this.ref.throttledUpdate(this.calculateValue(event));
    }
  }

  _handleMouseUp(event: MouseEvent | TouchEvent): any {
    const { ref } = this;
    const doc = ref.bar.el.ownerDocument;

    unblockTextSelection();

    doc.removeEventListener('mousemove', this._handleMouseMove);
    doc.removeEventListener('mouseup', this._handleMouseUp);
    doc.removeEventListener('touchmove', this._handleMouseMove);
    doc.removeEventListener('touchend', this._handleMouseUp);

    this.touchStarted = false;

    ref.update(this.calculateValue(event));
  }

  _handleKeyDown(event: KeyboardEvent): any {
    if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
      event.preventDefault();
      event.stopPropagation();
      this._stepBack();
    }
    else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
      event.preventDefault();
      event.stopPropagation();
      this._stepForward();
    }
  }

  _handleClick(event: MouseEvent): any {
    event.stopPropagation();
    event.preventDefault();
  }
}

export class Slider<T extends ISliderBar> extends Component<SliderOptions> {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);

  bar: T;
  value: number = 0;
  enabled: boolean = false;
  controller: Controller;

  constructor(name: string, player: IPlayer, opts?: SliderOptions) {
    super(name, player, opts);

    this.bar = this._createBar(player, opts);
    this.controller = this._createController(player, opts);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _createEl(player: IPlayer, opts: SliderOptions): HTMLElement {
    return createElement('div', {
      tabIndex: 0,
      className: 'vp-slider'
    }, {
      role: 'slider',
      'aria-valuenow': 0,
      'aria-valuemin': 0,
      'aria-valuemax': 100
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _createController(player: IPlayer, opts?: SliderOptions): Controller {
    return new Controller(this, player);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _createBar(player: IPlayer, opts?: SliderOptions): T {
    throw notImplementedError('initBar', this);
  }

  enable(): void {
    this.controller.enable();
  }

  disable(): void {
    this.controller.disable();
  }

  _beforeDispose(): void {
    this.disable();
  }


  // 渲染进度，并返回是否触发了渲染
  update(percent: number): void {
    if (percent === -1) {
      return;
    }
    this.value = percent;
    this.bar.update(percent);
  }

  clamp(val: number): number {
    return Number(clamp(val, 0, 1).toFixed(4));
  }
}
