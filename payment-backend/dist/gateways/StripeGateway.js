"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeGateway = void 0;
const stripe_1 = __importDefault(require("stripe"));
const PaymentGateway_1 = require("./PaymentGateway");
/**
 * Stripe implementation of PaymentGateway
 * Handles all Stripe-specific logic and API calls
 */
class StripeGateway extends PaymentGateway_1.PaymentGateway {
    name = 'stripe';
    stripe;
    webhookSecret;
    constructor(secretKey, webhookSecret, apiVersion) {
        super();
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: apiVersion || '2023-10-16',
            typescript: true,
        });
        this.webhookSecret = webhookSecret;
    }
    async createCheckoutSession(input) {
        try {
            // Get or create customer
            const customer = await this.getOrCreateCustomer(input.userId, input.customerEmail || '', input.metadata);
            const sessionParams = {
                customer: customer.externalId,
                mode: input.mode,
                success_url: input.successUrl,
                cancel_url: input.cancelUrl,
                client_reference_id: input.clientRef || input.userId,
                metadata: {
                    userId: input.userId,
                    ...input.metadata,
                },
                allow_promotion_codes: input.allowPromotionCodes !== false,
                billing_address_collection: 'auto',
                locale: input.locale || 'auto',
            };
            // Add line items based on mode
            if (input.mode === 'subscription') {
                sessionParams.line_items = [
                    {
                        price: input.priceId,
                        quantity: 1,
                    },
                ];
                // Add trial period if specified
                if (input.trialPeriodDays) {
                    sessionParams.subscription_data = {
                        trial_period_days: input.trialPeriodDays,
                        metadata: input.metadata,
                    };
                }
                // Enable automatic tax if configured
                if (process.env.FEATURE_STRIPE_TAX === 'true') {
                    sessionParams.automatic_tax = { enabled: true };
                }
            }
            else {
                sessionParams.line_items = [
                    {
                        price: input.priceId,
                        quantity: 1,
                    },
                ];
                sessionParams.payment_intent_data = {
                    metadata: input.metadata,
                };
            }
            // Add promo code if provided
            if (input.promoCode) {
                sessionParams.discounts = [{ promotion_code: input.promoCode }];
            }
            // Enable payment methods
            sessionParams.payment_method_types = ['card'];
            // Enable Apple Pay and Google Pay
            sessionParams.payment_method_options = {
                card: {
                    request_three_d_secure: 'automatic', // SCA/3DS support
                },
            };
            const session = await this.stripe.checkout.sessions.create(sessionParams);
            return {
                url: session.url,
                sessionId: session.id,
            };
        }
        catch (error) {
            throw new Error(`Stripe checkout session creation failed: ${error.message}`);
        }
    }
    async createPortalSession(input) {
        try {
            const session = await this.stripe.billingPortal.sessions.create({
                customer: input.customerId,
                return_url: input.returnUrl,
                locale: input.locale,
            });
            return {
                url: session.url,
            };
        }
        catch (error) {
            throw new Error(`Stripe portal session creation failed: ${error.message}`);
        }
    }
    async createPaymentIntent(input) {
        try {
            const customer = await this.getOrCreateCustomer(input.userId, input.customerEmail || '', input.metadata);
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: input.amount,
                currency: input.currency.toLowerCase(),
                customer: customer.externalId,
                metadata: {
                    userId: input.userId,
                    priceId: input.priceId,
                    ...input.metadata,
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return {
                clientSecret: paymentIntent.client_secret,
                intentId: paymentIntent.id,
            };
        }
        catch (error) {
            throw new Error(`Stripe payment intent creation failed: ${error.message}`);
        }
    }
    async refund(input) {
        try {
            const refundParams = {
                payment_intent: input.paymentId,
            };
            if (input.amount) {
                refundParams.amount = input.amount;
            }
            if (input.reason) {
                refundParams.reason = input.reason;
            }
            const refund = await this.stripe.refunds.create(refundParams);
            return {
                refundId: refund.id,
                status: refund.status ?? 'pending',
                amount: refund.amount,
            };
        }
        catch (error) {
            throw new Error(`Stripe refund failed: ${error.message}`);
        }
    }
    async getOrCreateCustomer(userId, email, metadata) {
        try {
            // Search for existing customer by userId in metadata
            const existingCustomers = await this.stripe.customers.list({
                email: email,
                limit: 1,
            });
            if (existingCustomers.data.length > 0) {
                const customer = existingCustomers.data[0];
                return {
                    id: userId,
                    email: customer.email,
                    externalId: customer.id,
                    metadata: customer.metadata,
                };
            }
            // Create new customer
            const customer = await this.stripe.customers.create({
                email: email,
                metadata: {
                    userId: userId,
                    ...metadata,
                },
            });
            return {
                id: userId,
                email: customer.email,
                externalId: customer.id,
                metadata: customer.metadata,
            };
        }
        catch (error) {
            throw new Error(`Stripe customer creation failed: ${error.message}`);
        }
    }
    async getCustomerByExternalId(externalId) {
        try {
            const customer = await this.stripe.customers.retrieve(externalId);
            if (customer.deleted) {
                return null;
            }
            return {
                id: customer.metadata?.userId || '',
                email: customer.email,
                externalId: customer.id,
                metadata: customer.metadata,
            };
        }
        catch (error) {
            if (error.statusCode === 404) {
                return null;
            }
            throw new Error(`Stripe customer retrieval failed: ${error.message}`);
        }
    }
    async verifyWebhookEvent(headers, rawBody) {
        try {
            const signature = headers['stripe-signature'];
            if (!signature) {
                throw new Error('Missing stripe-signature header');
            }
            const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
            return {
                id: event.id,
                type: event.type,
                rawPayload: event,
            };
        }
        catch (error) {
            throw new Error(`Webhook verification failed: ${error.message}`);
        }
    }
    mapEventToDomain(event) {
        const stripeEvent = event.rawPayload;
        return {
            id: stripeEvent.id,
            type: this.mapStripeEventType(stripeEvent.type),
            data: stripeEvent.data.object,
            createdAt: new Date(stripeEvent.created * 1000),
        };
    }
    mapStripeEventType(stripeType) {
        // Map Stripe event types to domain event types
        const mapping = {
            'checkout.session.completed': 'checkout_completed',
            'invoice.paid': 'invoice_paid',
            'invoice.payment_failed': 'invoice_payment_failed',
            'customer.subscription.created': 'subscription_created',
            'customer.subscription.updated': 'subscription_updated',
            'customer.subscription.deleted': 'subscription_deleted',
            'charge.refunded': 'charge_refunded',
            'charge.dispute.created': 'dispute_created',
            'charge.dispute.updated': 'dispute_updated',
            'charge.dispute.closed': 'dispute_closed',
            'payment_intent.succeeded': 'payment_succeeded',
            'payment_intent.payment_failed': 'payment_failed',
        };
        return mapping[stripeType] || stripeType;
    }
    async getSubscription(externalSubId) {
        try {
            return await this.stripe.subscriptions.retrieve(externalSubId);
        }
        catch (error) {
            throw new Error(`Stripe subscription retrieval failed: ${error.message}`);
        }
    }
    async cancelSubscription(externalSubId, cancelAtPeriodEnd = true) {
        try {
            if (cancelAtPeriodEnd) {
                return await this.stripe.subscriptions.update(externalSubId, {
                    cancel_at_period_end: true,
                });
            }
            else {
                return await this.stripe.subscriptions.cancel(externalSubId);
            }
        }
        catch (error) {
            throw new Error(`Stripe subscription cancellation failed: ${error.message}`);
        }
    }
    async updateSubscription(externalSubId, newPriceId, prorationBehavior = 'create_prorations') {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(externalSubId);
            return await this.stripe.subscriptions.update(externalSubId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: newPriceId,
                    },
                ],
                proration_behavior: prorationBehavior,
            });
        }
        catch (error) {
            throw new Error(`Stripe subscription update failed: ${error.message}`);
        }
    }
    /**
     * Get Stripe instance for advanced operations
     */
    getStripeInstance() {
        return this.stripe;
    }
}
exports.StripeGateway = StripeGateway;
//# sourceMappingURL=StripeGateway.js.map