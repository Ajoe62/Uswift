-- Sample job applications data for testing
-- Run this after creating the job_applications table

INSERT INTO job_applications (
  user_id,
  company_name,
  job_title,
  status,
  applied_date,
  application_url,
  notes
) VALUES
-- Replace 'user-uuid-here' with an actual user ID from your auth.users table
(
  'user-uuid-here',
  'Google',
  'Software Engineer',
  'interview',
  '2024-01-15',
  'https://careers.google.com/jobs/123456',
  'Applied through referral. Technical interview scheduled for next week.'
),
(
  'user-uuid-here',
  'Microsoft',
  'Senior Developer',
  'offer',
  '2024-01-10',
  'https://careers.microsoft.com/jobs/789012',
  'Received offer with competitive salary and benefits package.'
),
(
  'user-uuid-here',
  'Amazon',
  'Full Stack Developer',
  'applied',
  '2024-01-20',
  NULL,
  'Applied through company website. Following up in 2 weeks.'
),
(
  'user-uuid-here',
  'Apple',
  'iOS Developer',
  'rejected',
  '2023-12-15',
  'https://jobs.apple.com/en-us/details/456789',
  'Rejected after technical interview. Feedback: need more Swift experience.'
),
(
  'user-uuid-here',
  'Meta',
  'Frontend Engineer',
  'interview',
  '2024-01-18',
  'https://www.metacareers.com/jobs/345678',
  'Passed initial screening. System design interview next week.'
);

-- Note: Replace 'user-uuid-here' with actual user IDs from your Supabase auth.users table
-- You can find user IDs by running: SELECT id, email FROM auth.users;
