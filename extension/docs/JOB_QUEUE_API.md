# 📦 Job Queue API Documentation

## Overview

The Job Queue Service manages background job application processing with rate limiting, retry logic, and Supabase persistence.

---

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Popup     │─────▶│  Background.ts   │─────▶│   Supabase  │
│  (User UI)  │      │  (Service Worker)│      │  (Database) │
└─────────────┘      └──────────────────┘      └─────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ JobQueueService  │
                     │  (Queue Manager) │
                     └──────────────────┘
```

---

## Features

✅ **Rate Limiting**: 20 applications per hour per user (configurable)
✅ **Retry Logic**: Up to 3 retries for failed applications
✅ **Priority Queuing**: High, normal, low priority levels
✅ **Cloud Sync**: Persistent storage with Supabase
✅ **Local Fallback**: Chrome storage when offline
✅ **Background Processing**: Automatic queue processing every 30 seconds
✅ **Notifications**: Chrome notifications for queue updates

---

## Message Types

### 1. APPLY_JOB

**Description**: Queue a job application for background processing

**Request:**
```typescript
chrome.runtime.sendMessage({
  type: "APPLY_JOB",
  userId: string,           // User ID (required)
  jobUrl: string,           // Job posting URL (required)
  jobTitle?: string,        // Job title (optional)
  company?: string,         // Company name (optional)
  jobBoard: string,         // Job board name (required)
  profile: object,          // User profile data (required)
  maxRetries?: number,      // Max retry attempts (default: 3)
  priority?: "high" | "normal" | "low",  // Priority (default: "normal")
  metadata?: object         // Additional metadata (optional)
}, (response) => {
  console.log(response);
});
```

**Response:**
```typescript
{
  success: boolean,
  status: "queued" | "error",
  jobId?: string,           // Job ID if successful
  message: string,
  error?: string            // Error message if failed
}
```

**Example:**
```typescript
const profile = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "555-1234",
  resumeUrl: "https://..."
};

chrome.runtime.sendMessage({
  type: "APPLY_JOB",
  userId: user.id,
  jobUrl: "https://jobs.lever.co/company/job-id",
  jobTitle: "Senior Software Engineer",
  company: "TechCorp",
  jobBoard: "lever",
  profile: profile,
  priority: "high"
}, (response) => {
  if (response.success) {
    console.log("Job queued:", response.jobId);
  } else {
    console.error("Queue failed:", response.error);
  }
});
```

---

### 2. GET_QUEUE_STATS

**Description**: Get queue statistics for the current user

**Request:**
```typescript
chrome.runtime.sendMessage({
  type: "GET_QUEUE_STATS",
  userId: string
}, (response) => {
  console.log(response);
});
```

**Response:**
```typescript
{
  success: boolean,
  stats?: {
    queued: number,
    processing: number,
    completed: number,
    failed: number,
    total: number
  },
  error?: string
}
```

**Example:**
```typescript
chrome.runtime.sendMessage({
  type: "GET_QUEUE_STATS",
  userId: user.id
}, (response) => {
  if (response.success) {
    console.log("Queue stats:", response.stats);
    // { queued: 5, processing: 1, completed: 12, failed: 2, total: 20 }
  }
});
```

---

### 3. GET_QUEUED_JOBS

**Description**: Get all queued jobs for the current user

**Request:**
```typescript
chrome.runtime.sendMessage({
  type: "GET_QUEUED_JOBS",
  userId: string
}, (response) => {
  console.log(response);
});
```

**Response:**
```typescript
{
  success: boolean,
  jobs?: JobApplication[],
  error?: string
}

interface JobApplication {
  id: string,
  userId: string,
  jobUrl: string,
  jobTitle?: string,
  company?: string,
  jobBoard: string,
  status: "queued" | "processing" | "completed" | "failed" | "cancelled",
  profile: object,
  queuedAt: string,       // ISO timestamp
  processedAt?: string,   // ISO timestamp
  failureReason?: string,
  retryCount: number,
  maxRetries: number,
  priority: "high" | "normal" | "low",
  metadata?: object
}
```

**Example:**
```typescript
chrome.runtime.sendMessage({
  type: "GET_QUEUED_JOBS",
  userId: user.id
}, (response) => {
  if (response.success) {
    response.jobs.forEach(job => {
      console.log(`${job.jobTitle} at ${job.company} - ${job.status}`);
    });
  }
});
```

---

### 4. CANCEL_JOB

**Description**: Cancel a queued job

**Request:**
```typescript
chrome.runtime.sendMessage({
  type: "CANCEL_JOB",
  jobId: string
}, (response) => {
  console.log(response);
});
```

**Response:**
```typescript
{
  success: boolean,
  message: string,
  error?: string
}
```

**Example:**
```typescript
chrome.runtime.sendMessage({
  type: "CANCEL_JOB",
  jobId: "job-uuid-here"
}, (response) => {
  if (response.success) {
    console.log("Job cancelled successfully");
  }
});
```

---

### 5. PING

**Description**: Health check for background worker

**Request:**
```typescript
chrome.runtime.sendMessage({
  type: "PING"
}, (response) => {
  console.log(response);
});
```

**Response:**
```typescript
{
  status: "pong",
  timestamp: number
}
```

---

## Rate Limiting

The Job Queue Service enforces rate limiting to prevent abuse:

- **Default Limit**: 20 applications per hour per user
- **Configurable**: Set via `VITE_AUTO_APPLY_RATE_LIMIT` environment variable
- **Behavior**: When limit is exceeded, API returns error with minutes until reset

**Rate Limit Response:**
```typescript
{
  success: false,
  message: "Rate limit exceeded. You can apply again in 23 minutes."
}
```

---

## Error Handling

### Retry Logic

- Failed jobs are automatically retried up to `maxRetries` times (default: 3)
- Retry count increments after each failure
- Jobs exceeding max retries are marked as "failed"

### Failure Reasons

Common failure reasons:
- "Content script not responding"
- "Form detection failed"
- "Max retries exceeded"
- "Network error"

---

## Database Schema

See [supabase_migrations/001_create_job_queue_table.sql](../supabase_migrations/001_create_job_queue_table.sql) for full schema.

**Key Fields:**
```sql
job_queue (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  job_url TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  job_board TEXT NOT NULL,
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  profile JSONB NOT NULL,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  priority TEXT DEFAULT 'normal',
  metadata JSONB
)
```

---

## Usage Examples

### Queue Job from Popup

```typescript
// In Popup.tsx
const handleQueueJob = async () => {
  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: "APPLY_JOB",
      userId: user.id,
      jobUrl: currentTab.url,
      jobTitle: detectedJobInfo.title,
      company: detectedJobInfo.company,
      jobBoard: detectedJobBoard,
      profile: userProfile,
      priority: "normal"
    }, resolve);
  });

  if (response.success) {
    setQueueStatus("Job added to queue!");
  } else {
    setQueueStatus(`Error: ${response.error}`);
  }
};
```

### Display Queue Stats

```typescript
// In Popup.tsx
const [queueStats, setQueueStats] = useState(null);

useEffect(() => {
  if (user) {
    chrome.runtime.sendMessage({
      type: "GET_QUEUE_STATS",
      userId: user.id
    }, (response) => {
      if (response.success) {
        setQueueStats(response.stats);
      }
    });
  }
}, [user]);

// Render
{queueStats && (
  <div>
    <p>Queued: {queueStats.queued}</p>
    <p>Processing: {queueStats.processing}</p>
    <p>Completed: {queueStats.completed}</p>
    <p>Failed: {queueStats.failed}</p>
  </div>
)}
```

### List and Cancel Jobs

```typescript
const [queuedJobs, setQueuedJobs] = useState([]);

// Fetch queued jobs
chrome.runtime.sendMessage({
  type: "GET_QUEUED_JOBS",
  userId: user.id
}, (response) => {
  if (response.success) {
    setQueuedJobs(response.jobs);
  }
});

// Cancel a job
const handleCancelJob = (jobId) => {
  chrome.runtime.sendMessage({
    type: "CANCEL_JOB",
    jobId: jobId
  }, (response) => {
    if (response.success) {
      // Refresh job list
      fetchQueuedJobs();
    }
  });
};
```

---

## Background Processing

The Job Queue Service automatically processes queued jobs:

1. **Chrome Alarm**: Triggers every 5 minutes
2. **Service Interval**: Checks queue every 30 seconds
3. **Processing**: Opens job URL in background tab, triggers auto-apply
4. **Success**: Marks job as completed, closes tab after 3 seconds
5. **Failure**: Increments retry count or marks as failed

**Flow:**
```
[Queued] → [Processing] → [Auto-Apply] → [Success/Failure]
                                ↓
                              Retry?
                            Yes ↓ No
                          [Queued] [Failed]
```

---

## Best Practices

1. **Check Profile Completeness**: Validate user profile before queueing
2. **Handle Rate Limits**: Show user when they've hit limit
3. **Display Queue Status**: Keep user informed of queue progress
4. **Allow Cancellation**: Let users cancel queued jobs
5. **Show Notifications**: Use Chrome notifications for updates
6. **Monitor Failures**: Alert users to failed applications

---

## Testing

### Test Rate Limiting

```typescript
// Send 25 jobs quickly (limit is 20/hour)
for (let i = 0; i < 25; i++) {
  chrome.runtime.sendMessage({
    type: "APPLY_JOB",
    userId: user.id,
    jobUrl: `https://example.com/job-${i}`,
    jobBoard: "test",
    profile: testProfile
  }, (response) => {
    console.log(`Job ${i}:`, response.message);
    // Jobs 21-25 should be rate limited
  });
}
```

### Test Background Processing

```bash
# In Chrome DevTools (Service Worker console)
# Check if queue is processing
jobQueueService.getQueueStats('user-id-here')
```

---

## Troubleshooting

### Jobs Not Processing

1. Check background service worker is running: `chrome://extensions/`
2. Open service worker DevTools and check for errors
3. Verify Supabase connection: Check console logs
4. Ensure Chrome alarms are enabled

### Rate Limit Issues

1. Check `VITE_AUTO_APPLY_RATE_LIMIT` in `.env`
2. Clear rate limit: `chrome.storage.local.remove(['rateLimitMap'])`
3. Test with different user account

### Jobs Stuck in Processing

1. Check if content script is injected on job pages
2. Verify job URLs are valid and accessible
3. Review failure reasons in database or local storage

---

## Future Enhancements

- [ ] Batch processing (multiple jobs in parallel)
- [ ] Scheduled applications (apply at specific time)
- [ ] Smart scheduling (avoid peak hours)
- [ ] Application analytics (success rate tracking)
- [ ] Queue prioritization by job score
- [ ] Email notifications for queue updates
