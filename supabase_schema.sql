-- Uswift Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text default 'free' check (role in ('free', 'basic', 'premium', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Preferences table
create table preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  job_titles text[],
  locations text[],
  remote_ok boolean default false,
  salary_min integer,
  salary_max integer,
  filters jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Resumes/Documents table
create table resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_size integer,
  type text check (type in ('resume', 'cover_letter', 'portfolio')) default 'resume',
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Applications table
create table applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  job_board text not null,
  job_id text,
  job_url text,
  job_title text not null,
  company text not null,
  location text,
  salary text,
  status text default 'pending' check (status in ('pending', 'queued', 'applying', 'applied', 'failed', 'rejected', 'interview', 'offer')),
  applied_at timestamp with time zone,
  result jsonb default '{}',
  error_message text,
  resume_id uuid references resumes(id),
  cover_letter_id uuid references resumes(id),
  notes text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Subscriptions table
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  tier text default 'free' check (tier in ('free', 'basic', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  active boolean default false,
  trial_ends_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Usage tracking table
create table usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  month_year text not null, -- Format: 'YYYY-MM'
  applications_count integer default 0,
  applications_limit integer default 10,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, month_year)
);

-- Job queues table (for Django automation service)
create table job_queues (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  priority integer default 5,
  scheduled_for timestamp with time zone default now(),
  attempts integer default 0,
  max_attempts integer default 3,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  worker_id text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_log text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Analytics table
create table analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  event_type text not null,
  event_data jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Row Level Security (RLS) policies
alter table users enable row level security;
alter table preferences enable row level security;
alter table resumes enable row level security;
alter table applications enable row level security;
alter table subscriptions enable row level security;
alter table usage enable row level security;
alter table job_queues enable row level security;
alter table analytics enable row level security;

-- Policies for users table
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- Policies for preferences table
create policy "Users can manage own preferences" on preferences
  for all using (auth.uid() = user_id);

-- Policies for resumes table
create policy "Users can manage own resumes" on resumes
  for all using (auth.uid() = user_id);

-- Policies for applications table
create policy "Users can manage own applications" on applications
  for all using (auth.uid() = user_id);

-- Policies for subscriptions table
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Policies for usage table
create policy "Users can view own usage" on usage
  for select using (auth.uid() = user_id);

-- Policies for job_queues table
create policy "Users can view own job queues" on job_queues
  for select using (auth.uid() = user_id);

-- Policies for analytics table
create policy "Users can view own analytics" on analytics
  for select using (auth.uid() = user_id);

-- Triggers for updated_at columns
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_preferences_updated_at before update on preferences
  for each row execute function update_updated_at_column();

create trigger update_resumes_updated_at before update on resumes
  for each row execute function update_updated_at_column();

create trigger update_applications_updated_at before update on applications
  for each row execute function update_updated_at_column();

create trigger update_subscriptions_updated_at before update on subscriptions
  for each row execute function update_updated_at_column();

create trigger update_usage_updated_at before update on usage
  for each row execute function update_updated_at_column();

create trigger update_job_queues_updated_at before update on job_queues
  for each row execute function update_updated_at_column();

-- Indexes for better performance
create index idx_applications_user_id on applications(user_id);
create index idx_applications_status on applications(status);
create index idx_applications_created_at on applications(created_at);
create index idx_job_queues_status on job_queues(status);
create index idx_job_queues_scheduled_for on job_queues(scheduled_for);
create index idx_usage_user_month on usage(user_id, month_year);

-- Insert default user on signup (using a function)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Create default usage record for current month
  insert into public.usage (user_id, month_year, applications_limit)
  values (new.id, to_char(now(), 'YYYY-MM'), 10);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create user record on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
