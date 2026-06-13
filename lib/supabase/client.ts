// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Singleton para evitar múltiples instancias
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function createClientSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseClient;
}
