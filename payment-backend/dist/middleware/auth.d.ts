import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role?: string;
    };
}
/**
 * Verify JWT token from Authorization header
 */
export declare function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Verify extension token (for license validation)
 * Uses a separate secret for extension-to-backend communication
 */
export declare function authenticateExtension(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Verify admin API key
 */
export declare function authenticateAdmin(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Optional authentication - doesn't fail if token is missing
 * Useful for endpoints that work with or without auth
 */
export declare function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Generate JWT token for user
 */
export declare function generateToken(userId: string, email: string, role?: string): string;
/**
 * Generate extension token (shorter TTL, used for license checks)
 */
export declare function generateExtensionToken(userId: string, email: string): string;
//# sourceMappingURL=auth.d.ts.map