import { StripeGateway } from '../gateways/StripeGateway';
import Stripe from 'stripe';

describe('StripeGateway', () => {
  let gateway: StripeGateway;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    gateway = new StripeGateway('sk_test_xxx', 'whsec_xxx');
    mockStripe = gateway.getStripeInstance() as jest.Mocked<Stripe>;
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session with correct parameters', async () => {
      const mockCustomer = {
        id: 'cus_xxx',
        email: 'test@example.com',
        metadata: {},
      };

      const mockSession = {
        id: 'cs_test_xxx',
        url: 'https://checkout.stripe.com/xxx',
      };

      jest.spyOn(gateway as any, 'getOrCreateCustomer').mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        externalId: 'cus_xxx',
      });

      mockStripe.checkout.sessions.create = jest.fn().mockResolvedValue(mockSession);

      const result = await gateway.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_xxx',
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        customerEmail: 'test@example.com',
      });

      expect(result.url).toBe('https://checkout.stripe.com/xxx');
      expect(result.sessionId).toBe('cs_test_xxx');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: [{ price: 'price_xxx', quantity: 1 }],
        })
      );
    });

    it('should include trial period when specified', async () => {
      jest.spyOn(gateway as any, 'getOrCreateCustomer').mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        externalId: 'cus_xxx',
      });

      const mockSession = {
        id: 'cs_test_xxx',
        url: 'https://checkout.stripe.com/xxx',
      };

      mockStripe.checkout.sessions.create = jest.fn().mockResolvedValue(mockSession);

      await gateway.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_xxx',
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        trialPeriodDays: 14,
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        })
      );
    });
  });

  describe('refund', () => {
    it('should create refund with correct parameters', async () => {
      const mockRefund = {
        id: 're_xxx',
        status: 'succeeded',
        amount: 999,
      };

      mockStripe.refunds.create = jest.fn().mockResolvedValue(mockRefund);

      const result = await gateway.refund({
        paymentId: 'pi_xxx',
        amount: 999,
        reason: 'requested_by_customer',
      });

      expect(result.refundId).toBe('re_xxx');
      expect(result.amount).toBe(999);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_xxx',
        amount: 999,
        reason: 'requested_by_customer',
      });
    });

    it('should create full refund when amount not specified', async () => {
      const mockRefund = {
        id: 're_xxx',
        status: 'succeeded',
        amount: 1999,
      };

      mockStripe.refunds.create = jest.fn().mockResolvedValue(mockRefund);

      await gateway.refund({
        paymentId: 'pi_xxx',
      });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_xxx',
      });
    });
  });

  describe('verifyWebhookEvent', () => {
    it('should verify webhook signature', async () => {
      const mockEvent = {
        id: 'evt_xxx',
        type: 'checkout.session.completed',
        data: { object: {} },
        created: Date.now() / 1000,
      };

      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent);

      const result = await gateway.verifyWebhookEvent(
        { 'stripe-signature': 'sig_xxx' },
        'raw body'
      );

      expect(result.id).toBe('evt_xxx');
      expect(result.type).toBe('checkout.session.completed');
    });

    it('should throw error for invalid signature', async () => {
      mockStripe.webhooks.constructEvent = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('Invalid signature');
        });

      await expect(
        gateway.verifyWebhookEvent({ 'stripe-signature': 'bad_sig' }, 'raw body')
      ).rejects.toThrow('Webhook verification failed');
    });
  });

  describe('mapEventToDomain', () => {
    it('should map Stripe event to domain event', () => {
      const stripeEvent = {
        id: 'evt_xxx',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_xxx' } },
        created: 1234567890,
      };

      const domainEvent = gateway.mapEventToDomain({
        id: 'evt_xxx',
        type: 'checkout.session.completed',
        rawPayload: stripeEvent,
      });

      expect(domainEvent.id).toBe('evt_xxx');
      expect(domainEvent.type).toBe('checkout_completed');
      expect(domainEvent.createdAt).toBeInstanceOf(Date);
    });
  });
});
