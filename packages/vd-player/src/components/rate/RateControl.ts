
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';

export class RateControl extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    player.on(['loadstart', 'ratechange'], this._handleUpdate);
    this.onEl('click', this._handleClick);
  }

  _createEl(player: IPlayer): HTMLElement {
    return createElement(
      'button',
      {
        className: 'vp-control vp-rate-control vp-hidden'
      },
      null,
      `${player.playbackRate}x`
    );
  }

  _handleUpdate = () => {
    const { player } = this;
    this[player.playbackRateSupported ? 'show' : 'hide']();
    this.update(player.playbackRate);
  };

  _handleClick = () => {
    const { player } = this;
    const { playbackRate, playbackRates } =  player;

    let index = playbackRates.indexOf(playbackRate);
    index = index === playbackRates.length - 1 ? 0 : index + 1;

    player.playbackRate = playbackRates[index];
  };

  _beforeDispose(): void {
    this.player.off(['loadstart', 'ratechange'], this._handleUpdate);
  }

  update(rate: number) {
    this.el.textContent = `${rate}x`;
  }
}
