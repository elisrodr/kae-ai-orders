"use client";

import { Button } from "@/components/ui/button";
import type { OnboardingBasics, OnboardingOrderingHabits, VendorContact, RegularItem } from "@/types/database";

export function OnboardingStep5({
  basics,
  orderingHabits,
  vendors,
  regularItems,
  onComplete,
  saving,
  onBack,
}: {
  basics: OnboardingBasics | null;
  orderingHabits: OnboardingOrderingHabits | null;
  vendors: VendorContact[];
  regularItems: RegularItem[];
  onComplete: () => void;
  saving: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Review your info below. Click &quot;Complete setup&quot; to go to your dashboard.
      </p>

      {basics && (
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Restaurant</h4>
          <p>{basics.restaurant_name}</p>
          <p className="text-sm text-muted-foreground">{basics.address}</p>
          {basics.phone && <p className="text-sm text-muted-foreground">{basics.phone}</p>}
          {basics.cuisine_type && (
            <p className="text-sm text-muted-foreground">{basics.cuisine_type}</p>
          )}
        </div>
      )}

      {orderingHabits && (
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Ordering habits</h4>
          <p className="text-sm">
            Frequency: {orderingHabits.order_frequency}
            {orderingHabits.preferred_delivery_days.length > 0 &&
              ` · Days: ${orderingHabits.preferred_delivery_days.join(", ")}`}
            {orderingHabits.preferred_delivery_times && ` · Time: ${orderingHabits.preferred_delivery_times}`}
            {orderingHabits.min_order_amount != null && ` · Min order: $${orderingHabits.min_order_amount}`}
          </p>
        </div>
      )}

      {vendors.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Vendors ({vendors.length})</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            {vendors.map((v) => (
              <li key={v.name}>{v.name}</li>
            ))}
          </ul>
        </div>
      )}

      {regularItems.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Regular items ({regularItems.length})</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {regularItems.map((i, idx) => (
              <li key={idx}>
                {i.name} — {i.quantity} ({i.frequency}) from {i.vendor_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={saving}>
          {saving ? "Completing…" : "Complete setup"}
        </Button>
      </div>
    </div>
  );
}
