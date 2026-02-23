"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const PaymentGateway_1 = require("../gateways/PaymentGateway");
const EntitlementService_1 = require("../services/EntitlementService");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// All admin routes require admin API key
router.use(auth_1.authenticateAdmin);
/**
 * POST /api/admin/refunds
 * Issue a refund
 */
router.post('/refunds', (0, validation_1.validate)(validation_1.refundSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { paymentId, amount, reason } = req.body;
    // Get payment record
    const paymentQuery = await database_1.db.query('SELECT * FROM payments WHERE external_payment_id = $1', [paymentId]);
    if (paymentQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
    }
    const payment = paymentQuery.rows[0];
    const gateway = PaymentGateway_1.PaymentGatewayFactory.get(payment.gateway);
    try {
        const refund = await gateway.refund({
            paymentId,
            amount,
            reason,
        });
        logger_1.logger.info('Refund issued by admin', {
            paymentId,
            refundId: refund.refundId,
            amount: refund.amount,
        });
        res.json({
            success: true,
            refund,
        });
    }
    catch (error) {
        logger_1.logger.error('Refund failed', { error: error.message, paymentId });
        res.status(500).json({
            error: 'RefundFailed',
            message: error.message,
        });
    }
}));
/**
 * POST /api/admin/entitlements/grant
 * Manually grant entitlement to user
 */
router.post('/entitlements/grant', (0, validation_1.validate)(validation_1.grantEntitlementSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, plan, durationDays, reason } = req.body;
    try {
        const validTo = new Date();
        validTo.setDate(validTo.getDate() + (durationDays || 30));
        const entitlement = await EntitlementService_1.entitlementService.createEntitlement({
            userId,
            plan,
            status: 'active',
            features: [],
            validFrom: new Date(),
            validTo,
            source: 'manual',
            metadata: {
                grantedBy: 'admin',
                reason: reason || 'Manual grant',
                grantedAt: new Date().toISOString(),
            },
        });
        logger_1.logger.info('Entitlement manually granted', {
            userId,
            plan,
            entitlementId: entitlement.id,
            reason,
        });
        res.json({
            success: true,
            entitlement,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to grant entitlement', { error: error.message, userId });
        res.status(500).json({
            error: 'GrantFailed',
            message: error.message,
        });
    }
}));
/**
 * POST /api/admin/entitlements/revoke
 * Manually revoke user's entitlement
 */
router.post('/entitlements/revoke', (0, validation_1.validate)(validation_1.revokeEntitlementSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, reason } = req.body;
    try {
        const entitlement = await EntitlementService_1.entitlementService.getActiveEntitlement(userId);
        if (!entitlement) {
            return res.status(404).json({ error: 'No active entitlement found' });
        }
        await EntitlementService_1.entitlementService.revokeEntitlement(entitlement.id);
        logger_1.logger.info('Entitlement manually revoked', {
            userId,
            entitlementId: entitlement.id,
            reason,
        });
        res.json({
            success: true,
            message: 'Entitlement revoked',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to revoke entitlement', { error: error.message, userId });
        res.status(500).json({
            error: 'RevokeFailed',
            message: error.message,
        });
    }
}));
/**
 * GET /api/admin/users/:userId
 * Get user details including entitlements and payment history
 */
router.get('/users/:userId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    try {
        // Get user
        const userQuery = await database_1.db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userQuery.rows[0];
        // Get entitlements
        const entitlements = await EntitlementService_1.entitlementService.getUserEntitlements(userId);
        // Get subscriptions
        const subscriptions = await database_1.db.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        // Get payments
        const payments = await database_1.db.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json({
            user,
            entitlements,
            subscriptions: subscriptions.rows,
            payments: payments.rows,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user details', { error: error.message, userId });
        res.status(500).json({
            error: 'FetchFailed',
            message: error.message,
        });
    }
}));
/**
 * GET /api/admin/stats
 * Get payment system statistics
 */
router.get('/stats', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Active subscriptions
        const activeSubsQuery = await database_1.db.query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");
        // Active entitlements
        const activeEntsQuery = await database_1.db.query("SELECT COUNT(*) as count FROM entitlements WHERE status = 'active'");
        // Total revenue (last 30 days)
        const revenueQuery = await database_1.db.query(`
        SELECT SUM(amount) as total, currency
        FROM payments
        WHERE status = 'succeeded'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY currency
      `);
        // Failed payments (last 7 days)
        const failedPaymentsQuery = await database_1.db.query(`
        SELECT COUNT(*) as count
        FROM webhook_events
        WHERE type = 'invoice.payment_failed'
          AND created_at >= NOW() - INTERVAL '7 days'
      `);
        // Churn rate (cancellations last 30 days)
        const churnQuery = await database_1.db.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE status = 'canceled'
          AND canceled_at >= NOW() - INTERVAL '30 days'
      `);
        res.json({
            activeSubscriptions: parseInt(activeSubsQuery.rows[0].count),
            activeEntitlements: parseInt(activeEntsQuery.rows[0].count),
            revenue30Days: revenueQuery.rows,
            failedPayments7Days: parseInt(failedPaymentsQuery.rows[0].count),
            churn30Days: parseInt(churnQuery.rows[0].count),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get stats', { error: error.message });
        res.status(500).json({
            error: 'StatsFailed',
            message: error.message,
        });
    }
}));
/**
 * GET /api/admin/webhook-events
 * Get recent webhook events for monitoring
 */
router.get('/webhook-events', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    let query = 'SELECT * FROM webhook_events';
    const params = [];
    if (status) {
        query += ' WHERE status = $1';
        params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    try {
        const result = await database_1.db.query(query, params);
        res.json({
            events: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get webhook events', { error: error.message });
        res.status(500).json({
            error: 'FetchFailed',
            message: error.message,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=admin.js.map