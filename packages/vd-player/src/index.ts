
import 'tiny-dom-shim';
import './index.scss';

import { Player } from './Player';
import { PlayerOptions } from './typings';

export function createPlayer(opts: PlayerOptions) {
  return new Player(opts);
}

export * from './Component';
export * from './dom';
export * from './env';
export { default as fullscreenApi } from './fullscreenApi';
export { default as logFactory } from './logFactory';
export * from './Player';
export * from './Tech';
export * from './typings';
export * from './util';
export { default as keycode } from 'keycode';
