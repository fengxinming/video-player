
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions } from '../../typings';

export class TimeDivider extends Component<ComponentOptions> {
  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-time-control vp-time-divider'
      },
      {
        'aria-hidden': true // 把该元素和它的所有子元素从无障碍树上移除
      },
      '<span>/</span>'
    );
  }
}
