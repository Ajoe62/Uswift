import Stripe from 'stripe';
import { PaymentGateway, CheckoutSessionInput, CheckoutSessionOutput, PortalSessionInput, PortalSessionOutput, PaymentIntentInput, PaymentIntentOutput, RefundInput, RefundOutput, Customer, DomainEvent, WebhookEvent } from './PaymentGateway';
/**
 * Stripe implementation of PaymentGateway
 * Handles all Stripe-specific logic and API calls
 */
export declare class StripeGateway extends PaymentGateway {
    readonly name = "stripe";
    private stripe;
    private webhookSecret;
    constructor(secretKey: string, webhookSecret: string, apiVersion?: Stripe.LatestApiVersion);
    createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionOutput>;
    createPortalSession(input: PortalSessionInput): Promise<PortalSessionOutput>;
    createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentOutput>;
    refund(input: RefundInput): Promise<RefundOutput>;
    getOrCreateCustomer(userId: string, email: string, metadata?: Record<string, string>): Promise<Customer>;
    getCustomerByExternalId(externalId: string): Promise<Customer | null>;
    verifyWebhookEvent(headers: Record<string, string>, rawBody: string | Buffer): Promise<WebhookEvent>;
    mapEventToDomain(event: WebhookEvent): DomainEvent;
    private mapStripeEventType;
    getSubscription(externalSubId: string): Promise<any>;
    cancelSubscription(externalSubId: string, cancelAtPeriodEnd?: boolean): Promise<any>;
    updateSubscription(externalSubId: string, newPriceId: string, prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'): Promise<any>;
    /**
     * Get Stripe instance for advanced operations
     */
    getStripeInstance(): Stripe;
}
//# sourceMappingURL=StripeGateway.d.ts.map