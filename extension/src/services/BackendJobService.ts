/**
 * Backend Job Service for Extension
 * Handles communication with the payment backend job queue API
 * This integrates with the BullMQ-based job queue system
 */

interface JobData {
  jobUrl: string;
  jobTitle?: string;
  companyName?: string;
  platform: string;
  priority?: number;
  metadata?: Record<string, any>;
}

interface Job {
  id: string;
  jobUrl: string;
  jobTitle?: string;
  companyName?: string;
  platform: string;
  status: string;
  priority: number;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  result?: any;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface JobInstructions {
  platform: string;
  formType: string;
  fields: Array<{
    name: string;
    selector: string;
    value: string;
    type: string;
    required: boolean;
  }>;
  fileUploads: Array<{
    name: string;
    selector: string;
    required: boolean;
  }>;
  actions: Array<{
    type: string;
    order: number;
    requiresConsent?: boolean;
    selector?: string;
  }>;
  safetyChecks: {
    detectCaptcha: boolean;
    requirePreviewConsent: boolean;
    requireSubmitConsent: boolean;
    validateFieldsFilled: boolean;
  };
}

export class BackendJobService {
  private static instance: BackendJobService;
  private apiUrl: string;
  private pollingIntervals: Map<string, number> = new Map();

  private constructor() {
    // Use the payment backend URL from Vite environment or config
    this.apiUrl =
      import.meta.env.VITE_BACKEND_API_URL ||
      'http://localhost:3000';
  }

  static getInstance(): BackendJobService {
    if (!BackendJobService.instance) {
      BackendJobService.instance = new BackendJobService();
    }
    return BackendJobService.instance;
  }

  /**
   * Get auth token from extension storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(['authToken']);
      return result.authToken || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Enqueue a new job
   */
  async enqueueJob(jobData: JobData): Promise<{ success: boolean; job?: Job; error?: string }> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${this.apiUrl}/api/jobs/enqueue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Failed to enqueue job',
        };
      }

      const data = await response.json();
      console.log('Job enqueued:', data.job);

      // Start polling for this job
      this.startPolling(data.job.id);

      return { success: true, job: data.job };
    } catch (error: any) {
      console.error('Failed to enqueue job:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{ success: boolean; job?: Job; error?: string }> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${this.apiUrl}/api/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Failed to get job status',
        };
      }

      const data = await response.json();
      return { success: true, job: data.job };
    } catch (error: any) {
      console.error('Failed to get job status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job instructions
   */
  async getJobInstructions(
    jobId: string
  ): Promise<{ success: boolean; instructions?: JobInstructions; token?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${this.apiUrl}/api/jobs/${jobId}/instructions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Failed to get instructions',
        };
      }

      const data = await response.json();
      return {
        success: true,
        instructions: data.instructions,
        token: data.token,
      };
    } catch (error: any) {
      console.error('Failed to get job instructions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all user jobs
   */
  async getUserJobs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${this.apiUrl}/api/jobs?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Failed to get jobs',
        };
      }

      const data = await response.json();
      return { success: true, jobs: data.jobs };
    } catch (error: any) {
      console.error('Failed to get user jobs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${this.apiUrl}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Failed to cancel job',
        };
      }

      // Stop polling for this job
      this.stopPolling(jobId);

      return { success: true };
    } catch (error: any) {
      console.error('Failed to cancel job:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start polling for job updates
   */
  private startPolling(jobId: string, intervalMs: number = 5000): void {
    // Don't start if already polling
    if (this.pollingIntervals.has(jobId)) {
      return;
    }

    console.log(`Starting to poll job ${jobId} every ${intervalMs}ms`);

    const intervalId = window.setInterval(async () => {
      const { success, job, error } = await this.getJobStatus(jobId);

      if (!success) {
        console.error(`Polling failed for job ${jobId}:`, error);
        return;
      }

      if (!job) {
        return;
      }

      console.log(`Job ${jobId} status: ${job.status}`);

      // Notify extension of status update via Chrome runtime messaging
      try {
        chrome.runtime.sendMessage({
          type: 'JOB_STATUS_UPDATE',
          jobId,
          status: job.status,
          job,
        });
      } catch (e) {
        // Ignore errors from closed contexts
      }

      // If job has instructions ready, fetch them
      if (job.status === 'queued' && job.startedAt) {
        const instructionsResult = await this.getJobInstructions(jobId);

        if (instructionsResult.success && instructionsResult.instructions) {
          try {
            chrome.runtime.sendMessage({
              type: 'JOB_INSTRUCTIONS_READY',
              jobId,
              instructions: instructionsResult.instructions,
              token: instructionsResult.token,
            });
          } catch (e) {
            // Ignore errors
          }

          // Execute the job in content script
          this.executeJob(jobId, instructionsResult.instructions);
        }
      }

      // Stop polling if job is in terminal state
      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        console.log(`Job ${jobId} reached terminal state: ${job.status}`);
        this.stopPolling(jobId);
      }
    }, intervalMs);

    this.pollingIntervals.set(jobId, intervalId);
  }

  /**
   * Stop polling for a job
   */
  private stopPolling(jobId: string): void {
    const intervalId = this.pollingIntervals.get(jobId);

    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(jobId);
      console.log(`Stopped polling for job ${jobId}`);
    }
  }

  /**
   * Execute job in content script
   */
  private async executeJob(jobId: string, instructions: JobInstructions): Promise<void> {
    try {
      // Send message to content script to execute
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        console.error('No active tab found');
        return;
      }

      chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_JOB',
        jobId,
        instructions,
      });

      console.log('Job execution request sent to content script');
    } catch (error) {
      console.error('Failed to execute job:', error);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.pollingIntervals.clear();
    console.log('Stopped all job polling');
  }
}

export const backendJobService = BackendJobService.getInstance();
