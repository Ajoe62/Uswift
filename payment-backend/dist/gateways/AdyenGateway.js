"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdyenGateway = void 0;
const PaymentGateway_1 = require("./PaymentGateway");
/**
 * Adyen implementation of PaymentGateway (STUB)
 * TODO: Implement Adyen payment processing
 *
 * Documentation:
 * - https://docs.adyen.com/online-payments/
 * - https://docs.adyen.com/online-payments/subscriptions
 */
class AdyenGateway extends PaymentGateway_1.PaymentGateway {
    name = 'adyen';
    constructor(apiKey, merchantAccount, environment = 'test') {
        super();
        // TODO: Initialize Adyen client
    }
    async createCheckoutSession(input) {
        // TODO: Implement Adyen sessions API
        throw new Error('Adyen gateway not yet implemented');
    }
    async createPortalSession(input) {
        // TODO: Build custom portal for Adyen stored payment methods
        throw new Error('Adyen gateway not yet implemented');
    }
    async createPaymentIntent(input) {
        // TODO: Implement Adyen payments API
        throw new Error('Adyen gateway not yet implemented');
    }
    async refund(input) {
        // TODO: Implement Adyen refund
        throw new Error('Adyen gateway not yet implemented');
    }
    async getOrCreateCustomer(userId, email, metadata) {
        // TODO: Implement Adyen shopper management
        throw new Error('Adyen gateway not yet implemented');
    }
    async getCustomerByExternalId(externalId) {
        // TODO: Implement Adyen shopper retrieval
        throw new Error('Adyen gateway not yet implemented');
    }
    async verifyWebhookEvent(headers, rawBody) {
        // TODO: Implement Adyen webhook HMAC signature verification
        throw new Error('Adyen gateway not yet implemented');
    }
    mapEventToDomain(event) {
        // TODO: Map Adyen webhook events to domain events
        throw new Error('Adyen gateway not yet implemented');
    }
    async getSubscription(externalSubId) {
        // TODO: Implement Adyen recurring details retrieval
        throw new Error('Adyen gateway not yet implemented');
    }
    async cancelSubscription(externalSubId, cancelAtPeriodEnd) {
        // TODO: Implement Adyen subscription cancellation
        throw new Error('Adyen gateway not yet implemented');
    }
    async updateSubscription(externalSubId, newPriceId, prorationBehavior) {
        // TODO: Implement Adyen subscription update
        throw new Error('Adyen gateway not yet implemented');
    }
}
exports.AdyenGateway = AdyenGateway;
//# sourceMappingURL=AdyenGateway.js.map