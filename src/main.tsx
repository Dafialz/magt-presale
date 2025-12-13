import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./app/App";
import { TONCONNECT_MANIFEST_URL } from "./lib/config";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
