"use strict";
/**
 * PaymentGateway interface - abstraction for multiple payment providers
 * Allows switching between Stripe, PayPal, Braintree, Adyen without changing business logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayFactory = exports.PaymentGateway = void 0;
/**
 * Abstract PaymentGateway interface
 * All payment providers must implement this interface
 */
class PaymentGateway {
}
exports.PaymentGateway = PaymentGateway;
/**
 * Factory for creating payment gateways
 */
class PaymentGatewayFactory {
    static gateways = new Map();
    static register(name, gateway) {
        this.gateways.set(name.toLowerCase(), gateway);
    }
    static get(name) {
        const gateway = this.gateways.get(name.toLowerCase());
        if (!gateway) {
            throw new Error(`Payment gateway '${name}' not registered`);
        }
        return gateway;
    }
    static getPrimary() {
        return this.get('stripe');
    }
    static getAll() {
        return Array.from(this.gateways.values());
    }
}
exports.PaymentGatewayFactory = PaymentGatewayFactory;
//# sourceMappingURL=PaymentGateway.js.map