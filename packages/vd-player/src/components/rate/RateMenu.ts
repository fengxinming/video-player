
import { ComponentOptions, IPlayer } from '../../typings';
import { Menu } from '../Menu';
import { RatePanel } from './RatePanel';

export class RateMenu extends Menu<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    player.on('rateschange', this._handleRatesChange);
    player.on(['loadstart', 'ratechange'], this._handleRateChange);

    this._handleRatesChange();
  }

  _buildCSSClass(): string {
    return 'vp-rate-menu';
  }

  _handleRatesChange = (): void => {
    this.update(this.player.playbackRates);
  };

  _handleRateChange = (): void => {
    this.select(this.player.playbackRate);
  };

  _beforeDispose(): void {
    this.player
      .off('rateschange', this._handleRatesChange)
      .off(['loadstart', 'ratechange'], this._handleRateChange);
  }

  _handleItemClick(target: HTMLLinkElement): void {
    const val = target.getAttribute('aria-label');
    this.player.playbackRate = val ? parseFloat(val) : 1;
    (this.parent as RatePanel).hover(false);
  }
}
