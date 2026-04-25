import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// When deployed with a separate backend (e.g. Railway + Vercel),
// set VITE_API_URL to the backend's public URL so API calls are routed correctly.
// Example: VITE_API_URL=https://kings-player-api.up.railway.app
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById("root")!).render(<App />);
