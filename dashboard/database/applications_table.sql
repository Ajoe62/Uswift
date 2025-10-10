-- Applications table for Chrome extension Job Tracker
-- This table tracks job applications with all necessary fields

-- Drop existing table if you want a clean slate (CAUTION: This deletes data!)
-- DROP TABLE IF EXISTS applications CASCADE;

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    job_title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'archived')),
    applied_at DATE NOT NULL DEFAULT CURRENT_DATE,
    job_url TEXT,
    job_board TEXT DEFAULT 'manual',
    notes TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_applications_job_board ON applications(job_board);

-- Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON applications;

-- Create RLS policies
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
