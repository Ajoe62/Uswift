-- ========================================
-- Uswift Extension: Job Queue Table
-- ========================================
-- This table stores queued job applications for background processing
-- Run this in your Supabase SQL editor

-- Create job_queue table
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job details
  job_url TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  job_board TEXT NOT NULL,

  -- Application status
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),

  -- User profile data (JSON)
  profile JSONB NOT NULL,

  -- Timestamps
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Error handling
  failure_reason TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,

  -- Priority
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),

  -- Additional metadata
  metadata JSONB,

  -- Indexes for performance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_queue_user_id ON public.job_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_queued_at ON public.job_queue(queued_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON public.job_queue(priority);

-- Create composite index for common query
CREATE INDEX IF NOT EXISTS idx_job_queue_user_status
  ON public.job_queue(user_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own job queue"
  ON public.job_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can insert own jobs"
  ON public.job_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON public.job_queue
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON public.job_queue
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function
CREATE TRIGGER update_job_queue_updated_at
  BEFORE UPDATE ON public.job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_queue TO authenticated;

-- ========================================
-- Example Queries
-- ========================================

-- Get all queued jobs for processing
-- SELECT * FROM job_queue
-- WHERE status = 'queued'
-- ORDER BY priority ASC, queued_at ASC
-- LIMIT 10;

-- Get queue statistics for a user
-- SELECT
--   status,
--   COUNT(*) as count
-- FROM job_queue
-- WHERE user_id = 'YOUR_USER_ID'
-- GROUP BY status;

-- Get failed jobs with retry potential
-- SELECT * FROM job_queue
-- WHERE status = 'failed'
-- AND retry_count < max_retries
-- ORDER BY queued_at DESC;
