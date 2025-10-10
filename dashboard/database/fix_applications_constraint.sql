-- Fix the applications table status constraint
-- The existing table has wrong status values, this updates them

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;

-- Step 2: Add the correct CHECK constraint with values the extension uses
ALTER TABLE applications
ADD CONSTRAINT applications_status_check
CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'archived'));

-- Step 3: Refresh schema cache so PostgREST knows about the change
NOTIFY pgrst, 'reload schema';

-- Verification query (optional - run separately to check):
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_schema = 'public'
-- AND constraint_name = 'applications_status_check';
