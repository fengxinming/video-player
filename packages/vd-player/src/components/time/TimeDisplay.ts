
import { Component } from '../../Component';
import { createElement } from '../../dom';
import { ComponentOptions, IPlayer } from '../../typings';
import { formatTime, notImplementedError } from '../../util';

export class TimeDisplay extends Component<ComponentOptions> {
  private readonly _contentEl: Element | null;
  private _lastTimeDisplay: string = '';

  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    this._contentEl = this.el.lastElementChild;
  }

  _createEl(): HTMLElement {
    const className = this._buildCSSClass();
    return createElement(
      'div',
      {
        className: `vp-time-control vp-control${className ? ` ${className}` : ''}`
      }, null,
      `<span class="${className ? `${className}-display` : ''}" role="presentation" aria-live="off"></span>`
    );
  }

  _buildCSSClass(): string {
    throw notImplementedError('buildCSSClass', this);
  }

  update(time: number): void {
    const currentTimeDisplay = formatTime(time);

    if (this._lastTimeDisplay === currentTimeDisplay) {
      return;
    }

    this._lastTimeDisplay = currentTimeDisplay;

    this.requestNamedAnimationFrame('TimeDisplay#updateContent', () => {
      const { _contentEl } = this;
      if (!_contentEl) {
        return;
      }

      _contentEl.textContent = this._lastTimeDisplay;
    });
  }
}
