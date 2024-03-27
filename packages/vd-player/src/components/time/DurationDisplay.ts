
import { IPlayer } from '../../typings';
import { TimeDisplay } from './TimeDisplay';

export class DurationDisplay extends TimeDisplay {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.update(player.duration);

    player.on(['durationchange', 'loadstart', 'loadedmetadata'], this.handleDurationchange);
  }

  _buildCSSClass(): string {
    return 'vp-duration';
  }

  _beforeDispose(): void {
    this.player.off(['durationchange', 'loadstart', 'loadedmetadata'], this.handleDurationchange);
  }

  handleDurationchange = (): void => {
    this.update(this.player.duration);
  };
}
