
import { Component } from '../../Component';
import { UPDATE_REFRESH_INTERVAL } from '../../constants';
import { createElement, getBoundingClientRect } from '../../dom';
import { ClientRect, ComponentOptions, IPlayer } from '../../typings';
import { throttle } from '../../util';
import { TimeTooltip } from './TimeTooltip';

export class MouseTimeDisplay extends Component<ComponentOptions> {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);
  timeTooltip: TimeTooltip;

  constructor(name: string, player: IPlayer, opts?: ComponentOptions) {
    super(name, player, opts);

    this.initChildren([
      { name: 'timeTooltip', component: TimeTooltip }
    ]);

    this.timeTooltip = this.getChild('timeTooltip') as unknown as TimeTooltip;
  }

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-mouse-display'
    });
  }

  update(percent: number): void {
    const { parent } = this;
    if (!parent) {
      return;
    }
    const { width: seekBarWidth } = getBoundingClientRect(parent.el) as ClientRect;
    this.timeTooltip.updateTime(
      percent,
      percent * this.player.duration,
      seekBarWidth,
      () => {
        this.el.style.left = `${seekBarWidth * percent}px`;
      }
    );
  }
}
