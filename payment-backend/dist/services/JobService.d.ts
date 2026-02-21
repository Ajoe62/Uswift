/**
 * Job Service
 * Handles database operations for job applications
 */
export interface Job {
    id: string;
    userId: string;
    jobUrl: string;
    jobTitle?: string;
    companyName?: string;
    platform: string;
    status: JobStatus;
    priority: number;
    llmInstructions?: any;
    instructionToken?: string;
    instructionExpiresAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    result?: any;
    errorMessage?: string;
    retryCount: number;
    maxRetries: number;
    rateLimitKey?: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
export type JobStatus = 'queued' | 'processing' | 'awaiting_captcha' | 'awaiting_consent' | 'completed' | 'failed' | 'cancelled';
export interface CreateJobParams {
    userId: string;
    jobUrl: string;
    jobTitle?: string;
    companyName?: string;
    platform: string;
    priority?: number;
    metadata?: any;
}
export interface UpdateJobParams {
    status?: JobStatus;
    llmInstructions?: any;
    instructionToken?: string;
    instructionExpiresAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    result?: any;
    errorMessage?: string;
    retryCount?: number;
}
export interface JobAuditLog {
    jobId: string;
    step: string;
    status: 'success' | 'error' | 'warning' | 'info';
    message?: string;
    details?: any;
}
declare class JobService {
    private static instance;
    private constructor();
    static getInstance(): JobService;
    /**
     * Create a new job
     */
    createJob(params: CreateJobParams): Promise<Job>;
    /**
     * Get job by ID
     */
    getJob(jobId: string): Promise<Job | null>;
    /**
     * Get user's jobs
     */
    getUserJobs(userId: string, limit?: number, offset?: number): Promise<Job[]>;
    /**
     * Update job
     */
    updateJob(jobId: string, params: UpdateJobParams): Promise<Job | null>;
    /**
     * Generate and store instruction token
     */
    generateInstructionToken(jobId: string, instructions: any): Promise<string>;
    /**
     * Verify instruction token
     */
    verifyInstructionToken(token: string): {
        valid: boolean;
        jobId?: string;
        instructions?: any;
    };
    /**
     * Add audit log entry
     */
    addAuditLog(log: JobAuditLog): Promise<void>;
    /**
     * Get job audit logs
     */
    getAuditLogs(jobId: string): Promise<any[]>;
    /**
     * Record CAPTCHA event
     */
    recordCaptchaEvent(jobId: string, captchaType: string, captchaUrl?: string): Promise<void>;
    /**
     * Record consent event
     */
    recordConsentRequest(jobId: string, consentType: string): Promise<void>;
    /**
     * Check rate limit
     */
    checkRateLimit(userId: string, limitType: string, limitKey: string, maxCount: number, windowMinutes: number): Promise<{
        allowed: boolean;
        remaining: number;
    }>;
    /**
     * Helper: Convert camelCase to snake_case
     */
    private camelToSnake;
}
export declare const jobService: JobService;
export {};
//# sourceMappingURL=JobService.d.ts.map