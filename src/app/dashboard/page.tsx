import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: restaurantProfile } = await supabase
    .from("restaurant_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const restaurantId = restaurantProfile?.id ?? null;

  const { data: vendors = [] } = restaurantId
    ? await supabase
        .from("vendors")
        .select("id, name, email, phone, website")
        .eq("restaurant_id", restaurantId)
        .order("name")
    : { data: [] };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your vendors and place orders.</p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard/order">
            <Plus className="mr-2 h-4 w-4" />
            Place New Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your vendors
          </CardTitle>
          <CardDescription>
            Vendors you added during onboarding. Use &quot;Place New Order&quot; to order from them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!vendors || vendors.length === 0) ? (
            <p className="text-muted-foreground py-6 text-center">
              No vendors yet. You can add more from your profile or when placing an order.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(vendors ?? []).map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{v.name}</p>
                    {(v.email || v.phone) && (
                      <p className="text-sm text-muted-foreground">
                        {[v.email, v.phone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {v.website && (
                    <a
                      href={v.website.startsWith("http") ? v.website : `https://${v.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Website
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
