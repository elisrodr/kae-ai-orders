"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingBasics } from "@/types/database";

export function OnboardingStep1({
  initial,
  onNext,
  saving,
  onBack,
}: {
  initial?: OnboardingBasics;
  onNext: (data: OnboardingBasics) => void;
  saving: boolean;
  onBack: () => void;
}) {
  const [restaurant_name, setRestaurantName] = useState(initial?.restaurant_name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [cuisine_type, setCuisineType] = useState(initial?.cuisine_type ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext({ restaurant_name, address, phone, cuisine_type });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="restaurant_name">Restaurant name</Label>
        <Input
          id="restaurant_name"
          value={restaurant_name}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="e.g. Joe's Kitchen"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, city, state, ZIP"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cuisine_type">Cuisine type</Label>
        <Input
          id="cuisine_type"
          value={cuisine_type}
          onChange={(e) => setCuisineType(e.target.value)}
          placeholder="e.g. American, Italian, Mexican"
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
