
import { Emitter } from 'eemitt';

import { IPlayer, ITech, PlaySource, TechConstructor, TPreload } from './typings';
import { notImplementedError } from './util';

const techs: {[key: string]: TechConstructor} = Object.create(null);

export function registerTech(name: string, tech: TechConstructor) {
  techs[name] = tech;
}

export function getTech(name: string): TechConstructor {
  return techs[name];
}

export class Tech<T> extends Emitter implements ITech {
  opts: T;
  player: IPlayer;
  scrubbing = false;

  constructor(player: IPlayer, opts?: T) {
    super();

    this.player = player;
    this.opts = (opts || {}) as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canPlayType(type: string): string {
    throw notImplementedError('canPlayType', this.name || 'Tech');
  }

  static isSupported(): boolean {
    throw notImplementedError('isSupported', this.name || 'Tech');
  }

  currentTime(): number {
    throw notImplementedError('currentTime', this);
  }

  autoplay(): boolean {
    throw notImplementedError('autoplay', this);
  }

  createElement(): HTMLElement {
    throw notImplementedError('createElement', this);
  }

  dispose(): void {
    throw notImplementedError('dispose', this);
  }

  duration(): number {
    throw notImplementedError('duration', this);
  }

  ended(): boolean {
    throw notImplementedError('ended', this);
  }

  enterFullScreen(): void {
    throw notImplementedError('enterFullScreen', this);
  }

  exitFullScreen(): void {
    throw notImplementedError('exitFullScreen', this);
  }

  isLive(): boolean {
    return this.duration() === Infinity;
  }

  load(): any {
    throw notImplementedError('load', this);
  }

  loop(): boolean {
    throw notImplementedError('loop', this);
  }

  muted(): boolean {
    throw notImplementedError('muted', this);
  }

  networkState(): number {
    throw notImplementedError('networkState', this);
  }

  pause(): any {
    throw notImplementedError('pause', this);
  }

  paused(): boolean {
    throw notImplementedError('paused', this);
  }

  readyState(): number {
    throw notImplementedError('readyState', this);
  }

  videoHeight(): number {
    throw notImplementedError('videoHeight', this);
  }

  videoWidth(): number {
    throw notImplementedError('videoWidth', this);
  }

  play(): any {
    throw notImplementedError('play', this);
  }

  playbackRate(): number {
    throw notImplementedError('playbackRate', this);
  }

  preload(): TPreload {
    throw notImplementedError('preload', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAutoplay(bool: boolean): void {
    throw notImplementedError('setAutoplay', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCurrentTime(val: number): void {
    throw notImplementedError('setCurrentTime', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLoop(bool: boolean): void {
    throw notImplementedError('setLoop', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setMuted(bool: boolean): void {
    throw notImplementedError('setMuted', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPlaybackRate(val: number): void {
    throw notImplementedError('setPlaybackRate', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreload(val: TPreload): void {
    throw notImplementedError('setPreload', this);
  }

  setScrubbing(bool: boolean): void {
    this.scrubbing = bool;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSource(source: PlaySource): void {
    throw notImplementedError('setSource', this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVolume(val: number): void {
    throw notImplementedError('setVolume', this);
  }

  stop(): any {
    throw notImplementedError('stop', this);
  }

  supportsFullScreen(): boolean {
    return false;
  }

  supportsPlaybackRate(): boolean {
    return true;
  }

  volume(): number {
    throw notImplementedError('volume', this);
  }
}
