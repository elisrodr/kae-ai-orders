"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VendorContact, RegularItem } from "@/types/database";
import { Plus, Trash2 } from "lucide-react";

const FREQUENCIES = ["Every order", "Weekly", "Biweekly", "Monthly", "As needed"];

export function OnboardingStep4({
  initialVendors,
  initialItems,
  onNext,
  saving,
  onBack,
}: {
  initialVendors: VendorContact[];
  initialItems: RegularItem[];
  onNext: (items: RegularItem[]) => void;
  saving: boolean;
  onBack: () => void;
}) {
  const [vendors] = useState<VendorContact[]>(initialVendors);
  const [items, setItems] = useState<RegularItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          {
            name: "",
            vendor_name: initialVendors[0]?.name ?? "",
            quantity: "",
            frequency: "",
            notes: null,
          },
        ]
  );

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        vendor_name: vendors[0]?.name ?? "",
        quantity: "",
        frequency: "",
        notes: null,
      },
    ]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof RegularItem, value: string | null) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = items.filter((i) => i.name.trim() && i.vendor_name && i.quantity && i.frequency);
    if (valid.length === 0) {
      return;
    }
    onNext(valid.map((i) => ({ ...i, name: i.name.trim() })));
  }

  if (vendors.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Add at least one vendor in the previous step before adding regular items.
        </p>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        List items you order regularly. This helps KAE suggest orders later.
      </p>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Item {i + 1}</span>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(i)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Item name *</Label>
              <Input
                value={item.name}
                onChange={(e) => updateItem(i, "name", e.target.value)}
                placeholder="e.g. Olive oil, 1 gal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <select
                value={item.vendor_name}
                onChange={(e) => updateItem(i, "vendor_name", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {vendors.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                placeholder="e.g. 2 cases, 5 lbs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>How often *</Label>
              <select
                value={item.frequency}
                onChange={(e) => updateItem(i, "frequency", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Input
                value={item.notes ?? ""}
                onChange={(e) => updateItem(i, "notes", e.target.value || null)}
                placeholder="Brand, SKU, etc."
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addItem} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add another item
      </Button>
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={
            saving ||
            items.every(
              (i) => !i.name.trim() || !i.vendor_name || !i.quantity || !i.frequency
            )
          }
        >
          {saving ? "Saving…" : "Next"}
        </Button>
      </div>
    </form>
  );
}
