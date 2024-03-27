
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';
import { ProgressControl } from './ProgressControl';

export class ProgressPanel extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.initChildren([
      { name: 'progressControl', component: ProgressControl }
    ]);
  }

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-progress-panel'
    });
  }
}
