import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">KAE</h1>
          <p className="text-muted-foreground text-lg">
            AI ordering assistant for independent restaurants
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  redirect("/dashboard");
}
