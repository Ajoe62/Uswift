# Uswift Payment System - Deployment Guide

## Quick Start Checklist

- [ ] Database setup completed
- [ ] Stripe account configured
- [ ] Environment variables set
- [ ] Backend deployed
- [ ] Payment web app deployed
- [ ] Webhooks registered
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Extension updated with payment URLs
- [ ] Test checkout flow end-to-end

## Prerequisites

### Required Accounts & Services

1. **Stripe Account** (https://dashboard.stripe.com)
   - Create account
   - Complete business verification
   - Enable live mode

2. **Domain & SSL**
   - Domain for payment app (e.g., pay.uswift.app)
   - SSL certificate (Let's Encrypt recommended)

3. **Database**
   - PostgreSQL 14+ instance
   - Connection string/credentials

4. **Hosting**
   Choose one:
   - Railway (recommended for simplicity)
   - Heroku
   - AWS (ECS/EC2)
   - Digital Ocean
   - Vercel/Netlify (for web app)

## Step-by-Step Deployment

### 1. Database Setup

#### Option A: Managed PostgreSQL (Recommended)

```bash
# Use Railway, Heroku Postgres, or AWS RDS
# Get connection string: postgresql://user:pass@host:5432/dbname
```

#### Option B: Self-Hosted

```bash
# Install PostgreSQL
sudo apt-get install postgresql-15

# Create database
sudo -u postgres createdb uswift_payments

# Run migrations
psql postgresql://localhost/uswift_payments < payment-backend/migrations/001_initial_schema.sql
```

### 2. Stripe Configuration

#### Create Products & Prices

```bash
# Use Stripe Dashboard or CLI

# Create product
stripe products create \
  --name "Uswift Pro" \
  --description "Premium job application features"

# Create monthly price
stripe prices create \
  --product prod_xxx \
  --unit-amount 999 \
  --currency usd \
  --recurring.interval month

# Create annual price
stripe prices create \
  --product prod_xxx \
  --unit-amount 9900 \
  --currency usd \
  --recurring.interval year

# Note the price IDs: price_xxxxxxxxxxxxx
```

#### Configure Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://api.uswift.app/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Copy webhook secret: `whsec_xxxxxxxxxxxxx`

#### Enable Stripe Tax (Optional)

1. Go to: https://dashboard.stripe.com/settings/tax
2. Enable automatic tax calculation
3. Configure tax rates for your regions

### 3. Backend Deployment

#### Option A: Railway (Fastest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd payment-backend
railway init

# Add PostgreSQL
railway add --database postgresql

# Set environment variables
railway variables set STRIPE_SECRET_KEY=sk_live_xxx
railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxx
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set EXTENSION_TOKEN_SECRET=$(openssl rand -hex 32)
railway variables set ADMIN_API_KEY=$(openssl rand -hex 32)
railway variables set PRICE_PRO_MONTHLY=price_xxx
railway variables set PRICE_PRO_ANNUAL=price_xxx
railway variables set APP_DOMAIN=https://pay.uswift.app
railway variables set NODE_ENV=production

# Deploy
railway up

# Get deployment URL
railway domain
```

#### Option B: Docker (Self-Hosted)

```bash
cd payment-backend

# Build image
docker build -t uswift-payment-backend .

# Run with environment variables
docker run -d \
  --name uswift-payment \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e STRIPE_SECRET_KEY=sk_live_xxx \
  -e STRIPE_WEBHOOK_SECRET=whsec_xxx \
  -e JWT_SECRET=xxx \
  -e EXTENSION_TOKEN_SECRET=xxx \
  -e ADMIN_API_KEY=xxx \
  -e PRICE_PRO_MONTHLY=price_xxx \
  -e PRICE_PRO_ANNUAL=price_xxx \
  -e NODE_ENV=production \
  uswift-payment-backend

# Or use docker-compose
docker-compose up -d
```

#### Option C: Heroku

```bash
cd payment-backend

# Create Heroku app
heroku create uswift-payment-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxx
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set EXTENSION_TOKEN_SECRET=$(openssl rand -hex 32)
heroku config:set ADMIN_API_KEY=$(openssl rand -hex 32)
heroku config:set PRICE_PRO_MONTHLY=price_xxx
heroku config:set PRICE_PRO_ANNUAL=price_xxx
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run migrations
heroku run bash
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

### 4. Payment Web App Deployment

#### Option A: Vercel (Recommended)

```bash
cd payment-webapp

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add VITE_API_URL production
# Enter: https://api.uswift.app

vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_xxx

vercel env add VITE_APP_URL production
# Enter: https://pay.uswift.app

# Deploy
vercel --prod

# Set custom domain
vercel domains add pay.uswift.app
```

#### Option B: Netlify

```bash
cd payment-webapp

# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify UI:
# - VITE_API_URL=https://api.uswift.app
# - VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
# - VITE_APP_URL=https://pay.uswift.app

# Configure custom domain in Netlify UI
```

### 5. DNS Configuration

Configure DNS records for your domain:

```
# A record for backend
api.uswift.app → Your backend IP/Load Balancer

# CNAME for payment app
pay.uswift.app → your-vercel-deployment.vercel.app
```

### 6. SSL Certificates

#### Option A: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d api.uswift.app

# Copy certificates to nginx
sudo cp /etc/letsencrypt/live/api.uswift.app/fullchain.pem /etc/nginx/ssl/
sudo cp /etc/letsencrypt/live/api.uswift.app/privkey.pem /etc/nginx/ssl/

# Reload nginx
sudo nginx -s reload

# Auto-renew
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet && nginx -s reload
```

#### Option B: Cloudflare (Automatic)

1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS → Full (strict)
4. SSL is handled automatically

### 7. Chrome Extension Configuration

Update `extension/.env`:

```env
# Production API URL
VITE_BACKEND_API_URL=https://api.uswift.app

# Stripe price IDs
VITE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_PRICE_PRO_ANNUAL=price_xxxxxxxxxxxxx

# Features
VITE_FEATURE_FREE_TRIAL=true
VITE_FEATURE_PROMO_CODES=true
```

Update `extension/public/manifest.json`:

```json
{
  "host_permissions": [
    "https://api.uswift.app/*",
    "https://pay.uswift.app/*"
  ]
}
```

Rebuild extension:

```bash
cd extension
npm run build
```

### 8. Seed Database

```bash
# SSH into your server or use database client

# Update seed.sql with actual Stripe IDs
vim migrations/seed.sql

# Run seed
psql $DATABASE_URL < migrations/seed.sql
```

### 9. Smoke Tests

#### Test Backend Health

```bash
curl https://api.uswift.app/health
# Expected: {"status":"ok","timestamp":"...","environment":"production"}
```

#### Test Webhook Endpoint

```bash
stripe trigger checkout.session.completed
# Check backend logs for processing
```

#### Test Full Flow

1. Install extension
2. Click "Upgrade to Pro"
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify success page shows "Active"
5. Check database: `SELECT * FROM entitlements;`
6. Verify features enabled in extension

### 10. Monitoring Setup

#### Set Up Log Aggregation

```bash
# Option A: Papertrail
heroku addons:create papertrail

# Option B: Datadog
npm install dd-trace
# Add to src/index.ts:
require('dd-trace').init()
```

#### Set Up Error Tracking

```bash
# Add Sentry
npm install @sentry/node

# Update src/index.ts:
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

#### Set Up Uptime Monitoring

Services to use:
- Pingdom
- UptimeRobot (free)
- Datadog Synthetics

Monitor:
- `https://api.uswift.app/health` (every 1 min)
- `https://pay.uswift.app` (every 5 min)

#### Set Up Alerts

Create alerts for:
- API error rate > 5%
- Webhook processing failures
- Database connection errors
- Failed payment rate > 10%

## Post-Deployment

### 1. Test Complete User Journey

- [ ] Sign up new user
- [ ] Upgrade to Pro (monthly)
- [ ] Verify features unlocked
- [ ] Test auto-apply
- [ ] Open billing portal
- [ ] Update payment method
- [ ] Change plan (monthly → annual)
- [ ] Cancel subscription
- [ ] Verify access revoked at period end

### 2. Update Documentation

- [ ] Update README with production URLs
- [ ] Document admin access procedures
- [ ] Create runbook for common issues
- [ ] Document backup procedures

### 3. Security Hardening

```bash
# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Disable password authentication
sudo vim /etc/ssh/sshd_config
# Set: PasswordAuthentication no

# Set up fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
```

### 4. Backup Strategy

```bash
# Automated PostgreSQL backups
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-*.sql.gz s3://uswift-backups/

# Cron job (daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

### 5. Performance Optimization

```bash
# Enable Redis caching
npm install ioredis

# Add connection pooling
# Already configured in database.ts (max: 20)

# Enable CDN for payment app
# Vercel/Netlify handle this automatically
```

## Rollback Plan

If deployment fails:

```bash
# Backend rollback (Railway)
railway rollback

# Backend rollback (Heroku)
heroku releases:rollback v123

# Payment app rollback (Vercel)
vercel rollback

# Database rollback
psql $DATABASE_URL < backups/backup-20240115.sql
```

## Troubleshooting

### Webhook Not Receiving Events

```bash
# Check webhook in Stripe Dashboard
# Verify endpoint URL is correct
# Check webhook secret matches

# Test locally:
stripe listen --forward-to http://localhost:3000/webhooks/stripe
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check connection pool
# Look for "max connection" errors in logs
```

### CORS Errors

Update `CORS_ORIGINS` in backend `.env`:
```env
CORS_ORIGINS=https://pay.uswift.app,chrome-extension://*
```

## Support

For deployment issues:
- Check logs: `heroku logs --tail` or `railway logs`
- Review webhook events: Stripe Dashboard → Webhooks
- Database queries: `/api/admin/stats` endpoint
- Contact: devops@uswift.app

## Maintenance

### Monthly Tasks
- [ ] Review failed webhooks
- [ ] Check dispute status
- [ ] Review churn metrics
- [ ] Verify backup integrity

### Quarterly Tasks
- [ ] Security audit
- [ ] Dependency updates
- [ ] Performance review
- [ ] Cost optimization

---

✅ Deployment Complete!

Your production payment system is now live at:
- Backend API: https://api.uswift.app
- Payment App: https://pay.uswift.app
- Admin Dashboard: https://api.uswift.app/api/admin/stats (with API key)
