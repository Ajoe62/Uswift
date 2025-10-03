/**
 * PaymentGateway interface - abstraction for multiple payment providers
 * Allows switching between Stripe, PayPal, Braintree, Adyen without changing business logic
 */

export interface CheckoutSessionInput {
  userId: string;
  priceId?: string;
  planId?: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
  promoCode?: string;
  clientRef?: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
  allowPromotionCodes?: boolean;
  customerEmail?: string;
  locale?: string;
}

export interface CheckoutSessionOutput {
  url: string;
  sessionId: string;
}

export interface PortalSessionInput {
  customerId: string;
  returnUrl: string;
  locale?: string;
}

export interface PortalSessionOutput {
  url: string;
}

export interface PaymentIntentInput {
  userId: string;
  priceId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentOutput {
  clientSecret: string;
  intentId: string;
}

export interface RefundInput {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: 'requested_by_customer' | 'duplicate' | 'fraudulent';
}

export interface RefundOutput {
  refundId: string;
  status: string;
  amount: number;
}

export interface Customer {
  id: string;
  email: string;
  externalId: string;
  metadata?: Record<string, any>;
}

export interface DomainEvent {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  rawPayload: any;
}

/**
 * Abstract PaymentGateway interface
 * All payment providers must implement this interface
 */
export abstract class PaymentGateway {
  abstract readonly name: string;

  /**
   * Create a checkout session (hosted payment page)
   */
  abstract createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput>;

  /**
   * Create a customer portal session (manage billing)
   */
  abstract createPortalSession(
    input: PortalSessionInput
  ): Promise<PortalSessionOutput>;

  /**
   * Create a payment intent (for custom Payment Element integration)
   */
  abstract createPaymentIntent(
    input: PaymentIntentInput
  ): Promise<PaymentIntentOutput>;

  /**
   * Process a refund
   */
  abstract refund(input: RefundInput): Promise<RefundOutput>;

  /**
   * Get or create customer by user ID and email
   */
  abstract getOrCreateCustomer(
    userId: string,
    email: string,
    metadata?: Record<string, string>
  ): Promise<Customer>;

  /**
   * Get customer by external ID (Stripe customer ID, PayPal customer ID, etc.)
   */
  abstract getCustomerByExternalId(externalId: string): Promise<Customer | null>;

  /**
   * Verify webhook event signature
   * Returns the parsed event if valid, throws error if invalid
   */
  abstract verifyWebhookEvent(
    headers: Record<string, string>,
    rawBody: string | Buffer
  ): Promise<WebhookEvent>;

  /**
   * Map gateway-specific event to domain event
   * Converts Stripe/PayPal/etc events to our internal event format
   */
  abstract mapEventToDomain(event: WebhookEvent): DomainEvent;

  /**
   * Get subscription by external ID
   */
  abstract getSubscription(externalSubId: string): Promise<any>;

  /**
   * Cancel subscription
   */
  abstract cancelSubscription(
    externalSubId: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<any>;

  /**
   * Update subscription (change plan, proration)
   */
  abstract updateSubscription(
    externalSubId: string,
    newPriceId: string,
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  ): Promise<any>;
}

/**
 * Factory for creating payment gateways
 */
export class PaymentGatewayFactory {
  private static gateways: Map<string, PaymentGateway> = new Map();

  static register(name: string, gateway: PaymentGateway): void {
    this.gateways.set(name.toLowerCase(), gateway);
  }

  static get(name: string): PaymentGateway {
    const gateway = this.gateways.get(name.toLowerCase());
    if (!gateway) {
      throw new Error(`Payment gateway '${name}' not registered`);
    }
    return gateway;
  }

  static getPrimary(): PaymentGateway {
    return this.get('stripe');
  }

  static getAll(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }
}
