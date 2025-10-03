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
 * Braintree implementation of PaymentGateway (STUB)
 * TODO: Implement Braintree payments and subscriptions
 *
 * Documentation:
 * - https://developer.paypal.com/braintree/docs
 * - https://developer.paypal.com/braintree/docs/guides/subscriptions
 */
export class BraintreeGateway extends PaymentGateway {
  readonly name = 'braintree';

  constructor(merchantId: string, publicKey: string, privateKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    super();
    // TODO: Initialize Braintree gateway
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionOutput> {
    // TODO: Implement Braintree checkout (hosted fields or Drop-in UI)
    throw new Error('Braintree gateway not yet implemented');
  }

  async createPortalSession(input: PortalSessionInput): Promise<PortalSessionOutput> {
    // TODO: Build custom portal page for Braintree subscription management
    throw new Error('Braintree gateway not yet implemented');
  }

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentOutput> {
    // TODO: Generate Braintree client token
    throw new Error('Braintree gateway not yet implemented');
  }

  async refund(input: RefundInput): Promise<RefundOutput> {
    // TODO: Implement Braintree refund
    throw new Error('Braintree gateway not yet implemented');
  }

  async getOrCreateCustomer(
    userId: string,
    email: string,
    metadata?: Record<string, string>
  ): Promise<Customer> {
    // TODO: Implement Braintree customer creation
    throw new Error('Braintree gateway not yet implemented');
  }

  async getCustomerByExternalId(externalId: string): Promise<Customer | null> {
    // TODO: Implement Braintree customer retrieval
    throw new Error('Braintree gateway not yet implemented');
  }

  async verifyWebhookEvent(
    headers: Record<string, string>,
    rawBody: string | Buffer
  ): Promise<WebhookEvent> {
    // TODO: Implement Braintree webhook verification
    throw new Error('Braintree gateway not yet implemented');
  }

  mapEventToDomain(event: WebhookEvent): DomainEvent {
    // TODO: Map Braintree webhook notifications to domain events
    throw new Error('Braintree gateway not yet implemented');
  }

  async getSubscription(externalSubId: string): Promise<any> {
    // TODO: Implement Braintree subscription retrieval
    throw new Error('Braintree gateway not yet implemented');
  }

  async cancelSubscription(
    externalSubId: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<any> {
    // TODO: Implement Braintree subscription cancellation
    throw new Error('Braintree gateway not yet implemented');
  }

  async updateSubscription(
    externalSubId: string,
    newPriceId: string,
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  ): Promise<any> {
    // TODO: Implement Braintree subscription update
    throw new Error('Braintree gateway not yet implemented');
  }
}
