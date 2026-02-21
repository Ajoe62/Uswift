import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export declare function validate(schema: z.ZodSchema, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const checkoutSessionSchema: z.ZodObject<{
    userId: z.ZodString;
    priceId: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    mode: z.ZodEnum<["subscription", "payment"]>;
    successUrl: z.ZodString;
    cancelUrl: z.ZodString;
    promoCode: z.ZodOptional<z.ZodString>;
    clientRef: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    trialPeriodDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    mode: "subscription" | "payment";
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string> | undefined;
    priceId?: string | undefined;
    planId?: string | undefined;
    promoCode?: string | undefined;
    clientRef?: string | undefined;
    trialPeriodDays?: number | undefined;
}, {
    userId: string;
    mode: "subscription" | "payment";
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string> | undefined;
    priceId?: string | undefined;
    planId?: string | undefined;
    promoCode?: string | undefined;
    clientRef?: string | undefined;
    trialPeriodDays?: number | undefined;
}>;
export declare const portalSessionSchema: z.ZodObject<{
    userId: z.ZodString;
    returnUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    returnUrl: string;
}, {
    userId: string;
    returnUrl: string;
}>;
export declare const paymentIntentSchema: z.ZodObject<{
    userId: z.ZodString;
    priceId: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    priceId: string;
    amount: number;
    currency: string;
}, {
    userId: string;
    priceId: string;
    amount: number;
    currency: string;
}>;
export declare const refundSchema: z.ZodObject<{
    paymentId: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodEnum<["requested_by_customer", "duplicate", "fraudulent"]>>;
}, "strip", z.ZodTypeAny, {
    paymentId: string;
    amount?: number | undefined;
    reason?: "requested_by_customer" | "duplicate" | "fraudulent" | undefined;
}, {
    paymentId: string;
    amount?: number | undefined;
    reason?: "requested_by_customer" | "duplicate" | "fraudulent" | undefined;
}>;
export declare const validateLicenseSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const grantEntitlementSchema: z.ZodObject<{
    userId: z.ZodString;
    plan: z.ZodEnum<["free", "pro", "enterprise"]>;
    durationDays: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    plan: "free" | "pro" | "enterprise";
    reason?: string | undefined;
    durationDays?: number | undefined;
}, {
    userId: string;
    plan: "free" | "pro" | "enterprise";
    reason?: string | undefined;
    durationDays?: number | undefined;
}>;
export declare const revokeEntitlementSchema: z.ZodObject<{
    userId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    reason?: string | undefined;
}, {
    userId: string;
    reason?: string | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map