// Runtime configuration for Chrome Extension
// This file is copied to dist/ via Vite publicDir
// Safe to edit for different environments

// Full extension configuration
window.EXTENSION_CONFIG = {
  // Supabase configuration
  supabase: {
    url: "https://sigoorxtktxtbcneodux.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ29vcnh0a3R4dGJjbmVvZHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzMwOTMsImV4cCI6MjA3MTA0OTA5M30.x1e1_9GNoNtQUF4EPYlSAf0HWfrwUzQAuwiWTnMhbN8",
  },

  // Mistral AI configuration
  mistral: {
    // Get your API key from: https://console.mistral.ai/
    apiKey: "7VOMtyR1Gv69ohW3czVXVAV3QtxzILkY",
    baseUrl: "https://api.mistral.ai",
  },

  // Extension settings
  extension: {
    version: "1.0.0",
    debug: true,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  },
};

// Legacy support for old code
window.SUPABASE_CONFIG = window.EXTENSION_CONFIG.supabase;
