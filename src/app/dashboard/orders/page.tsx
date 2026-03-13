import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        vendors ( name )
      `
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  // #region agent log
  await fetch(
    "http://127.0.0.1:7450/ingest/f2c6a6de-f035-4b2b-89b4-ca09a6f1e006",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "da5480",
      },
      body: JSON.stringify({
        sessionId: "da5480",
        runId: "orders-page-initial",
        hypothesisId: "ORDERS_LIST",
        location: "src/app/dashboard/orders/page.tsx:ordersQuery",
        message: "Orders list query result",
        data: {
          hasData: !!ordersData,
          isArray: Array.isArray(ordersData),
        },
        timestamp: Date.now(),
      }),
    }
  ).catch(() => {});
  // #endregion

  const orders: OrdersPageOrder[] = ((ordersData ?? []) as any[]).map(
    (row) => ({
      id: row.id,
      status: row.status,
      requested_delivery_date: row.requested_delivery_date,
      created_at: row.created_at,
      vendor_name: row.vendors?.name ?? null,
      item_count: 0,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">
            View all orders you&apos;ve placed with your vendors.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto text-base font-semibold px-6 py-3 shadow-sm"
        >
          <Link href="/dashboard/orders/new">Place New Order</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            All orders for this restaurant, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">
                      Vendor
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Items
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Requested delivery
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="group relative cursor-pointer border-b last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium">
                          {order.vendor_name ?? "Unknown vendor"}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {order.item_count}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge
                          className={getStatusBadgeClasses(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {formatDate(order.requested_delivery_date)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="absolute inset-0">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="block h-full w-full"
                          aria-label="View order details"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

