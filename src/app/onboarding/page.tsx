"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveOnboardingStep1, saveOnboardingStep2, saveOnboardingStep3, saveOnboardingStep4, completeOnboarding } from "./actions";
import type { OnboardingBasics, OnboardingOrderingHabits, VendorContact, RegularItem } from "@/types/database";
import { OnboardingStep1 } from "./step-1-basics";
import { OnboardingStep2 } from "./step-2-ordering-habits";
import { OnboardingStep3 } from "./step-3-vendors";
import { OnboardingStep4 } from "./step-4-regular-items";
import { OnboardingStep5 } from "./step-5-review";

const STEPS = [
  { title: "Basics", description: "Restaurant info" },
  { title: "Ordering habits", description: "How you order" },
  { title: "Vendor contacts", description: "Your suppliers" },
  { title: "Regular items", description: "What you order often" },
  { title: "Review", description: "Finish setup" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [basics, setBasics] = useState<OnboardingBasics | null>(null);
  const [orderingHabits, setOrderingHabits] = useState<OnboardingOrderingHabits | null>(null);
  const [vendors, setVendors] = useState<VendorContact[]>([]);
  const [regularItems, setRegularItems] = useState<RegularItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext(payload?: {
    step1?: OnboardingBasics;
    step2?: OnboardingOrderingHabits;
    step3?: VendorContact[];
    step4?: RegularItem[];
  }) {
    setError(null);
    setSaving(true);
    try {
      if (step === 1 && payload?.step1) {
        await saveOnboardingStep1(payload.step1);
        setBasics(payload.step1);
      }
      if (step === 2 && payload?.step2) {
        await saveOnboardingStep2(payload.step2);
        setOrderingHabits(payload.step2);
      }
      if (step === 3 && payload?.step3) {
        await saveOnboardingStep3(
          payload.step3.map((v) => ({
            name: v.name,
            email: v.email ?? undefined,
            phone: v.phone ?? undefined,
            website: v.website ?? undefined,
            notes: v.notes ?? undefined,
          }))
        );
        setVendors(payload.step3);
      }
      if (step === 4 && payload?.step4) {
        await saveOnboardingStep4(payload.step4);
        setRegularItems(payload.step4);
      }
      if (step === 5) {
        await completeOnboarding();
        router.refresh();
        return;
      }
      setStep((s) => Math.min(s + 1, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i + 1 <= step ? "bg-primary" : "bg-muted"
            }`}
            aria-hidden
          />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].title}</CardTitle>
          <CardDescription>{STEPS[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}
          {step === 1 && (
            <OnboardingStep1
              initial={basics ?? undefined}
              onNext={(data) => handleNext({ step1: data })}
              saving={saving}
              onBack={handleBack}
            />
          )}
          {step === 2 && (
            <OnboardingStep2
              initial={orderingHabits ?? undefined}
              onNext={(data) => handleNext({ step2: data })}
              saving={saving}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <OnboardingStep3
              initial={vendors}
              onNext={(data) => handleNext({ step3: data })}
              saving={saving}
              onBack={handleBack}
            />
          )}
          {step === 4 && (
            <OnboardingStep4
              initialVendors={vendors}
              initialItems={regularItems}
              onNext={(items) => handleNext({ step4: items })}
              saving={saving}
              onBack={handleBack}
            />
          )}
          {step === 5 && (
            <OnboardingStep5
              basics={basics}
              orderingHabits={orderingHabits}
              vendors={vendors}
              regularItems={regularItems}
              onComplete={() => handleNext()}
              saving={saving}
              onBack={handleBack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
