"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingOrderingHabits } from "@/types/database";

const FREQUENCIES = ["Weekly", "Biweekly", "Monthly", "As needed"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function OnboardingStep2({
  initial,
  onNext,
  saving,
  onBack,
}: {
  initial?: OnboardingOrderingHabits;
  onNext: (data: OnboardingOrderingHabits) => void;
  saving: boolean;
  onBack: () => void;
}) {
  const [order_frequency, setOrderFrequency] = useState(initial?.order_frequency ?? "");
  const [preferred_delivery_days, setPreferredDeliveryDays] = useState<string[]>(
    initial?.preferred_delivery_days ?? []
  );
  const [preferred_delivery_times, setPreferredDeliveryTimes] = useState(
    initial?.preferred_delivery_times ?? ""
  );
  const [min_order_amount, setMinOrderAmount] = useState(
    initial?.min_order_amount != null ? String(initial.min_order_amount) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function toggleDay(day: string) {
    setPreferredDeliveryDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext({
      order_frequency,
      preferred_delivery_days,
      preferred_delivery_times,
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
      notes: notes || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>How often do you typically place orders?</Label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="order_frequency"
                checked={order_frequency === f}
                onChange={() => setOrderFrequency(f)}
                className="rounded-full border-input"
              />
              <span className="text-sm">{f}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Preferred delivery days (select all that apply)</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferred_delivery_days.includes(day)}
                onChange={() => toggleDay(day)}
                className="rounded border-input"
              />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferred_delivery_times">Preferred delivery time window</Label>
        <Input
          id="preferred_delivery_times"
          value={preferred_delivery_times}
          onChange={(e) => setPreferredDeliveryTimes(e.target.value)}
          placeholder="e.g. 8am–12pm or Morning"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="min_order_amount">Minimum order amount (optional)</Label>
        <Input
          id="min_order_amount"
          type="number"
          min={0}
          step={0.01}
          value={min_order_amount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Any other ordering preferences or notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Prefer morning deliveries"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Next"}
        </Button>
      </div>
    </form>
  );
}
