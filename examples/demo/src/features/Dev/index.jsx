
import { Button, Form, Input, Radio } from '@alicloud/console-components';
import React, { useRef } from 'react';

import { useScope } from '@/commons/scope';
import Video from '@/components/Video';

import styles from './index.module.styl';

function getSourceType(scheme, encoder) {
  let type;
  switch (scheme) {
    case 'flv':
      type = encoder === 'h265' ? 'video/x-h265' : 'video/x-flv';
      break;
    case 'hls':
      type = encoder === 'h265' ? 'video/x-h265' : 'video/x-hls';
      break;
    default:
      type = 'video/mp4';
  }
  return type;
}

const formLayout = {
  labelCol: {
    span: 8
  }
};

const schemeOptions = [
  { label: 'mp4', value: 'mp4' },
  { label: 'flv', value: 'flv' }
  // { label: 'hls', value: 'hls' },

];

const encoder = [
  { value: 'h264', label: 'H.264' },
  { value: 'h265', label: 'H.265' }
];

function initialState() {
  return {
    loading: false,
    formValue: {
      encoder: 'h264',
      hasAudio: false,
      scheme: 'mp4',
      url: '',
      decodeDelayMs: 100,
      audioMergeFrameNum: 32
    },
    doPlay: 0,
    doSnapshot: 0,
    doDownloadAudio: 0
  };
}

const defineScope = (setState) => {
  return {
    ...initialState(),

    reset() {
      setState(initialState());
    },

    onChangeForm(values) {
      // 直播默认设备端拉流
      // if (!values.fileName) {
      //   values.source = '';
      // }
      if (values.scheme === 'hls') {
        values.source = 'cloud';
      }
      else {
        values.source = 'local';
      }
      setState({ formValue: values });
    },

    exampleFlv() {
      setState(({ formValue }) => {
        return {
          formValue: {
            ...formValue,
            scheme: 'flv',
            url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-360p.flv'
          }
        };
      });
    },

    exampleMp4() {
      setState(({ formValue }) => {
        return {
          formValue: {
            ...formValue,
            scheme: 'mp4',
            url: 'https://www.w3school.com.cn/i/video/shanghai.mp4'
          }
        };
      });
    }
  };
};

// {
//   type: 'video/x-h265',
//   src: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-360p.flv'
//   // src: 'http://127.0.0.1:7001/live/movie.flv'
// }

// {
//   type: 'video/mp4',
//   // src: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4'
//   src: 'https://www.w3school.com.cn/i/video/shanghai.mp4'
// }

export default function () {
  const videoRef = useRef();
  const {
    loading,
    formValue,
    // snapshot,
    // downloadAudio,
    reset,
    onChangeForm,
    exampleFlv,
    exampleMp4
  } = useScope(defineScope);

  const play = () => {
    videoRef.current.play({
      src: formValue.url,
      type: getSourceType(formValue.scheme, formValue.encoder)
    });
  };

  return (
    <div className={styles.layout}>
      {/* <Loading visible={state.loading} inline={false}> */}
      <div className={styles.content}>
        <div className={styles.left}>
          <Video ref={videoRef} />
        </div>
        <div className={styles.right}>
          <Form
            {...formLayout}
            className={styles.form}
            fullWidth
            value={formValue}
            onChange={onChangeForm}
          >
            <Form.Item label="视频编码">
              <Radio.Group name="encoder" dataSource={encoder} />
            </Form.Item>
            {formValue.encoder !== 'h265' && (
              <Form.Item label="播放协议">
                <Radio.Group name="scheme" dataSource={schemeOptions} />
              </Form.Item>
            )}
            <Form.Item label="视频源">
              <Input.TextArea name="url" />
            </Form.Item>
            {
              formValue.encoder === 'h265' && (
                <>
                  <Form.Item label="decodeDelayMs" title="decodeDelayMs">
                    <Input name="decodeDelayMs" />
                  </Form.Item>
                  <Form.Item label="audioMergeFrameNum" title="audioMergeFrameNum">
                    <Input name="audioMergeFrameNum" />
                  </Form.Item>
                </>
              )
            }
            {
              (formValue.scheme === 'flv' || formValue.encoder === 'h265') && (
                <Form.Item>
                  <Button onClick={exampleFlv}>示例flv</Button>
                </Form.Item>
              )
            }
            {
              (formValue.scheme === 'mp4' && formValue.encoder !== 'h265') && (
                <Form.Item>
                  <Button onClick={exampleMp4}>示例mp4</Button>
                </Form.Item>
              )}
            <Form.Item>
              <Button type="primary" loading={loading} onClick={play}>播放</Button>
              &nbsp;&nbsp;
              <Form.Reset onClick={reset}>重置</Form.Reset>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
