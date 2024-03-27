
import { createElement, getPercentPointer, isSingleLeftClick } from '../../dom';
import { IPlayer, SliderOptions } from '../../typings';
import { clamp } from '../../util';
import { Controller, Slider } from '../Slider';
import { MouseVolumeLevelDisplay } from './MouseVolumeLevelDisplay';
import { VolumeLevel } from './VolumeLevel';

export class VolumeBarController extends Controller {
  constructor(ref: VolumeBar, player: IPlayer) {
    super(ref, player);

    player.on('volumechange', this._handleVolumeChange);
    ref.onEl('mousemove', this._handleMouseVolumeLevel);

    // 初始渲染进度
    this._handleVolumeChange();
  }

  clean(): void {
    this.player.off('volumechange', this._handleVolumeChange);
  }

  _stepBack(): void {
    this._updateVolume(this.ref.value - 0.1);
  }

  _stepForward(): void {
    this._updateVolume(this.ref.value + 0.1);
  }

  _handleMouseDown(event: MouseEvent | TouchEvent): any {
    if (!isSingleLeftClick(event as MouseEvent)) {
      return;
    }

    // 阻止冒泡
    event.stopPropagation();

    super._handleMouseDown(event);
  }

  _handleMouseMove(event: MouseEvent | TouchEvent): any {
    if (!isSingleLeftClick(event as MouseEvent) || !this.touchStarted) {
      return;
    }

    this._checkMuted();

    const value = this.calculateValue(event);
    if (value === -1) {
      return;
    }

    this.ref.update(value);
    this._updateVolume(value);
  }

  _handleMouseUp(event: MouseEvent | TouchEvent): any {
    super._handleMouseUp(event);
    this._updateVolume(this.ref.value);
  }

  _checkMuted(): void {
    const { player } = this;
    if (player.muted) {
      player.muted = false;
    }
  }

  _updateVolume = (percent: number): void => {
    const { player } = this;
    if (player.volume === percent) {
      return;
    }

    player.volume = +percent.toFixed(4);

    const { ref } = this;
    ref.requestNamedAnimationFrame('VolumeBar#update', () => {
      const { muted, volume }  = player;
      const ariaValue = muted ? 0 : Math.floor(volume * 100);
      ref.setAttribute('aria-valuenow', ariaValue);
      ref.setAttribute('aria-valuetext', `${ariaValue}%`);
    });
  };

  _handleVolumeChange = (): void => {
    const { player, ref } = this;
    if (player.muted) {
      ref.update(0);
      return;
    }

    const value = player.volume;
    if (value !== ref.value) {
      ref.update(value);
    }
  };

  _handleMouseVolumeLevel = (event: MouseEvent): void => {
    const ref = this.ref as VolumeBar;
    ref.tip.update(
      clamp(getPercentPointer(ref.el, event).x, 0, 1)
    );
  };
}

export class VolumeBar extends Slider<VolumeLevel> {
  tip: MouseVolumeLevelDisplay;

  constructor(name: string, player: IPlayer, opts?: SliderOptions) {
    super(name, player, opts);

    this.tip = this.getChild('mouseVolumeLevelDisplay') as MouseVolumeLevelDisplay;

    // 开启滑动事件监听
    this.enable();
  }

  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-volume-bar'
      }, {
        'aria-label': '音量',
        'aria-live': 'polite'
      }
    );
  }

  _createBar(): VolumeLevel {
    this.initChildren([
      { name: 'volumeLevel', component: VolumeLevel },
      { name: 'mouseVolumeLevelDisplay', component: MouseVolumeLevelDisplay }
    ]);
    return this.getChild('volumeLevel') as VolumeLevel;
  }

  _createController(player: IPlayer): Controller {
    return new VolumeBarController(this, player);
  }

  _beforeDispose(): void {
    (this.controller as VolumeBarController).clean();
    super._beforeDispose();
  }
}
