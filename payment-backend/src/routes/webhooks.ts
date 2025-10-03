import { Router, Request, Response } from 'express';
import { PaymentGatewayFactory } from '../gateways/PaymentGateway';
import { webhookHandler } from '../services/WebhookHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /webhooks/stripe
 * Stripe webhook endpoint
 * CRITICAL: This is the source of truth for payment state
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    logger.warn('Stripe webhook missing signature');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Get raw body (Express should be configured with express.raw() for webhooks)
  const rawBody = req.body;

  try {
    const gateway = PaymentGatewayFactory.get('stripe');

    // Process webhook with idempotency
    await webhookHandler.processEvent(
      gateway,
      { 'stripe-signature': signature },
      rawBody
    );

    // Respond immediately to Stripe
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook processing error', {
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
router.post('/paypal', async (req: Request, res: Response) => {
  logger.info('PayPal webhook received (not yet implemented)');
  res.json({ received: true });
});

/**
 * POST /webhooks/braintree
 * Braintree webhook endpoint (stub for future implementation)
 */
router.post('/braintree', async (req: Request, res: Response) => {
  logger.info('Braintree webhook received (not yet implemented)');
  res.json({ received: true });
});

/**
 * POST /webhooks/adyen
 * Adyen webhook endpoint (stub for future implementation)
 */
router.post('/adyen', async (req: Request, res: Response) => {
  logger.info('Adyen webhook received (not yet implemented)');
  res.json({ received: true });
});

/**
 * GET /webhooks/test
 * Test endpoint to verify webhook server is running
 */
router.get('/test', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Webhook server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
