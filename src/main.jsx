import React from 'react';
import ReactDOM from 'react-dom/client';
import YoboLabsDashboard from './YoboLabsDashboard.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <YoboLabsDashboard />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
  });
}
