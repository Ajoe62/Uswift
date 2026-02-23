"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const PaymentGateway_1 = require("../gateways/PaymentGateway");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const BRIDGE_SESSION_TTL_MS = 5 * 60 * 1000;
const bridgeSessions = new Map();
const allowedRedirectOrigins = new Set([
    config_1.config.appDomain,
    ...(config_1.config.nodeEnv !== 'production'
        ? ['http://localhost:3000', 'http://localhost:5173']
        : []),
]);
function cleanupExpiredBridgeSessions() {
    const now = Date.now();
    for (const [state, session] of bridgeSessions.entries()) {
        if (session.expiresAt <= now) {
            bridgeSessions.delete(state);
        }
    }
}
function getAuthenticatedUserId(req, bodyUserId) {
    const tokenUserId = req.user?.userId;
    if (!tokenUserId) {
        return null;
    }
    if (bodyUserId !== tokenUserId) {
        return null;
    }
    return tokenUserId;
}
function validateRedirectUrl(value, fieldName) {
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new Error(`Invalid ${fieldName}`);
    }
    const isLocalDevHttp = parsed.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(parsed.hostname) &&
        config_1.config.nodeEnv !== 'production';
    if (parsed.protocol !== 'https:' && !isLocalDevHttp) {
        throw new Error(`${fieldName} must use HTTPS`);
    }
    if (!allowedRedirectOrigins.has(parsed.origin) && !isLocalDevHttp) {
        throw new Error(`${fieldName} origin is not allowed`);
    }
}
function issueBridgeState(req, userId, purpose) {
    if (!req.user?.userId || req.user.userId !== userId) {
        throw new Error('User ID does not match authenticated user');
    }
    cleanupExpiredBridgeSessions();
    const bridgeToken = jsonwebtoken_1.default.sign({
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        scope: 'payment_web_bridge',
    }, config_1.config.auth.jwtSecret, { expiresIn: '10m' });
    const state = crypto_1.default.randomBytes(24).toString('hex');
    bridgeSessions.set(state, {
        token: bridgeToken,
        userId,
        purpose,
        expiresAt: Date.now() + BRIDGE_SESSION_TTL_MS,
    });
    return state;
}
router.post('/bridge/session', auth_1.authenticateJWT, (0, validation_1.validate)(validation_1.bridgeSessionSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, purpose = 'checkout' } = req.body;
    try {
        const state = issueBridgeState(req, userId, purpose);
        res.json({
            success: true,
            state,
            expiresInSeconds: Math.floor(BRIDGE_SESSION_TTL_MS / 1000),
        });
    }
    catch (error) {
        res.status(403).json({
            error: 'BridgeSessionForbidden',
            message: error.message || 'Unable to create bridge session',
        });
    }
}));
router.post('/bridge/exchange', (0, validation_1.validate)(validation_1.bridgeExchangeSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    cleanupExpiredBridgeSessions();
    const { state } = req.body;
    const session = bridgeSessions.get(state);
    if (!session) {
        return res.status(404).json({
            error: 'BridgeSessionNotFound',
            message: 'Session state is invalid or expired',
        });
    }
    bridgeSessions.delete(state);
    res.json({
        success: true,
        token: session.token,
        userId: session.userId,
        purpose: session.purpose,
    });
}));
/**
 * POST /api/checkout/session
 * Create a checkout session (Stripe Checkout)
 */
router.post('/session', auth_1.authenticateJWT, (0, validation_1.validate)(validation_1.checkoutSessionSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, priceId, mode, successUrl, cancelUrl, promoCode, metadata, trialPeriodDays } = req.body;
    const authenticatedUserId = getAuthenticatedUserId(req, userId);
    if (!authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden', message: 'User ID does not match authenticated user' });
    }
    validateRedirectUrl(successUrl, 'successUrl');
    validateRedirectUrl(cancelUrl, 'cancelUrl');
    const userQuery = await database_1.db.query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [authenticatedUserId]);
    if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    const user = userQuery.rows[0];
    const gateway = PaymentGateway_1.PaymentGatewayFactory.getPrimary();
    try {
        const session = await gateway.createCheckoutSession({
            userId: authenticatedUserId,
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
            userId: authenticatedUserId,
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
        logger_1.logger.error('Checkout session creation failed', { error: error.message, userId: authenticatedUserId });
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
    const authenticatedUserId = getAuthenticatedUserId(req, userId);
    if (!authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden', message: 'User ID does not match authenticated user' });
    }
    validateRedirectUrl(returnUrl, 'returnUrl');
    const userQuery = await database_1.db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [authenticatedUserId]);
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
        logger_1.logger.info('Portal session created', { userId: authenticatedUserId, customerId: stripeCustomerId });
        res.json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        logger_1.logger.error('Portal session creation failed', { error: error.message, userId: authenticatedUserId });
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
    const authenticatedUserId = getAuthenticatedUserId(req, userId);
    if (!authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden', message: 'User ID does not match authenticated user' });
    }
    const userQuery = await database_1.db.query('SELECT email FROM users WHERE id = $1', [authenticatedUserId]);
    if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    const user = userQuery.rows[0];
    const gateway = PaymentGateway_1.PaymentGatewayFactory.getPrimary();
    try {
        const paymentIntent = await gateway.createPaymentIntent({
            userId: authenticatedUserId,
            priceId,
            amount,
            currency,
            customerEmail: user.email,
        });
        logger_1.logger.info('Payment intent created', { userId: authenticatedUserId, intentId: paymentIntent.intentId });
        res.json({
            success: true,
            clientSecret: paymentIntent.clientSecret,
            intentId: paymentIntent.intentId,
        });
    }
    catch (error) {
        logger_1.logger.error('Payment intent creation failed', { error: error.message, userId: authenticatedUserId });
        res.status(500).json({
            error: 'PaymentIntentFailed',
            message: error.message,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=checkout.js.map