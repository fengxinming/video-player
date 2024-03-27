
import { Component } from '../../Component';
import { UPDATE_REFRESH_INTERVAL } from '../../constants';
import { createElement } from '../../dom';
import { IPlayer, ISliderBar, SliderOptions } from '../../typings';
import { throttle } from '../../util';

export class PlayProgressBar extends Component<SliderOptions> implements ISliderBar {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);
  value: number = 0;
  valueStyle: 'height' | 'width' = 'width';

  constructor(name: string, player: IPlayer, opts?: SliderOptions) {
    super(name, player, opts);

    this.valueStyle = this.opts.direction === 'vert' ? 'height' : 'width';
  }

  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-play-progress'
      },
      {
        'aria-hidden': 'true'
      },
      '<div class="vp-play-progress-thumb" aria-hidden="true"></div>'
    );
  }

  update(percent: number): void {
    this.value = percent;
    this.requestNamedAnimationFrame('PlayProgressBar#update', () => {
      this.el.style[this.valueStyle] = `${(this.value * 100).toFixed(2)}%`;
    });
  }
}
