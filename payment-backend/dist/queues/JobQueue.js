"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class JobQueue {
    static instance;
    queue;
    queueEvents;
    QUEUE_NAME = 'job-applications';
    constructor() {
        const redisConfig = (0, redis_1.getRedisConfig)();
        // Initialize queue
        this.queue = new bullmq_1.Queue(this.QUEUE_NAME, {
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
        this.queueEvents = new bullmq_1.QueueEvents(this.QUEUE_NAME, {
            connection: redisConfig,
        });
        this.setupEventListeners();
        logger_1.logger.info('JobQueue initialized', { queueName: this.QUEUE_NAME });
    }
    static getInstance() {
        if (!JobQueue.instance) {
            JobQueue.instance = new JobQueue();
        }
        return JobQueue.instance;
    }
    setupEventListeners() {
        // Job completed
        this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
            logger_1.logger.info('Job completed', { jobId, result: returnvalue });
        });
        // Job failed
        this.queueEvents.on('failed', ({ jobId, failedReason }) => {
            logger_1.logger.error('Job failed', { jobId, reason: failedReason });
        });
        // Job progress
        this.queueEvents.on('progress', ({ jobId, data }) => {
            logger_1.logger.debug('Job progress', { jobId, progress: data });
        });
        // Job stalled (worker crashed or timed out)
        this.queueEvents.on('stalled', ({ jobId }) => {
            logger_1.logger.warn('Job stalled', { jobId });
        });
    }
    /**
     * Enqueue a new job application
     */
    async enqueue(data, options) {
        try {
            const job = await this.queue.add('process-application', data, {
                priority: options?.priority,
                delay: options?.delay,
                attempts: options?.attempts,
                backoff: options?.backoff,
                jobId: data.jobId, // Use job ID from database as BullMQ job ID
            });
            logger_1.logger.info('Job enqueued', {
                jobId: job.id,
                userId: data.userId,
                platform: data.platform,
                priority: options?.priority,
            });
            return job;
        }
        catch (error) {
            logger_1.logger.error('Failed to enqueue job', { error, data });
            throw error;
        }
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get job status', { error, jobId });
            throw error;
        }
    }
    /**
     * Cancel a job
     */
    async cancelJob(jobId) {
        try {
            const job = await this.queue.getJob(jobId);
            if (!job) {
                logger_1.logger.warn('Job not found for cancellation', { jobId });
                return false;
            }
            await job.remove();
            logger_1.logger.info('Job cancelled', { jobId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel job', { error, jobId });
            throw error;
        }
    }
    /**
     * Get queue metrics
     */
    async getMetrics() {
        try {
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                this.queue.getWaitingCount(),
                this.queue.getActiveCount(),
                this.queue.getCompletedCount(),
                this.queue.getFailedCount(),
                this.queue.getDelayedCount(),
            ]);
            return { waiting, active, completed, failed, delayed };
        }
        catch (error) {
            logger_1.logger.error('Failed to get queue metrics', { error });
            throw error;
        }
    }
    /**
     * Pause the queue
     */
    async pause() {
        await this.queue.pause();
        logger_1.logger.info('Queue paused');
    }
    /**
     * Resume the queue
     */
    async resume() {
        await this.queue.resume();
        logger_1.logger.info('Queue resumed');
    }
    /**
     * Clean old jobs
     */
    async clean(grace = 86400000, status = 'completed') {
        const jobs = await this.queue.clean(grace, 1000, status);
        logger_1.logger.info('Queue cleaned', { status, jobsRemoved: jobs.length });
    }
    /**
     * Close the queue and event listeners
     */
    async close() {
        await this.queue.close();
        await this.queueEvents.close();
        logger_1.logger.info('JobQueue closed');
    }
    /**
     * Get the underlying BullMQ queue instance
     */
    getQueue() {
        return this.queue;
    }
}
exports.jobQueue = JobQueue.getInstance();
//# sourceMappingURL=JobQueue.js.map