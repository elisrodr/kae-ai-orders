-- KAE Seed Verification (existing schema only: profiles, restaurant_profiles, vendors, regular_items)
-- Run in Supabase SQL Editor after npm run seed.

-- 1. Row counts (expect: profiles 4, restaurant_profiles 3, vendors 10, regular_items varies)
SELECT 'profiles' AS tbl, count(*) AS cnt FROM public.profiles
UNION ALL SELECT 'restaurant_profiles', count(*) FROM public.restaurant_profiles
UNION ALL SELECT 'vendors', count(*) FROM public.vendors
UNION ALL SELECT 'regular_items', count(*) FROM public.regular_items
ORDER BY tbl;

-- 2. Profiles by role (expect: 1 admin, 3 restaurant)
SELECT role, email, full_name FROM public.profiles ORDER BY role, email;

-- 3. Restaurants with onboarding
SELECT p.email, p.full_name, rp.onboarding_basics->>'restaurant_name' AS restaurant_name, rp.onboarding_basics->>'cuisine_type' AS cuisine_type
FROM public.profiles p
JOIN public.restaurant_profiles rp ON rp.user_id = p.id
WHERE p.role = 'restaurant'
ORDER BY p.email;

-- 4. Vendor contacts per restaurant
SELECT rp.onboarding_basics->>'restaurant_name' AS restaurant, v.name AS vendor_name, v.email
FROM public.vendors v
JOIN public.restaurant_profiles rp ON rp.id = v.restaurant_id
ORDER BY restaurant, vendor_name;

-- 5. Regular items per restaurant (sample)
SELECT rp.onboarding_basics->>'restaurant_name' AS restaurant, v.name AS vendor, ri.name AS item, ri.quantity, ri.frequency
FROM public.regular_items ri
JOIN public.restaurant_profiles rp ON rp.id = ri.restaurant_id
JOIN public.vendors v ON v.id = ri.vendor_id
ORDER BY restaurant, vendor, ri.name
LIMIT 25;
