import {
  PaymentGateway,
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PortalSessionInput,
  PortalSessionOutput,
  PaymentIntentInput,
  PaymentIntentOutput,
  RefundInput,
  RefundOutput,
  Customer,
  DomainEvent,
  WebhookEvent,
} from './PaymentGateway';

/**
 * Adyen implementation of PaymentGateway (STUB)
 * TODO: Implement Adyen payment processing
 *
 * Documentation:
 * - https://docs.adyen.com/online-payments/
 * - https://docs.adyen.com/online-payments/subscriptions
 */
export class AdyenGateway extends PaymentGateway {
  readonly name = 'adyen';

  constructor(apiKey: string, merchantAccount: string, environment: 'test' | 'live' = 'test') {
    super();
    // TODO: Initialize Adyen client
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionOutput> {
    // TODO: Implement Adyen sessions API
    throw new Error('Adyen gateway not yet implemented');
  }

  async createPortalSession(input: PortalSessionInput): Promise<PortalSessionOutput> {
    // TODO: Build custom portal for Adyen stored payment methods
    throw new Error('Adyen gateway not yet implemented');
  }

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentOutput> {
    // TODO: Implement Adyen payments API
    throw new Error('Adyen gateway not yet implemented');
  }

  async refund(input: RefundInput): Promise<RefundOutput> {
    // TODO: Implement Adyen refund
    throw new Error('Adyen gateway not yet implemented');
  }

  async getOrCreateCustomer(
    userId: string,
    email: string,
    metadata?: Record<string, string>
  ): Promise<Customer> {
    // TODO: Implement Adyen shopper management
    throw new Error('Adyen gateway not yet implemented');
  }

  async getCustomerByExternalId(externalId: string): Promise<Customer | null> {
    // TODO: Implement Adyen shopper retrieval
    throw new Error('Adyen gateway not yet implemented');
  }

  async verifyWebhookEvent(
    headers: Record<string, string>,
    rawBody: string | Buffer
  ): Promise<WebhookEvent> {
    // TODO: Implement Adyen webhook HMAC signature verification
    throw new Error('Adyen gateway not yet implemented');
  }

  mapEventToDomain(event: WebhookEvent): DomainEvent {
    // TODO: Map Adyen webhook events to domain events
    throw new Error('Adyen gateway not yet implemented');
  }

  async getSubscription(externalSubId: string): Promise<any> {
    // TODO: Implement Adyen recurring details retrieval
    throw new Error('Adyen gateway not yet implemented');
  }

  async cancelSubscription(
    externalSubId: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<any> {
    // TODO: Implement Adyen subscription cancellation
    throw new Error('Adyen gateway not yet implemented');
  }

  async updateSubscription(
    externalSubId: string,
    newPriceId: string,
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  ): Promise<any> {
    // TODO: Implement Adyen subscription update
    throw new Error('Adyen gateway not yet implemented');
  }
}
