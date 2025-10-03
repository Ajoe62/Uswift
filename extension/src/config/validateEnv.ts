/**
 * Environment Variable Validation Utility
 * Validates that all required environment variables are set before the extension runs
 */

// Declare process for Node.js environment
declare const process: any;

export interface EnvConfig {
  mistral: {
    apiKey: string;
    baseUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  backend?: {
    apiUrl?: string;
  };
  debug: boolean;
  features: {
    autoApply: boolean;
    aiFeatures: boolean;
    fileUploads: boolean;
    cloudSync: boolean;
  };
  rateLimits: {
    aiCallsPerMinute: number;
    autoApplyPerHour: number;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config?: EnvConfig;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue?: string): string {
  // Try Vite's import.meta.env first
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    const value = (import.meta as any).env[key];
    if (value !== undefined) return value;
  }

  // Fallback to process.env (for Node.js builds)
  if (typeof process !== "undefined" && (process as any).env && (process as any).env[key]) {
    return (process as any).env[key] || "";
  }

  return defaultValue || "";
}

/**
 * Check if a value looks like a valid API key (not placeholder)
 */
function isValidApiKey(key: string): boolean {
  if (!key || key.trim() === "") return false;
  if (key.includes("your-") || key.includes("here")) return false;
  if (key.length < 10) return false;
  return true;
}

/**
 * Check if URL is valid
 */
function isValidUrl(url: string): boolean {
  if (!url || url.trim() === "") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate all environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all environment variables
  const mistralApiKey = getEnvVar("VITE_MISTRAL_API_KEY");
  const mistralBaseUrl = getEnvVar(
    "VITE_MISTRAL_BASE_URL",
    "https://api.mistral.ai"
  );
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");
  const backendApiUrl = getEnvVar("VITE_BACKEND_API_URL");
  const debugMode = getEnvVar("VITE_DEBUG_MODE", "false") === "true";

  // Feature flags
  const enableAutoApply =
    getEnvVar("VITE_ENABLE_AUTO_APPLY", "true") === "true";
  const enableAiFeatures =
    getEnvVar("VITE_ENABLE_AI_FEATURES", "true") === "true";
  const enableFileUploads =
    getEnvVar("VITE_ENABLE_FILE_UPLOADS", "true") === "true";
  const enableCloudSync =
    getEnvVar("VITE_ENABLE_CLOUD_SYNC", "true") === "true";

  // Rate limits
  const aiRateLimit = parseInt(getEnvVar("VITE_AI_RATE_LIMIT", "10"), 10);
  const autoApplyRateLimit = parseInt(
    getEnvVar("VITE_AUTO_APPLY_RATE_LIMIT", "20"),
    10
  );

  // Validate Mistral AI configuration
  if (!isValidApiKey(mistralApiKey)) {
    errors.push(
      "❌ VITE_MISTRAL_API_KEY is missing or invalid. Get your API key from https://console.mistral.ai/"
    );
  }

  if (!isValidUrl(mistralBaseUrl)) {
    errors.push(
      "❌ VITE_MISTRAL_BASE_URL is invalid. Should be https://api.mistral.ai"
    );
  }

  // Validate Supabase configuration
  if (!isValidUrl(supabaseUrl)) {
    errors.push(
      "❌ VITE_SUPABASE_URL is missing or invalid. Get it from https://app.supabase.com/"
    );
  }

  if (!isValidApiKey(supabaseAnonKey)) {
    errors.push(
      "❌ VITE_SUPABASE_ANON_KEY is missing or invalid. Get it from your Supabase project settings."
    );
  }

  // Warnings for optional configurations
  if (backendApiUrl && !isValidUrl(backendApiUrl)) {
    warnings.push("⚠️ VITE_BACKEND_API_URL is set but appears invalid");
  }

  if (enableAiFeatures && !isValidApiKey(mistralApiKey)) {
    warnings.push(
      "⚠️ AI features are enabled but Mistral API key is not configured"
    );
  }

  if (enableCloudSync && (!isValidUrl(supabaseUrl) || !isValidApiKey(supabaseAnonKey))) {
    warnings.push(
      "⚠️ Cloud sync is enabled but Supabase configuration is incomplete"
    );
  }

  // Validate rate limits
  if (isNaN(aiRateLimit) || aiRateLimit <= 0) {
    warnings.push("⚠️ VITE_AI_RATE_LIMIT is invalid, using default: 10");
  }

  if (isNaN(autoApplyRateLimit) || autoApplyRateLimit <= 0) {
    warnings.push(
      "⚠️ VITE_AUTO_APPLY_RATE_LIMIT is invalid, using default: 20"
    );
  }

  // Build config object
  const config: EnvConfig = {
    mistral: {
      apiKey: mistralApiKey,
      baseUrl: mistralBaseUrl,
    },
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
    backend: backendApiUrl ? { apiUrl: backendApiUrl } : undefined,
    debug: debugMode,
    features: {
      autoApply: enableAutoApply,
      aiFeatures: enableAiFeatures,
      fileUploads: enableFileUploads,
      cloudSync: enableCloudSync,
    },
    rateLimits: {
      aiCallsPerMinute: aiRateLimit,
      autoApplyPerHour: autoApplyRateLimit,
    },
  };

  // Log results if in debug mode
  if (debugMode) {
    console.group("🔧 Environment Configuration");
    console.log("Mistral API:", isValidApiKey(mistralApiKey) ? "✅" : "❌");
    console.log("Supabase:", isValidUrl(supabaseUrl) ? "✅" : "❌");
    console.log("Features:", config.features);
    console.log("Rate Limits:", config.rateLimits);
    if (errors.length > 0) {
      console.error("Errors:", errors);
    }
    if (warnings.length > 0) {
      console.warn("Warnings:", warnings);
    }
    console.groupEnd();
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: errors.length === 0 ? config : undefined,
  };
}

/**
 * Get validated configuration or throw error
 */
export function getValidatedConfig(): EnvConfig {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessage = [
      "❌ Extension configuration is invalid:",
      "",
      ...result.errors,
      "",
      "Please update your .env file with valid credentials.",
      "See .env.example for reference.",
    ].join("\n");

    console.error(errorMessage);
    throw new Error("Invalid extension configuration");
  }

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn("Extension configuration warnings:");
    result.warnings.forEach((warning) => console.warn(warning));
  }

  return result.config!;
}

/**
 * Export configuration to global scope (for legacy code)
 */
export function exposeConfigToGlobal(): void {
  try {
    const config = getValidatedConfig();
    (globalThis as any).EXTENSION_CONFIG = config;

    // Also expose to window for popup/content scripts
    if (typeof window !== "undefined") {
      (window as any).EXTENSION_CONFIG = config;
    }
  } catch (error) {
    console.error("Failed to initialize extension configuration:", error);
  }
}

// Auto-initialize when module is loaded
if (typeof window !== "undefined") {
  // Only validate in browser context (not during SSR/build)
  exposeConfigToGlobal();
}
