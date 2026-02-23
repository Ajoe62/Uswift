# Auto-Apply Queue Setup Guide

Quick start guide for setting up the LLM-orchestrated job application queue system.

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 7+
- Chrome browser (for extension testing)

## Step 1: Install Dependencies

### Backend

```bash
cd payment-backend
npm install
```

This will install:
- `bullmq` - Job queue management
- `ioredis` - Redis client for BullMQ
- `jsonwebtoken` - JWT token signing
- Other existing dependencies

### Extension

```bash
cd extension
npm install
```

No new dependencies required for extension.

## Step 2: Database Setup

### Run Migrations

```bash
cd payment-backend

# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run initial schema (if not already done)
\i migrations/001_initial_schema.sql

# Run jobs table migration
\i migrations/002_jobs_table.sql
```

Or using command line:

```bash
psql $DATABASE_URL < migrations/001_initial_schema.sql
psql $DATABASE_URL < migrations/002_jobs_table.sql
```

### Verify Tables

```sql
-- Check that tables were created
\dt

-- Should see:
-- jobs
-- job_audit_logs
-- job_captcha_events
-- job_consent_events
-- job_rate_limits
```

## Step 3: Redis Setup

### Option A: Docker (Recommended)

```bash
docker run -d \
  --name uswift-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Option B: Local Installation

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases

### Verify Redis

```bash
redis-cli ping
# Should return: PONG
```

## Step 4: Environment Configuration

### Backend (.env)

Create or update `payment-backend/.env`:

```bash
# Existing config...
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/uswift_payments

# Stripe, JWT, etc (existing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your-jwt-secret
EXTENSION_TOKEN_SECRET=your-extension-token-secret

# NEW: Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# NEW: Queue Settings
QUEUE_WORKER_CONCURRENCY=5
QUEUE_RATE_LIMIT_MAX=10
QUEUE_RATE_LIMIT_DURATION=60000

# CORS (add your extension ID if needed)
CORS_ORIGINS=http://localhost:5173,chrome-extension://your-extension-id
```

### Extension

Update `extension/.env` or `extension/src/config.js`:

```javascript
// extension/src/config.js
export const config = {
  backendApiUrl: 'http://localhost:3000',
  supabaseUrl: 'your-supabase-url',
  supabaseAnonKey: 'your-supabase-key',
  // ... other config
};
```

Or if using Vite environment variables (`.env`):

```bash
VITE_BACKEND_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

## Step 5: Start Backend

### Development Mode

```bash
cd payment-backend
npm run dev
```

You should see:

```
info: Database connection test successful
info: Redis connection test successful
info: Job worker initialized and ready
info: Uswift Payment Backend started {"port":3000,"environment":"development"}
```

### Production Mode

```bash
cd payment-backend
npm run build
npm run start
```

## Step 6: Build Extension

```bash
cd extension
npm run build
```

This creates `extension/dist/` folder with compiled extension.

## Step 7: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist/` folder
5. Extension should now appear in your browser

## Step 8: Test the System

### Test 1: Backend Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T...",
  "environment": "development"
}
```

### Test 2: Enqueue a Job (Manual API Test)

First, get an auth token (use your actual user JWT):

```bash
# Test enqueue endpoint
curl -X POST http://localhost:3000/api/jobs/enqueue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobUrl": "https://boards.greenhouse.io/company/jobs/123",
    "jobTitle": "Software Engineer",
    "companyName": "Test Company",
    "platform": "greenhouse",
    "priority": 5
  }'
```

Expected response:
```json
{
  "success": true,
  "job": {
    "id": "uuid-here",
    "status": "queued",
    "jobUrl": "...",
    "platform": "greenhouse",
    "createdAt": "..."
  },
  "rateLimits": {
    "hourly": { "remaining": 9 },
    "daily": { "remaining": 49 }
  }
}
```

### Test 3: Check Queue Metrics

```bash
curl http://localhost:3000/api/jobs/queue/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "metrics": {
    "waiting": 1,
    "active": 0,
    "completed": 0,
    "failed": 0,
    "delayed": 0
  }
}
```

### Test 4: Extension Integration

1. Open Chrome DevTools (F12)
2. Navigate to a job posting (e.g., Greenhouse, Lever, LinkedIn)
3. Open extension popup
4. Click "Auto-Apply" or trigger job enqueue
5. Check console for logs:

```
[BackendJobService] Job enqueued: uuid-here
[BackendJobService] Starting to poll job uuid-here every 5000ms
[BackendJobService] Job uuid-here status: queued
[BackendJobService] Job uuid-here status: processing
[JobExecutor] Received job execution request: uuid-here
[JobExecutor] Starting execution for job uuid-here
```

## Troubleshooting

### Error: "Database connection failed"

- Check PostgreSQL is running: `psql $DATABASE_URL -c "SELECT 1"`
- Verify DATABASE_URL is correct in `.env`
- Check database user has permissions

### Error: "Redis connection failed"

- Check Redis is running: `redis-cli ping`
- Verify REDIS_HOST and REDIS_PORT in `.env`
- Check firewall isn't blocking port 6379

### Error: "Not authenticated"

- Extension needs valid JWT token in `chrome.storage.local`
- Use Supabase auth or generate JWT manually
- Check Authorization header format: `Bearer <token>`

### Jobs not processing

- Check worker is running: Look for "JobWorker initialized" in backend logs
- Check Redis connection: `redis-cli` then `KEYS *`
- Check queue concurrency settings: `QUEUE_WORKER_CONCURRENCY`

### Extension can't connect to backend

- Check CORS settings in backend `src/index.ts`
- Verify `CORS_ORIGINS` includes extension ID
- Check backend URL in extension config

### Rate limit errors

- Default limits: 10/hour per company, 50/day global
- Adjust in `src/routes/jobs.ts` if needed
- Clear rate limits: `DELETE FROM job_rate_limits WHERE user_id = '...'`

## Monitoring

### Check Redis Queue

```bash
redis-cli

# List all keys
KEYS *

# Check queue length
LLEN bull:job-applications:wait

# View job data
GET bull:job-applications:job-id
```

### Check Database Jobs

```sql
-- View all jobs
SELECT id, status, platform, created_at
FROM jobs
ORDER BY created_at DESC
LIMIT 10;

-- Count jobs by status
SELECT status, COUNT(*)
FROM jobs
GROUP BY status;

-- View audit logs for a job
SELECT *
FROM job_audit_logs
WHERE job_id = 'your-job-id'
ORDER BY created_at;
```

### Backend Logs

```bash
# Development (with nodemon)
npm run dev

# Production (with PM2)
pm2 logs uswift-payment-backend
```

## Next Steps

1. **Integrate Real LLM**: Replace placeholder LLM logic in `JobWorker.ts`
2. **Add Observability**: Set up Sentry, Datadog, or Prometheus
3. **Write E2E Tests**: Test auto-apply on real job boards
4. **Deploy**: Use Docker Compose or deploy to cloud (AWS, GCP, etc.)

## Resources

- **BullMQ Docs**: https://docs.bullmq.io/
- **Redis Docs**: https://redis.io/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## Support

For issues or questions:
- Check logs: `payment-backend/logs/` or console
- Review `AUTO_APPLY_QUEUE_IMPLEMENTATION.md` for architecture details
- Check GitHub issues: https://github.com/your-repo/issues
