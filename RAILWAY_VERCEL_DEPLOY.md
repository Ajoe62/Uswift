# Fast & Free Deployment: Railway + Vercel + Cloudflare

Deploy the complete Uswift payment system in **30 minutes** using the best free/low-cost tools.

## 🎯 Stack Overview

- **Backend + Database**: Railway (starts free, ~$5-20/month)
- **Payment Web App**: Vercel (free hobby tier)
- **DNS + SSL**: Cloudflare (free)
- **Payments**: Stripe (2.9% + $0.30 per transaction)

**Total Cost**: $5-20/month + Stripe fees

---

## 📋 Prerequisites Checklist

- [ ] Stripe account created
- [ ] Domain name registered (e.g., uswift.app)
- [ ] GitHub account
- [ ] Railway account (sign up at railway.app)
- [ ] Vercel account (sign up at vercel.com)
- [ ] Cloudflare account (sign up at cloudflare.com)

---

## Part 1: Stripe Setup (5 minutes)

### 1.1 Create Products & Prices

```bash
# Install Stripe CLI
# macOS:
brew install stripe/stripe-cli/stripe

# Windows:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Login
stripe login
```

**Create products in Stripe Dashboard** (easier than CLI):

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
   - **Name**: Uswift Pro
   - **Description**: Premium job application features
   - **Pricing model**: Recurring
   - **Price**: $9.99 USD / month
   - Click "Save product"
   - **Copy the price ID**: `price_xxxxxxxxxxxxx`

3. Add another price to same product:
   - Click "Add another price"
   - **Price**: $99 USD / year
   - Click "Save"
   - **Copy the price ID**: `price_yyyyyyyyyyy`

4. **Save these IDs** - you'll need them later!

### 1.2 Get API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - **Publishable key**: `pk_test_xxxxx` (for web app)
   - **Secret key**: `sk_test_xxxxx` (for backend)

**⚠️ Note**: Use test mode for now. Switch to live mode after testing.

---

## Part 2: Backend Deployment to Railway (10 minutes)

### 2.1 Prepare Code for Railway

Create `payment-backend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Create `payment-backend/.nvmrc`:

```
18.18.0
```

### 2.2 Push to GitHub

```bash
cd payment-backend

# Initialize git if not already
git init
git add .
git commit -m "Initial payment backend"

# Create repo on GitHub (via web UI or gh CLI)
gh repo create uswift-payment-backend --private --source=. --remote=origin --push

# Or manually:
# git remote add origin https://github.com/yourusername/uswift-payment-backend.git
# git push -u origin main
```

### 2.3 Deploy to Railway

1. **Go to** https://railway.app/new
2. **Click** "Deploy from GitHub repo"
3. **Select** your `uswift-payment-backend` repository
4. **Wait** for initial deployment (will fail - that's expected)

### 2.4 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Wait for provisioning (~30 seconds)

### 2.5 Set Environment Variables

1. Click on your **backend service**
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these:

```bash
NODE_ENV=production
PORT=3000

# Stripe (from Part 1)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # We'll get this in Part 3

# Database (Railway auto-fills this)
# Just click "Add Reference" → PostgreSQL → DATABASE_URL

# Security (generate random strings)
JWT_SECRET=<generate-with-command-below>
EXTENSION_TOKEN_SECRET=<generate-with-command-below>
ADMIN_API_KEY=<generate-with-command-below>

# Stripe Price IDs (from Part 1.1)
PRICE_PRO_MONTHLY=price_xxxxx
PRICE_PRO_ANNUAL=price_yyyyyyy

# App settings
APP_DOMAIN=https://pay.uswift.app
SUCCESS_URL=https://pay.uswift.app/success
CANCEL_URL=https://pay.uswift.app/cancel
PRIMARY_CURRENCY=USD
SUPPORTED_CURRENCIES=USD,EUR,GBP
CORS_ORIGINS=https://pay.uswift.app,chrome-extension://*

# Features
FEATURE_SECONDARY_GATEWAY=false
FEATURE_FREE_TRIAL=true
FEATURE_PROMO_CODES=true
FEATURE_STRIPE_TAX=true

# Logs
LOG_LEVEL=info
```

**Generate secrets**:
```bash
# Run these locally to generate random secrets:
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for EXTENSION_TOKEN_SECRET
openssl rand -hex 32  # Use for ADMIN_API_KEY
```

### 2.6 Run Database Migrations

1. In Railway, click on your **backend service**
2. Go to **"Settings"** tab
3. Scroll to **"Service Domains"**
4. Click **"Generate Domain"**
5. Copy the URL (e.g., `your-app.up.railway.app`)

Now connect to PostgreSQL and run migrations:

**Option A: Railway CLI** (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
cd payment-backend
railway link

# Connect to database
railway run psql $DATABASE_URL

# Inside psql, run:
\i migrations/001_initial_schema.sql
\i migrations/seed.sql
\q
```

**Option B: Railway Web Shell**

1. Click on **PostgreSQL service** in Railway
2. Click **"Connect"** tab
3. Copy the connection string
4. Use any PostgreSQL client (TablePlus, pgAdmin, psql)
5. Run the SQL files

### 2.7 Verify Deployment

```bash
curl https://your-app.up.railway.app/health
# Should return: {"status":"ok","timestamp":"...","environment":"production"}
```

✅ **Backend deployed!**

---

## Part 3: Stripe Webhook Configuration (3 minutes)

### 3.1 Add Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-app.up.railway.app/webhooks/stripe`
4. **Description**: "Uswift Production Webhooks"
5. **Events to send**: Select these:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
6. Click **"Add endpoint"**

### 3.2 Get Webhook Secret

1. Click on the webhook you just created
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret: `whsec_xxxxxxxxxxxxx`

### 3.3 Add to Railway

1. Go back to Railway
2. Click on **backend service** → **Variables**
3. Find `STRIPE_WEBHOOK_SECRET`
4. Paste the webhook secret
5. **Deployment will auto-restart**

### 3.4 Test Webhook

```bash
# Send test event from Stripe Dashboard
# Or use CLI:
stripe trigger checkout.session.completed --override checkout_session:metadata.userId=test-user-uuid-123

# Check Railway logs:
# Click backend service → Logs
# Should see: "Webhook event processed successfully"
```

✅ **Webhooks configured!**

---

## Part 4: Payment Web App to Vercel (5 minutes)

### 4.1 Update Environment Variables

Edit `payment-webapp/.env`:

```env
# Backend API (from Railway)
VITE_API_URL=https://your-app.up.railway.app

# Stripe Publishable Key (from Part 1.2)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# App URL (will update after Vercel deployment)
VITE_APP_URL=https://pay.uswift.app
```

### 4.2 Push to GitHub

```bash
cd payment-webapp

git init
git add .
git commit -m "Initial payment web app"

# Create repo
gh repo create uswift-payment-webapp --private --source=. --remote=origin --push
```

### 4.3 Deploy to Vercel

**Option A: Vercel CLI** (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd payment-webapp
vercel

# Follow prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? uswift-payment-webapp
# Directory? ./
# Override settings? No

# Production deployment
vercel --prod
```

**Option B: Vercel Dashboard**

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select `uswift-payment-webapp`
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Environment Variables**: Add these:
   - `VITE_API_URL` = `https://your-app.up.railway.app`
   - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_xxxxx`
   - `VITE_APP_URL` = `https://pay.uswift.app`
8. Click **"Deploy"**

### 4.4 Get Vercel URL

After deployment:
- Copy the URL: `uswift-payment-webapp.vercel.app`

✅ **Web app deployed!**

---

## Part 5: Cloudflare DNS + SSL (5 minutes)

### 5.1 Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click **"Add a Site"**
3. Enter your domain: `uswift.app`
4. Select **Free plan**
5. Click **"Add Site"**
6. Wait for DNS scan

### 5.2 Update Nameservers

1. Cloudflare will show you 2 nameservers:
   ```
   bob.ns.cloudflare.com
   sara.ns.cloudflare.com
   ```
2. Go to your domain registrar (GoDaddy, Namecheap, etc.)
3. Update nameservers to Cloudflare's
4. Wait 5-60 minutes for propagation

### 5.3 Add DNS Records

Once nameservers are updated, add these DNS records in Cloudflare:

**For Payment Web App:**
- **Type**: CNAME
- **Name**: `pay`
- **Target**: `uswift-payment-webapp.vercel.app`
- **Proxy status**: Proxied (orange cloud)

**For Backend API:**
- **Type**: CNAME
- **Name**: `api`
- **Target**: `your-app.up.railway.app`
- **Proxy status**: Proxied (orange cloud)

### 5.4 Configure SSL

1. In Cloudflare, go to **SSL/TLS** tab
2. Set SSL mode to: **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### 5.5 Add Custom Domains

**Vercel:**
1. Go to Vercel project → **Settings** → **Domains**
2. Add domain: `pay.uswift.app`
3. Follow instructions (should auto-configure with Cloudflare)

**Railway:**
1. Go to Railway backend service → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `api.uswift.app`
4. Follow instructions (may need to verify)

Wait 5-10 minutes for DNS propagation.

### 5.6 Update Environment Variables

**Railway Backend:**
- Update `APP_DOMAIN` to `https://pay.uswift.app`
- Update `CORS_ORIGINS` to include `https://pay.uswift.app`

**Vercel Web App:**
- Update `VITE_API_URL` to `https://api.uswift.app`
- Update `VITE_APP_URL` to `https://pay.uswift.app`

**Redeploy both services** after updating.

✅ **SSL configured!**

---

## Part 6: Extension Configuration (2 minutes)

### 6.1 Update Extension Environment

Edit `extension/.env`:

```env
# Add/update these lines:
VITE_BACKEND_API_URL=https://api.uswift.app
VITE_PRICE_PRO_MONTHLY=price_xxxxx
VITE_PRICE_PRO_ANNUAL=price_yyyyyyy
VITE_FEATURE_FREE_TRIAL=true
VITE_FEATURE_PROMO_CODES=true
```

### 6.2 Update Manifest

Edit `extension/public/manifest.json`:

```json
{
  "host_permissions": [
    "https://api.uswift.app/*",
    "https://pay.uswift.app/*",
    "https://*.supabase.co/*"
  ]
}
```

### 6.3 Rebuild Extension

```bash
cd extension
npm run build
```

✅ **Extension configured!**

---

## Part 7: End-to-End Testing (5 minutes)

### 7.1 Test Backend

```bash
# Health check
curl https://api.uswift.app/health

# Should return:
# {"status":"ok","timestamp":"...","environment":"production"}
```

### 7.2 Test Payment Web App

1. Open https://pay.uswift.app
2. Should show: "Uswift Payment Portal"
3. Check browser console - no errors

### 7.3 Test Webhook

```bash
# Trigger test event
stripe trigger checkout.session.completed

# Check Railway logs for:
# "Webhook event processed successfully"

# Or check in database:
railway run psql $DATABASE_URL -c "SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 5;"
```

### 7.4 Test Complete Flow

1. **Load extension** in Chrome
2. **Open popup** → Click "Upgrade to Pro"
3. **Should open** https://pay.uswift.app → redirect to Stripe Checkout
4. **Use test card**: `4242 4242 4242 4242`
5. **Complete payment**
6. **Should redirect** to success page
7. **Should show** "Welcome to Uswift Pro!"
8. **Check database**:
   ```bash
   railway run psql $DATABASE_URL -c "SELECT * FROM entitlements WHERE status = 'active';"
   ```
9. **Extension should** show Pro features unlocked

✅ **All systems operational!**

---

## Part 8: Monitoring & Maintenance (Ongoing)

### 8.1 Railway Monitoring

**View Logs:**
1. Go to Railway dashboard
2. Click backend service → **"Logs"** tab
3. Filter by error level if needed

**View Metrics:**
- Railway shows CPU, Memory, Network automatically
- Click **"Metrics"** tab

**Set Up Alerts:**
1. Click backend service → **"Settings"**
2. Scroll to **"Webhooks"**
3. Add webhook URL for deploy notifications

### 8.2 Vercel Monitoring

**View Deployments:**
1. Go to Vercel dashboard
2. Click project → **"Deployments"**
3. See build logs for each deployment

**Analytics** (Free on Hobby plan):
- Automatically tracks page views
- Shows Web Vitals

### 8.3 Stripe Monitoring

**Dashboard Widgets:**
1. Go to https://dashboard.stripe.com
2. Pin these widgets:
   - Total payments
   - Failed payments
   - Active subscriptions
   - MRR (Monthly Recurring Revenue)

**Set Up Alerts:**
1. Go to **Settings** → **Notifications**
2. Enable:
   - Successful payments (optional)
   - Failed payments (important)
   - Disputes
   - Refunds

### 8.4 Admin Dashboard

```bash
# Get system stats
curl https://api.uswift.app/api/admin/stats \
  -H "X-Admin-API-Key: your-admin-key-here"

# View webhook events
curl https://api.uswift.app/api/admin/webhook-events \
  -H "X-Admin-API-Key: your-admin-key-here"
```

### 8.5 Database Backups

**Railway Auto-Backups:**
- Railway backs up PostgreSQL automatically
- Go to PostgreSQL service → **"Backups"** tab
- Can restore to any point in last 7 days

**Manual Backup:**
```bash
# Export database
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to cloud storage (optional)
# aws s3 cp backup-*.sql s3://your-bucket/
```

---

## 🎯 Success Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created and migrated
- [ ] Webhooks configured in Stripe
- [ ] Payment web app deployed to Vercel
- [ ] DNS configured in Cloudflare
- [ ] SSL certificates active (https://)
- [ ] Extension updated with production URLs
- [ ] Test payment completed successfully
- [ ] Entitlement granted in database
- [ ] Webhook events processing
- [ ] Logs showing no errors
- [ ] Admin API accessible

---

## 💰 Cost Breakdown

### Railway (Backend + Database)
- **Free tier**: $5 credit/month
- **Starter plan**: $5/month + usage
- **Expected**: $5-10/month for small scale
- **Expected**: $20-50/month for 10k users

### Vercel (Payment Web App)
- **Hobby plan**: FREE
- **Pro plan**: $20/month (if needed for more builds)
- **Expected**: $0/month (Hobby is enough)

### Cloudflare (DNS + SSL)
- **Free plan**: FREE
- **Expected**: $0/month

### Stripe (Payment Processing)
- **Per transaction**: 2.9% + $0.30
- **Example**: $9.99 subscription = $0.59 fee
- **No monthly fee**

### Domain
- **Annual cost**: $10-15/year
- **Monthly equivalent**: ~$1/month

**Total Monthly Cost: $6-11/month + Stripe fees**

---

## 🔧 Troubleshooting

### "Railway build failed"

**Check logs** in Railway → Logs tab

**Common fixes:**
```bash
# Ensure package.json has correct scripts:
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js"
}

# Ensure tsconfig.json outDir is "dist"
```

### "Vercel deployment failed"

**Check build logs** in Vercel → Deployments

**Common fixes:**
- Ensure all environment variables are set
- Check `vite.config.ts` is correct
- Verify `package.json` build command

### "Webhook not receiving events"

1. **Check Stripe Dashboard** → Webhooks → Click endpoint
2. **View attempts** - if failing, check:
   - URL is correct: `https://api.uswift.app/webhooks/stripe`
   - Endpoint is reachable (test with curl)
   - Webhook secret matches Railway env var
3. **Resend test event** from Stripe Dashboard

### "CORS error in extension"

1. **Update Railway** `CORS_ORIGINS`:
   ```
   https://pay.uswift.app,chrome-extension://*
   ```
2. **Redeploy** backend
3. **Check** manifest.json has correct `host_permissions`

### "Database connection failed"

**Railway auto-connects** the database if you use "Add Reference"

**Manual connection string format:**
```
postgresql://user:password@host:port/database
```

---

## 🚀 Going to Production (Live Mode)

When ready to accept real payments:

### 1. Switch Stripe to Live Mode

1. Go to Stripe Dashboard
2. Toggle from **Test Mode** to **Live Mode** (top right)
3. Create products/prices in Live Mode
4. Copy new live API keys
5. Update Railway env vars with live keys:
   - `STRIPE_SECRET_KEY` → `sk_live_xxxxx`
   - `STRIPE_PUBLISHABLE_KEY` → `pk_live_xxxxx`
6. Update Vercel env var:
   - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_xxxxx`
7. Add webhook endpoint in Live Mode
8. Update `STRIPE_WEBHOOK_SECRET` in Railway

### 2. Update Extension

- Update `.env` with live price IDs
- Rebuild and submit to Chrome Web Store

### 3. Test with Real Card

- Use your own card for small test ($1 product)
- Complete full flow
- Verify entitlement granted
- Issue refund to yourself

### 4. Monitor Closely

- Watch Railway logs
- Check Stripe Dashboard every hour
- Verify webhooks processing
- Test customer support flow

---

## 📞 Support

### Railway
- Docs: https://docs.railway.app
- Community: https://discord.gg/railway

### Vercel
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### Stripe
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### Your System
- Backend logs: Railway → Backend Service → Logs
- Web app logs: Vercel → Project → Logs
- Database: Railway → PostgreSQL → Connect
- Admin API: `curl https://api.uswift.app/api/admin/stats`

---

## 🎉 You're Live!

Your production payment system is now accepting payments at:

- 🌐 **Payment Portal**: https://pay.uswift.app
- 🔧 **Backend API**: https://api.uswift.app
- 💾 **Database**: Railway PostgreSQL
- 💳 **Payments**: Stripe
- 🔒 **SSL**: Cloudflare

**Next Steps:**
1. Submit extension to Chrome Web Store
2. Market your Pro features
3. Monitor metrics daily
4. Iterate based on user feedback

**Built with ❤️ | Deployed in 30 minutes** 🚀
