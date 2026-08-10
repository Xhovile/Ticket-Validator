import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BuyMeshoGate from "./components/BuyMeshoGate";
import { ValidatorAuthProvider } from "./auth/ValidatorAuthProvider";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./index.css";
import { registerServiceWorker } from "./utils/offlineSyncManager";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ValidatorAuthProvider>
        <BuyMeshoGate />
      </ValidatorAuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
