
import { isIOS } from './env';
import fullscreenApi from './fullscreenApi';
import { ClientRect, Pointer, Position } from './typings';
import { forOwn } from './util';

function textContent(el: Node, text: string) {
  if (typeof el.textContent === 'undefined') {
    (el as HTMLElement).innerText = text;
  }
  else {
    el.textContent = text;
  }
  return el;
}

function appendChild(el: Node, child: Node | string) {
  if (typeof (child as Node).nodeType === 'undefined') {
    (el as HTMLElement).innerHTML = child as string;
  }
  else {
    el.appendChild(child as Node);
  }
}

function createElement(
  tagName: string,
  properties?: {[key: string]: any} | null,
  attributes?: {[key: string]: any} | null,
  content?: Node | string
) {
  if (!tagName) {
    tagName = 'div';
  }
  const el = document.createElement(tagName);

  forOwn(properties, (val, propName) => {
    if (propName === 'textContent') {
      textContent(el, val);
    }
    else if ((el as any)[propName] !== val || propName === 'tabIndex') {
      (el as any)[propName] = val;
    }
  });

  forOwn(attributes, (val, attrName) => {
    el.setAttribute(attrName, val);
  });

  if (typeof content === 'string') {
    el.innerHTML = content;
  }
  else if (content) {
    appendChild(el, content);
  }

  return el;
}

function setCssText(el: Node, content: string) {
  if ((el as any).styleSheet) {
    (el as any).styleSheet.cssText = content;
  }
  else {
    el.textContent = content;
  }
}

function createStyleElement(className: string) {
  const style = document.createElement('style');

  style.className = className;

  return style;
}

function isFullscreenElement(el: Element): boolean {
  const { fullscreenElement } = fullscreenApi;
  if (!fullscreenElement) {
    return false;
  }

  let isFs = (document as any)[fullscreenElement] === el;
  if (!isFs) {
    isFs = el.matches(`:${fullscreenApi.fullscreen}`);
  }
  return isFs;
}

function computedStyle(el: Element, prop: string): string {
  if (!el || !prop) {
    return '';
  }

  if (typeof window.getComputedStyle === 'function') {
    let computedStyleValue: CSSStyleDeclaration;

    try {
      computedStyleValue = window.getComputedStyle(el);
    }
    catch (e) {
      return '';
    }

    return computedStyleValue ? computedStyleValue.getPropertyValue(prop) || computedStyleValue[prop] : '';
  }

  return '';
}

function findPosition(el: HTMLElement): Position | null {
  if (el && el.offsetParent) {
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    let left = 0;
    let top = 0;

    while (el.offsetParent && el !== document[fullscreenApi.fullscreenElement]) {
      left += el.offsetLeft;
      top += el.offsetTop;

      el = el.offsetParent as HTMLElement;
    }

    return {
      left,
      top,
      width,
      height
    };
  }

  return null;
}

function getPercentPointer(el: Element, event: MouseEvent | TouchEvent): Pointer {
  const translated = {
    x: 0,
    y: 0
  };

  if (isIOS) {
    let item: Element | null = el;

    while (item && item.nodeName.toLowerCase() !== 'html') {
      const transform = computedStyle(item, 'transform');

      if (transform.startsWith('matrix')) {
        const values = transform.slice(7, -1).split(/,\s/).map(Number);

        translated.x += values[4];
        translated.y += values[5];
      }
      else if (transform.startsWith('matrix3d')) {
        const values = transform.slice(9, -1).split(/,\s/).map(Number);

        translated.x += values[12];
        translated.y += values[13];
      }

      item = item.parentNode as Element;
    }
  }

  const position: Pointer = { x: -1, y: -1 };
  const boxTarget = findPosition(event.target as HTMLElement);

  if (boxTarget) {
    const box = findPosition(el as HTMLElement);
    const boxW = box!.width;
    const boxH = box!.height;
    let offsetY = (event as MouseEvent).offsetY - (box!.top - boxTarget.top);
    let offsetX = (event as MouseEvent).offsetX - (box!.left - boxTarget.left);

    if ((event as TouchEvent).changedTouches) {
      offsetX = (event as TouchEvent).changedTouches[0].pageX - box!.left;
      offsetY = (event as TouchEvent).changedTouches[0].pageY + box!.top;
      if (isIOS) {
        offsetX -= translated.x;
        offsetY -= translated.y;
      }
    }

    position.y = (1 - Math.max(0, Math.min(1, offsetY / boxH)));
    position.x = Math.max(0, Math.min(1, offsetX / boxW));
  }

  return position;
}

function getBoundingClientRect(el: Element): ClientRect | null {
  if (el && el.getBoundingClientRect && el.parentNode) {
    const rect = el.getBoundingClientRect();
    const result: any = {};

    ['bottom', 'height', 'left', 'right', 'top', 'width'].forEach((k) => {
      const v = rect[k];
      if (v !== undefined) {
        result[k] = v;
      }
    });

    if (!result.height) {
      result.height = parseFloat(computedStyle(el, 'height'));
    }

    if (!result.width) {
      result.width = parseFloat(computedStyle(el, 'width'));
    }

    return result;
  }

  return null;
}

function blockTextSelection(): void {
  document.body.focus();
  document.onselectstart = function () {
    return false;
  };
}

function unblockTextSelection(): void {
  document.onselectstart = function () {
    return true;
  };
}

function isSingleLeftClick(event: MouseEvent) {
  const { button, buttons, type } = event;

  if (button === undefined && buttons === undefined) {
    return true;
  }

  if (button === 0 && buttons === undefined) {
    return true;
  }

  if (type === 'mouseup' && button === 0 && buttons === 0) {
    return true;
  }

  if (button !== 0 || buttons !== 1) {
    return false;
  }

  return true;
}

export {
  blockTextSelection,
  createElement,
  createStyleElement,
  findPosition,
  getBoundingClientRect,
  getPercentPointer,
  isFullscreenElement,
  isSingleLeftClick,
  setCssText,
  textContent,
  unblockTextSelection
};
