
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions } from '../typings';

export class Overlay extends Component<ComponentOptions> {
  _createEl(): HTMLElement {
    return createElement(
      'div',
      {
        className: 'vp-overlay vp-hidden'
      }
    );
  }
}
