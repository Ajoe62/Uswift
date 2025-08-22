import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./Popup";
import "./index.css";
// Initialize local Supabase client (CSP-safe)
import { getSupabaseClient } from "./supabaseClient";

// Ensure client is initialized for the popup UI (no-op if config missing)
function ensureSupabaseClientReady() {
  try {
    const supabase = getSupabaseClient();
    if (supabase) return;
  } catch (e) {
    // getSupabaseClient now returns null instead of throwing, but be defensive
  }

  // If runtime config isn't present, inject /config.js and initialize after load.
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && !(window as any).SUPABASE_CONFIG) {
    const existing = document.querySelector('script[data-runtime-config]');
    if (!existing) {
      const s = document.createElement('script');
      s.setAttribute('data-runtime-config', 'true');
      s.src = '/config.js';
      s.onload = () => {
        try { getSupabaseClient(); } catch (e) { console.warn('Supabase init after config failed', e); }
      };
      s.onerror = () => console.warn('Failed to load /config.js');
      document.head.appendChild(s);
    }
  }
}


// Render the popup UI immediately; Supabase will initialize shortly after if needed.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);

// Try to initialize now (no-op if missing); dynamic loader above will call later.
try { getSupabaseClient(); } catch (e) { /* ignore */ }
