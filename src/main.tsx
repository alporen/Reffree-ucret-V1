import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// iOS/Safari, viewport meta'daki user-scalable=no'yu yok sayar; pinch/gesture ile
// sayfanın sürekli zoomlanmasını script tarafında kapat. Kaydırma ve dokunma etkilenmez.
if (typeof document !== 'undefined') {
  const pinch = (e: Event) => e.preventDefault();
  // Safari'ye özgü gesture olayları
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, pinch, { passive: false });
  }
  // İki parmaklı dokunma hareketi (diğer tarayıcılar)
  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false },
  );
}
