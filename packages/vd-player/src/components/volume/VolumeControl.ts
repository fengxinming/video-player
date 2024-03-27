
import { Component } from '../../Component';
// import { VolumeBar } from './VolumeBar';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';
import { VolumeBar } from './VolumeBar';

export class VolumeControl extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.initChildren([
      { name: 'volumeBar', component: VolumeBar, opts: { direction: this.opts.direction || 'horz' } }
    ]);
  }

  _createEl(player: IPlayer, opts: ComponentOptions): HTMLElement {
    let orientationClass = 'vp-volume-horizontal';

    if (opts.direction === 'vert') {
      orientationClass = 'vp-volume-vertical';
    }

    return createElement('div', {
      className: `vp-control vp-volume-control ${orientationClass}`
    });
  }
}
