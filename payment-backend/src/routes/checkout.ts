import { Router } from 'express';
import { PaymentGatewayFactory } from '../gateways/PaymentGateway';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { validate, checkoutSessionSchema, portalSessionSchema, paymentIntentSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { db } from '../config/database';

const router: Router = Router();

function getAuthenticatedUserId(req: AuthRequest, bodyUserId: string): string | null {
  const tokenUserId = req.user?.userId;
  if (!tokenUserId) {
    return null;
  }

  if (bodyUserId !== tokenUserId) {
    return null;
  }

  return tokenUserId;
}

/**
 * POST /api/checkout/session
 * Create a checkout session (Stripe Checkout)
 */
router.post(
  '/session',
  authenticateJWT,
  validate(checkoutSessionSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId, priceId, mode, successUrl, cancelUrl, promoCode, metadata, trialPeriodDays } = req.body;
    const authenticatedUserId = getAuthenticatedUserId(req, userId);

    if (!authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden', message: 'User ID does not match authenticated user' });
    }

    // Verify user exists and get email
    const userQuery = await db.query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [authenticatedUserId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];

    // Get payment gateway (default: Stripe)
    const gateway = PaymentGatewayFactory.getPrimary();

    try {
      // Create checkout session
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

      logger.info('Checkout session created', {
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
    } catch (error: any) {
      logger.error('Checkout session creation failed', { error: error.message, userId: authenticatedUserId });
      res.status(500).json({
        error: 'CheckoutSessionFailed',
        message: error.message,
      });
    }
  })
);

/**
 * POST /api/portal/session
 * Create a customer portal session (Stripe Customer Portal)
 */
router.post(
  '/portal/session',
  authenticateJWT,
  validate(portalSessionSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId, returnUrl } = req.body;
    const authenticatedUserId = getAuthenticatedUserId(req, userId);

    if (!authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden', message: 'User ID does not match authenticated user' });
    }

    // Get user's Stripe customer ID
    const userQuery = await db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [authenticatedUserId]);

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

    const gateway = PaymentGatewayFactory.getPrimary();

    try {
      const session = await gateway.createPortalSession({
        customerId: stripeCustomerId,
        returnUrl,
      });

      logger.info('Portal session created', { userId: authenticatedUserId, customerId: stripeCustomerId });

      res.json({
        success: true,
        url: session.url,
      });
    } catch (error: any) {
      logger.error('Portal session creation failed', { error: error.message, userId: authenticatedUserId });
      res.status(500).json({
        error: 'PortalSessionFailed',
        message: error.message,
      });
    }
  })
);

/**
 * POST /api/payments/intent
 * Create a payment intent (for Payment Element)
 * Optional - only needed if implementing custom payment page
 */
router.post(
  '/payments/intent',
  authenticateJWT,
  validate(paymentIntentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId, priceId, amount, currency } = req.body;
    const authenticatedUserId = getAuthenticatedUserId(req, userId);

    if (!authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden', message: 'User ID does not match authenticated user' });
    }

    // Get user email
    const userQuery = await db.query('SELECT email FROM users WHERE id = $1', [authenticatedUserId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];
    const gateway = PaymentGatewayFactory.getPrimary();

    try {
      const paymentIntent = await gateway.createPaymentIntent({
        userId: authenticatedUserId,
        priceId,
        amount,
        currency,
        customerEmail: user.email,
      });

      logger.info('Payment intent created', { userId: authenticatedUserId, intentId: paymentIntent.intentId });

      res.json({
        success: true,
        clientSecret: paymentIntent.clientSecret,
        intentId: paymentIntent.intentId,
      });
    } catch (error: any) {
      logger.error('Payment intent creation failed', { error: error.message, userId: authenticatedUserId });
      res.status(500).json({
        error: 'PaymentIntentFailed',
        message: error.message,
      });
    }
  })
);

export default router;
