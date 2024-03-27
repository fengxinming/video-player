
import './global.styl';

import React from 'react';
// import ReactDOM from 'react-dom/client';
import ReactDOM from 'react-dom';

import App from './features/Dev';

const appDOM = document.getElementById('root');
if (!appDOM) {
  throw new Error('当前页面不存在 <div id="root"></div> 节点.');
}

// ReactDOM.createRoot(appDOM).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
ReactDOM.render(<App />, appDOM);
