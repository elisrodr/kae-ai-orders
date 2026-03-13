import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Plus } from "lucide-react";

type DashboardOrder = {
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

  let recentOrders: DashboardOrder[] = [];
  let totalThisMonth = 0;
  let awaitingConfirmation = 0;

  if (restaurantId) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

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
      .order("created_at", { ascending: false })
      .limit(5);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentOrders = ((ordersData ?? []) as any[]).map((row) => {
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
    });

    const { data: statsData } = await supabase
      .from("orders")
      .select("id, status, created_at")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", monthStart.toISOString());

    totalThisMonth = (statsData ?? []).length;
    awaitingConfirmation = (statsData ?? []).filter(
      (o: { status: string }) => o.status === "sent"
    ).length;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Review your recent orders and manage your vendors.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto text-base font-semibold px-6 py-3 shadow-lg"
        >
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Place New Order
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders This Month</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {totalThisMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Orders placed so far this month.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting confirmation</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {awaitingConfirmation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Orders with status &quot;sent&quot;.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vendors</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {vendors.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unique vendors you have a relationship with.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            The 5 most recent orders you&apos;ve placed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No orders yet — place your first order to get started!
            </p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">
                        Vendor
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Delivery date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
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
                          <Badge
                            className={getStatusBadgeClasses(order.status)}
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {formatDate(order.requested_delivery_date)}
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
              <div className="mt-3 flex justify-end">
                <Link
                  href="/dashboard/orders"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all orders
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your vendors
          </CardTitle>
          <CardDescription>
            Vendors you added during onboarding. Use &quot;Place New Order&quot;
            to order from them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!vendors || vendors.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No vendors yet. You can add more from your profile or when
              placing an order.
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
                      href={
                        v.website.startsWith("http")
                          ? v.website
                          : `https://${v.website}`
                      }
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
