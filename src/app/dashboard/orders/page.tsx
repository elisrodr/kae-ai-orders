import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrdersPageClient } from "./OrdersPageClient";

type OrdersPageOrder = {
  id: string;
  status: string;
  requested_delivery_date: string | null;
  created_at: string;
  vendor_name: string | null;
  item_count: number;
};

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "sent":
      return "border-transparent bg-blue-100 text-blue-800";
    case "confirmed":
      return "border-transparent bg-emerald-100 text-emerald-800";
    case "issue":
      return "border-transparent bg-amber-100 text-amber-800";
    case "fulfilled":
      return "border-transparent bg-muted text-muted-foreground";
    default:
      return "border-transparent bg-slate-100 text-slate-800";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function OrdersPage() {
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

  const restaurantId = restaurantProfile.id;

  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        requested_delivery_date,
        created_at,
        vendors ( name ),
        order_items ( count )
      `
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: OrdersPageOrder[] = ((ordersData ?? []) as any[]).map(
    (row) => {
      const orderItems = Array.isArray(row.order_items)
        ? row.order_items
        : [];
      const aggregatedCount =
        orderItems.length > 0 && typeof orderItems[0]?.count === "number"
          ? orderItems[0].count
          : orderItems.length;

      return {
        id: row.id,
        status: row.status,
        requested_delivery_date: row.requested_delivery_date,
        created_at: row.created_at,
        vendor_name: row.vendors?.name ?? null,
        item_count: aggregatedCount,
      };
    }
  );

  return <OrdersPageClient orders={orders} />;
}

