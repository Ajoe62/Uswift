"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRateLimiter = exports.strictRateLimiter = exports.apiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'TooManyRequests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: res.getHeader('Retry-After'),
        });
    },
});
/**
 * Strict rate limiter for sensitive endpoints
 * 5 requests per 15 minutes per IP
 */
exports.strictRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Webhook rate limiter
 * Higher limit for webhook endpoints
 */
exports.webhookRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: 'Webhook rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limit for Stripe webhooks (they have signature verification)
        return req.path.startsWith('/webhooks/');
    },
});
//# sourceMappingURL=rateLimit.js.map