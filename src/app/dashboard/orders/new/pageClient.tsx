"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Pencil, ArrowLeft } from "lucide-react";

type Vendor = { id: string; name: string };

type ParsedItem = {
  item_name: string;
  quantity: number;
  unit: string;
  vendor_id: string | null;
  vendor_name: string | null;
  needs_clarification: boolean;
  no_vendor_match: boolean;
  clarification_question: string | null;
  estimated_category: string | null;
};

type ParsedResponse = {
  parsed_items: ParsedItem[];
  summary: string;
  warnings: string[];
};

type OrderItemState = ParsedItem & {
  id: string;
  edit_quantity: string;
  edit_unit: string;
  clarification_answer: string;
  selected_vendor_id: string | null;
};

function addBusinessDays(start: Date, days: number): Date {
  const date = new Date(start);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }
  return date;
}

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function NewOrderPageClient({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [orderText, setOrderText] = useState("");
  const [orderTextError, setOrderTextError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItemState[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(
    formatDateInput(addBusinessDays(new Date(), 2))
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const vendorById = useMemo(() => {
    const map = new Map<string, Vendor>();
    for (const v of vendors) {
      map.set(v.id, v);
    }
    return map;
  }, [vendors]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, { vendorId: string | null; vendorName: string; items: OrderItemState[] }>();
    if (!items) return groups;
    for (const item of items) {
      const vid = item.selected_vendor_id ?? item.vendor_id;
      const key = vid ?? "__unassigned__";
      const vendorName =
        vid && vendorById.get(vid)?.name
          ? vendorById.get(vid)!.name
          : item.vendor_name || (item.no_vendor_match ? "Unassigned" : "Unknown vendor");
      if (!groups.has(key)) {
        groups.set(key, { vendorId: vid ?? null, vendorName, items: [] });
      }
      groups.get(key)!.items.push(item);
    }
    return groups;
  }, [items, vendorById]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleParse() {
    setParseError(null);
    setSubmitError(null);
    if (!orderText.trim()) {
      setOrderTextError("Please enter what you want to order.");
      return;
    }
    setOrderTextError(null);
    setIsParsing(true);
    try {
      const res = await fetch("/api/orders/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data?.error ?? "Could not parse your order.");
        return;
      }
      const parsed = data as ParsedResponse;
      const nextItems: OrderItemState[] = (parsed.parsed_items ?? []).map((item, idx) => ({
        ...item,
        id: `${idx}`,
        edit_quantity: String(item.quantity ?? ""),
        edit_unit: item.unit ?? "",
        clarification_answer: "",
        selected_vendor_id: item.vendor_id,
      }));
      setItems(nextItems);
      setSummary(parsed.summary ?? null);
      setStep(2);
    } catch (err) {
      console.error(err);
      setParseError("Something went wrong while parsing your order. Please try again.");
    } finally {
      setIsParsing(false);
    }
  }

  function handleUpdateItem(id: string, patch: Partial<OrderItemState>) {
    setItems((prev) => {
      if (!prev) return prev;
      return prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
    });
  }

  async function handleSubmit() {
    if (!items || items.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      showToast("Sending orders to your vendors...", "success");
      const res = await fetch("/api/orders/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_date: deliveryDate,
          raw_input: orderText,
          items: items.map((item) => ({
            item_name: item.item_name,
            quantity: Number(item.edit_quantity) || item.quantity,
            unit: item.edit_unit || item.unit,
            vendor_id: item.selected_vendor_id ?? item.vendor_id,
            needs_clarification: item.needs_clarification,
            clarification_answer: item.clarification_answer || null,
            no_vendor_match: item.no_vendor_match,
            estimated_category: item.estimated_category,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error ?? "Could not send orders. Please try again.");
        return;
      }
      const orderIds: string[] = Array.isArray(data?.orderIds) ? data.orderIds : [];

      let emailSuccessCount = 0;
      let emailFailCount = 0;

      // Send emails sequentially to avoid rate limiting
      for (const orderId of orderIds) {
        try {
          const emailRes = await fetch("/api/emails/send-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const emailData = await emailRes.json();
          if (emailRes.ok && emailData?.success) {
            emailSuccessCount += 1;
          } else {
            emailFailCount += 1;
          }
        } catch (e) {
          console.error("[NewOrderPageClient] email send failed", e);
          emailFailCount += 1;
        }
      }

      if (emailSuccessCount > 0 && emailFailCount === 0) {
        showToast(
          `Orders sent to ${emailSuccessCount} vendor${emailSuccessCount === 1 ? "" : "s"}!`,
          "success"
        );
      } else if (emailSuccessCount > 0 && emailFailCount > 0) {
        showToast(
          `${emailSuccessCount} of ${emailSuccessCount + emailFailCount} orders sent. Some emails failed — you can retry from your orders page.`,
          "error"
        );
      } else {
        showToast(
          "Emails couldn't be sent. Your orders are saved — try resending from your orders page.",
          "error"
        );
      }

      router.push("/dashboard/orders");
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong while sending your orders. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          type="button"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Place New Order</h1>
          <p className="text-sm text-muted-foreground">
            Type what you need, then review by vendor before sending.
          </p>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Describe your order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-text">Order details</Label>
              <Textarea
                id="order-text"
                rows={6}
                placeholder='Type your order in plain English... e.g., I need 3 cases of chicken thighs, 2 cases romaine lettuce, a case of olive oil, and 50 lbs russet potatoes'
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
              />
              {orderTextError && (
                <p className="text-xs text-destructive mt-1">{orderTextError}</p>
              )}
            </div>
            {parseError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {parseError}
              </div>
            )}
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleParse}
              disabled={isParsing}
            >
              {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isParsing ? "KAE is organizing your order..." : "Parse Order"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && items && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Review & confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Delivery date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full sm:w-56"
                />
                <p className="text-xs text-muted-foreground">
                  Default is 2 business days from today. Adjust if needed.
                </p>
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setStep(1)}
              >
                Back to edit
              </Button>
            </div>

            {summary && (
              <p className="text-sm text-muted-foreground">{summary}</p>
            )}

            <div className="space-y-4">
              {Array.from(groupedItems.values()).map((group) => (
                <div
                  key={group.vendorId ?? "unassigned"}
                  className="rounded-lg border bg-card"
                >
                  <div className="border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {group.vendorName || "Unknown vendor"}
                      </span>
                      {!group.vendorId && (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}
                    </div>
                  </div>
                  <div className="divide-y">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.item_name}</span>
                              {item.estimated_category && (
                                <Badge variant="outline">
                                  {item.estimated_category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Input
                                  value={item.edit_quantity}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      edit_quantity: e.target.value,
                                    })
                                  }
                                  className="h-8 w-16"
                                />
                                <Input
                                  value={item.edit_unit}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      edit_unit: e.target.value,
                                    })
                                  }
                                  className="h-8 w-24"
                                  placeholder="cases"
                                />
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 text-xs">
                          {item.needs_clarification && item.clarification_question && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Needs clarification</Badge>
                                <span className="text-muted-foreground">
                                  {item.clarification_question}
                                </span>
                              </div>
                              <Input
                                placeholder="Type your answer..."
                                value={item.clarification_answer}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    clarification_answer: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {item.no_vendor_match && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">No vendor matched</Badge>
                                <span className="text-muted-foreground">
                                  Choose which vendor should receive this.
                                </span>
                              </div>
                              <select
                                className={cn(
                                  "flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                )}
                                value={item.selected_vendor_id ?? ""}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    selected_vendor_id: e.target.value || null,
                                  })
                                }
                              >
                                <option value="">Select vendor</option>
                                {vendors.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {submitError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Sending orders..." : "Confirm & Send Orders"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 rounded-md border px-4 py-3 shadow-lg text-sm",
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

