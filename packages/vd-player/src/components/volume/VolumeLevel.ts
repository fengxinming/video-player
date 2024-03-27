
import { Component } from '../../Component';
import { UPDATE_REFRESH_INTERVAL } from '../../constants';
import { createElement } from '../../dom';
import { ISliderBar, SliderOptions } from '../../typings';
import { throttle } from '../../util';

export class VolumeLevel extends Component<SliderOptions> implements ISliderBar {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);

  valueStyle: 'height' | 'width' = 'width';
  value: number = 0;

  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-volume-level'
      },
      {
        'aria-hidden': 'true'
      },
      '<div class="vp-volume-level-thumb" aria-hidden="true"></div>'
    );
  }

  update(percent: number): boolean {
    if (percent === this.value) {
      return false;
    }

    this.value = percent;

    this.requestNamedAnimationFrame('VolumeLevel#update', () => {
      this.el.style[this.valueStyle] = `${(this.value * 100).toFixed(2)}%`;
    });

    return true;
  }
}
