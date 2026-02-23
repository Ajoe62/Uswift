// Configuration for Chrome Extension
const CONFIG = {
  // Supabase configuration
  supabase: {
    url: "",
    anonKey: "",
  },

  // Mistral AI configuration
  mistral: {
    apiKey: "",
    baseUrl: "https://api.mistral.ai",
  },

  // Extension settings
  extension: {
    version: "1.0.0",
    debug: false,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  },
};

// Helper function to get configuration values
function getConfig(path) {
  return path.split(".").reduce((obj, key) => obj && obj[key], CONFIG);
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}

// Make available globally for Chrome extension
window.EXTENSION_CONFIG = CONFIG;

// Environment variable support (for development)
if (typeof process !== "undefined" && process.env) {
  CONFIG.mistral.apiKey =
    process.env.VITE_MISTRAL_API_KEY || CONFIG.mistral.apiKey;
  CONFIG.mistral.baseUrl =
    process.env.VITE_MISTRAL_BASE_URL || CONFIG.mistral.baseUrl;
}

// Browser environment variable support
if (typeof window !== "undefined" && window.location) {
  const urlParams = new URLSearchParams(window.location.search);
  CONFIG.mistral.apiKey =
    urlParams.get("mistral_api_key") || CONFIG.mistral.apiKey;
}

// Console warning for missing API key
if (CONFIG.mistral.apiKey === "your-mistral-api-key-here") {
  console.warn("⚠️  MISTRAL API KEY NOT CONFIGURED!");
  console.warn("📝 To fix AI chat errors:");
  console.warn("   1. Get your API key from: https://mistral.ai/");
  console.warn("   2. Replace 'your-mistral-api-key-here' in config.js");
  console.warn("   3. Or set VITE_MISTRAL_API_KEY environment variable");
}

// Legacy support
window.SUPABASE_CONFIG = CONFIG.supabase;
