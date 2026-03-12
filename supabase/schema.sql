-- KAE Database Schema for Supabase
-- Run this in your Supabase project: SQL Editor → New query → paste and run

-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- Custom types for roles
create type user_role as enum ('restaurant', 'admin');

-- Profiles: extends auth.users with role and onboarding status
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'restaurant',
  full_name text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Restaurant profile: onboarding answers (basics, ordering habits). Vendors and items in separate tables.
create table public.restaurant_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  onboarding_basics jsonb,
  onboarding_ordering_habits jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vendors (from onboarding step 3)
create table public.vendors (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurant_profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Regular items (from onboarding step 4), linked to vendor
create table public.regular_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurant_profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  quantity text not null,
  frequency text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.restaurant_profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.regular_items enable row level security;

-- Profiles: users can read/update own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Restaurant profiles: own restaurant only
create policy "Users can view own restaurant profile" on public.restaurant_profiles
  for select using (
    user_id in (select id from public.profiles where id = auth.uid())
  );

create policy "Users can insert own restaurant profile" on public.restaurant_profiles
  for insert with check (
    user_id in (select id from public.profiles where id = auth.uid())
  );

create policy "Users can update own restaurant profile" on public.restaurant_profiles
  for update using (
    user_id in (select id from public.profiles where id = auth.uid())
  );

-- Vendors: via restaurant_profile id
create policy "Users can manage own vendors" on public.vendors
  for all using (
    restaurant_id in (
      select id from public.restaurant_profiles where user_id = auth.uid()
    )
  );

-- Regular items: same
create policy "Users can manage own regular items" on public.regular_items
  for all using (
    restaurant_id in (
      select id from public.restaurant_profiles where user_id = auth.uid()
    )
  );

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    'restaurant',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: create restaurant_profile when profile is created (optional: we can create it on first onboarding save)
-- We'll create restaurant_profile in the app when user starts onboarding.

-- Optional: updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger restaurant_profiles_updated_at before update on public.restaurant_profiles
  for each row execute procedure public.set_updated_at();
create trigger vendors_updated_at before update on public.vendors
  for each row execute procedure public.set_updated_at();
create trigger regular_items_updated_at before update on public.regular_items
  for each row execute procedure public.set_updated_at();
