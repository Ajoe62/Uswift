import { getSupabaseClient } from './supabaseClient.js';

const scriptRel = (function detectScriptRel() {
    const relList = typeof document !== 'undefined' && document.createElement('link').relList;
    return relList && relList.supports && relList.supports('modulepreload')
        ? 'modulepreload'
        : 'preload';
})();const assetsURL = function(dep) { return "/"+dep };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
    // @ts-expect-error true will be replaced with boolean later
    if (!true || !deps || deps.length === 0) {
        return baseModule();
    }
    const links = document.getElementsByTagName('link');
    return Promise.all(deps.map((dep) => {
        // @ts-expect-error assetsURL is declared before preload.toString()
        dep = assetsURL(dep);
        if (dep in seen)
            return;
        seen[dep] = true;
        const isCss = dep.endsWith('.css');
        const cssSelector = isCss ? '[rel="stylesheet"]' : '';
        const isBaseRelative = !!importerUrl;
        // check if the file is already preloaded by SSR markup
        if (isBaseRelative) {
            // When isBaseRelative is true then we have `importerUrl` and `dep` is
            // already converted to an absolute URL by the `assetsURL` function
            for (let i = links.length - 1; i >= 0; i--) {
                const link = links[i];
                // The `links[i].href` is an absolute URL thanks to browser doing the work
                // for us. See https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes:idl-domstring-5
                if (link.href === dep && (!isCss || link.rel === 'stylesheet')) {
                    return;
                }
            }
        }
        else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
            return;
        }
        const link = document.createElement('link');
        link.rel = isCss ? 'stylesheet' : scriptRel;
        if (!isCss) {
            link.as = 'script';
            link.crossOrigin = '';
        }
        link.href = dep;
        document.head.appendChild(link);
        if (isCss) {
            return new Promise((res, rej) => {
                link.addEventListener('load', res);
                link.addEventListener('error', () => rej(new Error(`Unable to preload CSS for ${dep}`)));
            });
        }
    }))
        .then(() => baseModule())
        .catch((err) => {
        const e = new Event('vite:preloadError', { cancelable: true });
        // @ts-expect-error custom payload
        e.payload = err;
        window.dispatchEvent(e);
        if (!e.defaultPrevented) {
            throw err;
        }
    });
};

class JobQueueService {
  constructor() {
    this.processingQueue = /* @__PURE__ */ new Map();
    this.rateLimitMap = /* @__PURE__ */ new Map();
    // userId -> timestamps
    this.maxAppliesPerHour = 20;
    this.isProcessing = false;
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
        iconUrl: "icons/icon48.png",
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
        iconUrl: "icons/icon48.png",
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
  __vitePreload(() => import('./supabaseClient.js'),true?[]:void 0).then(({ getSupabaseClient }) => {
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
  }).catch(() => {
    console.warn("⚠️ Failed to load Supabase module");
  });
} catch (e) {
  console.warn("⚠️ Supabase initialization error:", e);
}
try {
  __vitePreload(() => import('./validateEnv.js'),true?[]:void 0).then(({ exposeConfigToGlobal }) => {
    try {
      exposeConfigToGlobal();
      console.log("✅ Environment configuration loaded");
    } catch (e) {
      console.error("❌ Failed to validate environment:", e);
    }
  }).catch(() => {
    console.warn("⚠️ Failed to load environment configuration");
  });
} catch (e) {
  console.warn("⚠️ Environment configuration error:", e);
}
console.log("✅ Uswift Background Worker ready");
