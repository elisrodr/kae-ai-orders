"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VendorContact } from "@/types/database";
import { Plus, Trash2 } from "lucide-react";

export function OnboardingStep3({
  initial,
  onNext,
  saving,
  onBack,
}: {
  initial: VendorContact[];
  onNext: (data: VendorContact[]) => void;
  saving: boolean;
  onBack: () => void;
}) {
  const [vendors, setVendors] = useState<VendorContact[]>(
    initial.length > 0
      ? initial
      : [{ name: "", email: null, phone: null, website: null, notes: null }]
  );

  function addVendor() {
    setVendors((prev) => [
      ...prev,
      { name: "", email: null, phone: null, website: null, notes: null },
    ]);
  }

  function removeVendor(i: number) {
    setVendors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateVendor(i: number, field: keyof VendorContact, value: string | null) {
    setVendors((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = vendors.filter((v) => v.name.trim());
    if (valid.length === 0) {
      return;
    }
    onNext(valid.map((v) => ({ ...v, name: v.name.trim() })));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add your main suppliers or vendors. You can add more later.
      </p>
      {vendors.map((v, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Vendor {i + 1}</span>
            {vendors.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVendor(i)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Vendor name *</Label>
              <Input
                value={v.name}
                onChange={(e) => updateVendor(i, "name", e.target.value)}
                placeholder="e.g. Sysco, US Foods"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={v.email ?? ""}
                onChange={(e) => updateVendor(i, "email", e.target.value || null)}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={v.phone ?? ""}
                onChange={(e) => updateVendor(i, "phone", e.target.value || null)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website</Label>
              <Input
                type="url"
                value={v.website ?? ""}
                onChange={(e) => updateVendor(i, "website", e.target.value || null)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Input
                value={v.notes ?? ""}
                onChange={(e) => updateVendor(i, "notes", e.target.value || null)}
                placeholder="Account number, contact name, etc."
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addVendor} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add another vendor
      </Button>
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button type="submit" disabled={saving || vendors.every((v) => !v.name.trim())}>
          {saving ? "Saving…" : "Next"}
        </Button>
      </div>
    </form>
  );
}
