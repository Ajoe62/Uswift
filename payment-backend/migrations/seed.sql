-- Seed data for Uswift Payment System
-- Run this after running 001_initial_schema.sql

-- Insert Products
INSERT INTO products (id, key, name, description, external_product_id, active, metadata)
VALUES
  (
    'c7e6f5d4-3b2a-1c0d-9e8f-7a6b5c4d3e2f',
    'uswift_pro',
    'Uswift Pro Subscription',
    'Access to all premium features including automated job applications, AI-powered resume optimization, and unlimited applies',
    'prod_xxxxxxxxxxxxx', -- Replace with actual Stripe product ID
    true,
    '{"features": ["auto_apply", "ai_resume", "ai_cover_letter", "priority_support", "unlimited_applies"]}'
  ),
  (
    'a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    'uswift_tokens',
    'Uswift Token Bundle',
    'One-time purchase for AI credits and advanced features',
    'prod_yyyyyyyyyyyyy', -- Replace with actual Stripe product ID
    true,
    '{"features": ["ai_credits", "advanced_features"], "credits": 1000}'
  )
ON CONFLICT (key) DO NOTHING;

-- Insert Prices
INSERT INTO prices (id, product_id, external_price_id, currency, unit_amount, type, interval, interval_count, active, metadata)
VALUES
  -- Monthly Pro Subscription
  (
    'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
    'c7e6f5d4-3b2a-1c0d-9e8f-7a6b5c4d3e2f',
    'price_monthly_xxxxx', -- Replace with actual Stripe price ID
    'USD',
    999, -- $9.99
    'recurring',
    'month',
    1,
    true,
    '{"display_name": "Pro Monthly", "popular": false}'
  ),
  -- Annual Pro Subscription
  (
    'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7',
    'c7e6f5d4-3b2a-1c0d-9e8f-7a6b5c4d3e2f',
    'price_annual_xxxxx', -- Replace with actual Stripe price ID
    'USD',
    9900, -- $99.00 (save $20/year)
    'recurring',
    'year',
    1,
    true,
    '{"display_name": "Pro Annual", "popular": true, "savings": "Save $20"}'
  ),
  -- EUR Monthly
  (
    'f3g4h5i6-j7k8-l9m0-n1o2-p3q4r5s6t7u8',
    'c7e6f5d4-3b2a-1c0d-9e8f-7a6b5c4d3e2f',
    'price_monthly_eur', -- Replace with actual Stripe price ID
    'EUR',
    899, -- €8.99
    'recurring',
    'month',
    1,
    true,
    '{"display_name": "Pro Monthly (EUR)"}'
  ),
  -- GBP Monthly
  (
    'g4h5i6j7-k8l9-m0n1-o2p3-q4r5s6t7u8v9',
    'c7e6f5d4-3b2a-1c0d-9e8f-7a6b5c4d3e2f',
    'price_monthly_gbp', -- Replace with actual Stripe price ID
    'GBP',
    799, -- £7.99
    'recurring',
    'month',
    1,
    true,
    '{"display_name": "Pro Monthly (GBP)"}'
  ),
  -- Token Bundle - 1000 credits
  (
    'h5i6j7k8-l9m0-n1o2-p3q4-r5s6t7u8v9w0',
    'a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    'price_tokens_1000', -- Replace with actual Stripe price ID
    'USD',
    1999, -- $19.99
    'one_time',
    NULL,
    NULL,
    true,
    '{"display_name": "1000 AI Credits", "credits": 1000}'
  )
ON CONFLICT (external_price_id) DO NOTHING;

-- Insert Sample Promo Codes (optional)
INSERT INTO promo_codes (id, code, external_promo_id, discount_type, discount_value, max_redemptions, active, expires_at, metadata)
VALUES
  (
    'i6j7k8l9-m0n1-o2p3-q4r5-s6t7u8v9w0x1',
    'WELCOME20',
    'promo_xxxxxxxxxxxxx', -- Replace with actual Stripe promo code ID
    'percentage',
    20, -- 20% off
    1000,
    true,
    NOW() + INTERVAL '90 days',
    '{"description": "Welcome discount for new users", "campaign": "launch"}'
  ),
  (
    'j7k8l9m0-n1o2-p3q4-r5s6-t7u8v9w0x1y2',
    'ANNUAL50',
    'promo_yyyyyyyyyyyyy', -- Replace with actual Stripe promo code ID
    'percentage',
    50, -- 50% off
    500,
    true,
    NOW() + INTERVAL '30 days',
    '{"description": "50% off annual plan", "campaign": "annual_promo"}'
  )
ON CONFLICT (code) DO NOTHING;

-- Sample test user (for development only)
-- Remove or comment out in production
INSERT INTO users (id, email, provider, provider_user_id, stripe_customer_id, metadata)
VALUES
  (
    'test-user-uuid-123',
    'test@uswift.app',
    'email',
    'test-provider-id',
    NULL, -- Will be filled when user makes first purchase
    '{"test": true, "environment": "development"}'
  )
ON CONFLICT (email) DO NOTHING;

-- Grant test user a free trial (for development only)
-- Remove or comment out in production
INSERT INTO entitlements (id, user_id, plan, status, features, valid_from, valid_to, source, metadata)
VALUES
  (
    'test-entitlement-uuid-123',
    'test-user-uuid-123',
    'pro',
    'active',
    '["auto_apply", "ai_resume", "ai_cover_letter", "priority_support", "unlimited_applies"]',
    NOW(),
    NOW() + INTERVAL '14 days',
    'trial',
    '{"test": true, "trial_days": 14}'
  )
ON CONFLICT DO NOTHING;

-- Create indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_entitlements_user_status ON entitlements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status_created ON webhook_events(status, created_at);

-- Add check constraints for data integrity
ALTER TABLE prices
ADD CONSTRAINT check_unit_amount_positive CHECK (unit_amount > 0);

ALTER TABLE payments
ADD CONSTRAINT check_payment_amount_positive CHECK (amount >= 0);

ALTER TABLE refunds
ADD CONSTRAINT check_refund_amount_positive CHECK (amount > 0);

-- Create view for active subscriptions with user details
CREATE OR REPLACE VIEW active_subscriptions_view AS
SELECT
  s.id AS subscription_id,
  s.external_sub_id,
  s.status,
  s.current_period_end,
  u.id AS user_id,
  u.email,
  p.external_price_id,
  pr.name AS product_name,
  pr.key AS product_key
FROM subscriptions s
JOIN users u ON s.user_id = u.id
LEFT JOIN prices p ON s.price_id = p.id
LEFT JOIN products pr ON p.product_id = pr.id
WHERE s.status IN ('active', 'past_due');

-- Create view for MRR (Monthly Recurring Revenue) calculation
CREATE OR REPLACE VIEW mrr_view AS
SELECT
  COUNT(DISTINCT s.user_id) AS active_subscribers,
  SUM(
    CASE
      WHEN p.interval = 'month' THEN p.unit_amount
      WHEN p.interval = 'year' THEN p.unit_amount / 12
      ELSE 0
    END
  ) AS mrr_cents,
  p.currency
FROM subscriptions s
JOIN prices p ON s.price_id = p.id
WHERE s.status = 'active'
GROUP BY p.currency;

-- Log seed data completion
DO $$
BEGIN
  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM products);
  RAISE NOTICE 'Prices: %', (SELECT COUNT(*) FROM prices);
  RAISE NOTICE 'Promo Codes: %', (SELECT COUNT(*) FROM promo_codes);
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Replace placeholder Stripe IDs with actual values from your Stripe dashboard:';
  RAISE NOTICE '  - products.external_product_id';
  RAISE NOTICE '  - prices.external_price_id';
  RAISE NOTICE '  - promo_codes.external_promo_id';
END $$;
