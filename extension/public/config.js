// Runtime configuration for Chrome Extension
// This file is copied to dist/ via Vite publicDir
// Safe to edit for different environments

// Full extension configuration
window.EXTENSION_CONFIG = {
  supabase: {
    url: "",
    anonKey: "",
  },

  mistral: {
    apiKey: "",
    baseUrl: "https://api.mistral.ai",
  },

  extension: {
    version: "1.0.0",
    debug: false,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  },
};

// Legacy support for old code
window.SUPABASE_CONFIG = window.EXTENSION_CONFIG.supabase;
