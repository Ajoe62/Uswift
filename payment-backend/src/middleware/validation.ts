import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation error', { errors, source });

        return res.status(400).json({
          error: 'Validation error',
          details: errors,
        });
      }

      next(error);
    }
  };
}

// Common validation schemas

export const checkoutSessionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  priceId: z.string().optional(),
  planId: z.string().optional(),
  mode: z.enum(['subscription', 'payment']),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
  promoCode: z.string().optional(),
  clientRef: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  trialPeriodDays: z.number().int().positive().optional(),
});

export const portalSessionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  returnUrl: z.string().url('Invalid return URL'),
});

export const paymentIntentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  priceId: z.string(),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
});

export const refundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().int().positive().optional(),
  reason: z.enum(['requested_by_customer', 'duplicate', 'fraudulent']).optional(),
});

export const validateLicenseSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const grantEntitlementSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  plan: z.enum(['free', 'pro', 'enterprise']),
  durationDays: z.number().int().positive().optional(),
  reason: z.string().optional(),
});

export const revokeEntitlementSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().optional(),
});
