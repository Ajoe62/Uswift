"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobService_1 = require("../services/JobService");
const JobQueue_1 = require("../queues/JobQueue");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const router = express_1.default.Router();
/**
 * Job Routes
 * API endpoints for job application queue management
 */
// Validation schemas
const enqueueJobSchema = zod_1.z.object({
    jobUrl: zod_1.z.string().url(),
    jobTitle: zod_1.z.string().optional(),
    companyName: zod_1.z.string().optional(),
    platform: zod_1.z.string().min(1),
    priority: zod_1.z.number().int().min(0).max(100).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
/**
 * POST /api/jobs/enqueue
 * Enqueue a new job application
 */
router.post('/enqueue', auth_1.authenticateExtension, async (req, res) => {
    try {
        const userId = req.userId;
        // Validate request body
        const validationResult = enqueueJobSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.errors,
            });
        }
        const { jobUrl, jobTitle, companyName, platform, priority, metadata } = validationResult.data;
        // Check rate limits
        const rateLimitKey = companyName
            ? companyName.toLowerCase()
            : platform.toLowerCase();
        const hourlyLimit = await JobService_1.jobService.checkRateLimit(userId, 'per_hour', rateLimitKey, 10, // Max 10 per hour
        60);
        if (!hourlyLimit.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many job applications. Please try again later.',
                retryAfter: 3600, // 1 hour in seconds
            });
        }
        const dailyLimit = await JobService_1.jobService.checkRateLimit(userId, 'per_day', 'global', 50, // Max 50 per day
        1440);
        if (!dailyLimit.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Daily job application limit reached.',
                retryAfter: 86400, // 24 hours in seconds
            });
        }
        // Create job in database
        const job = await JobService_1.jobService.createJob({
            userId,
            jobUrl,
            jobTitle,
            companyName,
            platform,
            priority,
            metadata,
        });
        // Enqueue job in BullMQ
        await JobQueue_1.jobQueue.enqueue({
            jobId: job.id,
            userId,
            jobUrl,
            jobTitle,
            companyName,
            platform,
            metadata,
        }, {
            priority,
            attempts: 3,
        });
        logger_1.logger.info('Job enqueued via API', {
            jobId: job.id,
            userId,
            platform,
        });
        res.status(201).json({
            success: true,
            job: {
                id: job.id,
                status: job.status,
                jobUrl: job.jobUrl,
                platform: job.platform,
                createdAt: job.createdAt,
            },
            rateLimits: {
                hourly: {
                    remaining: hourlyLimit.remaining,
                },
                daily: {
                    remaining: dailyLimit.remaining,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to enqueue job', { error, body: req.body });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to enqueue job application',
        });
    }
});
/**
 * GET /api/jobs/:jobId
 * Get job status and details
 */
router.get('/:jobId', auth_1.authenticateExtension, async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;
        // Get job from database
        const job = await JobService_1.jobService.getJob(jobId);
        if (!job) {
            return res.status(404).json({
                error: 'Job not found',
            });
        }
        // Verify user owns this job
        if (job.userId !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have access to this job',
            });
        }
        // Get queue status
        const queueStatus = await JobQueue_1.jobQueue.getJobStatus(jobId);
        res.json({
            success: true,
            job: {
                id: job.id,
                jobUrl: job.jobUrl,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                platform: job.platform,
                status: job.status,
                priority: job.priority,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                failedAt: job.failedAt,
                result: job.result,
                errorMessage: job.errorMessage,
                retryCount: job.retryCount,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            },
            queueStatus: queueStatus
                ? {
                    status: queueStatus.status,
                    progress: queueStatus.progress,
                }
                : null,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get job', { error, jobId: req.params.jobId });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve job',
        });
    }
});
/**
 * GET /api/jobs/:jobId/instructions
 * Get LLM-generated instructions for a job (secured with token)
 */
router.get('/:jobId/instructions', auth_1.authenticateExtension, async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;
        const job = await JobService_1.jobService.getJob(jobId);
        if (!job) {
            return res.status(404).json({
                error: 'Job not found',
            });
        }
        if (job.userId !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
            });
        }
        // Check if instruction token exists and is valid
        if (!job.instructionToken) {
            return res.status(404).json({
                error: 'Instructions not yet generated',
                message: 'Job is still being processed',
            });
        }
        // Verify token
        const verification = JobService_1.jobService.verifyInstructionToken(job.instructionToken);
        if (!verification.valid) {
            return res.status(401).json({
                error: 'Invalid or expired token',
                message: 'Instructions have expired, please retry the job',
            });
        }
        res.json({
            success: true,
            instructions: verification.instructions,
            token: job.instructionToken,
            expiresAt: job.instructionExpiresAt,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get job instructions', {
            error,
            jobId: req.params.jobId,
        });
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});
/**
 * GET /api/jobs
 * Get user's jobs (paginated)
 */
router.get('/', auth_1.authenticateExtension, async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const jobs = await JobService_1.jobService.getUserJobs(userId, limit, offset);
        res.json({
            success: true,
            jobs: jobs.map((job) => ({
                id: job.id,
                jobUrl: job.jobUrl,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                platform: job.platform,
                status: job.status,
                createdAt: job.createdAt,
                completedAt: job.completedAt,
            })),
            pagination: {
                limit,
                offset,
                total: jobs.length,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user jobs', { error });
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});
/**
 * DELETE /api/jobs/:jobId
 * Cancel a job
 */
router.delete('/:jobId', auth_1.authenticateExtension, async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;
        const job = await JobService_1.jobService.getJob(jobId);
        if (!job) {
            return res.status(404).json({
                error: 'Job not found',
            });
        }
        if (job.userId !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
            });
        }
        // Can only cancel queued or processing jobs
        if (!['queued', 'processing', 'awaiting_captcha', 'awaiting_consent'].includes(job.status)) {
            return res.status(400).json({
                error: 'Cannot cancel job',
                message: 'Job has already completed or failed',
            });
        }
        // Cancel in queue
        await JobQueue_1.jobQueue.cancelJob(jobId);
        // Update database
        await JobService_1.jobService.updateJob(jobId, {
            status: 'cancelled',
        });
        await JobService_1.jobService.addAuditLog({
            jobId,
            step: 'cancelled',
            status: 'info',
            message: 'Job cancelled by user',
        });
        logger_1.logger.info('Job cancelled via API', { jobId, userId });
        res.json({
            success: true,
            message: 'Job cancelled successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel job', { error, jobId: req.params.jobId });
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});
/**
 * GET /api/jobs/:jobId/logs
 * Get job audit logs
 */
router.get('/:jobId/logs', auth_1.authenticateExtension, async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;
        const job = await JobService_1.jobService.getJob(jobId);
        if (!job) {
            return res.status(404).json({
                error: 'Job not found',
            });
        }
        if (job.userId !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
            });
        }
        const logs = await JobService_1.jobService.getAuditLogs(jobId);
        res.json({
            success: true,
            logs,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get job logs', { error, jobId: req.params.jobId });
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});
/**
 * GET /api/jobs/queue/metrics
 * Get queue metrics (admin or user-specific)
 */
router.get('/queue/metrics', auth_1.authenticateExtension, async (req, res) => {
    try {
        const metrics = await JobQueue_1.jobQueue.getMetrics();
        res.json({
            success: true,
            metrics,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get queue metrics', { error });
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map