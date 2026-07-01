"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleSignOut}
        aria-label="Çıkış yap"
        className="sm:hidden"
      >
        <LogOut className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="hidden sm:inline-flex"
      >
        Çıkış Yap
      </Button>
    </>
  );
}
