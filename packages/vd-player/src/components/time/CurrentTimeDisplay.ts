
import { IPlayer } from '../../typings';
import { TimeDisplay } from './TimeDisplay';

export class CurrentTimeDisplay extends TimeDisplay {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.update(player.currentTime);
    player.on(['timeupdate', 'ended'], this.handleTimeUpdate);
  }

  _buildCSSClass(): string {
    return 'vp-current-time';
  }

  handleTimeUpdate = (): void => {
    const { player } = this;
    let time;
    if (player.ended) {
      time = player.duration;
    }
    else {
      time = player.currentTime;
    }
    this.update(time);
  };

  _beforeDispose(): void {
    this.player.off(['timeupdate', 'ended'], this.handleTimeUpdate);
  }
}
