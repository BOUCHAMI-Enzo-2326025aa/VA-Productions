import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Service worker: uniquement en prod, et jamais sur localhost.
// Important: 305viter le cache en dev pour ne pas casser localhost.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocalhost) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // silencieux: ne casse pas le rendu si la registration 205choue
      });
    });
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
