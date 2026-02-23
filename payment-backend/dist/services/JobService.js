"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
class JobService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!JobService.instance) {
            JobService.instance = new JobService();
        }
        return JobService.instance;
    }
    /**
     * Create a new job
     */
    async createJob(params) {
        try {
            const id = (0, uuid_1.v4)();
            const rateLimitKey = params.companyName
                ? `company:${params.companyName.toLowerCase()}`
                : `platform:${params.platform}`;
            const result = await database_1.db.query(`
        INSERT INTO jobs (
          id, user_id, job_url, job_title, company_name, platform,
          priority, rate_limit_key, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `, [
                id,
                params.userId,
                params.jobUrl,
                params.jobTitle,
                params.companyName,
                params.platform,
                params.priority || 0,
                rateLimitKey,
                JSON.stringify(params.metadata || {}),
            ]);
            const job = result.rows[0];
            // Log audit event
            await this.addAuditLog({
                jobId: id,
                step: 'enqueued',
                status: 'info',
                message: 'Job created and enqueued',
                details: { platform: params.platform },
            });
            logger_1.logger.info('Job created', { jobId: id, userId: params.userId });
            return job;
        }
        catch (error) {
            logger_1.logger.error('Failed to create job', { error, params });
            throw error;
        }
    }
    /**
     * Get job by ID
     */
    async getJob(jobId) {
        try {
            const result = await database_1.db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get job', { error, jobId });
            throw error;
        }
    }
    /**
     * Get user's jobs
     */
    async getUserJobs(userId, limit = 50, offset = 0) {
        try {
            const result = await database_1.db.query(`
        SELECT * FROM jobs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user jobs', { error, userId });
            throw error;
        }
    }
    /**
     * Update job
     */
    async updateJob(jobId, params) {
        try {
            const updates = [];
            const values = [];
            let paramIndex = 1;
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    const snakeKey = this.camelToSnake(key);
                    updates.push(`${snakeKey} = $${paramIndex}`);
                    values.push(typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : value);
                    paramIndex++;
                }
            });
            if (updates.length === 0) {
                return await this.getJob(jobId);
            }
            values.push(jobId);
            const result = await database_1.db.query(`
        UPDATE jobs
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `, values);
            logger_1.logger.info('Job updated', { jobId, updates: Object.keys(params) });
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to update job', { error, jobId, params });
            throw error;
        }
    }
    /**
     * Generate and store instruction token
     */
    async generateInstructionToken(jobId, instructions) {
        try {
            const secret = process.env.EXTENSION_TOKEN_SECRET || 'change-me-in-production';
            const expiresIn = '1h'; // Token valid for 1 hour
            const token = jsonwebtoken_1.default.sign({
                jobId,
                instructions,
                type: 'job_instructions',
            }, secret, { expiresIn });
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await this.updateJob(jobId, {
                instructionToken: token,
                instructionExpiresAt: expiresAt,
                llmInstructions: instructions,
            });
            logger_1.logger.info('Instruction token generated', { jobId });
            return token;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate instruction token', { error, jobId });
            throw error;
        }
    }
    /**
     * Verify instruction token
     */
    verifyInstructionToken(token) {
        try {
            const secret = process.env.EXTENSION_TOKEN_SECRET || 'change-me-in-production';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (decoded.type !== 'job_instructions') {
                return { valid: false };
            }
            return {
                valid: true,
                jobId: decoded.jobId,
                instructions: decoded.instructions,
            };
        }
        catch (error) {
            logger_1.logger.warn('Invalid instruction token', { error });
            return { valid: false };
        }
    }
    /**
     * Add audit log entry
     */
    async addAuditLog(log) {
        try {
            await database_1.db.query(`
        INSERT INTO job_audit_logs (job_id, step, status, message, details)
        VALUES ($1, $2, $3, $4, $5)
        `, [
                log.jobId,
                log.step,
                log.status,
                log.message,
                JSON.stringify(log.details || {}),
            ]);
        }
        catch (error) {
            logger_1.logger.error('Failed to add audit log', { error, log });
            // Don't throw - audit logs shouldn't break main flow
        }
    }
    /**
     * Get job audit logs
     */
    async getAuditLogs(jobId) {
        try {
            const result = await database_1.db.query(`
        SELECT * FROM job_audit_logs
        WHERE job_id = $1
        ORDER BY created_at ASC
        `, [jobId]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to get audit logs', { error, jobId });
            throw error;
        }
    }
    /**
     * Record CAPTCHA event
     */
    async recordCaptchaEvent(jobId, captchaType, captchaUrl) {
        try {
            await database_1.db.query(`
        INSERT INTO job_captcha_events (job_id, captcha_type, captcha_url)
        VALUES ($1, $2, $3)
        `, [jobId, captchaType, captchaUrl]);
            await this.updateJob(jobId, { status: 'awaiting_captcha' });
            await this.addAuditLog({
                jobId,
                step: 'captcha_detected',
                status: 'warning',
                message: `CAPTCHA detected: ${captchaType}`,
                details: { captchaType, captchaUrl },
            });
            logger_1.logger.info('CAPTCHA event recorded', { jobId, captchaType });
        }
        catch (error) {
            logger_1.logger.error('Failed to record CAPTCHA event', { error, jobId });
            throw error;
        }
    }
    /**
     * Record consent event
     */
    async recordConsentRequest(jobId, consentType) {
        try {
            await database_1.db.query(`
        INSERT INTO job_consent_events (job_id, consent_type)
        VALUES ($1, $2)
        `, [jobId, consentType]);
            await this.updateJob(jobId, { status: 'awaiting_consent' });
            await this.addAuditLog({
                jobId,
                step: 'consent_requested',
                status: 'info',
                message: `User consent requested: ${consentType}`,
                details: { consentType },
            });
            logger_1.logger.info('Consent request recorded', { jobId, consentType });
        }
        catch (error) {
            logger_1.logger.error('Failed to record consent request', { error, jobId });
            throw error;
        }
    }
    /**
     * Check rate limit
     */
    async checkRateLimit(userId, limitType, limitKey, maxCount, windowMinutes) {
        try {
            const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
            const windowEnd = new Date();
            // Get or create rate limit record
            const result = await database_1.db.query(`
        INSERT INTO job_rate_limits (user_id, limit_type, limit_key, window_start, window_end, count, max_count)
        VALUES ($1, $2, $3, $4, $5, 1, $6)
        ON CONFLICT (user_id, limit_type, limit_key, window_start)
        DO UPDATE SET count = job_rate_limits.count + 1
        RETURNING count, max_count
        `, [userId, limitType, limitKey, windowStart, windowEnd, maxCount]);
            const { count, max_count } = result.rows[0];
            const allowed = count <= max_count;
            const remaining = Math.max(0, max_count - count);
            logger_1.logger.debug('Rate limit check', {
                userId,
                limitType,
                limitKey,
                count,
                maxCount,
                allowed,
            });
            return { allowed, remaining };
        }
        catch (error) {
            logger_1.logger.error('Failed to check rate limit', { error, userId });
            // On error, allow the request (fail open)
            return { allowed: true, remaining: maxCount };
        }
    }
    /**
     * Helper: Convert camelCase to snake_case
     */
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    }
}
exports.jobService = JobService.getInstance();
//# sourceMappingURL=JobService.js.map