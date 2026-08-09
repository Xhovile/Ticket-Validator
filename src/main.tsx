import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BuyMeshoGateLite from './components/BuyMeshoGateLite.tsx';
import './index.css';
import { registerServiceWorker } from './utils/offlineSyncManager.ts';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BuyMeshoGateLite />
  </StrictMode>,
);