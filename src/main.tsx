import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BuyMeshoGate from "./components/BuyMeshoGate";
import { ValidatorAuthProvider } from "./auth/ValidatorAuthProvider";
import "./index.css";
import { registerServiceWorker } from "./utils/offlineSyncManager";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ValidatorAuthProvider>
      <BuyMeshoGate />
    </ValidatorAuthProvider>
  </StrictMode>,
);
