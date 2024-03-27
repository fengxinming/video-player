
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';
import { RateControl } from './RateControl';
import { RateMenu } from './RateMenu';

export class RatePanel extends Component<ComponentOptions> {

  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.initChildren([
      { name: 'rateMenu', component: RateMenu },
      { name: 'rateControl', component: RateControl }
    ]);

    this
      .onEl('mouseenter', () => {
        if (!this.player.scrubbing) {
          this.hover(true);
        }
      })
      .onEl('mouseleave', () => {
        this.hover(false);
      });
  }

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-rate-panel'
    });
  }

  hover(bool: boolean): void {
    this[bool ? 'addClass' : 'removeClass']('vp-hover');
  }
}
