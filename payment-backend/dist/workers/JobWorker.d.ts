import { Worker } from 'bullmq';
import type { JobApplicationData } from '../queues/JobQueue';
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
declare class JobWorker {
    private static instance;
    private worker;
    private constructor();
    static getInstance(): JobWorker;
    private setupWorkerEventListeners;
    /**
     * Process a job application
     */
    private processJob;
    /**
     * Analyze job page using LLM
     * TODO: Integrate with actual LLM (Mistral AI, OpenAI, etc.)
     */
    private analyzJobPage;
    /**
     * Generate fill instructions from analysis
     * TODO: Enhance with actual user profile data
     */
    private generateInstructions;
    /**
     * Detect form type based on platform
     */
    private detectFormType;
    /**
     * Get field selector for platform
     */
    private getFieldSelector;
    /**
     * Get submit button selector for platform
     */
    private getSubmitSelector;
    /**
     * Get file upload selector
     */
    private getFileUploadSelector;
    /**
     * Get placeholder value for field
     */
    private getPlaceholderValue;
    /**
     * Get field type
     */
    private getFieldType;
    /**
     * Close the worker
     */
    close(): Promise<void>;
    /**
     * Get the worker instance
     */
    getWorker(): Worker<JobApplicationData>;
}
export declare const jobWorker: JobWorker;
export {};
//# sourceMappingURL=JobWorker.d.ts.map