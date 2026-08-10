import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BuyMeshoGate from "./components/BuyMeshoGate";
import DiagnosticPage from "./DiagnosticPage";
import { ValidatorAuthProvider } from "./auth/ValidatorAuthProvider";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./index.css";
import { registerServiceWorker } from "./utils/offlineSyncManager";

registerServiceWorker();

const isDiagnosticRoute = window.location.pathname.replace(/\/+$/, "") === "/diagnostic";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      {isDiagnosticRoute ? (
        <DiagnosticPage />
      ) : (
        <ValidatorAuthProvider>
          <BuyMeshoGate />
        </ValidatorAuthProvider>
      )}
    </AppErrorBoundary>
  </StrictMode>,
);
