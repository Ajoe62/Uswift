import express, { Request, Response } from 'express';
import { jobService } from '../services/JobService';
import { jobQueue } from '../queues/JobQueue';
import { authenticateExtension } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = express.Router();

/**
 * Job Routes
 * API endpoints for job application queue management
 */

// Validation schemas
const enqueueJobSchema = z.object({
  jobUrl: z.string().url(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  platform: z.string().min(1),
  priority: z.number().int().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/jobs/enqueue
 * Enqueue a new job application
 */
router.post('/enqueue', authenticateExtension, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Validate request body
    const validationResult = enqueueJobSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { jobUrl, jobTitle, companyName, platform, priority, metadata } =
      validationResult.data;

    // Check rate limits
    const rateLimitKey = companyName
      ? companyName.toLowerCase()
      : platform.toLowerCase();

    const hourlyLimit = await jobService.checkRateLimit(
      userId,
      'per_hour',
      rateLimitKey,
      10, // Max 10 per hour
      60
    );

    if (!hourlyLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many job applications. Please try again later.',
        retryAfter: 3600, // 1 hour in seconds
      });
    }

    const dailyLimit = await jobService.checkRateLimit(
      userId,
      'per_day',
      'global',
      50, // Max 50 per day
      1440
    );

    if (!dailyLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Daily job application limit reached.',
        retryAfter: 86400, // 24 hours in seconds
      });
    }

    // Create job in database
    const job = await jobService.createJob({
      userId,
      jobUrl,
      jobTitle,
      companyName,
      platform,
      priority,
      metadata,
    });

    // Enqueue job in BullMQ
    await jobQueue.enqueue(
      {
        jobId: job.id,
        userId,
        jobUrl,
        jobTitle,
        companyName,
        platform,
        metadata,
      },
      {
        priority,
        attempts: 3,
      }
    );

    logger.info('Job enqueued via API', {
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
  } catch (error: any) {
    logger.error('Failed to enqueue job', { error, body: req.body });
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
router.get('/:jobId', authenticateExtension, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).userId;

    // Get job from database
    const job = await jobService.getJob(jobId);

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
    const queueStatus = await jobQueue.getJobStatus(jobId);

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
  } catch (error: any) {
    logger.error('Failed to get job', { error, jobId: req.params.jobId });
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
router.get(
  '/:jobId/instructions',
  authenticateExtension,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = (req as any).userId;

      const job = await jobService.getJob(jobId);

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
      const verification = jobService.verifyInstructionToken(job.instructionToken);

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
    } catch (error: any) {
      logger.error('Failed to get job instructions', {
        error,
        jobId: req.params.jobId,
      });
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
);

/**
 * GET /api/jobs
 * Get user's jobs (paginated)
 */
router.get('/', authenticateExtension, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const jobs = await jobService.getUserJobs(userId, limit, offset);

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
  } catch (error: any) {
    logger.error('Failed to get user jobs', { error });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/jobs/:jobId
 * Cancel a job
 */
router.delete('/:jobId', authenticateExtension, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).userId;

    const job = await jobService.getJob(jobId);

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
    await jobQueue.cancelJob(jobId);

    // Update database
    await jobService.updateJob(jobId, {
      status: 'cancelled',
    });

    await jobService.addAuditLog({
      jobId,
      step: 'cancelled',
      status: 'info',
      message: 'Job cancelled by user',
    });

    logger.info('Job cancelled via API', { jobId, userId });

    res.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  } catch (error: any) {
    logger.error('Failed to cancel job', { error, jobId: req.params.jobId });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/jobs/:jobId/logs
 * Get job audit logs
 */
router.get('/:jobId/logs', authenticateExtension, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).userId;

    const job = await jobService.getJob(jobId);

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

    const logs = await jobService.getAuditLogs(jobId);

    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    logger.error('Failed to get job logs', { error, jobId: req.params.jobId });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/jobs/queue/metrics
 * Get queue metrics (admin or user-specific)
 */
router.get('/queue/metrics', authenticateExtension, async (req: Request, res: Response) => {
  try {
    const metrics = await jobQueue.getMetrics();

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    logger.error('Failed to get queue metrics', { error });
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
