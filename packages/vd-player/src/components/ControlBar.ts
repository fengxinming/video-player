
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions, IPlayer } from '../typings';
import { FullscreenToggle } from './FullscreenToggle';
import { LiveDisplay } from './LiveDisplay';
import { PlayToggle } from './PlayToggle';
import { ProgressPanel } from './progress/ProgressPanel';
import { RatePanel } from './rate/RatePanel';
import { StopControl } from './StopControl';
import { CurrentTimeDisplay } from './time/CurrentTimeDisplay';
import { DurationDisplay } from './time/DurationDisplay';
import { TimeDivider } from './time/TimeDivider';
import { VolumePanel } from './volume/VolumePanel';

export class ControlBar extends Component<ComponentOptions> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this.initChildren([
      { name: 'playToggle', component: PlayToggle },
      { name: 'stopControl', component: StopControl },
      { name: 'currentTimeDisplay', component: CurrentTimeDisplay },
      { name: 'timeDivider', component: TimeDivider },
      { name: 'durationDisplay', component: DurationDisplay },
      { name: 'liveDisplay', component: LiveDisplay },
      { name: 'progressPanel', component: ProgressPanel },
      { name: 'volumePanel', component: VolumePanel },
      { name: 'ratePanel', component: RatePanel },
      { name: 'fullscreenToggle', component: FullscreenToggle }
    ]);
  }

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-control-bar'
    });
  }
}
