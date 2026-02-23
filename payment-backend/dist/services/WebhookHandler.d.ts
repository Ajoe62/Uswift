import { PaymentGateway } from '../gateways/PaymentGateway';
/**
 * WebhookHandler - Processes webhook events with idempotency
 * Source of truth for subscription and payment state changes
 */
export declare class WebhookHandler {
    private static instance;
    private constructor();
    static getInstance(): WebhookHandler;
    /**
     * Process webhook event with idempotency
     */
    processEvent(gateway: PaymentGateway, headers: Record<string, string>, rawBody: string): Promise<void>;
    /**
     * Handle domain events
     */
    private handleDomainEvent;
    /**
     * Handle checkout.session.completed
     * Creates entitlement for new subscription or one-time payment
     */
    private handleCheckoutCompleted;
    /**
     * Handle invoice.paid
     * Keeps subscription active
     */
    private handleInvoicePaid;
    /**
     * Handle invoice.payment_failed
     * Sets subscription to past_due, starts grace period
     */
    private handleInvoicePaymentFailed;
    /**
     * Handle customer.subscription.created
     * Creates subscription record and grants entitlement
     */
    private handleSubscriptionCreated;
    /**
     * Handle customer.subscription.updated
     * Updates subscription and entitlement
     */
    private handleSubscriptionUpdated;
    /**
     * Handle customer.subscription.deleted
     * Cancels entitlement
     */
    private handleSubscriptionDeleted;
    /**
     * Handle charge.refunded
     * Revokes entitlement for refunded one-time payments
     */
    private handleChargeRefunded;
    /**
     * Handle dispute.created
     */
    private handleDisputeCreated;
    /**
     * Handle dispute.closed
     */
    private handleDisputeClosed;
    /**
     * Handle payment_intent.succeeded
     */
    private handlePaymentSucceeded;
    /**
     * Grant one-time access
     */
    private grantOneTimeAccess;
    /**
     * Record payment in database
     */
    private recordPayment;
    /**
     * Store webhook event
     */
    private storeWebhookEvent;
    /**
     * Get webhook event
     */
    private getWebhookEvent;
    /**
     * Mark event as processed
     */
    private markEventProcessed;
    /**
     * Mark event as failed
     */
    private markEventFailed;
}
export declare const webhookHandler: WebhookHandler;
//# sourceMappingURL=WebhookHandler.d.ts.map