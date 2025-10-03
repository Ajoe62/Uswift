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
 * PayPal implementation of PaymentGateway (STUB)
 * TODO: Implement PayPal Checkout and Subscriptions integration
 *
 * Documentation:
 * - https://developer.paypal.com/docs/checkout/
 * - https://developer.paypal.com/docs/subscriptions/
 */
export class PayPalGateway extends PaymentGateway {
  readonly name = 'paypal';

  constructor(clientId: string, clientSecret: string, environment: 'sandbox' | 'production' = 'sandbox') {
    super();
    // TODO: Initialize PayPal SDK
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionOutput> {
    // TODO: Implement PayPal order creation
    // Use PayPal Checkout Orders API v2
    throw new Error('PayPal gateway not yet implemented');
  }

  async createPortalSession(input: PortalSessionInput): Promise<PortalSessionOutput> {
    // TODO: Implement PayPal subscription management portal
    // May need to build custom portal page
    throw new Error('PayPal gateway not yet implemented');
  }

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentOutput> {
    // TODO: Implement PayPal payment intent (order)
    throw new Error('PayPal gateway not yet implemented');
  }

  async refund(input: RefundInput): Promise<RefundOutput> {
    // TODO: Implement PayPal refund using Payments API
    throw new Error('PayPal gateway not yet implemented');
  }

  async getOrCreateCustomer(
    userId: string,
    email: string,
    metadata?: Record<string, string>
  ): Promise<Customer> {
    // TODO: Implement PayPal customer (payer) lookup/creation
    throw new Error('PayPal gateway not yet implemented');
  }

  async getCustomerByExternalId(externalId: string): Promise<Customer | null> {
    // TODO: Implement PayPal payer retrieval
    throw new Error('PayPal gateway not yet implemented');
  }

  async verifyWebhookEvent(
    headers: Record<string, string>,
    rawBody: string | Buffer
  ): Promise<WebhookEvent> {
    // TODO: Implement PayPal webhook signature verification
    // https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-signature
    throw new Error('PayPal gateway not yet implemented');
  }

  mapEventToDomain(event: WebhookEvent): DomainEvent {
    // TODO: Map PayPal events to domain events
    // PAYMENT.SALE.COMPLETED -> payment_succeeded
    // BILLING.SUBSCRIPTION.ACTIVATED -> subscription_created
    // BILLING.SUBSCRIPTION.CANCELLED -> subscription_deleted
    throw new Error('PayPal gateway not yet implemented');
  }

  async getSubscription(externalSubId: string): Promise<any> {
    // TODO: Implement PayPal subscription retrieval
    throw new Error('PayPal gateway not yet implemented');
  }

  async cancelSubscription(
    externalSubId: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<any> {
    // TODO: Implement PayPal subscription cancellation
    throw new Error('PayPal gateway not yet implemented');
  }

  async updateSubscription(
    externalSubId: string,
    newPriceId: string,
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  ): Promise<any> {
    // TODO: Implement PayPal subscription update (plan change)
    throw new Error('PayPal gateway not yet implemented');
  }
}
