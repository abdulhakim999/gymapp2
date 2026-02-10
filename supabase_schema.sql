
-- Enable necessary extensions if needed (e.g. for UUIDs)
create extension if not exists "uuid-ossp";

-- Workouts Table
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  volume float default 0,
  exercises jsonb default '[]'::jsonb,
  status text check (status in ('active', 'completed')) default 'active',
  created_at timestamptz default now()
);

-- Custom Exercises Table
create table public.custom_exercises (
  id text primary key, -- Use text to match "custom_timestamp" format or uuid
  user_id uuid references auth.users not null,
  name text not null,
  muscle text not null,
  created_at timestamptz default now()
);

-- RLS Policies for Workouts
alter table public.workouts enable row level security;

create policy "Users can view their own workouts" 
on public.workouts for select using (auth.uid() = user_id);

create policy "Users can insert their own workouts" 
on public.workouts for insert with check (auth.uid() = user_id);

create policy "Users can update their own workouts" 
on public.workouts for update using (auth.uid() = user_id);

create policy "Users can delete their own workouts" 
on public.workouts for delete using (auth.uid() = user_id);

-- RLS Policies for Custom Exercises
alter table public.custom_exercises enable row level security;

create policy "Users can view their own custom exercises" 
on public.custom_exercises for select using (auth.uid() = user_id);

create policy "Users can insert their own custom exercises" 
on public.custom_exercises for insert with check (auth.uid() = user_id);

create policy "Users can update their own custom exercises" 
on public.custom_exercises for update using (auth.uid() = user_id);

create policy "Users can delete their own custom exercises" 
on public.custom_exercises for delete using (auth.uid() = user_id);
