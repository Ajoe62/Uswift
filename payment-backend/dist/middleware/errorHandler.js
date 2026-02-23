"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.asyncHandler = asyncHandler;
const logger_1 = require("../utils/logger");
/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
    // Log error with correlation ID
    logger_1.logger.error('Request error', {
        correlationId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
    });
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    // Build error response
    const errorResponse = {
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred',
        correlationId,
    };
    // Add details in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
            stack: err.stack,
        };
    }
    res.status(statusCode).json(errorResponse);
}
/**
 * 404 handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'NotFound',
        message: `Route ${req.method} ${req.path} not found`,
    });
}
/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
//# sourceMappingURL=errorHandler.js.map