
import { Component } from '../../Component';
import { UPDATE_REFRESH_INTERVAL } from '../../constants';
import { createElement, getBoundingClientRect, textContent } from '../../dom';
import { ComponentOptions } from '../../typings';
import { formatTime, throttle } from '../../util';

export class TimeTooltip extends Component<ComponentOptions> {
  throttledUpdate = throttle(this.update.bind(this), UPDATE_REFRESH_INTERVAL);

  _createEl(): HTMLElement {
    return createElement('div', {
      className: 'vp-time-tooltip'
    }, {
      'aria-hidden': 'true'
    });
  }

  update(percent: number, content: string, seekBarWidth: number): void {
    const { el } = this;
    textContent(el, content);

    // 元素被隐藏后可能获取不到
    const tooltipRect = getBoundingClientRect(el);
    if (!tooltipRect) {
      return;
    }

    let offsetX = Math.round(tooltipRect.width / 2);
    const distance = seekBarWidth * percent;
    let remaining = 0;

    if (offsetX >= distance) {
      offsetX -= offsetX - distance;
    }
    else if (offsetX >= (remaining = seekBarWidth - distance)) {
      offsetX += offsetX - remaining;
    }

    el.style.left = `-${offsetX}px`;
  }

  updateTime(percent: number, time: number, seekBarWidth: number, cb?: () => void): void {
    this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
      this.throttledUpdate(percent, formatTime(time), seekBarWidth);
      cb && cb();
    });
  }
}
