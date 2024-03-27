
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions } from '../typings';

export class LiveDisplay extends Component<ComponentOptions> {
  _createEl(): HTMLElement {
    return createElement(
      'span',
      {
        className: 'vp-live-control'
      },
      null,
      '<span class="vp-live-display">直播</span>'
    );
  }
}
