"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { OnboardingBasics, OnboardingOrderingHabits } from "@/types/database";

export async function saveOnboardingStep1(data: OnboardingBasics) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: existing } = await supabase
    .from("restaurant_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase
      .from("restaurant_profiles")
      .update({ onboarding_basics: data, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("restaurant_profiles").insert({
      user_id: user.id,
      onboarding_basics: data,
    });
  }
}

export async function saveOnboardingStep2(data: OnboardingOrderingHabits) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rp } = await supabase
    .from("restaurant_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!rp) redirect("/onboarding");

  await supabase
    .from("restaurant_profiles")
    .update({
      onboarding_ordering_habits: data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rp.id);
}

export async function saveOnboardingStep3(vendors: { name: string; email?: string; phone?: string; website?: string; notes?: string }[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rp } = await supabase
    .from("restaurant_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!rp) redirect("/onboarding");

  await supabase.from("vendors").delete().eq("restaurant_id", rp.id);

  if (vendors.length > 0) {
    await supabase.from("vendors").insert(
      vendors.map((v) => ({
        restaurant_id: rp.id,
        name: v.name,
        email: v.email || null,
        phone: v.phone || null,
        website: v.website || null,
        notes: v.notes || null,
      }))
    );
  }
}

export async function saveOnboardingStep4(
  items: { name: string; vendor_name: string; quantity: string; frequency: string; notes?: string | null }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rp } = await supabase
    .from("restaurant_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!rp) redirect("/onboarding");

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("restaurant_id", rp.id);
  const vendorIdByName: Record<string, string> = {};
  (vendors ?? []).forEach((v) => {
    vendorIdByName[v.name] = v.id;
  });

  await supabase.from("regular_items").delete().eq("restaurant_id", rp.id);

  if (items.length > 0) {
    const rows = items
      .map((item) => {
        const vendorId = vendorIdByName[item.vendor_name];
        if (!vendorId) return null;
        return {
          restaurant_id: rp.id,
          vendor_id: vendorId,
          name: item.name,
          quantity: item.quantity,
          frequency: item.frequency,
          notes: item.notes || null,
        };
      })
      .filter(Boolean) as { restaurant_id: string; vendor_id: string; name: string; quantity: string; frequency: string; notes: string | null }[];

    if (rows.length > 0) {
      await supabase.from("regular_items").insert(rows);
    }
  }
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect("/dashboard");
}
