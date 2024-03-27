
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions, IPlayer } from '../typings';

export class StopControl extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);
    this.onEl('click', this.stop);
  }
  _createEl(): HTMLElement {
    return createElement(
      'button',
      {
        className: 'vp-control vp-stop-control'
      },
      null,
      '<i class="iconfont icon-tingzhi1 vp-icon-placeholder"></i>'
    );
  }

  stop(): void {
    this.player.stop();
  }
}
