import { Router } from 'express';
import { PaymentGatewayFactory } from '../gateways/PaymentGateway';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { validate, checkoutSessionSchema, portalSessionSchema, paymentIntentSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { db } from '../config/database';

const router = Router();

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

    // Verify user exists and get email
    const userQuery = await db.query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [userId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];

    // Get payment gateway (default: Stripe)
    const gateway = PaymentGatewayFactory.getPrimary();

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

      logger.info('Checkout session created', {
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
    } catch (error: any) {
      logger.error('Checkout session creation failed', { error: error.message, userId });
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

    // Get user's Stripe customer ID
    const userQuery = await db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);

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

      logger.info('Portal session created', { userId, customerId: stripeCustomerId });

      res.json({
        success: true,
        url: session.url,
      });
    } catch (error: any) {
      logger.error('Portal session creation failed', { error: error.message, userId });
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

    // Get user email
    const userQuery = await db.query('SELECT email FROM users WHERE id = $1', [userId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];
    const gateway = PaymentGatewayFactory.getPrimary();

    try {
      const paymentIntent = await gateway.createPaymentIntent({
        userId,
        priceId,
        amount,
        currency,
        customerEmail: user.email,
      });

      logger.info('Payment intent created', { userId, intentId: paymentIntent.intentId });

      res.json({
        success: true,
        clientSecret: paymentIntent.clientSecret,
        intentId: paymentIntent.intentId,
      });
    } catch (error: any) {
      logger.error('Payment intent creation failed', { error: error.message, userId });
      res.status(500).json({
        error: 'PaymentIntentFailed',
        message: error.message,
      });
    }
  })
);

export default router;
