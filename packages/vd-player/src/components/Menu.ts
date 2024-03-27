
import { Component } from '../Component';
import { createElement } from '../dom';
import { ComponentOptions, IPlayer } from '../typings';

export class Menu<T extends ComponentOptions> extends Component<T> {
  constructor(name: string, player: IPlayer, opts?: any) {
    super(name, player, opts);

    const cls = this._buildCSSClass();
    if (cls) {
      this.addClass(cls);
    }

    this.onEl('click', function (evt: MouseEvent): void {
      const match = (evt.target as Element).closest('li');
      if (match) {
        this._handleItemClick(match, evt);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _handleItemClick(target: HTMLLinkElement, evt: MouseEvent): void {
    // empty
  }

  _createEl(): HTMLElement {
    return createElement(
      'ul',
      {
        className: 'vp-menu'
      },
      {
        role: 'menu'
      }
    );
  }

  _buildCSSClass(): string {
    return '';
  }

  update(items: number[]): void {
    const fragment = document.createDocumentFragment();
    items.forEach((val: number) => {
      fragment.appendChild(
        createElement(
          'li',
          {
            className: 'vp-menu-item'
          }, {
            role: 'menuitemradio',
            'aria-disabled': 'false',
            'aria-checked': 'false',
            'aria-label': val
          },
          `${val}x`
        )
      );
    });
    this.el.appendChild(fragment);
  }

  select(rate: number): void {
    const { childNodes } = this.el;
    for (let i = 0, len = childNodes.length; i < len; i++) {
      const li = childNodes[i] as Element;
      if (li.getAttribute('aria-label') === String(rate)) {
        li.setAttribute('aria-checked', 'true');
        li.classList.add('vp-selected');
      }
      else {
        li.setAttribute('aria-checked', 'false');
        if (li.classList.contains('vp-selected')) {
          li.classList.remove('vp-selected');
        }
      }
    }
  }
}
