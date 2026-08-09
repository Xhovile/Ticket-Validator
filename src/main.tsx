import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BuyMeshoGateLite from "./components/BuyMeshoGateLite";
import "./index.css";
import { registerServiceWorker } from "./utils/offlineSyncManager";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BuyMeshoGateLite />
  </StrictMode>,
);
