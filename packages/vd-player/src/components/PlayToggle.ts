
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions, IPlayer } from '../typings';
import { debounce } from '../util';

export class PlayToggle extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);
    this.onEl('click', debounce(this._handlePlay.bind(this), 250, true, this));
  }

  _createEl(): HTMLElement {
    return createElement(
      'button',
      {
        className: 'vp-control vp-play-control'
      },
      null,
      '<i class="iconfont icon-bofang vp-icon-placeholder"></i>'
    );
  }

  _handlePlay(): void {
    this.play();
  }

  play(): void {
    const { player } = this;
    if (player.paused) {
      player.play();
      return;
    }

    player.pause();
  }
}
