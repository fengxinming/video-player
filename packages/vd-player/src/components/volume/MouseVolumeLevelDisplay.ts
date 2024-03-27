
import { Component } from '../../Component';
import { UPDATE_REFRESH_INTERVAL } from '../../constants';
import { createElement, getBoundingClientRect } from '../../dom';
import { ClientRect, ComponentOptions, IPlayer } from '../../typings';
import { throttle } from '../../util';
import { VolumeLevelTooltip } from './VolumeLevelTooltip';

export class MouseVolumeLevelDisplay extends Component<ComponentOptions> {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);
  tooltip: VolumeLevelTooltip;

  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.initChildren([
      { name: 'volumeLevelTooltip', component: VolumeLevelTooltip }
    ]);

    this.tooltip = this.getChild('volumeLevelTooltip') as VolumeLevelTooltip;
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
    const { width: volumeBarWidth } = getBoundingClientRect(parent.el) as ClientRect;
    this.tooltip.updateVolume(
      percent,
      volumeBarWidth,
      () => {
        this.el.style.left = `${volumeBarWidth * percent}px`;
      }
    );
  }
}
