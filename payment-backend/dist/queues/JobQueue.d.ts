import { Queue, Job as BullJob } from 'bullmq';
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
declare class JobQueue {
    private static instance;
    private queue;
    private queueEvents;
    private readonly QUEUE_NAME;
    private constructor();
    static getInstance(): JobQueue;
    private setupEventListeners;
    /**
     * Enqueue a new job application
     */
    enqueue(data: JobApplicationData, options?: JobQueueOptions): Promise<BullJob<JobApplicationData>>;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<{
        status: string;
        progress?: any;
        result?: any;
        failedReason?: string;
    } | null>;
    /**
     * Cancel a job
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * Get queue metrics
     */
    getMetrics(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    /**
     * Pause the queue
     */
    pause(): Promise<void>;
    /**
     * Resume the queue
     */
    resume(): Promise<void>;
    /**
     * Clean old jobs
     */
    clean(grace?: number, status?: 'completed' | 'failed'): Promise<void>;
    /**
     * Close the queue and event listeners
     */
    close(): Promise<void>;
    /**
     * Get the underlying BullMQ queue instance
     */
    getQueue(): Queue<JobApplicationData>;
}
export declare const jobQueue: JobQueue;
export {};
//# sourceMappingURL=JobQueue.d.ts.map