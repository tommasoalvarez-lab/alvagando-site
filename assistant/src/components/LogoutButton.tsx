"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      className="btn-secondary text-xs"
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();
      }}
    >
      Esci
    </button>
  );
}
