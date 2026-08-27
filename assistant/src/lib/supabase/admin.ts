import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client con service role: bypassa la RLS, va usato SOLO in codice server-side
// di fiducia (es. il cron job dei promemoria), mai esposto al browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
