-- Uswift Payment System Database Schema
-- MV3-compliant, PCI SAQ A friendly

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', 'email'
  provider_user_id VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_provider ON users(provider, provider_user_id);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE, -- 'uswift_pro', 'uswift_tokens'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  external_product_id VARCHAR(255), -- Stripe product ID
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_key ON products(key);

-- Prices table
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  external_price_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe price ID
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  unit_amount INTEGER NOT NULL, -- Amount in cents
  type VARCHAR(20) NOT NULL, -- 'recurring' or 'one_time'
  interval VARCHAR(20), -- 'month', 'year' (for recurring)
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_external ON prices(external_price_id);
CREATE INDEX idx_prices_currency ON prices(currency);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
  external_sub_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe subscription ID
  price_id UUID REFERENCES prices(id),
  status VARCHAR(50) NOT NULL, -- 'active', 'past_due', 'canceled', 'incomplete', etc.
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_external ON subscriptions(external_sub_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
  external_payment_id VARCHAR(255) NOT NULL, -- Stripe charge/payment intent ID
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  kind VARCHAR(20) NOT NULL, -- 'one_time' or 'subscription'
  status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  payment_method_type VARCHAR(50), -- 'card', 'apple_pay', 'google_pay', etc.
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_external ON payments(external_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_kind ON payments(kind);

-- Entitlements table (source of truth for features)
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
  status VARCHAR(50) NOT NULL, -- 'active', 'past_due', 'canceled', 'expired'
  features JSONB NOT NULL DEFAULT '[]', -- ['auto_apply', 'ai_resume', 'priority_support']
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMP WITH TIME ZONE, -- NULL = indefinite
  source VARCHAR(50), -- 'subscription', 'one_time', 'manual', 'trial'
  source_id UUID, -- ID of subscription or payment
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_status ON entitlements(status);
CREATE INDEX idx_entitlements_valid ON entitlements(valid_from, valid_to);
CREATE UNIQUE INDEX idx_entitlements_user_active ON entitlements(user_id)
  WHERE status = 'active';

-- Webhook events table (idempotency + audit)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
  external_event_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe event ID
  type VARCHAR(100) NOT NULL, -- 'checkout.session.completed', etc.
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_external ON webhook_events(external_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at);

-- Refunds table
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  external_refund_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe refund ID
  amount INTEGER NOT NULL, -- Amount in cents
  reason VARCHAR(100), -- 'requested_by_customer', 'duplicate', 'fraudulent'
  status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_external ON refunds(external_refund_id);

-- Disputes table
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  external_dispute_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe dispute ID
  amount INTEGER NOT NULL,
  reason VARCHAR(100),
  status VARCHAR(50) NOT NULL, -- 'warning_needs_response', 'warning_under_review', 'won', 'lost'
  evidence_due_by TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disputes_payment ON disputes(payment_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  external_promo_id VARCHAR(255), -- Stripe promo code ID
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value INTEGER NOT NULL, -- 20 (for 20%) or 1000 (for $10.00)
  currency VARCHAR(3), -- Only for fixed discounts
  max_redemptions INTEGER,
  times_redeemed INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(active);

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'subscription_created', 'entitlement_granted', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'subscription', 'payment', 'entitlement'
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entitlements_updated_at BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with provider authentication and Stripe customer mapping';
COMMENT ON TABLE products IS 'Products available for purchase (Pro subscription, token bundles)';
COMMENT ON TABLE prices IS 'Pricing options for products (monthly, annual, one-time)';
COMMENT ON TABLE subscriptions IS 'Active and historical subscriptions';
COMMENT ON TABLE payments IS 'Individual payment transactions (both one-time and subscription-based)';
COMMENT ON TABLE entitlements IS 'User feature entitlements - source of truth for access control';
COMMENT ON TABLE webhook_events IS 'Idempotent webhook event processing with retry support';
COMMENT ON TABLE refunds IS 'Payment refunds issued';
COMMENT ON TABLE disputes IS 'Payment disputes (chargebacks)';
COMMENT ON TABLE promo_codes IS 'Promotional discount codes';
COMMENT ON TABLE audit_logs IS 'Audit trail for all payment and entitlement changes';
