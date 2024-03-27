
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';
import { MuteToggle } from './MuteToggle';
import { VolumeControl } from './VolumeControl';

export class VolumePanel extends Component<ComponentOptions> {

  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.initChildren([
      {
        name: 'volumeControl',
        component: VolumeControl,
        opts: {
          direction: this.opts.inline === false ? 'vert' : 'horz'
        }
      },
      { name: 'muteToggle', component: MuteToggle }
    ]);
  }

  _createEl(player: IPlayer, opts: ComponentOptions): HTMLElement {
    let orientationClass = 'vp-volume-panel-horizontal';

    if (opts.inline === false) {
      orientationClass = 'vp-volume-panel-vertical';
    }
    return createElement('div', {
      className: `vp-volume-panel ${orientationClass}`
    });
  }
}
