import crypto from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PaymentGatewayFactory } from '../gateways/PaymentGateway';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import {
  validate,
  checkoutSessionSchema,
  portalSessionSchema,
  paymentIntentSchema,
  bridgeSessionSchema,
  bridgeExchangeSchema,
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { db } from '../config/database';
import { config } from '../config';

const router: Router = Router();
const BRIDGE_SESSION_TTL_MS = 5 * 60 * 1000;

type BridgeSessionPurpose = 'checkout' | 'billing' | 'billing_return';
type BridgeSessionRecord = {
  token: string;
  userId: string;
  purpose: BridgeSessionPurpose;
  expiresAt: number;
};

const bridgeSessions = new Map<string, BridgeSessionRecord>();
const allowedRedirectOrigins = new Set([
  config.appDomain,
  ...(config.nodeEnv !== 'production'
    ? ['http://localhost:3000', 'http://localhost:5173']
    : []),
]);

function cleanupExpiredBridgeSessions(): void {
  const now = Date.now();
  for (const [state, session] of bridgeSessions.entries()) {
    if (session.expiresAt <= now) {
      bridgeSessions.delete(state);
    }
  }
}

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

function validateRedirectUrl(value: string, fieldName: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid ${fieldName}`);
  }

  const isLocalDevHttp =
    parsed.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(parsed.hostname) &&
    config.nodeEnv !== 'production';

  if (parsed.protocol !== 'https:' && !isLocalDevHttp) {
    throw new Error(`${fieldName} must use HTTPS`);
  }

  if (!allowedRedirectOrigins.has(parsed.origin) && !isLocalDevHttp) {
    throw new Error(`${fieldName} origin is not allowed`);
  }
}

function issueBridgeState(req: AuthRequest, userId: string, purpose: BridgeSessionPurpose): string {
  if (!req.user?.userId || req.user.userId !== userId) {
    throw new Error('User ID does not match authenticated user');
  }

  cleanupExpiredBridgeSessions();

  const bridgeToken = jwt.sign(
    {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      scope: 'payment_web_bridge',
    },
    config.auth.jwtSecret,
    { expiresIn: '10m' }
  );

  const state = crypto.randomBytes(24).toString('hex');
  bridgeSessions.set(state, {
    token: bridgeToken,
    userId,
    purpose,
    expiresAt: Date.now() + BRIDGE_SESSION_TTL_MS,
  });

  return state;
}

router.post(
  '/bridge/session',
  authenticateJWT,
  validate(bridgeSessionSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId, purpose = 'checkout' } = req.body as {
      userId: string;
      purpose?: BridgeSessionPurpose;
    };

    try {
      const state = issueBridgeState(req, userId, purpose);
      res.json({
        success: true,
        state,
        expiresInSeconds: Math.floor(BRIDGE_SESSION_TTL_MS / 1000),
      });
    } catch (error: any) {
      res.status(403).json({
        error: 'BridgeSessionForbidden',
        message: error.message || 'Unable to create bridge session',
      });
    }
  })
);

router.post(
  '/bridge/exchange',
  validate(bridgeExchangeSchema),
  asyncHandler(async (req, res) => {
    cleanupExpiredBridgeSessions();
    const { state } = req.body as { state: string };
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
  })
);

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

    validateRedirectUrl(successUrl, 'successUrl');
    validateRedirectUrl(cancelUrl, 'cancelUrl');

    const userQuery = await db.query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [authenticatedUserId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];
    const gateway = PaymentGatewayFactory.getPrimary();

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

    validateRedirectUrl(returnUrl, 'returnUrl');

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
