import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BuyMeshoGate from './components/BuyMeshoGate.tsx';
import './index.css';
import { registerServiceWorker } from './utils/offlineSyncManager.ts';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BuyMeshoGate />
  </StrictMode>,
);
