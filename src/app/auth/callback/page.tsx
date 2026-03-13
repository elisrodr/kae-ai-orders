 "use client";

 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 import { createClient } from "@/lib/supabase/client";

 export default function AuthCallbackPage() {
   const router = useRouter();

   useEffect(() => {
     const handleAuthCallback = async () => {
       const supabase = createClient();

       // This will read the hash fragment from the URL, exchange it for a session,
       // and update the auth cookies / client state accordingly.
       const { error } = await supabase.auth.getSession();

       if (error) {
         // If something goes wrong, just send them to the login page.
         router.replace("/login");
         return;
       }

       // On success, send the user to the dashboard.
       router.replace("/dashboard");
     };

     handleAuthCallback();
   }, [router]);

   return null;
 }

