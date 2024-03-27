
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions, IPlayer } from '../typings';

export class FullscreenToggle extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);
    this.onEl('click', this.toggle);
  }

  _createEl(): HTMLElement {
    return createElement(
      'button',
      {
        className: 'vp-control vp-fullscreen-control'
      },
      null,
      '<i class="iconfont icon-quanping_kuai vp-icon-placeholder"></i>'
    );
  }

  toggle(): void {
    const { player } = this;
    if (player.isFullscreen) {
      player.exitFullscreen();
      return;
    }
    player.requestFullscreen();
  }
}
