import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewOrderPageClient } from "./pageClient";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: restaurantProfile } = await supabase
    .from("restaurant_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!restaurantProfile) {
    redirect("/onboarding");
  }

  const { data: vendors = [] } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("restaurant_id", restaurantProfile.id)
    .order("name");

  return <NewOrderPageClient vendors={vendors ?? []} />;
}

