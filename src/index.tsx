//ここはほぼこのままでエラー境界と将来のSuspense/Profilerを差し込める構造にしておくと拡張しやすいかも

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
