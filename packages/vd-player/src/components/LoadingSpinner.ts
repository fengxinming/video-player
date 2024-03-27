
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions } from '../typings';

export class LoadingSpinner extends Component<ComponentOptions> {
  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-loading-spinner'
      }
    );
  }
}
