/**
 * KAE Database Seed Script
 *
 * Uses ONLY existing schema (Days 1-2): profiles, restaurant_profiles, vendors, regular_items.
 * No migration required. No vendor_profiles or products tables.
 *
 * Creates: 3 restaurant auth users, 1 admin auth user, restaurant_profiles with onboarding,
 * per-restaurant vendor contacts (vendors table), and sample regular_items.
 *
 * Set env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run seed   or   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_PASSWORD = "KaeTest2026!";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Restaurant accounts (3) — auth users + profiles + restaurant_profiles ---
const restaurants = [
  {
    email: "artisanaffiliated@gmail.com",
    full_name: "Eli Rodriguez",
    onboarding_basics: {
      restaurant_name: "The Chester Table",
      address: "Chester, PA",
      phone: "(610) 555-0101",
      cuisine_type: "Farm-to-table, upscale casual",
    },
    onboarding_ordering_habits: {
      order_frequency: "4-5 times per week",
      preferred_delivery_days: ["Monday", "Wednesday", "Friday"],
      preferred_delivery_times: "Morning",
      min_order_amount: 1200,
      notes: null,
    },
    vendor_contacts: [
      { name: "Valley Fresh Produce", email: "artisanaffiliated+valleyfresh@gmail.com" },
      { name: "Chester Protein Supply", email: "artisanaffiliated+chesterprotein@gmail.com" },
      { name: "Main Line Dairy", email: "artisanaffiliated+dairy-test@gmail.com" },
    ],
  },
  {
    email: "artisanaffiliated+broad-bistro@gmail.com",
    full_name: "Alex Boeckx",
    onboarding_basics: {
      restaurant_name: "Broad Street Bistro",
      address: "Media, PA",
      phone: "(610) 555-0102",
      cuisine_type: "American bistro, mid-range",
    },
    onboarding_ordering_habits: {
      order_frequency: "3 times per week",
      preferred_delivery_days: ["Tuesday", "Thursday"],
      preferred_delivery_times: "Morning",
      min_order_amount: 800,
      notes: null,
    },
    vendor_contacts: [
      { name: "Valley Fresh Produce", email: "artisanaffiliated+valleyfresh@gmail.com" },
      { name: "Chester Protein Supply", email: "artisanaffiliated+chesterprotein@gmail.com" },
      { name: "DelCo Dry Goods & Beverage", email: "artisanaffiliated+delcogoods@gmail.com" },
    ],
  },
  {
    email: "artisanaffiliated+rosa@gmail.com",
    full_name: "Rosa Martinez",
    onboarding_basics: {
      restaurant_name: "Mama Rosa's Kitchen",
      address: "Ridley Park, PA",
      phone: "(610) 555-0103",
      cuisine_type: "Italian family restaurant",
    },
    onboarding_ordering_habits: {
      order_frequency: "3-4 times per week",
      preferred_delivery_days: ["Monday", "Wednesday", "Friday"],
      preferred_delivery_times: "Morning",
      min_order_amount: 950,
      notes: null,
    },
    vendor_contacts: [
      { name: "Valley Fresh Produce", email: "artisanaffiliated+valleyfresh@gmail.com" },
      { name: "Chester Protein Supply", email: "artisanaffiliated+chesterprotein@gmail.com" },
      { name: "Main Line Dairy", email: "artisanaffiliated+dairy-test@gmail.com" },
      { name: "DelCo Dry Goods & Beverage", email: "artisanaffiliated+delcogoods@gmail.com" },
    ],
  },
];

// --- Admin (1) — auth user + profile with role admin ---
const admin = {
  email: "artisanaffiliated+admin@gmail.com",
  full_name: "Admin",
  role: "admin" as const,
};

// --- Sample regular_items per vendor (name, quantity, frequency) for seeding ---
// Maps vendor business name -> items to add as regular_items for any restaurant that has this vendor
const sampleRegularItemsByVendor: Record<string, { name: string; quantity: string; frequency: string }[]> = {
  "Valley Fresh Produce": [
    { name: "Romaine Lettuce Hearts", quantity: "case (6 heads)", frequency: "weekly" },
    { name: "Baby Spinach", quantity: "2.5 lb bag", frequency: "weekly" },
    { name: "Roma Tomatoes", quantity: "25 lb case", frequency: "twice weekly" },
    { name: "Yellow Onions", quantity: "50 lb bag", frequency: "weekly" },
    { name: "Fresh Basil", quantity: "1 lb bunch", frequency: "twice weekly" },
  ],
  "Chester Protein Supply": [
    { name: "Chicken Breast, Boneless Skinless", quantity: "40 lb case", frequency: "weekly" },
    { name: "Ground Beef 80/20", quantity: "10 lb chub", frequency: "twice weekly" },
    { name: "Bacon, Thick Cut", quantity: "15 lb case", frequency: "weekly" },
    { name: "Salmon Fillet, Atlantic", quantity: "10 lb case", frequency: "weekly" },
  ],
  "Main Line Dairy": [
    { name: "Heavy Cream", quantity: "gallon", frequency: "twice weekly" },
    { name: "Large Eggs", quantity: "15 dozen case", frequency: "twice weekly" },
    { name: "Shredded Mozzarella", quantity: "5 lb bag", frequency: "weekly" },
    { name: "Unsalted Butter", quantity: "36 ct case", frequency: "weekly" },
  ],
  "DelCo Dry Goods & Beverage": [
    { name: "Extra Virgin Olive Oil", quantity: "gallon", frequency: "weekly" },
    { name: "All-Purpose Flour", quantity: "50 lb bag", frequency: "weekly" },
    { name: "Crushed Tomatoes, Canned", quantity: "case (6 #10 cans)", frequency: "weekly" },
    { name: "Dried Pasta, Spaghetti", quantity: "20 lb case", frequency: "weekly" },
  ],
};

async function main() {
  console.log("KAE Seed: Using existing schema only (profiles, restaurant_profiles, vendors, regular_items)\n");

  const userIds: Record<string, string> = {};

  // 1. Create restaurant auth users
  for (const r of restaurants) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: r.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: r.full_name },
    });
    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`User already exists: ${r.email}, skipping`);
        const { data: list } = await supabase.auth.admin.listUsers();
        const u = list?.users?.find((x) => x.email === r.email);
        if (u) userIds[r.email] = u.id;
      } else {
        console.error("Create restaurant user error:", r.email, error);
        throw error;
      }
    } else if (data.user) {
      userIds[r.email] = data.user.id;
      console.log("Created restaurant:", r.email);
    }
  }

  // 2. Create admin auth user
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: admin.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: admin.full_name },
  });
  if (adminError) {
    if (adminError.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const u = list?.users?.find((x) => x.email === admin.email);
      if (u) userIds[admin.email] = u.id;
    } else throw adminError;
  } else if (adminData?.user) userIds[admin.email] = adminData.user.id;
  console.log("Admin:", admin.email);

  // 3. Update profiles: role and full_name (trigger creates profile with role=restaurant; set admin role)
  for (const r of restaurants) {
    const id = userIds[r.email];
    if (id) await supabase.from("profiles").update({ role: "restaurant", full_name: r.full_name }).eq("id", id);
  }
  if (userIds[admin.email]) {
    await supabase.from("profiles").update({ role: "admin", full_name: admin.full_name }).eq("id", userIds[admin.email]);
  }

  // 4. Restaurant profiles + per-restaurant vendor contacts (vendors table)
  for (const r of restaurants) {
    const profileId = userIds[r.email];
    if (!profileId) continue;

    let restaurantProfileId: string | null = null;
    const { data: existing } = await supabase
      .from("restaurant_profiles")
      .select("id")
      .eq("user_id", profileId)
      .single();

    if (existing) {
      restaurantProfileId = existing.id;
      await supabase
        .from("restaurant_profiles")
        .update({
          onboarding_basics: r.onboarding_basics,
          onboarding_ordering_habits: r.onboarding_ordering_habits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("restaurant_profiles")
        .insert({
          user_id: profileId,
          onboarding_basics: r.onboarding_basics,
          onboarding_ordering_habits: r.onboarding_ordering_habits,
        })
        .select("id")
        .single();
      if (error) throw error;
      restaurantProfileId = inserted?.id ?? null;
    }
    if (!restaurantProfileId) continue;

    await supabase.from("vendors").delete().eq("restaurant_id", restaurantProfileId);
    const vendorRows = r.vendor_contacts.map((v) => ({
      restaurant_id: restaurantProfileId!,
      name: v.name,
      email: v.email,
      phone: null,
      website: null,
      notes: null,
    }));
    await supabase.from("vendors").insert(vendorRows);
    console.log("Restaurant profile + vendors:", r.onboarding_basics.restaurant_name);
  }

  // 5. Regular items: for each restaurant, for each of their vendors, add sample regular_items (vendor_id = that restaurant's vendor row)
  for (const r of restaurants) {
    const profileId = userIds[r.email];
    if (!profileId) continue;
    const { data: rp } = await supabase
      .from("restaurant_profiles")
      .select("id")
      .eq("user_id", profileId)
      .single();
    if (!rp) continue;

    const { data: restaurantVendors } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("restaurant_id", rp.id);
    if (!restaurantVendors?.length) continue;

    await supabase.from("regular_items").delete().eq("restaurant_id", rp.id);
    const itemRows: { restaurant_id: string; vendor_id: string; name: string; quantity: string; frequency: string; notes: string | null }[] = [];
    for (const v of restaurantVendors) {
      const items = sampleRegularItemsByVendor[v.name] ?? [];
      for (const it of items) {
        itemRows.push({
          restaurant_id: rp.id,
          vendor_id: v.id,
          name: it.name,
          quantity: it.quantity,
          frequency: it.frequency,
          notes: null,
        });
      }
    }
    if (itemRows.length > 0) {
      await supabase.from("regular_items").insert(itemRows);
      console.log("Regular items for", r.onboarding_basics.restaurant_name, ":", itemRows.length);
    }
  }

  console.log("\n--- Seed complete ---");
  console.log("\nVerification: run the queries in scripts/seed-verification.sql in Supabase SQL Editor.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
