/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for sensitive endpoints
 * 5 requests per 15 minutes per IP
 */
export declare const strictRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Webhook rate limiter
 * Higher limit for webhook endpoints
 */
export declare const webhookRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.d.ts.map