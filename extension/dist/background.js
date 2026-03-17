import { g as getSupabaseClient } from './supabaseClient.js';

class JobQueueService {
  static instance;
  processingQueue = /* @__PURE__ */ new Map();
  rateLimitMap = /* @__PURE__ */ new Map();
  // userId -> timestamps
  maxAppliesPerHour = 20;
  isProcessing = false;
  constructor() {
    this.startBackgroundProcessor();
  }
  static getInstance() {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }
  /**
   * Add job application to queue
   */
  async addToQueue(application) {
    try {
      const rateLimitCheck = this.checkRateLimit(application.userId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: `Rate limit exceeded. You can apply again in ${rateLimitCheck.minutesUntilReset} minutes.`
        };
      }
      const job = {
        ...application,
        queuedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "queued",
        retryCount: 0,
        maxRetries: application.maxRetries || 3,
        priority: application.priority || "normal"
      };
      const supabase = getSupabaseClient();
      let jobId;
      if (supabase) {
        try {
          const savedJob = await supabase.makeRequest("job_queue", {
            method: "POST",
            body: JSON.stringify([{
              user_id: job.userId,
              job_url: job.jobUrl,
              job_title: job.jobTitle,
              company: job.company,
              job_board: job.jobBoard,
              status: job.status,
              profile: job.profile,
              queued_at: job.queuedAt,
              retry_count: job.retryCount,
              max_retries: job.maxRetries,
              priority: job.priority,
              metadata: job.metadata
            }])
          });
          jobId = savedJob?.[0]?.id || `local-${Date.now()}`;
          job.id = jobId;
        } catch (error) {
          console.warn("Failed to save to Supabase, using local queue:", error);
          jobId = `local-${Date.now()}`;
          job.id = jobId;
        }
      } else {
        jobId = `local-${Date.now()}`;
        job.id = jobId;
        await this.saveToLocalStorage(job);
      }
      this.updateRateLimit(application.userId);
      if (!this.isProcessing) {
        this.processQueue();
      }
      return {
        success: true,
        id: jobId,
        message: "Job application queued successfully"
      };
    } catch (error) {
      console.error("Error adding to queue:", error);
      return {
        success: false,
        message: error.message || "Failed to queue job application"
      };
    }
  }
  /**
   * Check if user has exceeded rate limit
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1e3;
    const userTimestamps = this.rateLimitMap.get(userId) || [];
    const recentApplies = userTimestamps.filter((ts) => ts > oneHourAgo);
    if (recentApplies.length >= this.maxAppliesPerHour) {
      const oldestTimestamp = Math.min(...recentApplies);
      const minutesUntilReset = Math.ceil(
        (oldestTimestamp + 60 * 60 * 1e3 - now) / (60 * 1e3)
      );
      return {
        allowed: false,
        minutesUntilReset
      };
    }
    return { allowed: true };
  }
  /**
   * Update rate limit after successful queue
   */
  updateRateLimit(userId) {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1e3;
    const userTimestamps = this.rateLimitMap.get(userId) || [];
    const recentTimestamps = userTimestamps.filter((ts) => ts > oneHourAgo);
    recentTimestamps.push(now);
    this.rateLimitMap.set(userId, recentTimestamps);
  }
  /**
   * Get queue statistics
   */
  async getQueueStats(userId) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const jobs = await supabase.makeRequest(
          `job_queue?user_id=eq.${userId}`
        );
        const stats = {
          queued: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          total: jobs?.length || 0
        };
        jobs?.forEach((job) => {
          if (job.status === "queued")
            stats.queued++;
          else if (job.status === "processing")
            stats.processing++;
          else if (job.status === "completed")
            stats.completed++;
          else if (job.status === "failed")
            stats.failed++;
        });
        return stats;
      } catch (error) {
        console.warn("Failed to get stats from Supabase:", error);
      }
    }
    return this.getLocalStats(userId);
  }
  /**
   * Get all queued jobs for a user
   */
  async getQueuedJobs(userId) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const jobs = await supabase.makeRequest(
          `job_queue?user_id=eq.${userId}&status=eq.queued&order=priority.asc,queued_at.asc`
        );
        return jobs?.map((job) => ({
          id: job.id,
          userId: job.user_id,
          jobUrl: job.job_url,
          jobTitle: job.job_title,
          company: job.company,
          jobBoard: job.job_board,
          status: job.status,
          profile: job.profile,
          queuedAt: job.queued_at,
          processedAt: job.processed_at,
          failureReason: job.failure_reason,
          retryCount: job.retry_count,
          maxRetries: job.max_retries,
          priority: job.priority,
          metadata: job.metadata
        })) || [];
      } catch (error) {
        console.warn("Failed to get jobs from Supabase:", error);
      }
    }
    return this.getLocalJobs(userId);
  }
  /**
   * Cancel a queued job
   */
  async cancelJob(jobId) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.makeRequest(`job_queue?id=eq.${jobId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "cancelled",
            processed_at: (/* @__PURE__ */ new Date()).toISOString()
          })
        });
        return true;
      } catch (error) {
        console.error("Failed to cancel job:", error);
      }
    }
    return this.cancelLocalJob(jobId);
  }
  /**
   * Background processor - processes queue every 30 seconds
   */
  startBackgroundProcessor() {
    setInterval(() => {
      if (!this.isProcessing) {
        this.processQueue();
      }
    }, 3e4);
  }
  /**
   * Process the job queue
   */
  async processQueue() {
    if (this.isProcessing)
      return;
    this.isProcessing = true;
    try {
      const supabase = getSupabaseClient();
      let queuedJobs = [];
      if (supabase) {
        try {
          const jobs = await supabase.makeRequest(
            `job_queue?status=eq.queued&order=priority.asc,queued_at.asc&limit=10`
          );
          queuedJobs = jobs?.map((job) => ({
            id: job.id,
            userId: job.user_id,
            jobUrl: job.job_url,
            jobTitle: job.job_title,
            company: job.company,
            jobBoard: job.job_board,
            status: job.status,
            profile: job.profile,
            queuedAt: job.queued_at,
            retryCount: job.retry_count,
            maxRetries: job.max_retries,
            priority: job.priority,
            metadata: job.metadata
          })) || [];
        } catch (error) {
          console.warn("Failed to fetch queue from Supabase:", error);
        }
      }
      for (const job of queuedJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error("Error processing queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }
  /**
   * Process a single job
   */
  async processJob(job) {
    const supabase = getSupabaseClient();
    try {
      if (supabase && job.id) {
        await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "processing" })
        });
      }
      const tab = await chrome.tabs.create({ url: job.jobUrl, active: false });
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "autoApply", profile: job.profile },
          async (response) => {
            if (response?.status === "success") {
              if (supabase && job.id) {
                await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    status: "completed",
                    processed_at: (/* @__PURE__ */ new Date()).toISOString()
                  })
                });
              }
              setTimeout(() => {
                if (tab.id)
                  chrome.tabs.remove(tab.id);
              }, 3e3);
            } else {
              await this.handleJobFailure(job, response?.message);
            }
          }
        );
      }
    } catch (error) {
      console.error("Error processing job:", error);
      await this.handleJobFailure(job, error.message);
    }
  }
  /**
   * Handle job failure with retry logic
   */
  async handleJobFailure(job, reason) {
    const supabase = getSupabaseClient();
    if (job.retryCount < job.maxRetries) {
      if (supabase && job.id) {
        await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "queued",
            retry_count: job.retryCount + 1,
            failure_reason: reason
          })
        });
      }
    } else {
      if (supabase && job.id) {
        await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "failed",
            processed_at: (/* @__PURE__ */ new Date()).toISOString(),
            failure_reason: reason || "Max retries exceeded"
          })
        });
      }
    }
  }
  /**
   * Local storage fallback methods
   */
  async saveToLocalStorage(job) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue = result.jobQueue || [];
        queue.push(job);
        chrome.storage.local.set({ jobQueue: queue }, () => resolve());
      });
    });
  }
  async getLocalStats(userId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue = result.jobQueue || [];
        const userJobs = queue.filter((job) => job.userId === userId);
        const stats = {
          queued: userJobs.filter((j) => j.status === "queued").length,
          processing: userJobs.filter((j) => j.status === "processing").length,
          completed: userJobs.filter((j) => j.status === "completed").length,
          failed: userJobs.filter((j) => j.status === "failed").length,
          total: userJobs.length
        };
        resolve(stats);
      });
    });
  }
  async getLocalJobs(userId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue = result.jobQueue || [];
        const userJobs = queue.filter(
          (job) => job.userId === userId && job.status === "queued"
        );
        resolve(userJobs);
      });
    });
  }
  async cancelLocalJob(jobId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue = result.jobQueue || [];
        const updated = queue.map(
          (job) => job.id === jobId ? { ...job, status: "cancelled" } : job
        );
        chrome.storage.local.set({ jobQueue: updated }, () => resolve(true));
      });
    });
  }
}
const jobQueueService = JobQueueService.getInstance();

function getEnvVar(key, defaultValue) {
  if (typeof import.meta !== "undefined" && {"VITE_MISTRAL_API_KEY":"7VOMtyR1Gv69ohW3czVXVAV3QtxzILkY","VITE_MISTRAL_BASE_URL":"https://api.mistral.ai","VITE_MISTRAL_CHAT_API_URL":"https://api.mistral.ai/v1/chat/completions","VITE_MISTRAL_FILES_API_URL":"https://api.mistral.ai/v1/files","VITE_MISTRAL_EMBEDDINGS_API_URL":"https://api.mistral.ai/v1/embeddings","VITE_MISTRAL_PROXY_URL":"http://localhost:3000/api/mistral","VITE_SUPABASE_URL":"https://sigoorxtktxtbcneodux.supabase.co","VITE_SUPABASE_ANON_KEY":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ29vcnh0a3R4dGJjbmVvZHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzMwOTMsImV4cCI6MjA3MTA0OTA5M30.x1e1_9GNoNtQUF4EPYlSAf0HWfrwUzQAuwiWTnMhbN8","VITE_PASSWORD_RESET_REDIRECT_URL":"https://uswift-ai.vercel.app/auth/reset-password","VITE_DEBUG_MODE":false,"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false,"VITE_BACKEND_API_URL":""}) {
    const value = {"VITE_MISTRAL_API_KEY":"7VOMtyR1Gv69ohW3czVXVAV3QtxzILkY","VITE_MISTRAL_BASE_URL":"https://api.mistral.ai","VITE_MISTRAL_CHAT_API_URL":"https://api.mistral.ai/v1/chat/completions","VITE_MISTRAL_FILES_API_URL":"https://api.mistral.ai/v1/files","VITE_MISTRAL_EMBEDDINGS_API_URL":"https://api.mistral.ai/v1/embeddings","VITE_MISTRAL_PROXY_URL":"http://localhost:3000/api/mistral","VITE_SUPABASE_URL":"https://sigoorxtktxtbcneodux.supabase.co","VITE_SUPABASE_ANON_KEY":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ29vcnh0a3R4dGJjbmVvZHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzMwOTMsImV4cCI6MjA3MTA0OTA5M30.x1e1_9GNoNtQUF4EPYlSAf0HWfrwUzQAuwiWTnMhbN8","VITE_PASSWORD_RESET_REDIRECT_URL":"https://uswift-ai.vercel.app/auth/reset-password","VITE_DEBUG_MODE":false,"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false,"VITE_BACKEND_API_URL":""}[key];
    if (value !== void 0)
      return value;
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] || "";
  }
  return defaultValue || "";
}
function isValidApiKey(key) {
  if (!key || key.trim() === "")
    return false;
  if (key.includes("your-") || key.includes("here"))
    return false;
  if (key.length < 10)
    return false;
  return true;
}
function isValidUrl(url) {
  if (!url || url.trim() === "")
    return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function validateEnv() {
  const errors = [];
  const warnings = [];
  const mistralApiKey = getEnvVar("VITE_MISTRAL_API_KEY");
  const mistralBaseUrl = getEnvVar(
    "VITE_MISTRAL_BASE_URL",
    "https://api.mistral.ai"
  );
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");
  const backendApiUrl = getEnvVar("VITE_BACKEND_API_URL");
  const debugMode = getEnvVar("VITE_DEBUG_MODE", "false") === "true";
  const enableAutoApply = getEnvVar("VITE_ENABLE_AUTO_APPLY", "true") === "true";
  const enableAiFeatures = getEnvVar("VITE_ENABLE_AI_FEATURES", "true") === "true";
  const enableFileUploads = getEnvVar("VITE_ENABLE_FILE_UPLOADS", "true") === "true";
  const enableCloudSync = getEnvVar("VITE_ENABLE_CLOUD_SYNC", "true") === "true";
  const aiRateLimit = parseInt(getEnvVar("VITE_AI_RATE_LIMIT", "10"), 10);
  const autoApplyRateLimit = parseInt(
    getEnvVar("VITE_AUTO_APPLY_RATE_LIMIT", "20"),
    10
  );
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
  if (isNaN(aiRateLimit) || aiRateLimit <= 0) {
    warnings.push("⚠️ VITE_AI_RATE_LIMIT is invalid, using default: 10");
  }
  if (isNaN(autoApplyRateLimit) || autoApplyRateLimit <= 0) {
    warnings.push(
      "⚠️ VITE_AUTO_APPLY_RATE_LIMIT is invalid, using default: 20"
    );
  }
  const config = {
    mistral: {
      apiKey: mistralApiKey,
      baseUrl: mistralBaseUrl
    },
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    },
    backend: backendApiUrl ? { apiUrl: backendApiUrl } : void 0,
    debug: debugMode,
    features: {
      autoApply: enableAutoApply,
      aiFeatures: enableAiFeatures,
      fileUploads: enableFileUploads,
      cloudSync: enableCloudSync
    },
    rateLimits: {
      aiCallsPerMinute: aiRateLimit,
      autoApplyPerHour: autoApplyRateLimit
    }
  };
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
    config: errors.length === 0 ? config : void 0
  };
}
function getValidatedConfig() {
  const result = validateEnv();
  if (!result.valid) {
    const errorMessage = [
      "❌ Extension configuration is invalid:",
      "",
      ...result.errors,
      "",
      "Please update your .env file with valid credentials.",
      "See .env.example for reference."
    ].join("\n");
    console.error(errorMessage);
    throw new Error("Invalid extension configuration");
  }
  if (result.warnings.length > 0) {
    console.warn("Extension configuration warnings:");
    result.warnings.forEach((warning) => console.warn(warning));
  }
  return result.config;
}
function exposeConfigToGlobal() {
  try {
    const config = getValidatedConfig();
    globalThis.EXTENSION_CONFIG = config;
    if (typeof window !== "undefined") {
      window.EXTENSION_CONFIG = config;
    }
  } catch (error) {
    console.error("Failed to initialize extension configuration:", error);
  }
}
if (typeof window !== "undefined") {
  exposeConfigToGlobal();
}

console.log("🚀 Uswift Background Worker initialized");
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Uswift Job Board Auto-Apply extension installed.");
  chrome.storage.local.set({
    extensionInstalled: true,
    installedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "APPLY_JOB":
      handleApplyJob(message, sendResponse);
      return true;
    case "GET_QUEUE_STATS":
      handleGetQueueStats(message, sendResponse);
      return true;
    case "GET_QUEUED_JOBS":
      handleGetQueuedJobs(message, sendResponse);
      return true;
    case "CANCEL_JOB":
      handleCancelJob(message, sendResponse);
      return true;
    case "PING":
      sendResponse({ status: "pong", timestamp: Date.now() });
      break;
    default:
      console.warn("Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
  }
});
async function handleApplyJob(message, sendResponse) {
  try {
    console.log("📥 Received APPLY_JOB request:", {
      jobUrl: message.jobUrl,
      jobBoard: message.jobBoard,
      userId: message.userId
    });
    if (!message.userId) {
      sendResponse({
        success: false,
        error: "User ID is required. Please sign in first."
      });
      return;
    }
    if (!message.jobUrl) {
      sendResponse({
        success: false,
        error: "Job URL is required"
      });
      return;
    }
    if (!message.profile) {
      sendResponse({
        success: false,
        error: "Profile data is required. Please complete your profile first."
      });
      return;
    }
    const jobApplication = {
      userId: message.userId,
      jobUrl: message.jobUrl,
      jobTitle: message.jobTitle,
      company: message.company,
      jobBoard: message.jobBoard || "unknown",
      status: "queued",
      profile: message.profile,
      retryCount: 0,
      maxRetries: message.maxRetries || 3,
      priority: message.priority || "normal",
      metadata: message.metadata
    };
    const result = await jobQueueService.addToQueue(jobApplication);
    if (result.success) {
      console.log("✅ Job queued successfully:", result.id);
      sendResponse({
        success: true,
        status: "queued",
        jobId: result.id,
        message: result.message
      });
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Job Application Queued",
        message: `${message.jobTitle || "Job"} at ${message.company || "company"} has been queued for auto-apply.`,
        priority: 1
      });
    } else {
      console.error("❌ Failed to queue job:", result.message);
      sendResponse({
        success: false,
        status: "error",
        error: result.message
      });
    }
  } catch (error) {
    console.error("❌ Error in handleApplyJob:", error);
    sendResponse({
      success: false,
      status: "error",
      error: error.message || "Failed to queue job application"
    });
  }
}
async function handleGetQueueStats(message, sendResponse) {
  try {
    if (!message.userId) {
      sendResponse({ success: false, error: "User ID is required" });
      return;
    }
    const stats = await jobQueueService.getQueueStats(message.userId);
    sendResponse({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error getting queue stats:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to get queue statistics"
    });
  }
}
async function handleGetQueuedJobs(message, sendResponse) {
  try {
    if (!message.userId) {
      sendResponse({ success: false, error: "User ID is required" });
      return;
    }
    const jobs = await jobQueueService.getQueuedJobs(message.userId);
    sendResponse({
      success: true,
      jobs
    });
  } catch (error) {
    console.error("Error getting queued jobs:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to get queued jobs"
    });
  }
}
async function handleCancelJob(message, sendResponse) {
  try {
    if (!message.jobId) {
      sendResponse({ success: false, error: "Job ID is required" });
      return;
    }
    const success = await jobQueueService.cancelJob(message.jobId);
    if (success) {
      sendResponse({
        success: true,
        message: "Job cancelled successfully"
      });
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Job Application Cancelled",
        message: "The job application has been removed from the queue.",
        priority: 0
      });
    } else {
      sendResponse({
        success: false,
        error: "Failed to cancel job"
      });
    }
  } catch (error) {
    console.error("Error cancelling job:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to cancel job"
    });
  }
}
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "processQueue") {
    console.log("⏰ Processing job queue via alarm...");
  }
});
chrome.alarms.create("processQueue", {
  periodInMinutes: 5
});
try {
  const client = getSupabaseClient();
  if (client) {
    console.log("✅ Supabase client initialized in background");
  } else {
    console.warn("⚠️ Supabase client not configured");
  }
} catch (e) {
  console.warn("⚠️ Supabase background init skipped:", e);
}
try {
  exposeConfigToGlobal();
  console.log("✅ Environment configuration loaded");
} catch (e) {
  console.error("❌ Failed to validate environment:", e);
}
console.log("✅ Uswift Background Worker ready");
