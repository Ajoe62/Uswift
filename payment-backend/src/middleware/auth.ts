import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

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
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error: any) {
    logger.warn('JWT verification failed', { error: error.message });
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Verify extension token (for license validation)
 * Uses a separate secret for extension-to-backend communication
 */
export function authenticateExtension(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, config.auth.extensionTokenSecret) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error: any) {
    logger.warn('Extension token verification failed', { error: error.message });
    return res.status(403).json({ error: 'Invalid or expired extension token' });
  }
}

/**
 * Verify admin API key
 */
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-admin-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing admin API key' });
  }

  if (apiKey !== config.admin.apiKey) {
    logger.warn('Invalid admin API key attempt', { ip: req.ip });
    return res.status(403).json({ error: 'Invalid admin API key' });
  }

  next();
}

/**
 * Optional authentication - doesn't fail if token is missing
 * Useful for endpoints that work with or without auth
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    // Ignore token errors for optional auth
  }

  next();
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, email: string, role?: string): string {
  const expiresIn = config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'];

  return jwt.sign(
    {
      userId,
      email,
      role,
    },
    config.auth.jwtSecret,
    {
      expiresIn,
    }
  );
}

/**
 * Generate extension token (shorter TTL, used for license checks)
 */
export function generateExtensionToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
    },
    config.auth.extensionTokenSecret,
    {
      expiresIn: '24h', // Extension tokens expire faster
    }
  );
}
