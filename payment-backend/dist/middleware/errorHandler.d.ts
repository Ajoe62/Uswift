import { NextFunction, Request, RequestHandler, Response } from 'express';
export interface ErrorResponse {
    error: string;
    message?: string;
    details?: any;
    correlationId?: string;
}
/**
 * Global error handler middleware
 */
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
export declare function asyncHandler(fn: RequestHandler): RequestHandler;
//# sourceMappingURL=errorHandler.d.ts.map