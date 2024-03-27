
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';

export class MuteToggle extends Component<ComponentOptions> {

  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    player.on(['loadstart', 'volumechange'], this._handleUpdate);
    this.onEl('click', this._handleClick);
  }

  _createEl(): HTMLElement {
    return createElement(
      'button',
      {
        className: 'vp-control vp-mute-control'
      },
      null,
      '<i class="iconfont icon-shengyinkai_shoujiduan vp-icon-placeholder"></i>'
    );
  }

  _beforeDispose(): void {
    this.player.off(['loadstart', 'volumechange'], this._handleUpdate);
  }

  _handleClick() {
    const { player } = this;
    player.muted = !player.muted;
  }

  _handleUpdate = () => {
    const icon = this.el.firstChild as Element;
    if (this.player.muted) {
      icon.classList.remove('icon-shengyinkai_shoujiduan');
      icon.classList.add('icon-shengyinguan_shoujiduan');
    }
    else {
      icon.classList.remove('icon-shengyinguan_shoujiduan');
      icon.classList.add('icon-shengyinkai_shoujiduan');
    }
  };
}
