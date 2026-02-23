import { PaymentGateway, CheckoutSessionInput, CheckoutSessionOutput, PortalSessionInput, PortalSessionOutput, PaymentIntentInput, PaymentIntentOutput, RefundInput, RefundOutput, Customer, DomainEvent, WebhookEvent } from './PaymentGateway';
/**
 * Braintree implementation of PaymentGateway (STUB)
 * TODO: Implement Braintree payments and subscriptions
 *
 * Documentation:
 * - https://developer.paypal.com/braintree/docs
 * - https://developer.paypal.com/braintree/docs/guides/subscriptions
 */
export declare class BraintreeGateway extends PaymentGateway {
    readonly name = "braintree";
    constructor(merchantId: string, publicKey: string, privateKey: string, environment?: 'sandbox' | 'production');
    createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionOutput>;
    createPortalSession(input: PortalSessionInput): Promise<PortalSessionOutput>;
    createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentOutput>;
    refund(input: RefundInput): Promise<RefundOutput>;
    getOrCreateCustomer(userId: string, email: string, metadata?: Record<string, string>): Promise<Customer>;
    getCustomerByExternalId(externalId: string): Promise<Customer | null>;
    verifyWebhookEvent(headers: Record<string, string>, rawBody: string | Buffer): Promise<WebhookEvent>;
    mapEventToDomain(event: WebhookEvent): DomainEvent;
    getSubscription(externalSubId: string): Promise<any>;
    cancelSubscription(externalSubId: string, cancelAtPeriodEnd?: boolean): Promise<any>;
    updateSubscription(externalSubId: string, newPriceId: string, prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'): Promise<any>;
}
//# sourceMappingURL=BraintreeGateway.d.ts.map