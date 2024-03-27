
import { Message } from '@alicloud/console-components';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createPlayer } from 'vd-player';
import { Html5 } from 'vd-player-tech-html5';

import styles from './index.module.styl';

function Video(props, ref) {
  const elRef = useRef();
  const playerRef = useRef();
  const propsRef = useRef();

  propsRef.current = props;

  useEffect(() => {
    const player = createPlayer({
      fluid: true,
      playbackRates: [0.5, 1, 2, 4],
      techOrder: [
        Html5
      ]
    });
    player.mount(elRef.current);
    playerRef.current = player;

    player.on('loadedtech', () => {
      const props2 = propsRef.current;
      if (props2.encoder === 'h265') {
        player.tech.configureDecode({
          decodeDelayMs: props2.decodeDelayMs,
          audioMergeFrameNum: props2.audioMergeFrameNum
        });
      }
    });
    player.on('error', (evt) => {
      Message.error(evt.error.message);
    });

    return () => {
      player.dispose();
    };
  }, []);
  useImperativeHandle(ref, () => {
    return {
      setSource(source) {
        playerRef.current.source = source;
      },

      play(source) {
        playerRef.current.play();
      },

      pause() {
        playerRef.current.pause();
      },

      start(source) {
        playerRef.current.start(source);
      }
    };
  });

  return (
    <div className={styles.player} ref={elRef} />
  );
}

export default forwardRef(Video);
