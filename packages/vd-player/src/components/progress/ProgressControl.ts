
import { Component } from '../../Component';
// import { VolumeBar } from './VolumeBar';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';
import { SeekBar } from './SeekBar';

export class ProgressControl extends Component<ComponentOptions> {
  enabled: boolean = false;

  constructor(name: string, player: IPlayer, opts?: ComponentOptions) {
    super(name, player, opts);

    this.initChildren([
      { name: 'seekBar', component: SeekBar }
    ]);
    this.enable();
  }

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-progress-control'
    });
  }

  disable() {
    this.children.forEach((child) => {
      (child as any).disable && (child as any).disable();
    });

    if (!this.enabled) {
      return;
    }

    this.enabled = false;
  }

  enable() {
    this.children.forEach((child) => {
      (child as any).enable && (child as any).enable();
    });

    if (this.enabled) {
      return;
    }

    this.enabled = true;
  }
}
