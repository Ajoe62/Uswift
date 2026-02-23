import { Queue, QueueEvents, Job as BullJob } from 'bullmq';
import { getRedisConfig } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * BullMQ Job Queue for Auto-Apply
 * Manages the queue of job applications to be processed by LLM workers
 */

export interface JobApplicationData {
  jobId: string;
  userId: string;
  jobUrl: string;
  jobTitle?: string;
  companyName?: string;
  platform: string;
  instructionToken?: string;
  metadata?: Record<string, any>;
}

export interface JobQueueOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

class JobQueue {
  private static instance: JobQueue;
  private queue: Queue<JobApplicationData>;
  private queueEvents: QueueEvents;
  private readonly QUEUE_NAME = 'job-applications';

  private constructor() {
    const redisConfig = getRedisConfig();

    // Initialize queue
    this.queue = new Queue<JobApplicationData>(this.QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5 seconds initial delay
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents(this.QUEUE_NAME, {
      connection: redisConfig,
    });

    this.setupEventListeners();

    logger.info('JobQueue initialized', { queueName: this.QUEUE_NAME });
  }

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  private setupEventListeners(): void {
    // Job completed
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info('Job completed', { jobId, result: returnvalue });
    });

    // Job failed
    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error('Job failed', { jobId, reason: failedReason });
    });

    // Job progress
    this.queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug('Job progress', { jobId, progress: data });
    });

    // Job stalled (worker crashed or timed out)
    this.queueEvents.on('stalled', ({ jobId }) => {
      logger.warn('Job stalled', { jobId });
    });
  }

  /**
   * Enqueue a new job application
   */
  async enqueue(
    data: JobApplicationData,
    options?: JobQueueOptions
  ): Promise<BullJob<JobApplicationData>> {
    try {
      const job = await this.queue.add('process-application', data, {
        priority: options?.priority,
        delay: options?.delay,
        attempts: options?.attempts,
        backoff: options?.backoff,
        jobId: data.jobId, // Use job ID from database as BullMQ job ID
      });

      logger.info('Job enqueued', {
        jobId: job.id,
        userId: data.userId,
        platform: data.platform,
        priority: options?.priority,
      });

      return job;
    } catch (error) {
      logger.error('Failed to enqueue job', { error, data });
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress?: any;
    result?: any;
    failedReason?: string;
  } | null> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress;
      const returnValue = job.returnvalue;
      const failedReason = job.failedReason;

      return {
        status: state,
        progress,
        result: returnValue,
        failedReason,
      };
    } catch (error) {
      logger.error('Failed to get job status', { error, jobId });
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        logger.warn('Job not found for cancellation', { jobId });
        return false;
      }

      await job.remove();
      logger.info('Job cancelled', { jobId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel job', { error, jobId });
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  async getMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount(),
      ]);

      return { waiting, active, completed, failed, delayed };
    } catch (error) {
      logger.error('Failed to get queue metrics', { error });
      throw error;
    }
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Clean old jobs
   */
  async clean(grace: number = 86400000, status: 'completed' | 'failed' = 'completed'): Promise<void> {
    const jobs = await this.queue.clean(grace, 1000, status);
    logger.info('Queue cleaned', { status, jobsRemoved: jobs.length });
  }

  /**
   * Close the queue and event listeners
   */
  async close(): Promise<void> {
    await this.queue.close();
    await this.queueEvents.close();
    logger.info('JobQueue closed');
  }

  /**
   * Get the underlying BullMQ queue instance
   */
  getQueue(): Queue<JobApplicationData> {
    return this.queue;
  }
}

export const jobQueue = JobQueue.getInstance();
