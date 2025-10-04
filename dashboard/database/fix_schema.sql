-- Fix Schema - Add missing columns if tables already exist
-- Run this if you already created the tables but are missing columns

-- First, let's handle the preferences table
DO $$
BEGIN
    -- Add email column if it doesn't exist (we removed it but errors suggest it might be expected)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='preferences' AND column_name='email') THEN
        -- Note: email is in auth.users, not needed in preferences
        -- But if code expects it, we can add it
        NULL; -- Skip for now
    END IF;

    -- Add qa_profile column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='preferences' AND column_name='qa_profile') THEN
        ALTER TABLE preferences ADD COLUMN qa_profile TEXT;
    END IF;
END $$;

-- Check resumes table has content column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='resumes' AND column_name='content') THEN
        ALTER TABLE resumes ADD COLUMN content TEXT;
    END IF;
END $$;

-- Refresh the schema cache (Supabase PostgREST)
NOTIFY pgrst, 'reload schema';
