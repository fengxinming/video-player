
import keycode from 'keycode';

import {
  PAGE_KEY_MULTIPLIER,
  STEP_SECONDS,
  UPDATE_REFRESH_INTERVAL
} from '../../constants';
import { createElement, getPercentPointer, isSingleLeftClick } from '../../dom';
import { IPlayer, SliderOptions } from '../../typings';
import { clamp, throttle } from '../../util';
import { Controller, Slider } from '../Slider';
import { MouseTimeDisplay } from './MouseTimeDisplay';
import { PlayProgressBar } from './PlayProgressBar';

class SeekBarController extends Controller {
  videoWasPlaying = false;

  _handleTimeUpdate = throttle(() => {
    const { ref, player } = this;
    const { currentTime, duration } = player;
    ref.throttledUpdate(ref.clamp(currentTime / duration));
  }, UPDATE_REFRESH_INTERVAL);

  constructor(ref: SeekBar, player: IPlayer) {
    super(ref, player);

    player
      .on(['ended', 'durationchange', 'timeupdate'], this._handleTimeUpdate)
      .on('stop', this._handleStop);

    if ('hidden' in document && 'visibilityState' in document) {
      document.addEventListener('visibilitychange', this._toggleVisibility);
    }

    ref.onEl('mousemove', this._handleMouseTime);
  }

  clean(): void {
    this.player
      .off(['ended', 'durationchange', 'timeupdate'], this._handleTimeUpdate)
      .off('stop', this._handleStop);

    if ('hidden' in document && 'visibilityState' in document) {
      document.removeEventListener('visibilitychange', this._toggleVisibility);
    }
  }

  _toggleVisibility = () => {
    const { ref } = this;
    if (document.visibilityState === 'hidden') {
      ref.cancelNamedAnimationFrame('SeekBar#update');
      ref.cancelNamedAnimationFrame('Slider#update');
    }
    else {
      this._handleTimeUpdate();
    }
  };

  _handleMouseTime = (event) => {
    const ref = this.ref as SeekBar;
    ref.tip.throttledUpdate(
      clamp(getPercentPointer(ref.el, event).x, 0, 1)
    );
  };

  _handleStop = (): void => {
    this.ref.throttledUpdate(0);
  };

  _handleMouseDown(event: MouseEvent | TouchEvent): any {
    if (!isSingleLeftClick(event as MouseEvent)) {
      return;
    }

    // 阻止冒泡
    event.stopPropagation();

    const { player } = this;

    // 异常情况
    if (player.scrubbing) {
      this._handleMouseUp(event);
      return;
    }

    // 记录seek前的播放状态
    this.videoWasPlaying = !player.paused;
    player.pause();

    super._handleMouseDown(event);
  }

  _handleMouseMove(event: MouseEvent | TouchEvent): any {
    const { player } = this;
    if (!isSingleLeftClick(event as MouseEvent) || !this.touchStarted || isNaN(player.duration)) {
      return;
    }

    // 标记正在拖动进度条
    if (!player.scrubbing) {
      player.scrubbing = true;
    }

    const value = this.calculateValue(event);
    if (value === -1) {
      return;
    }

    const ref = this.ref as SeekBar;
    ref.throttledUpdate(value);
    ref.seek(value);
  }

  _handleMouseUp(event: MouseEvent | TouchEvent): any {
    event.stopPropagation();

    const { player } = this;
    player.scrubbing = false;

    super._handleMouseUp(event);

    const ref = this.ref as SeekBar;
    ref.seek(ref.value);

    if (this.videoWasPlaying) {
      player.play();
    }
  }

  _handleKeyDown(event: KeyboardEvent): any {
    const { player } = this;
    const ref = this.ref as SeekBar;

    if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
      event.preventDefault();
      event.stopPropagation();
      if (player.paused) {
        player.play();
      }
      else {
        player.pause();
      }
    }
    else if (keycode.isEventKey(event, 'Home')) {
      event.preventDefault();
      event.stopPropagation();
      ref.seek(0);
    }
    else if (keycode.isEventKey(event, 'End')) {
      event.preventDefault();
      event.stopPropagation();
      ref.seek(1);
    }
    else if (/^[0-9]$/.test(keycode(event))) {
      event.preventDefault();
      event.stopPropagation();
      const gotoFraction = (keycode.codes[keycode(event)] - keycode.codes['0']) * 10.0 / 100.0;
      ref.seek(gotoFraction);
    }
    else if (keycode.isEventKey(event, 'PgDn')) {
      event.preventDefault();
      event.stopPropagation();
      ref.seek((player.currentTime - (STEP_SECONDS * PAGE_KEY_MULTIPLIER)) / player.duration);
    }
    else if (keycode.isEventKey(event, 'PgUp')) {
      event.preventDefault();
      event.stopPropagation();
      ref.seek((player.currentTime + (STEP_SECONDS * PAGE_KEY_MULTIPLIER)) / player.duration);
    }
    else {
      super._handleKeyDown(event);
    }
  }

  _stepBack(): void {
    const { player } = this;
    const ref = this.ref as SeekBar;
    ref.seek((player.currentTime - STEP_SECONDS) / player.duration);
  }

  _stepForward(): void {
    const { player } = this;
    const ref = this.ref as SeekBar;
    ref.seek((player.currentTime + STEP_SECONDS) / player.duration);
  }
}

export class SeekBar extends Slider<PlayProgressBar> {
  tip: MouseTimeDisplay;

  constructor(name: string, player: IPlayer, opts?: SliderOptions) {
    super(name, player, opts);

    this.tip = this.getChild('mouseTimeDisplay') as MouseTimeDisplay;
  }

  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-seek-bar'
      }
    );
  }

  _createController(player: IPlayer): SeekBarController {
    return new SeekBarController(this, player);
  }

  _createBar(): PlayProgressBar {
    this.initChildren([
      { name: 'playProgressBar', component: PlayProgressBar },
      { name: 'mouseTimeDisplay', component: MouseTimeDisplay }
    ]);
    return this.getChild('playProgressBar') as PlayProgressBar;
  }

  _beforeDispose() {
    (this.controller as SeekBarController).clean();
    super._beforeDispose();
  }


  seek(percent: number) {
    const { player } = this;
    const { duration } = player;
    let newTime = duration * percent;

    if (newTime === player.currentTime) {
      return;
    }

    if (newTime === duration) {
      newTime = newTime - 0.1;
    }

    player.currentTime = +newTime.toFixed(4);

    this.requestNamedAnimationFrame('SeekBar#update', () => {
      this.el.setAttribute('aria-valuenow', (this.value * 100).toFixed(2));
    });
  }
}
