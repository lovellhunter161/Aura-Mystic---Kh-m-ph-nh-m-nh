import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Essential polyfills for browser environment
if (typeof window !== 'undefined') {
  (window as any).global = window;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
