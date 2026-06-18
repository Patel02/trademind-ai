-- TradeMind AI - Supabase Database Schema Backup
-- Executed on: 2026-06-18

-- 1. Create Profiles Table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'user',
  subscription_plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create User Consents Table
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  terms_accepted boolean default false,
  risk_disclosure_accepted boolean default false,
  accepted_at timestamptz
);

-- 3. Enable Row Level Security (RLS) on Profiles
alter table profiles enable row level security;

create policy "read own profile"
on profiles
for select
using (auth.uid() = id);

create policy "update own profile"
on profiles
for update
using (auth.uid() = id);

-- 4. Enable Row Level Security (RLS) on User Consents
alter table user_consents enable row level security;

create policy "read own consents"
on user_consents
for select
using (auth.uid() = user_id);

create policy "insert own consents"
on user_consents
for insert
with check (auth.uid() = user_id);

-- 5. Trigger Function to Auto-Create Profile After Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles(id, email, full_name, avatar_url)
  values(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

-- 6. Trigger Definition
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
