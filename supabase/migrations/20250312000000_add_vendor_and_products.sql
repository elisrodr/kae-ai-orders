-- KAE: Add vendor role, vendor_profiles, and products tables
-- Run this in Supabase SQL Editor before running the seed script (or the seed will create these via raw SQL if run with createTables option).

-- 1. Add 'vendor' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendor';

-- 2. Vendor profiles: one per vendor account (profile with role=vendor)
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  categories text[] DEFAULT '{}',
  delivery_days text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Products: catalog items per vendor
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit_description text NOT NULL,
  base_price numeric(10,2) NOT NULL,
  availability text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Vendor can manage own vendor_profile and products (drop if exists for idempotent re-run)
DROP POLICY IF EXISTS "Vendors can view own vendor_profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update own vendor_profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can insert own vendor_profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can manage own products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Vendors can view own vendor_profile" ON public.vendor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Vendors can update own vendor_profile" ON public.vendor_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Vendors can insert own vendor_profile" ON public.vendor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Vendors can manage own products" ON public.products
  FOR ALL USING (
    vendor_id = auth.uid()
  );

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- Triggers (drop first for idempotent re-run)
DROP TRIGGER IF EXISTS vendor_profiles_updated_at ON public.vendor_profiles;
DROP TRIGGER IF EXISTS products_updated_at ON public.products;

CREATE TRIGGER vendor_profiles_updated_at
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Optional: allow trigger to set role from signup metadata (for admin-created vendor accounts)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      (new.raw_user_meta_data->>'role')::user_role,
      'restaurant'
    ),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
