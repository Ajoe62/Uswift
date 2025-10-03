/**
 * Job Application Queue Service
 * Manages job application queue with rate limiting, retry logic, and persistence
 */

import { getSupabaseClient } from "../supabaseClient";

export interface JobApplication {
  id?: string;
  userId: string;
  jobUrl: string;
  jobTitle?: string;
  company?: string;
  jobBoard: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  profile: any; // User profile data for auto-fill
  queuedAt: string;
  processedAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  priority: "high" | "normal" | "low";
  metadata?: {
    detectedFields?: string[];
    formComplexity?: "simple" | "medium" | "complex";
    estimatedTime?: number;
  };
}

export interface QueueStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export class JobQueueService {
  private static instance: JobQueueService;
  private processingQueue: Map<string, JobApplication> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map(); // userId -> timestamps
  private maxAppliesPerHour: number = 20;
  private isProcessing: boolean = false;

  private constructor() {
    // Start background processing
    this.startBackgroundProcessor();
  }

  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Add job application to queue
   */
  async addToQueue(application: Omit<JobApplication, "id" | "queuedAt">): Promise<{
    success: boolean;
    id?: string;
    message: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = this.checkRateLimit(application.userId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: `Rate limit exceeded. You can apply again in ${rateLimitCheck.minutesUntilReset} minutes.`,
        };
      }

      // Create job application object
      const job: JobApplication = {
        ...application,
        queuedAt: new Date().toISOString(),
        status: "queued",
        retryCount: 0,
        maxRetries: application.maxRetries || 3,
        priority: application.priority || "normal",
      };

      // Save to Supabase (if authenticated)
      const supabase = getSupabaseClient();
      let jobId: string;

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
              metadata: job.metadata,
            }]),
          });

          jobId = savedJob?.[0]?.id || `local-${Date.now()}`;
          job.id = jobId;
        } catch (error) {
          console.warn("Failed to save to Supabase, using local queue:", error);
          jobId = `local-${Date.now()}`;
          job.id = jobId;
        }
      } else {
        // Fallback to Chrome storage
        jobId = `local-${Date.now()}`;
        job.id = jobId;
        await this.saveToLocalStorage(job);
      }

      // Update rate limit
      this.updateRateLimit(application.userId);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      return {
        success: true,
        id: jobId,
        message: "Job application queued successfully",
      };
    } catch (error: any) {
      console.error("Error adding to queue:", error);
      return {
        success: false,
        message: error.message || "Failed to queue job application",
      };
    }
  }

  /**
   * Check if user has exceeded rate limit
   */
  private checkRateLimit(userId: string): {
    allowed: boolean;
    minutesUntilReset?: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Get user's recent applications
    const userTimestamps = this.rateLimitMap.get(userId) || [];
    const recentApplies = userTimestamps.filter((ts) => ts > oneHourAgo);

    if (recentApplies.length >= this.maxAppliesPerHour) {
      const oldestTimestamp = Math.min(...recentApplies);
      const minutesUntilReset = Math.ceil(
        (oldestTimestamp + 60 * 60 * 1000 - now) / (60 * 1000)
      );

      return {
        allowed: false,
        minutesUntilReset,
      };
    }

    return { allowed: true };
  }

  /**
   * Update rate limit after successful queue
   */
  private updateRateLimit(userId: string): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const userTimestamps = this.rateLimitMap.get(userId) || [];
    const recentTimestamps = userTimestamps.filter((ts) => ts > oneHourAgo);
    recentTimestamps.push(now);

    this.rateLimitMap.set(userId, recentTimestamps);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(userId: string): Promise<QueueStats> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const jobs = await supabase.makeRequest(
          `job_queue?user_id=eq.${userId}`
        );

        const stats: QueueStats = {
          queued: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          total: jobs?.length || 0,
        };

        jobs?.forEach((job: any) => {
          if (job.status === "queued") stats.queued++;
          else if (job.status === "processing") stats.processing++;
          else if (job.status === "completed") stats.completed++;
          else if (job.status === "failed") stats.failed++;
        });

        return stats;
      } catch (error) {
        console.warn("Failed to get stats from Supabase:", error);
      }
    }

    // Fallback to local storage
    return this.getLocalStats(userId);
  }

  /**
   * Get all queued jobs for a user
   */
  async getQueuedJobs(userId: string): Promise<JobApplication[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const jobs = await supabase.makeRequest(
          `job_queue?user_id=eq.${userId}&status=eq.queued&order=priority.asc,queued_at.asc`
        );

        return (
          jobs?.map((job: any) => ({
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
            metadata: job.metadata,
          })) || []
        );
      } catch (error) {
        console.warn("Failed to get jobs from Supabase:", error);
      }
    }

    return this.getLocalJobs(userId);
  }

  /**
   * Cancel a queued job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        await supabase.makeRequest(`job_queue?id=eq.${jobId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "cancelled",
            processed_at: new Date().toISOString(),
          }),
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
  private startBackgroundProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing) {
        this.processQueue();
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * Process the job queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Get all queued jobs
      const supabase = getSupabaseClient();
      let queuedJobs: JobApplication[] = [];

      if (supabase) {
        try {
          const jobs = await supabase.makeRequest(
            `job_queue?status=eq.queued&order=priority.asc,queued_at.asc&limit=10`
          );

          queuedJobs =
            jobs?.map((job: any) => ({
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
              metadata: job.metadata,
            })) || [];
        } catch (error) {
          console.warn("Failed to fetch queue from Supabase:", error);
        }
      }

      // Process each job
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
  private async processJob(job: JobApplication): Promise<void> {
    const supabase = getSupabaseClient();

    try {
      // Update status to processing
      if (supabase && job.id) {
        await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "processing" }),
        });
      }

      // Open tab and trigger auto-apply
      const tab = await chrome.tabs.create({ url: job.jobUrl, active: false });

      // Wait for tab to load
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Send auto-apply message
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "autoApply", profile: job.profile },
          async (response: any) => {
            if (response?.status === "success") {
              // Mark as completed
              if (supabase && job.id) {
                await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    status: "completed",
                    processed_at: new Date().toISOString(),
                  }),
                });
              }

              // Close tab after delay
              setTimeout(() => {
                if (tab.id) chrome.tabs.remove(tab.id);
              }, 3000);
            } else {
              // Handle failure
              await this.handleJobFailure(job, response?.message);
            }
          }
        );
      }
    } catch (error: any) {
      console.error("Error processing job:", error);
      await this.handleJobFailure(job, error.message);
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(
    job: JobApplication,
    reason?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();

    if (job.retryCount < job.maxRetries) {
      // Retry
      if (supabase && job.id) {
        await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "queued",
            retry_count: job.retryCount + 1,
            failure_reason: reason,
          }),
        });
      }
    } else {
      // Max retries reached - mark as failed
      if (supabase && job.id) {
        await supabase.makeRequest(`job_queue?id=eq.${job.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "failed",
            processed_at: new Date().toISOString(),
            failure_reason: reason || "Max retries exceeded",
          }),
        });
      }
    }
  }

  /**
   * Local storage fallback methods
   */
  private async saveToLocalStorage(job: JobApplication): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue = result.jobQueue || [];
        queue.push(job);
        chrome.storage.local.set({ jobQueue: queue }, () => resolve());
      });
    });
  }

  private async getLocalStats(userId: string): Promise<QueueStats> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue: JobApplication[] = result.jobQueue || [];
        const userJobs = queue.filter((job) => job.userId === userId);

        const stats: QueueStats = {
          queued: userJobs.filter((j) => j.status === "queued").length,
          processing: userJobs.filter((j) => j.status === "processing").length,
          completed: userJobs.filter((j) => j.status === "completed").length,
          failed: userJobs.filter((j) => j.status === "failed").length,
          total: userJobs.length,
        };

        resolve(stats);
      });
    });
  }

  private async getLocalJobs(userId: string): Promise<JobApplication[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue: JobApplication[] = result.jobQueue || [];
        const userJobs = queue.filter(
          (job) => job.userId === userId && job.status === "queued"
        );
        resolve(userJobs);
      });
    });
  }

  private async cancelLocalJob(jobId: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobQueue"], (result) => {
        const queue: JobApplication[] = result.jobQueue || [];
        const updated = queue.map((job) =>
          job.id === jobId ? { ...job, status: "cancelled" as const } : job
        );
        chrome.storage.local.set({ jobQueue: updated }, () => resolve(true));
      });
    });
  }
}

// Export singleton instance
export const jobQueueService = JobQueueService.getInstance();
