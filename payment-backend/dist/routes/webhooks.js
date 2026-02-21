"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentGateway_1 = require("../gateways/PaymentGateway");
const WebhookHandler_1 = require("../services/WebhookHandler");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * POST /webhooks/stripe
 * Stripe webhook endpoint
 * CRITICAL: This is the source of truth for payment state
 */
router.post('/stripe', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        logger_1.logger.warn('Stripe webhook missing signature');
        return res.status(400).json({ error: 'Missing stripe-signature header' });
    }
    // Get raw body (Express should be configured with express.raw() for webhooks)
    const rawBody = req.body;
    try {
        const gateway = PaymentGateway_1.PaymentGatewayFactory.get('stripe');
        // Process webhook with idempotency
        await WebhookHandler_1.webhookHandler.processEvent(gateway, { 'stripe-signature': signature }, rawBody);
        // Respond immediately to Stripe
        res.json({ received: true });
    }
    catch (error) {
        logger_1.logger.error('Stripe webhook processing error', {
            error: error.message,
            signature,
        });
        // Return 400 for verification errors, 500 for processing errors
        if (error.message.includes('verification') || error.message.includes('signature')) {
            return res.status(400).json({ error: 'Webhook verification failed' });
        }
        // For processing errors, return 500 so Stripe retries
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});
/**
 * POST /webhooks/paypal
 * PayPal webhook endpoint (stub for future implementation)
 */
router.post('/paypal', async (req, res) => {
    logger_1.logger.info('PayPal webhook received (not yet implemented)');
    res.json({ received: true });
});
/**
 * POST /webhooks/braintree
 * Braintree webhook endpoint (stub for future implementation)
 */
router.post('/braintree', async (req, res) => {
    logger_1.logger.info('Braintree webhook received (not yet implemented)');
    res.json({ received: true });
});
/**
 * POST /webhooks/adyen
 * Adyen webhook endpoint (stub for future implementation)
 */
router.post('/adyen', async (req, res) => {
    logger_1.logger.info('Adyen webhook received (not yet implemented)');
    res.json({ received: true });
});
/**
 * GET /webhooks/test
 * Test endpoint to verify webhook server is running
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Webhook server is running',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map