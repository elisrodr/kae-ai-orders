"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

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
    case "draft":
      return "border-transparent bg-slate-200 text-slate-800";
    case "sent":
      return "border-transparent bg-blue-100 text-blue-800";
    case "confirmed":
      return "border-transparent bg-emerald-100 text-emerald-800";
    case "issue":
      return "border-transparent bg-amber-100 text-amber-800";
    case "fulfilled":
      return "border-transparent bg-violet-100 text-violet-800";
    default:
      return "border-transparent bg-slate-100 text-slate-800";
  }
}

function formatDeliveryDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatPlacedOn(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_TAB_DEFS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "issue", label: "Issue" },
  { value: "fulfilled", label: "Fulfilled" },
];

export function OrdersPageClient({ orders }: { orders: OrdersPageOrder[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      draft: 0,
      sent: 0,
      confirmed: 0,
      issue: 0,
      fulfilled: 0,
    };
    for (const order of orders) {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const hasOrders = orders.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Orders</h1>
          <p className="text-muted-foreground text-sm">
            Review, filter, and resend orders placed with your vendors.
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

      <Tabs
        defaultValue="all"
        value={statusFilter}
        onValueChange={setStatusFilter}
      >
        <TabsList>
          {STATUS_TAB_DEFS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}{" "}
              <span className="ml-1 text-[11px] text-muted-foreground">
                ({statusCounts[tab.value] ?? 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter || "all"}>
          {!hasOrders ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-base font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground">
                  Place your first order and it will appear here.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/orders/new">Place New Order</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="w-20 text-right">Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery date</TableHead>
                    <TableHead>Placed on</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group relative cursor-pointer"
                    >
                      <TableCell>
                        <div className="font-medium">
                          {order.vendor_name ?? "Unknown vendor"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.item_count}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadgeClasses(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDeliveryDate(order.requested_delivery_date)}
                      </TableCell>
                      <TableCell>{formatPlacedOn(order.created_at)}</TableCell>
                      <TableCell className="absolute inset-0">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="block h-full w-full"
                          aria-label="View order details"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

