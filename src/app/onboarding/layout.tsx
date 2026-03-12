import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "restaurant") {
    redirect("/dashboard");
  }

  if (profile.onboarding_completed_at) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card py-4">
        <div className="container mx-auto px-4">
          <p className="font-semibold text-lg">KAE — Restaurant onboarding</p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
