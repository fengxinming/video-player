
import { Component } from '../../Component';
import { UPDATE_REFRESH_INTERVAL } from '../../constants';
import { createElement, getBoundingClientRect, textContent } from '../../dom';
import { ComponentOptions } from '../../typings';
import { throttle } from '../../util';

export class VolumeLevelTooltip extends Component<ComponentOptions> {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-volume-tooltip'
    }, {
      'aria-hidden': 'true'
    });
  }

  update(percent: number, content: string, volumeBarWidth): void {
    const { el } = this;
    textContent(el, content);

    // 元素被隐藏后可能获取不到
    const tooltipRect = getBoundingClientRect(el);
    if (!tooltipRect) {
      return;
    }

    let offsetX = Math.round(tooltipRect.width / 2);
    const distance = volumeBarWidth * percent;
    let remaining = 0;

    if (offsetX >= distance) {
      offsetX -= offsetX - distance;
    }
    else if (offsetX >= (remaining = volumeBarWidth - distance)) {
      offsetX += offsetX - remaining;
    }

    el.style.left = `-${offsetX}px`;
  }

  updateVolume(percent: number, volumeBarWidth: number, cb?: () => void): void {
    this.requestNamedAnimationFrame('TimeTooltip#updateVolume', () => {
      this.throttledUpdate(percent, `${Math.floor(percent * 100)}%`, volumeBarWidth);
      cb && cb();
    });
  }
}
