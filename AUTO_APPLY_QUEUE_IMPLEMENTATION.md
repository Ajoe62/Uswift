# Auto-Apply Queue Implementation

## Overview

This document describes the LLM-orchestrated job application queue system for Uswift. The system enables secure, consent-based automatic job applications with CAPTCHA detection, rate limiting, and comprehensive safety mechanisms.

## Architecture

```
┌─────────────┐
│  Extension  │
│   (Chrome)  │
└──────┬──────┘
       │
       │ 1. Enqueue Job
       ▼
┌─────────────────────────────────────────┐
│     Payment Backend (Express.js)        │
│  ┌───────────┐       ┌──────────────┐  │
│  │  Jobs API │──────▶│  Job Service │  │
│  └───────────┘       └──────┬───────┘  │
│                             │           │
│                             ▼           │
│                      ┌──────────────┐   │
│                      │  PostgreSQL  │   │
│                      │  Jobs Table  │   │
│                      └──────────────┘   │
│                             │           │
│                             ▼           │
│  ┌───────────┐       ┌──────────────┐  │
│  │  BullMQ   │◀─────▶│  JobWorker   │  │
│  │  Queue    │       │  (LLM Orch)  │  │
│  └─────┬─────┘       └──────────────┘  │
│        │                                │
│        ▼                                │
│  ┌──────────┐                          │
│  │  Redis   │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
       │
       │ 2. Poll Status
       │ 3. Fetch Instructions (JWT)
       ▼
┌─────────────┐
│  Extension  │
│  Content    │◀─── 4. Execute Job
│  Script     │     (with safety checks)
└─────────────┘
```

## Components

### 1. Database Schema

**Jobs Table** (`payment-backend/migrations/002_jobs_table.sql`)

Tracks queued job applications with the following key fields:

- `id`: UUID primary key
- `user_id`: References users table
- `job_url`, `job_title`, `company_name`, `platform`: Job details
- `status`: `queued`, `processing`, `awaiting_captcha`, `awaiting_consent`, `completed`, `failed`, `cancelled`
- `llm_instructions`: JSONB - LLM-generated fill instructions
- `instruction_token`: JWT token for secure instruction validation
- `priority`: Integer for job prioritization
- `retry_count`, `max_retries`: Retry logic

**Additional Tables:**
- `job_audit_logs`: Detailed step-by-step tracking
- `job_captcha_events`: CAPTCHA detection tracking
- `job_consent_events`: User consent tracking
- `job_rate_limits`: Rate limiting enforcement

### 2. Backend Services

#### JobService (`payment-backend/src/services/JobService.ts`)

Core database operations:
- `createJob()`: Create new job in database
- `updateJob()`: Update job status and metadata
- `generateInstructionToken()`: Create signed JWT for instructions
- `verifyInstructionToken()`: Validate instruction JWT
- `recordCaptchaEvent()`: Track CAPTCHA encounters
- `recordConsentRequest()`: Track consent requests
- `checkRateLimit()`: Enforce rate limits

#### JobQueue (`payment-backend/src/queues/JobQueue.ts`)

BullMQ queue management:
- `enqueue()`: Add job to Redis queue
- `getJobStatus()`: Check job state in queue
- `cancelJob()`: Remove job from queue
- `getMetrics()`: Queue statistics

#### JobWorker (`payment-backend/src/workers/JobWorker.ts`)

LLM orchestration worker:
1. **Analyze Job Page**: Fetch and analyze job page content
2. **Generate Instructions**: Create fill instructions via LLM
3. **Sign Instructions**: Create JWT token
4. **Update Database**: Store instructions and token

**Worker Features:**
- Concurrency: 5 jobs simultaneously
- Rate limiting: Max 10 jobs per 60 seconds
- Automatic retry on failure (3 attempts)

### 3. API Routes

**POST** `/api/jobs/enqueue`
- Enqueue a new job application
- Checks rate limits (10/hour, 50/day)
- Returns job ID and status

**GET** `/api/jobs/:jobId`
- Get job status and details
- Returns current job state

**GET** `/api/jobs/:jobId/instructions`
- Fetch LLM-generated instructions (JWT secured)
- Only available when job processing is complete

**GET** `/api/jobs`
- List user's jobs (paginated)

**DELETE** `/api/jobs/:jobId`
- Cancel a queued job

### 4. Extension Integration

#### BackendJobService (`extension/src/services/BackendJobService.ts`)

Extension-side job queue client:
- `enqueueJob()`: Submit job to backend queue
- `getJobStatus()`: Poll job status
- `getJobInstructions()`: Fetch signed instructions
- `cancelJob()`: Cancel job
- **Auto-polling**: Polls job status every 5 seconds until completion

#### JobExecutor (`extension/src/jobExecutor.ts`)

Content script executor with safety features:

**Safety Checks:**
1. **CAPTCHA Detection**: Detects reCAPTCHA, hCaptcha before execution
2. **Consent UI**: Shows preview overlay before submission
3. **Field Validation**: Ensures required fields are filled
4. **Secure Instructions**: Validates JWT token

**Execution Flow:**
1. Detect CAPTCHA → Abort if found
2. Fill form fields → From LLM instructions
3. Upload files → Resume, cover letter
4. Show preview → Request user consent
5. Validate fields → Check required fields
6. Submit form → Click submit button

## Security

### Instruction Token (JWT)

Instructions are signed with JWT to prevent tampering:

```typescript
{
  jobId: string,
  instructions: object,
  type: 'job_instructions',
  exp: timestamp // 1 hour expiry
}
```

**Secret**: `EXTENSION_TOKEN_SECRET` environment variable

**Validation**: Backend verifies token before allowing extension to execute

### Rate Limiting

**Per-user limits:**
- 10 applications per hour (per company/platform)
- 50 applications per day (global)

**Implemented in:**
- API layer (before enqueuing)
- Database (`job_rate_limits` table)

### CORS

Backend accepts requests from:
- Chrome extension origins (`chrome-extension://...`)
- Configured web domains (`CORS_ORIGINS`)

## Safety Features

### 1. CAPTCHA Detection

Detects common CAPTCHA providers:
- Google reCAPTCHA (v2, v3)
- hCaptcha
- Cloudflare Turnstile

**Action**: Pauses job, changes status to `awaiting_captcha`, notifies user

### 2. Consent UI

**Preview Consent**: Shows overlay with filled form preview before submission

**Submit Consent**: Confirms before clicking submit button

**User Actions**: Approve or Reject

### 3. Audit Logging

Every job step is logged:
- `enqueued`
- `llm_analysis_started`
- `instructions_generated`
- `captcha_detected`
- `consent_requested`
- `consent_approved` / `consent_rejected`
- `completed` / `failed`

### 4. Field Validation

Before submission:
- Checks all required fields are filled
- Validates field types (email, phone)
- Ensures file uploads are present

## Configuration

### Backend Environment Variables

```bash
# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue Settings
QUEUE_WORKER_CONCURRENCY=5
QUEUE_RATE_LIMIT_MAX=10
QUEUE_RATE_LIMIT_DURATION=60000

# Security
EXTENSION_TOKEN_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/uswift_payments
```

### Extension Configuration

```typescript
// extension/src/config.js or .env
VITE_BACKEND_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

## LLM Integration (TODO)

Current implementation uses placeholders for LLM. To integrate real LLM:

### 1. Update JobWorker.analyzJobPage()

```typescript
private async analyzJobPage(jobUrl: string): Promise<any> {
  // Fetch page HTML
  const html = await fetchPage(jobUrl);

  // Send to LLM (Mistral, GPT-4, Claude)
  const analysis = await mistralClient.chat({
    model: 'mistral-large',
    messages: [{
      role: 'user',
      content: `Analyze this job application form and extract fields: ${html}`
    }]
  });

  return analysis;
}
```

### 2. Update JobWorker.generateInstructions()

```typescript
private async generateInstructions(analysis: any, userId: string): Promise<any> {
  // Fetch user profile
  const profile = await fetchUserProfile(userId);

  // Generate personalized instructions
  const instructions = await mistralClient.chat({
    model: 'mistral-large',
    messages: [{
      role: 'user',
      content: `Generate form fill instructions for: ${JSON.stringify(analysis)}
                User profile: ${JSON.stringify(profile)}`
    }]
  });

  return instructions;
}
```

## Observability (TODO)

### Metrics to Track

- Queue depth (waiting jobs)
- Processing time per job
- Success/failure rates
- CAPTCHA encounter rate
- Consent approval rate
- Rate limit hits

### Logging

Uses Winston logger with structured logging:

```typescript
logger.info('Job enqueued', { jobId, userId, platform });
logger.error('Job failed', { jobId, error: err.message });
```

### Monitoring Integrations

- **Sentry**: Error tracking (configure `SENTRY_DSN`)
- **Datadog/Prometheus**: Metrics (add exporters)
- **LogRocket**: Session replay for debugging

## Testing

### Unit Tests

```bash
cd payment-backend
npm run test
```

### E2E Tests (TODO)

Test auto-apply on staging job boards:

```typescript
describe('Auto-Apply E2E', () => {
  it('should complete LinkedIn Easy Apply', async () => {
    const job = await enqueueJob({
      jobUrl: 'https://linkedin.com/jobs/...',
      platform: 'linkedin',
    });

    // Poll until completed
    await waitForJobCompletion(job.id);

    // Verify application was submitted
    const status = await getJobStatus(job.id);
    expect(status).toBe('completed');
  });
});
```

## Deployment

### 1. Run Database Migrations

```bash
cd payment-backend
psql $DATABASE_URL < migrations/001_initial_schema.sql
psql $DATABASE_URL < migrations/002_jobs_table.sql
```

### 2. Start Redis

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 3. Start Backend

```bash
cd payment-backend
npm install
npm run build
npm run start
```

### 4. Build Extension

```bash
cd extension
npm install
npm run build:prod
```

### 5. Load Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/` folder

## Usage

### 1. Enqueue Job from Extension

```typescript
import { backendJobService } from './services/BackendJobService';

const result = await backendJobService.enqueueJob({
  jobUrl: 'https://greenhouse.io/company/jobs/12345',
  jobTitle: 'Software Engineer',
  companyName: 'Acme Corp',
  platform: 'greenhouse',
  priority: 5,
});

if (result.success) {
  console.log('Job enqueued:', result.job.id);
}
```

### 2. Monitor Job Progress

Job service automatically polls status every 5 seconds. Listen for updates:

```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'JOB_STATUS_UPDATE') {
    console.log('Job status:', message.status);
  }

  if (message.type === 'JOB_INSTRUCTIONS_READY') {
    console.log('Instructions ready, executing...');
  }
});
```

### 3. Cancel Job

```typescript
await backendJobService.cancelJob(jobId);
```

## Troubleshooting

### Job stuck in "queued"

- Check Redis is running: `redis-cli ping`
- Check worker is running: Look for "JobWorker initialized" in logs
- Check worker concurrency limit

### "Not authenticated" error

- Ensure `authToken` is stored in `chrome.storage.local`
- Check JWT is valid and not expired
- Verify `Authorization` header format: `Bearer <token>`

### CAPTCHA always detected

- Check CAPTCHA detection selectors are up-to-date
- Verify page doesn't have hidden CAPTCHAs
- Consider allowlisting certain platforms

### Rate limit exceeded

- Check `job_rate_limits` table for user's limits
- Adjust limits in `JobService.checkRateLimit()`
- Clear old rate limit entries

## Next Steps

1. ✅ Jobs table + enqueue API
2. ✅ BullMQ skeleton
3. ✅ Worker LLM orchestration
4. ✅ Instruction token signing
5. ✅ Extension polling
6. ✅ Secure fetch for instructions
7. ⏳ Content script fill/submit preview
8. ⏳ CAPTCHA detection
9. ⏳ Consent UI
10. ⏳ Observability
11. ⏳ E2E tests

## License

Proprietary - Uswift 2025
