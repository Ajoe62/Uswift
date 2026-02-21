import { PaymentGateway, CheckoutSessionInput, CheckoutSessionOutput, PortalSessionInput, PortalSessionOutput, PaymentIntentInput, PaymentIntentOutput, RefundInput, RefundOutput, Customer, DomainEvent, WebhookEvent } from './PaymentGateway';
/**
 * Adyen implementation of PaymentGateway (STUB)
 * TODO: Implement Adyen payment processing
 *
 * Documentation:
 * - https://docs.adyen.com/online-payments/
 * - https://docs.adyen.com/online-payments/subscriptions
 */
export declare class AdyenGateway extends PaymentGateway {
    readonly name = "adyen";
    constructor(apiKey: string, merchantAccount: string, environment?: 'test' | 'live');
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
//# sourceMappingURL=AdyenGateway.d.ts.map