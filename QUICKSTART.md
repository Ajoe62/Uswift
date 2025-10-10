# Uswift Payment System - Quick Start Guide

Get the payment system running locally in 10 minutes.

## Prerequisites

```bash
# Check you have these installed:
node --version  # v18+
npm --version   # v9+
psql --version  # PostgreSQL 14+
git --version   # v2+

# Install Stripe CLI
brew install stripe/stripe-cli/stripe
# or
scoop install stripe
```

## Step 1: Clone & Install (2 min)

```bash
# Backend
cd payment-backend
npm install

# Payment Web App
cd ../payment-webapp
npm install

# Extension (if not already done)
cd ../extension
npm install
```

## Step 2: Database Setup (2 min)

```bash
# Create database
createdb uswift_payments

# Run migrations
psql uswift_payments < payment-backend/migrations/001_initial_schema.sql

# Seed data (optional)
psql uswift_payments < payment-backend/migrations/seed.sql
```

## Step 3: Stripe Setup (3 min)

```bash
# Login to Stripe
stripe login

# Get test API keys
stripe keys list

# Create test products & prices
stripe products create --name "Uswift Pro" --description "Premium features"
# Copy product ID: prod_xxxxx

stripe prices create \
  --product prod_xxxxx \
  --unit-amount 999 \
  --currency usd \
  --recurring.interval month
# Copy price ID: price_monthly_xxxxx

stripe prices create \
  --product prod_xxxxx \
  --unit-amount 9900 \
  --currency usd \
  --recurring.interval year
# Copy price ID: price_annual_xxxxx
```

## Step 4: Configure Environment (1 min)

### Backend .env

```bash
cd payment-backend
cp .env.example .env

# Edit .env:
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/uswift_payments
STRIPE_SECRET_KEY=sk_test_xxxxx  # From Stripe CLI
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Will get this in Step 5
JWT_SECRET=dev-secret-change-in-production
EXTENSION_TOKEN_SECRET=dev-extension-secret
ADMIN_API_KEY=dev-admin-key
PRICE_PRO_MONTHLY=price_monthly_xxxxx
PRICE_PRO_ANNUAL=price_annual_xxxxx
```

### Web App .env

```bash
cd payment-webapp
cp .env.example .env

# Edit .env:
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # From Stripe CLI
```

### Extension .env

```bash
cd extension
# Add to existing .env:
VITE_BACKEND_API_URL=http://localhost:3000
VITE_PRICE_PRO_MONTHLY=price_monthly_xxxxx
VITE_PRICE_PRO_ANNUAL=price_annual_xxxxx
VITE_FEATURE_FREE_TRIAL=true
```

## Step 5: Start Everything (2 min)

Open 3 terminals:

**Terminal 1 - Backend:**
```bash
cd payment-backend
npm run dev
# Server running on http://localhost:3000
```

**Terminal 2 - Payment Web App:**
```bash
cd payment-webapp
npm run dev
# App running on http://localhost:3001
```

**Terminal 3 - Stripe Webhooks:**
```bash
cd payment-backend
stripe listen --forward-to localhost:3000/webhooks/stripe
# Copy webhook secret: whsec_xxxxx
# Update backend .env with this secret
# Restart backend (Ctrl+C and npm run dev again)
```

## Step 6: Test (3 min)

### Test Backend Health

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Test Checkout Flow

1. **Build & Load Extension:**
   ```bash
   cd extension
   npm run build
   # Load dist/ folder in Chrome
   ```

2. **Open Extension Popup**

3. **Click "Upgrade to Pro"**
   - Should open Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Complete Payment**
   - Redirects to success page
   - Shows "Activating..."
   - Then shows "Welcome to Pro!"

5. **Verify in Database:**
   ```bash
   psql uswift_payments -c "SELECT * FROM entitlements;"
   # Should show active Pro entitlement
   ```

6. **Check Webhook Events:**
   ```bash
   curl http://localhost:3000/api/admin/webhook-events \
     -H "X-Admin-API-Key: dev-admin-key"
   # Should show processed events
   ```

## Common Issues

### "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# If not, start it:
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### "Webhook verification failed"

```bash
# Make sure webhook secret matches
# 1. Check Stripe CLI output for secret
# 2. Update STRIPE_WEBHOOK_SECRET in .env
# 3. Restart backend
```

### "Extension can't connect to backend"

```bash
# Update extension manifest.json:
{
  "host_permissions": [
    "http://localhost:3000/*"
  ]
}

# Rebuild extension:
cd extension && npm run build
```

### Port already in use

```bash
# Backend (3000):
lsof -ti:3000 | xargs kill

# Web App (3001):
lsof -ti:3001 | xargs kill
```

## Test Different Scenarios

### Test Subscription

```bash
# Monthly subscription (already tested above)
# Test annual subscription: Click "Annual $99" in extension

# Test trial:
# Set VITE_FEATURE_FREE_TRIAL=true in extension/.env
# Rebuild and test checkout
```

### Test Billing Portal

```bash
# In extension popup, click "Manage Billing"
# Should open billing page showing current plan
# Click "Open Billing Portal"
# Should open Stripe Customer Portal
```

### Test Webhook Events

```bash
# Trigger events manually:
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.updated

# Check logs in Terminal 1 (backend)
# Verify in database:
psql uswift_payments -c "SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 5;"
```

### Test Refund

```bash
# Get payment ID from database:
psql uswift_payments -c "SELECT external_payment_id FROM payments LIMIT 1;"

# Issue refund via admin API:
curl -X POST http://localhost:3000/api/admin/refunds \
  -H "X-Admin-API-Key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pi_xxxxx",
    "reason": "requested_by_customer"
  }'

# Verify entitlement revoked:
psql uswift_payments -c "SELECT * FROM entitlements WHERE status = 'expired';"
```

### Test Admin Dashboard

```bash
# Get stats:
curl http://localhost:3000/api/admin/stats \
  -H "X-Admin-API-Key: dev-admin-key"

# View webhook events:
curl http://localhost:3000/api/admin/webhook-events \
  -H "X-Admin-API-Key: dev-admin-key"

# Get user details:
curl http://localhost:3000/api/admin/users/USER_UUID \
  -H "X-Admin-API-Key: dev-admin-key"
```

## Running Tests

```bash
cd payment-backend
npm test

# With coverage:
npm test -- --coverage

# Watch mode:
npm test -- --watch

# Specific test:
npm test -- entitlementService.test.ts
```

## Development Workflow

```bash
# Make changes to backend
# TypeScript compiles automatically (nodemon)
# Refresh browser to test

# Make changes to web app
# Vite hot-reloads automatically

# Make changes to extension
cd extension && npm run build
# Reload extension in Chrome
```

## Useful Commands

```bash
# View logs
cd payment-backend
tail -f logs/combined.log

# View database
psql uswift_payments

# Common queries:
SELECT * FROM entitlements WHERE status = 'active';
SELECT * FROM subscriptions ORDER BY created_at DESC;
SELECT * FROM webhook_events WHERE status = 'failed';
SELECT * FROM payments WHERE status = 'succeeded';

# Clear test data:
TRUNCATE users, subscriptions, payments, entitlements, webhook_events RESTART IDENTITY CASCADE;
```

## Next Steps

Once everything works locally:

1. **Read Full Documentation**
   - [PAYMENT_SYSTEM_README.md](./PAYMENT_SYSTEM_README.md) - Architecture & APIs
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment

2. **Customize**
   - Update pricing in Stripe
   - Customize payment web app UI
   - Add more features to plans
   - Customize email receipts

3. **Deploy to Staging**
   - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Test with staging Stripe account
   - Verify webhooks work

4. **Go to Production**
   - Switch to Stripe live mode
   - Update all API keys
   - Point DNS to production servers
   - Enable monitoring

## Getting Help

- 📚 **Full Docs**: [PAYMENT_SYSTEM_README.md](./PAYMENT_SYSTEM_README.md)
- 🚀 **Deploy Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 📊 **Summary**: [PAYMENT_SYSTEM_SUMMARY.md](./PAYMENT_SYSTEM_SUMMARY.md)
- 🐛 **Issues**: Check logs in `payment-backend/logs/`
- 💬 **Support**: support@uswift.app

---

✅ **You're all set!** Happy coding! 🚀
