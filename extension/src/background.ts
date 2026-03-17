// Entry point for Chrome extension background tasks
import { jobQueueService, JobApplication } from "./services/JobQueueService";
import { getSupabaseClient } from "./supabaseClient";
import { exposeConfigToGlobal } from "./config/validateEnv";

console.log("🚀 Uswift Background Worker initialized");

// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Uswift Job Board Auto-Apply extension installed.");

  // Set up default configuration
  chrome.storage.local.set({
    extensionInstalled: true,
    installedAt: new Date().toISOString(),
  });
});

/**
 * Message handler for popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle different message types
  switch (message.type) {
    case "APPLY_JOB":
      handleApplyJob(message, sendResponse);
      return true; // Keep channel open for async response

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
      // Health check from popup
      sendResponse({ status: "pong", timestamp: Date.now() });
      break;

    default:
      console.warn("Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
  }
});

/**
 * Handle APPLY_JOB message - Queue job for processing
 */
async function handleApplyJob(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    console.log("📥 Received APPLY_JOB request:", {
      jobUrl: message.jobUrl,
      jobBoard: message.jobBoard,
      userId: message.userId,
    });

    // Validate required fields
    if (!message.userId) {
      sendResponse({
        success: false,
        error: "User ID is required. Please sign in first.",
      });
      return;
    }

    if (!message.jobUrl) {
      sendResponse({
        success: false,
        error: "Job URL is required",
      });
      return;
    }

    if (!message.profile) {
      sendResponse({
        success: false,
        error: "Profile data is required. Please complete your profile first.",
      });
      return;
    }

    // Create job application object
    const jobApplication: Omit<JobApplication, "id" | "queuedAt"> = {
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
      metadata: message.metadata,
    };

    // Add to queue
    const result = await jobQueueService.addToQueue(jobApplication);

    if (result.success) {
      console.log("✅ Job queued successfully:", result.id);
      sendResponse({
        success: true,
        status: "queued",
        jobId: result.id,
        message: result.message,
      });

      // Show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Job Application Queued",
        message: `${message.jobTitle || "Job"} at ${
          message.company || "company"
        } has been queued for auto-apply.`,
        priority: 1,
      });
    } else {
      console.error("❌ Failed to queue job:", result.message);
      sendResponse({
        success: false,
        status: "error",
        error: result.message,
      });
    }
  } catch (error: any) {
    console.error("❌ Error in handleApplyJob:", error);
    sendResponse({
      success: false,
      status: "error",
      error: error.message || "Failed to queue job application",
    });
  }
}

/**
 * Handle GET_QUEUE_STATS message - Get queue statistics
 */
async function handleGetQueueStats(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    if (!message.userId) {
      sendResponse({ success: false, error: "User ID is required" });
      return;
    }

    const stats = await jobQueueService.getQueueStats(message.userId);

    sendResponse({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Error getting queue stats:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to get queue statistics",
    });
  }
}

/**
 * Handle GET_QUEUED_JOBS message - Get all queued jobs
 */
async function handleGetQueuedJobs(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    if (!message.userId) {
      sendResponse({ success: false, error: "User ID is required" });
      return;
    }

    const jobs = await jobQueueService.getQueuedJobs(message.userId);

    sendResponse({
      success: true,
      jobs,
    });
  } catch (error: any) {
    console.error("Error getting queued jobs:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to get queued jobs",
    });
  }
}

/**
 * Handle CANCEL_JOB message - Cancel a queued job
 */
async function handleCancelJob(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    if (!message.jobId) {
      sendResponse({ success: false, error: "Job ID is required" });
      return;
    }

    const success = await jobQueueService.cancelJob(message.jobId);

    if (success) {
      sendResponse({
        success: true,
        message: "Job cancelled successfully",
      });

      // Show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Job Application Cancelled",
        message: "The job application has been removed from the queue.",
        priority: 0,
      });
    } else {
      sendResponse({
        success: false,
        error: "Failed to cancel job",
      });
    }
  } catch (error: any) {
    console.error("Error cancelling job:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to cancel job",
    });
  }
}

/**
 * Handle alarm events for scheduled tasks
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "processQueue") {
    console.log("⏰ Processing job queue via alarm...");
    // Queue is automatically processed by JobQueueService
  }
});

/**
 * Set up recurring alarm for queue processing (every 5 minutes)
 */
chrome.alarms.create("processQueue", {
  periodInMinutes: 5,
});

/**
 * Initialize Supabase client in background (if configured)
 */
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

/**
 * Initialize environment configuration
 */
try {
  exposeConfigToGlobal();
  console.log("✅ Environment configuration loaded");
} catch (e) {
  console.error("❌ Failed to validate environment:", e);
}

console.log("✅ Uswift Background Worker ready");
