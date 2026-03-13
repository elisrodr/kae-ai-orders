import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

type OrderDetailParams = {
  params: { id: string };
};

export default async function OrderDetailPage({ params }: OrderDetailParams) {
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

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        requested_delivery_date,
        created_at,
        raw_input,
        vendors!orders_vendor_id_fkey ( name ),
        order_items ( item_name, quantity, unit )
      `
    )
    .eq("id", params.id)
    .single();

  if (!order) {
    notFound();
  }

  const items = (order as any).order_items as {
    item_name: string;
    quantity: number;
    unit: string;
  }[];

  const vendorName = (order as any).vendors?.name ?? "Unknown vendor";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Order details</h1>
          <p className="text-sm text-muted-foreground">
            Review the items and context for this order.
          </p>
        </div>
        <Badge className={getStatusBadgeClasses(order.status)}>
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{vendorName}</CardTitle>
            <CardDescription>
              Requested for {formatDate(order.requested_delivery_date)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items && items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">
                        Item
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-4 py-3 align-middle">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No line items were found for this order.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Requested delivery
              </span>
              <span>{formatDate(order.requested_delivery_date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Original Order Text</CardTitle>
          <CardDescription>
            The plain English text you originally entered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {order.raw_input ? (
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Show / hide original text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {order.raw_input}
              </pre>
            </details>
          ) : (
            <p className="text-sm text-muted-foreground">
              No original order text was stored for this order.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
}

