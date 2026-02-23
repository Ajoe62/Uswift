"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const JobService_1 = require("../services/JobService");
const logger_1 = require("../utils/logger");
/**
 * Job Worker
 * Processes job applications with LLM orchestration
 *
 * This worker:
 * 1. Analyzes the job page using LLM
 * 2. Generates fill instructions
 * 3. Creates signed instruction token
 * 4. Waits for extension to fetch and execute
 */
class JobWorker {
    static instance;
    worker;
    constructor() {
        const redisConfig = (0, redis_1.getRedisConfig)();
        this.worker = new bullmq_1.Worker('job-applications', async (job) => {
            return await this.processJob(job);
        }, {
            connection: redisConfig,
            concurrency: 5, // Process up to 5 jobs concurrently
            limiter: {
                max: 10, // Max 10 jobs
                duration: 60000, // per 60 seconds (rate limiting)
            },
        });
        this.setupWorkerEventListeners();
        logger_1.logger.info('JobWorker initialized', { concurrency: 5 });
    }
    static getInstance() {
        if (!JobWorker.instance) {
            JobWorker.instance = new JobWorker();
        }
        return JobWorker.instance;
    }
    setupWorkerEventListeners() {
        this.worker.on('completed', (job) => {
            logger_1.logger.info('Worker completed job', { jobId: job.id });
        });
        this.worker.on('failed', (job, err) => {
            logger_1.logger.error('Worker failed job', {
                jobId: job?.id,
                error: err.message,
            });
        });
        this.worker.on('error', (err) => {
            logger_1.logger.error('Worker error', { error: err });
        });
        this.worker.on('stalled', (jobId) => {
            logger_1.logger.warn('Worker job stalled', { jobId });
        });
    }
    /**
     * Process a job application
     */
    async processJob(job) {
        const { jobId, userId, jobUrl, platform, metadata } = job.data;
        logger_1.logger.info('Processing job', { jobId, userId, platform, jobUrl });
        try {
            // Update job status to processing
            await JobService_1.jobService.updateJob(jobId, {
                status: 'processing',
                startedAt: new Date(),
            });
            await JobService_1.jobService.addAuditLog({
                jobId,
                step: 'processing_started',
                status: 'info',
                message: 'Job processing started',
            });
            // Step 1: Analyze job page with LLM
            await job.updateProgress(10);
            await JobService_1.jobService.addAuditLog({
                jobId,
                step: 'llm_analysis_started',
                status: 'info',
                message: 'Analyzing job page with LLM',
            });
            const analysis = await this.analyzJobPage(jobUrl, platform, metadata);
            // Step 2: Generate fill instructions
            await job.updateProgress(40);
            await JobService_1.jobService.addAuditLog({
                jobId,
                step: 'instructions_generating',
                status: 'info',
                message: 'Generating fill instructions',
            });
            const instructions = await this.generateInstructions(analysis, userId, platform);
            // Step 3: Create signed instruction token
            await job.updateProgress(60);
            const token = await JobService_1.jobService.generateInstructionToken(jobId, instructions);
            await JobService_1.jobService.addAuditLog({
                jobId,
                step: 'instructions_generated',
                status: 'success',
                message: 'Instructions generated and signed',
                details: {
                    fieldCount: instructions.fields?.length || 0,
                    hasFileUploads: instructions.fileUploads?.length > 0,
                },
            });
            // Step 4: Job is now ready for extension to poll
            await job.updateProgress(80);
            await JobService_1.jobService.updateJob(jobId, {
                status: 'queued', // Back to queued, awaiting extension pickup
                llmInstructions: instructions,
            });
            await JobService_1.jobService.addAuditLog({
                jobId,
                step: 'awaiting_extension',
                status: 'info',
                message: 'Awaiting extension to fetch instructions',
            });
            // Step 5: Return result
            await job.updateProgress(100);
            return {
                success: true,
                jobId,
                instructionToken: token,
                message: 'Instructions ready for extension',
            };
        }
        catch (error) {
            logger_1.logger.error('Job processing failed', {
                jobId,
                error: error.message,
                stack: error.stack,
            });
            // Update job as failed
            await JobService_1.jobService.updateJob(jobId, {
                status: 'failed',
                failedAt: new Date(),
                errorMessage: error.message,
            });
            await JobService_1.jobService.addAuditLog({
                jobId,
                step: 'failed',
                status: 'error',
                message: `Job processing failed: ${error.message}`,
                details: { error: error.stack },
            });
            throw error;
        }
    }
    /**
     * Analyze job page using LLM
     * TODO: Integrate with actual LLM (Mistral AI, OpenAI, etc.)
     */
    async analyzJobPage(jobUrl, platform, metadata) {
        // Placeholder for LLM analysis
        // In production, this would:
        // 1. Fetch the job page content
        // 2. Send to LLM for analysis
        // 3. Extract job requirements, form fields, etc.
        logger_1.logger.info('Analyzing job page', { jobUrl, platform });
        // Simulate LLM analysis delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
            platform,
            jobUrl,
            detectedFields: [
                'firstName',
                'lastName',
                'email',
                'phone',
                'resume',
                'coverLetter',
            ],
            formType: this.detectFormType(platform),
            requiresCaptcha: Math.random() > 0.9, // 10% chance
            complexity: 'medium',
            metadata,
        };
    }
    /**
     * Generate fill instructions from analysis
     * TODO: Enhance with actual user profile data
     */
    async generateInstructions(analysis, userId, platform) {
        logger_1.logger.info('Generating instructions', { userId, platform });
        // In production, fetch user profile and generate personalized instructions
        // For now, return a template
        const instructions = {
            platform,
            formType: analysis.formType,
            fields: analysis.detectedFields.map((field) => ({
                name: field,
                selector: this.getFieldSelector(field, platform),
                value: this.getPlaceholderValue(field),
                type: this.getFieldType(field),
                required: true,
            })),
            fileUploads: [
                {
                    name: 'resume',
                    selector: this.getFileUploadSelector('resume', platform),
                    required: true,
                },
            ],
            actions: [
                {
                    type: 'fill',
                    order: 1,
                },
                {
                    type: 'preview',
                    order: 2,
                    requiresConsent: true,
                },
                {
                    type: 'submit',
                    order: 3,
                    requiresConsent: true,
                    selector: this.getSubmitSelector(platform),
                },
            ],
            safetyChecks: {
                detectCaptcha: true,
                requirePreviewConsent: true,
                requireSubmitConsent: true,
                validateFieldsFilled: true,
            },
        };
        return instructions;
    }
    /**
     * Detect form type based on platform
     */
    detectFormType(platform) {
        const formTypes = {
            linkedin: 'linkedin_easy_apply',
            greenhouse: 'greenhouse_standard',
            lever: 'lever_standard',
            workday: 'workday_complex',
            indeed: 'indeed_standard',
        };
        return formTypes[platform.toLowerCase()] || 'generic';
    }
    /**
     * Get field selector for platform
     */
    getFieldSelector(field, platform) {
        // Platform-specific selectors
        // In production, these would be more sophisticated
        const selectors = {
            linkedin: {
                firstName: 'input[name="firstName"]',
                lastName: 'input[name="lastName"]',
                email: 'input[type="email"]',
                phone: 'input[type="tel"]',
            },
            greenhouse: {
                firstName: '#first_name',
                lastName: '#last_name',
                email: '#email',
                phone: '#phone',
            },
        };
        return selectors[platform]?.[field] || `input[name="${field}"]`;
    }
    /**
     * Get submit button selector for platform
     */
    getSubmitSelector(platform) {
        const selectors = {
            linkedin: 'button[aria-label="Submit application"]',
            greenhouse: 'input[type="submit"]',
            lever: 'button[type="submit"]',
        };
        return selectors[platform] || 'button[type="submit"]';
    }
    /**
     * Get file upload selector
     */
    getFileUploadSelector(fileType, platform) {
        return `input[type="file"][name*="${fileType}"]`;
    }
    /**
     * Get placeholder value for field
     */
    getPlaceholderValue(field) {
        const values = {
            firstName: '{{user.firstName}}',
            lastName: '{{user.lastName}}',
            email: '{{user.email}}',
            phone: '{{user.phone}}',
        };
        return values[field] || `{{user.${field}}}`;
    }
    /**
     * Get field type
     */
    getFieldType(field) {
        const types = {
            email: 'email',
            phone: 'tel',
            resume: 'file',
            coverLetter: 'file',
        };
        return types[field] || 'text';
    }
    /**
     * Close the worker
     */
    async close() {
        await this.worker.close();
        logger_1.logger.info('JobWorker closed');
    }
    /**
     * Get the worker instance
     */
    getWorker() {
        return this.worker;
    }
}
exports.jobWorker = JobWorker.getInstance();
//# sourceMappingURL=JobWorker.js.map