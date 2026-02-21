"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeEntitlementSchema = exports.grantEntitlementSchema = exports.validateLicenseSchema = exports.refundSchema = exports.paymentIntentSchema = exports.portalSessionSchema = exports.checkoutSessionSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const data = req[source];
            schema.parse(data);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));
                logger_1.logger.warn('Validation error', { errors, source });
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
exports.checkoutSessionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    priceId: zod_1.z.string().optional(),
    planId: zod_1.z.string().optional(),
    mode: zod_1.z.enum(['subscription', 'payment']),
    successUrl: zod_1.z.string().url('Invalid success URL'),
    cancelUrl: zod_1.z.string().url('Invalid cancel URL'),
    promoCode: zod_1.z.string().optional(),
    clientRef: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string()).optional(),
    trialPeriodDays: zod_1.z.number().int().positive().optional(),
});
exports.portalSessionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    returnUrl: zod_1.z.string().url('Invalid return URL'),
});
exports.paymentIntentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    priceId: zod_1.z.string(),
    amount: zod_1.z.number().int().positive('Amount must be positive'),
    currency: zod_1.z.string().length(3, 'Currency must be 3 characters'),
});
exports.refundSchema = zod_1.z.object({
    paymentId: zod_1.z.string(),
    amount: zod_1.z.number().int().positive().optional(),
    reason: zod_1.z.enum(['requested_by_customer', 'duplicate', 'fraudulent']).optional(),
});
exports.validateLicenseSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
});
exports.grantEntitlementSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    plan: zod_1.z.enum(['free', 'pro', 'enterprise']),
    durationDays: zod_1.z.number().int().positive().optional(),
    reason: zod_1.z.string().optional(),
});
exports.revokeEntitlementSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    reason: zod_1.z.string().optional(),
});
//# sourceMappingURL=validation.js.map