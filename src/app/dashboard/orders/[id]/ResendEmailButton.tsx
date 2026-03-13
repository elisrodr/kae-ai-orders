"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResendEmailButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleResend() {
    if (!orderId) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/emails/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showToast("Order email sent successfully!", "success");
        router.refresh();
      } else {
        showToast("Could not send email. Please try again.", "error");
      }
    } catch (err) {
      console.error("[ResendEmailButton] failed", err);
      showToast("Could not send email. Please try again.", "error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" onClick={handleResend} disabled={isSending}>
        {isSending ? "Sending..." : "Resend Email"}
      </Button>
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
    </>
  );
}

