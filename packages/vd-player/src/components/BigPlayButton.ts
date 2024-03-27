
import { createElement } from '../dom';
import { PlayToggle } from './PlayToggle';

export class BigPlayButton extends PlayToggle {
  _createEl(): HTMLElement {
    return createElement(
      'button',
      {
        className: 'vp-button vp-big-play-button'
      },
      null,
      '<i class="iconfont icon-bofang vp-icon-placeholder"></i>'
    );
  }

  play() {
    const { player } = this;
    if (!player.hasStarted) {
      if (player.source) {
        player.start();
      }
      else {
        player.emit({ type: 'error', error: new Error('No source specified.') });
      }
    }
  }
}
