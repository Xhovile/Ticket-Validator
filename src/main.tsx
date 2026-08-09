import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BuyMeshoGate from "./components/BuyMeshoGate";
import "./index.css";
import { registerServiceWorker } from "./utils/offlineSyncManager";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BuyMeshoGate />
  </StrictMode>,
);
