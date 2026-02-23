"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookHandler = exports.WebhookHandler = void 0;
const database_1 = require("../config/database");
const EntitlementService_1 = require("./EntitlementService");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
/**
 * WebhookHandler - Processes webhook events with idempotency
 * Source of truth for subscription and payment state changes
 */
class WebhookHandler {
    static instance;
    constructor() { }
    static getInstance() {
        if (!WebhookHandler.instance) {
            WebhookHandler.instance = new WebhookHandler();
        }
        return WebhookHandler.instance;
    }
    /**
     * Process webhook event with idempotency
     */
    async processEvent(gateway, headers, rawBody) {
        // Verify webhook signature
        const webhookEvent = await gateway.verifyWebhookEvent(headers, rawBody);
        // Check if event already processed (idempotency)
        const existingEvent = await this.getWebhookEvent(webhookEvent.id);
        if (existingEvent) {
            if (existingEvent.status === 'processed') {
                logger_1.logger.info('Webhook event already processed', { eventId: webhookEvent.id });
                return;
            }
            // Retry failed event
            if (existingEvent.status === 'failed' && existingEvent.retry_count >= 3) {
                logger_1.logger.warn('Webhook event max retries exceeded', {
                    eventId: webhookEvent.id,
                    retryCount: existingEvent.retry_count,
                });
                return;
            }
        }
        // Store event
        await this.storeWebhookEvent(webhookEvent.id, webhookEvent.type, webhookEvent.rawPayload);
        try {
            // Map to domain event
            const domainEvent = gateway.mapEventToDomain(webhookEvent);
            // Process event based on type
            await this.handleDomainEvent(domainEvent, webhookEvent.rawPayload);
            // Mark as processed
            await this.markEventProcessed(webhookEvent.id);
            logger_1.logger.info('Webhook event processed successfully', {
                eventId: webhookEvent.id,
                type: webhookEvent.type,
            });
        }
        catch (error) {
            logger_1.logger.error('Webhook event processing failed', {
                eventId: webhookEvent.id,
                type: webhookEvent.type,
                error: error.message,
            });
            await this.markEventFailed(webhookEvent.id, error.message);
            throw error;
        }
    }
    /**
     * Handle domain events
     */
    async handleDomainEvent(event, rawPayload) {
        switch (event.type) {
            case 'checkout_completed':
                await this.handleCheckoutCompleted(rawPayload);
                break;
            case 'invoice_paid':
                await this.handleInvoicePaid(rawPayload);
                break;
            case 'invoice_payment_failed':
                await this.handleInvoicePaymentFailed(rawPayload);
                break;
            case 'subscription_created':
                await this.handleSubscriptionCreated(rawPayload);
                break;
            case 'subscription_updated':
                await this.handleSubscriptionUpdated(rawPayload);
                break;
            case 'subscription_deleted':
                await this.handleSubscriptionDeleted(rawPayload);
                break;
            case 'charge_refunded':
                await this.handleChargeRefunded(rawPayload);
                break;
            case 'dispute_created':
                await this.handleDisputeCreated(rawPayload);
                break;
            case 'dispute_closed':
                await this.handleDisputeClosed(rawPayload);
                break;
            case 'payment_succeeded':
                await this.handlePaymentSucceeded(rawPayload);
                break;
            default:
                logger_1.logger.info('Unhandled webhook event type', { type: event.type });
        }
    }
    /**
     * Handle checkout.session.completed
     * Creates entitlement for new subscription or one-time payment
     */
    async handleCheckoutCompleted(event) {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        if (!userId) {
            throw new Error('User ID not found in checkout session');
        }
        // Get user
        const userQuery = await database_1.db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userQuery.rows.length === 0) {
            throw new Error(`User not found: ${userId}`);
        }
        // Update user's Stripe customer ID
        if (session.customer) {
            await database_1.db.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
                session.customer,
                userId,
            ]);
        }
        if (session.mode === 'subscription') {
            // Wait for subscription.created event to handle entitlement
            logger_1.logger.info('Checkout completed for subscription', {
                userId,
                sessionId: session.id,
                subscriptionId: session.subscription,
            });
        }
        else if (session.mode === 'payment') {
            // One-time payment - grant immediate access
            await this.grantOneTimeAccess(userId, session.payment_intent);
        }
    }
    /**
     * Handle invoice.paid
     * Keeps subscription active
     */
    async handleInvoicePaid(event) {
        const invoice = event.data.object;
        if (!invoice.subscription) {
            return; // Not a subscription invoice
        }
        const subscriptionId = invoice.subscription;
        // Update subscription status
        await database_1.db.query(`UPDATE subscriptions
       SET status = 'active', current_period_end = $1
       WHERE external_sub_id = $2`, [new Date(invoice.period_end * 1000), subscriptionId]);
        // Ensure entitlement is active
        const subQuery = await database_1.db.query('SELECT user_id FROM subscriptions WHERE external_sub_id = $1', [
            subscriptionId,
        ]);
        if (subQuery.rows.length > 0) {
            const userId = subQuery.rows[0].user_id;
            // Update entitlement status to active
            await database_1.db.query(`UPDATE entitlements
         SET status = 'active', valid_to = $1
         WHERE user_id = $2 AND source = 'subscription' AND source_id = $3`, [new Date(invoice.period_end * 1000), userId, subscriptionId]);
            logger_1.logger.info('Invoice paid, subscription active', { userId, subscriptionId });
        }
    }
    /**
     * Handle invoice.payment_failed
     * Sets subscription to past_due, starts grace period
     */
    async handleInvoicePaymentFailed(event) {
        const invoice = event.data.object;
        if (!invoice.subscription) {
            return;
        }
        const subscriptionId = invoice.subscription;
        // Update subscription status
        await database_1.db.query(`UPDATE subscriptions
       SET status = 'past_due'
       WHERE external_sub_id = $1`, [subscriptionId]);
        // Update entitlement to past_due
        await database_1.db.query(`UPDATE entitlements
       SET status = 'past_due'
       WHERE source = 'subscription' AND source_id = $1`, [subscriptionId]);
        logger_1.logger.warn('Invoice payment failed', {
            subscriptionId,
            invoiceId: invoice.id,
            attemptCount: invoice.attempt_count,
        });
        // TODO: Trigger dunning email flow
    }
    /**
     * Handle customer.subscription.created
     * Creates subscription record and grants entitlement
     */
    async handleSubscriptionCreated(event) {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        // Get user by customer ID
        const userQuery = await database_1.db.query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId]);
        if (userQuery.rows.length === 0) {
            throw new Error(`User not found for customer: ${customerId}`);
        }
        const userId = userQuery.rows[0].id;
        // Get price information
        const priceId = subscription.items.data[0].price.id;
        const priceQuery = await database_1.db.query('SELECT id, product_id FROM prices WHERE external_price_id = $1', [priceId]);
        let dbPriceId = null;
        if (priceQuery.rows.length > 0) {
            dbPriceId = priceQuery.rows[0].id;
        }
        // Create subscription record
        const subscriptionId = (0, uuid_1.v4)();
        await database_1.db.query(`INSERT INTO subscriptions (
        id, user_id, gateway, external_sub_id, price_id, status,
        current_period_start, current_period_end,
        trial_start, trial_end, cancel_at_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            subscriptionId,
            userId,
            'stripe',
            subscription.id,
            dbPriceId,
            subscription.status,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            subscription.cancel_at_period_end,
        ]);
        // Grant entitlement
        await EntitlementService_1.entitlementService.grantSubscriptionEntitlement(userId, subscription.id, 'pro', new Date(subscription.current_period_end * 1000));
        logger_1.logger.info('Subscription created and entitlement granted', {
            userId,
            subscriptionId: subscription.id,
            status: subscription.status,
        });
    }
    /**
     * Handle customer.subscription.updated
     * Updates subscription and entitlement
     */
    async handleSubscriptionUpdated(event) {
        const subscription = event.data.object;
        // Update subscription record
        await database_1.db.query(`UPDATE subscriptions
       SET status = $1, current_period_end = $2, cancel_at_period_end = $3
       WHERE external_sub_id = $4`, [
            subscription.status,
            new Date(subscription.current_period_end * 1000),
            subscription.cancel_at_period_end,
            subscription.id,
        ]);
        // Update entitlement
        await database_1.db.query(`UPDATE entitlements
       SET status = $1, valid_to = $2
       WHERE source = 'subscription' AND source_id = $3`, [
            subscription.status === 'active' ? 'active' : subscription.status,
            new Date(subscription.current_period_end * 1000),
            subscription.id,
        ]);
        logger_1.logger.info('Subscription updated', {
            subscriptionId: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
    }
    /**
     * Handle customer.subscription.deleted
     * Cancels entitlement
     */
    async handleSubscriptionDeleted(event) {
        const subscription = event.data.object;
        // Update subscription status
        await database_1.db.query(`UPDATE subscriptions
       SET status = 'canceled', canceled_at = NOW()
       WHERE external_sub_id = $1`, [subscription.id]);
        // Cancel entitlement
        await database_1.db.query(`UPDATE entitlements
       SET status = 'canceled', valid_to = NOW()
       WHERE source = 'subscription' AND source_id = $1`, [subscription.id]);
        logger_1.logger.info('Subscription canceled', { subscriptionId: subscription.id });
    }
    /**
     * Handle charge.refunded
     * Revokes entitlement for refunded one-time payments
     */
    async handleChargeRefunded(event) {
        const charge = event.data.object;
        // Find payment record
        const paymentQuery = await database_1.db.query('SELECT id, user_id FROM payments WHERE external_payment_id = $1', [charge.payment_intent || charge.id]);
        if (paymentQuery.rows.length === 0) {
            logger_1.logger.warn('Payment not found for refunded charge', { chargeId: charge.id });
            return;
        }
        const payment = paymentQuery.rows[0];
        // Create refund record
        await database_1.db.query(`INSERT INTO refunds (id, payment_id, external_refund_id, amount, status)
       VALUES ($1, $2, $3, $4, $5)`, [(0, uuid_1.v4)(), payment.id, charge.refunds?.data[0]?.id || (0, uuid_1.v4)(), charge.amount_refunded, 'succeeded']);
        // Update payment status
        await database_1.db.query('UPDATE payments SET status = $1 WHERE id = $2', ['refunded', payment.id]);
        // Revoke entitlement if from one-time payment
        await database_1.db.query(`UPDATE entitlements
       SET status = 'canceled', valid_to = NOW()
       WHERE source = 'one_time' AND source_id = $1`, [charge.payment_intent || charge.id]);
        logger_1.logger.info('Charge refunded, entitlement revoked', {
            chargeId: charge.id,
            amount: charge.amount_refunded,
        });
    }
    /**
     * Handle dispute.created
     */
    async handleDisputeCreated(event) {
        const dispute = event.data.object;
        const paymentQuery = await database_1.db.query('SELECT id FROM payments WHERE external_payment_id = $1', [dispute.charge]);
        if (paymentQuery.rows.length > 0) {
            await database_1.db.query(`INSERT INTO disputes (id, payment_id, external_dispute_id, amount, reason, status, evidence_due_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                (0, uuid_1.v4)(),
                paymentQuery.rows[0].id,
                dispute.id,
                dispute.amount,
                dispute.reason,
                dispute.status,
                dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
            ]);
            logger_1.logger.warn('Dispute created', { disputeId: dispute.id, amount: dispute.amount });
        }
    }
    /**
     * Handle dispute.closed
     */
    async handleDisputeClosed(event) {
        const dispute = event.data.object;
        await database_1.db.query('UPDATE disputes SET status = $1 WHERE external_dispute_id = $2', [dispute.status, dispute.id]);
        logger_1.logger.info('Dispute closed', { disputeId: dispute.id, status: dispute.status });
    }
    /**
     * Handle payment_intent.succeeded
     */
    async handlePaymentSucceeded(event) {
        const paymentIntent = event.data.object;
        // Record payment
        const userId = paymentIntent.metadata?.userId;
        if (!userId) {
            logger_1.logger.warn('Payment succeeded but no user ID in metadata', {
                paymentIntentId: paymentIntent.id,
            });
            return;
        }
        await this.recordPayment(userId, paymentIntent.id, paymentIntent.amount, paymentIntent.currency, 'one_time', 'succeeded');
    }
    /**
     * Grant one-time access
     */
    async grantOneTimeAccess(userId, paymentIntentId) {
        // Record payment
        await this.recordPayment(userId, paymentIntentId, 0, 'usd', 'one_time', 'succeeded');
        // Grant 30-day access
        await EntitlementService_1.entitlementService.grantOneTimeEntitlement(userId, paymentIntentId, 'pro', 30);
        logger_1.logger.info('One-time access granted', { userId, paymentIntentId });
    }
    /**
     * Record payment in database
     */
    async recordPayment(userId, externalPaymentId, amount, currency, kind, status) {
        await database_1.db.query(`INSERT INTO payments (id, user_id, gateway, external_payment_id, amount, currency, kind, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`, [(0, uuid_1.v4)(), userId, 'stripe', externalPaymentId, amount, currency, kind, status]);
    }
    /**
     * Store webhook event
     */
    async storeWebhookEvent(eventId, type, payload) {
        await database_1.db.query(`INSERT INTO webhook_events (id, gateway, external_event_id, type, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (external_event_id) DO NOTHING`, [(0, uuid_1.v4)(), 'stripe', eventId, type, JSON.stringify(payload), 'pending']);
    }
    /**
     * Get webhook event
     */
    async getWebhookEvent(eventId) {
        const result = await database_1.db.query('SELECT * FROM webhook_events WHERE external_event_id = $1', [eventId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    /**
     * Mark event as processed
     */
    async markEventProcessed(eventId) {
        await database_1.db.query(`UPDATE webhook_events
       SET status = 'processed', processed_at = NOW()
       WHERE external_event_id = $1`, [eventId]);
    }
    /**
     * Mark event as failed
     */
    async markEventFailed(eventId, error) {
        await database_1.db.query(`UPDATE webhook_events
       SET status = 'failed', error = $1, retry_count = retry_count + 1
       WHERE external_event_id = $2`, [error, eventId]);
    }
}
exports.WebhookHandler = WebhookHandler;
exports.webhookHandler = WebhookHandler.getInstance();
//# sourceMappingURL=WebhookHandler.js.map