
import { FullscreenApi } from './typings';

const fullscreenApi: {[key: string]: any} = {
  prefixed: true
};

// browser API methods
const apiMap = [
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror',
    'fullscreen'
  ],
  // WebKit
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
    '-webkit-full-screen'
  ],
  // Mozilla
  [
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror',
    '-moz-full-screen'
  ],
  // Microsoft
  [
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError',
    '-ms-fullscreen'
  ]
];

const specApi = apiMap[0];
let browserApi: string[] | null = null;

// determine the supported set of functions
apiMap.some((apis) => {
  // check for exitFullscreen function
  if (apis[1] in document) {
    browserApi = apis;
    return true;
  }
  return false;
});

// map the browser API names to the spec API names
if (browserApi) {
  (browserApi as string[]).forEach((api, i) => {
    fullscreenApi[specApi[i]] = api;
  });

  fullscreenApi.prefixed = browserApi[0] !== specApi[0];
}

export default fullscreenApi as FullscreenApi;
