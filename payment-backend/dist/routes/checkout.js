"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentGateway_1 = require("../gateways/PaymentGateway");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
/**
 * POST /api/checkout/session
 * Create a checkout session (Stripe Checkout)
 */
router.post('/session', auth_1.authenticateJWT, (0, validation_1.validate)(validation_1.checkoutSessionSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, priceId, mode, successUrl, cancelUrl, promoCode, metadata, trialPeriodDays } = req.body;
    // Verify user exists and get email
    const userQuery = await database_1.db.query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    const user = userQuery.rows[0];
    // Get payment gateway (default: Stripe)
    const gateway = PaymentGateway_1.PaymentGatewayFactory.getPrimary();
    try {
        // Create checkout session
        const session = await gateway.createCheckoutSession({
            userId,
            priceId,
            mode,
            successUrl,
            cancelUrl,
            promoCode,
            metadata,
            trialPeriodDays,
            customerEmail: user.email,
        });
        logger_1.logger.info('Checkout session created', {
            userId,
            sessionId: session.sessionId,
            mode,
            priceId,
        });
        res.json({
            success: true,
            url: session.url,
            sessionId: session.sessionId,
        });
    }
    catch (error) {
        logger_1.logger.error('Checkout session creation failed', { error: error.message, userId });
        res.status(500).json({
            error: 'CheckoutSessionFailed',
            message: error.message,
        });
    }
}));
/**
 * POST /api/portal/session
 * Create a customer portal session (Stripe Customer Portal)
 */
router.post('/portal/session', auth_1.authenticateJWT, (0, validation_1.validate)(validation_1.portalSessionSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, returnUrl } = req.body;
    // Get user's Stripe customer ID
    const userQuery = await database_1.db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    const stripeCustomerId = userQuery.rows[0].stripe_customer_id;
    if (!stripeCustomerId) {
        return res.status(400).json({
            error: 'NoCustomer',
            message: 'User has no Stripe customer ID. Please make a purchase first.',
        });
    }
    const gateway = PaymentGateway_1.PaymentGatewayFactory.getPrimary();
    try {
        const session = await gateway.createPortalSession({
            customerId: stripeCustomerId,
            returnUrl,
        });
        logger_1.logger.info('Portal session created', { userId, customerId: stripeCustomerId });
        res.json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        logger_1.logger.error('Portal session creation failed', { error: error.message, userId });
        res.status(500).json({
            error: 'PortalSessionFailed',
            message: error.message,
        });
    }
}));
/**
 * POST /api/payments/intent
 * Create a payment intent (for Payment Element)
 * Optional - only needed if implementing custom payment page
 */
router.post('/payments/intent', auth_1.authenticateJWT, (0, validation_1.validate)(validation_1.paymentIntentSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, priceId, amount, currency } = req.body;
    // Get user email
    const userQuery = await database_1.db.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    const user = userQuery.rows[0];
    const gateway = PaymentGateway_1.PaymentGatewayFactory.getPrimary();
    try {
        const paymentIntent = await gateway.createPaymentIntent({
            userId,
            priceId,
            amount,
            currency,
            customerEmail: user.email,
        });
        logger_1.logger.info('Payment intent created', { userId, intentId: paymentIntent.intentId });
        res.json({
            success: true,
            clientSecret: paymentIntent.clientSecret,
            intentId: paymentIntent.intentId,
        });
    }
    catch (error) {
        logger_1.logger.error('Payment intent creation failed', { error: error.message, userId });
        res.status(500).json({
            error: 'PaymentIntentFailed',
            message: error.message,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=checkout.js.map