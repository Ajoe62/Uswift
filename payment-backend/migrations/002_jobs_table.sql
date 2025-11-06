-- Auto-Apply Jobs Queue Table
-- Stores queued job applications for LLM-orchestrated auto-apply

-- Jobs table - tracks job application submissions
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Job details
  job_url TEXT NOT NULL,
  job_title VARCHAR(500),
  company_name VARCHAR(255),
  platform VARCHAR(100) NOT NULL, -- 'linkedin', 'greenhouse', 'lever', etc.

  -- Queue status
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  -- 'queued', 'processing', 'awaiting_captcha', 'awaiting_consent',
  -- 'completed', 'failed', 'cancelled'

  priority INTEGER DEFAULT 0, -- Higher = more priority

  -- Processing metadata
  llm_instructions JSONB, -- Secured signed instructions from LLM
  instruction_token TEXT, -- JWT token for secure instruction validation
  instruction_expires_at TIMESTAMP WITH TIME ZONE,

  -- Execution details
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,

  -- Results
  result JSONB, -- Application result with filled fields, errors, etc.
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 2,

  -- Rate limiting
  rate_limit_key VARCHAR(255), -- For per-company or per-platform limits

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX idx_jobs_created ON jobs(created_at);
CREATE INDEX idx_jobs_platform ON jobs(platform);
CREATE INDEX idx_jobs_rate_limit ON jobs(rate_limit_key);

-- Compound index for queue processing (get next job to process)
CREATE INDEX idx_jobs_queue ON jobs(status, priority DESC, created_at ASC)
  WHERE status IN ('queued', 'awaiting_captcha', 'awaiting_consent');

-- Index for user's recent jobs
CREATE INDEX idx_jobs_user_recent ON jobs(user_id, created_at DESC);

-- Job audit log - detailed tracking of job processing steps
CREATE TABLE job_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  step VARCHAR(100) NOT NULL,
  -- 'enqueued', 'llm_analysis_started', 'instructions_generated',
  -- 'form_fill_started', 'captcha_detected', 'consent_requested',
  -- 'submission_started', 'completed', 'failed'

  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'warning', 'info'
  message TEXT,
  details JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_audit_logs_job ON job_audit_logs(job_id, created_at);
CREATE INDEX idx_job_audit_logs_step ON job_audit_logs(step);

-- Job captcha events - tracks CAPTCHA encounters
CREATE TABLE job_captcha_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captcha_type VARCHAR(50), -- 'recaptcha_v2', 'recaptcha_v3', 'hcaptcha', etc.
  captcha_url TEXT,

  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_method VARCHAR(50), -- 'user_manual', 'auto_retry', 'skipped'

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_captcha_events_job ON job_captcha_events(job_id);
CREATE INDEX idx_job_captcha_events_detected ON job_captcha_events(detected_at);

-- Job consent events - tracks user consent interactions
CREATE TABLE job_consent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  consent_type VARCHAR(50) NOT NULL, -- 'form_preview', 'submission_confirm', 'data_validation'

  responded_at TIMESTAMP WITH TIME ZONE,
  user_response VARCHAR(20), -- 'approved', 'rejected', 'modified'

  -- If user modified the form data
  modifications JSONB,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_consent_events_job ON job_consent_events(job_id);
CREATE INDEX idx_job_consent_events_requested ON job_consent_events(requested_at);

-- Rate limit tracking table
CREATE TABLE job_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  limit_type VARCHAR(50) NOT NULL, -- 'per_hour', 'per_day', 'per_company', 'per_platform'
  limit_key VARCHAR(255) NOT NULL, -- Company name, platform, or 'global'

  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,

  count INTEGER DEFAULT 0,
  max_count INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, limit_type, limit_key, window_start)
);

CREATE INDEX idx_job_rate_limits_user ON job_rate_limits(user_id);
CREATE INDEX idx_job_rate_limits_window ON job_rate_limits(window_end);

-- Update trigger for jobs
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_rate_limits_updated_at BEFORE UPDATE ON job_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE jobs IS 'Queued job applications for LLM-orchestrated auto-apply';
COMMENT ON TABLE job_audit_logs IS 'Detailed audit trail of job processing steps';
COMMENT ON TABLE job_captcha_events IS 'CAPTCHA detection and resolution tracking';
COMMENT ON TABLE job_consent_events IS 'User consent requests and responses';
COMMENT ON TABLE job_rate_limits IS 'Rate limiting for job applications';
