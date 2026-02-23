import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import { validate, refundSchema, grantEntitlementSchema, revokeEntitlementSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { PaymentGatewayFactory } from '../gateways/PaymentGateway';
import { entitlementService } from '../services/EntitlementService';
import { db } from '../config/database';
import { logger } from '../utils/logger';

const router: Router = Router();

// All admin routes require admin API key
router.use(authenticateAdmin);

/**
 * POST /api/admin/refunds
 * Issue a refund
 */
router.post(
  '/refunds',
  validate(refundSchema),
  asyncHandler(async (req, res) => {
    const { paymentId, amount, reason } = req.body;

    // Get payment record
    const paymentQuery = await db.query(
      'SELECT * FROM payments WHERE external_payment_id = $1',
      [paymentId]
    );

    if (paymentQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentQuery.rows[0];
    const gateway = PaymentGatewayFactory.get(payment.gateway);

    try {
      const refund = await gateway.refund({
        paymentId,
        amount,
        reason,
      });

      logger.info('Refund issued by admin', {
        paymentId,
        refundId: refund.refundId,
        amount: refund.amount,
      });

      res.json({
        success: true,
        refund,
      });
    } catch (error: any) {
      logger.error('Refund failed', { error: error.message, paymentId });
      res.status(500).json({
        error: 'RefundFailed',
        message: error.message,
      });
    }
  })
);

/**
 * POST /api/admin/entitlements/grant
 * Manually grant entitlement to user
 */
router.post(
  '/entitlements/grant',
  validate(grantEntitlementSchema),
  asyncHandler(async (req, res) => {
    const { userId, plan, durationDays, reason } = req.body;

    try {
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + (durationDays || 30));

      const entitlement = await entitlementService.createEntitlement({
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

      logger.info('Entitlement manually granted', {
        userId,
        plan,
        entitlementId: entitlement.id,
        reason,
      });

      res.json({
        success: true,
        entitlement,
      });
    } catch (error: any) {
      logger.error('Failed to grant entitlement', { error: error.message, userId });
      res.status(500).json({
        error: 'GrantFailed',
        message: error.message,
      });
    }
  })
);

/**
 * POST /api/admin/entitlements/revoke
 * Manually revoke user's entitlement
 */
router.post(
  '/entitlements/revoke',
  validate(revokeEntitlementSchema),
  asyncHandler(async (req, res) => {
    const { userId, reason } = req.body;

    try {
      const entitlement = await entitlementService.getActiveEntitlement(userId);

      if (!entitlement) {
        return res.status(404).json({ error: 'No active entitlement found' });
      }

      await entitlementService.revokeEntitlement(entitlement.id);

      logger.info('Entitlement manually revoked', {
        userId,
        entitlementId: entitlement.id,
        reason,
      });

      res.json({
        success: true,
        message: 'Entitlement revoked',
      });
    } catch (error: any) {
      logger.error('Failed to revoke entitlement', { error: error.message, userId });
      res.status(500).json({
        error: 'RevokeFailed',
        message: error.message,
      });
    }
  })
);

/**
 * GET /api/admin/users/:userId
 * Get user details including entitlements and payment history
 */
router.get(
  '/users/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      // Get user
      const userQuery = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

      if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userQuery.rows[0];

      // Get entitlements
      const entitlements = await entitlementService.getUserEntitlements(userId);

      // Get subscriptions
      const subscriptions = await db.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      // Get payments
      const payments = await db.query(
        'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      res.json({
        user,
        entitlements,
        subscriptions: subscriptions.rows,
        payments: payments.rows,
      });
    } catch (error: any) {
      logger.error('Failed to get user details', { error: error.message, userId });
      res.status(500).json({
        error: 'FetchFailed',
        message: error.message,
      });
    }
  })
);

/**
 * GET /api/admin/stats
 * Get payment system statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    try {
      // Active subscriptions
      const activeSubsQuery = await db.query(
        "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'"
      );

      // Active entitlements
      const activeEntsQuery = await db.query(
        "SELECT COUNT(*) as count FROM entitlements WHERE status = 'active'"
      );

      // Total revenue (last 30 days)
      const revenueQuery = await db.query(`
        SELECT SUM(amount) as total, currency
        FROM payments
        WHERE status = 'succeeded'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY currency
      `);

      // Failed payments (last 7 days)
      const failedPaymentsQuery = await db.query(`
        SELECT COUNT(*) as count
        FROM webhook_events
        WHERE type = 'invoice.payment_failed'
          AND created_at >= NOW() - INTERVAL '7 days'
      `);

      // Churn rate (cancellations last 30 days)
      const churnQuery = await db.query(`
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
    } catch (error: any) {
      logger.error('Failed to get stats', { error: error.message });
      res.status(500).json({
        error: 'StatsFailed',
        message: error.message,
      });
    }
  })
);

/**
 * GET /api/admin/webhook-events
 * Get recent webhook events for monitoring
 */
router.get(
  '/webhook-events',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    let query = 'SELECT * FROM webhook_events';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    try {
      const result = await db.query(query, params);

      res.json({
        events: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      logger.error('Failed to get webhook events', { error: error.message });
      res.status(500).json({
        error: 'FetchFailed',
        message: error.message,
      });
    }
  })
);

export default router;
