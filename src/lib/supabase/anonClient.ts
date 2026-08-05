import { createClient } from "@supabase/supabase-js";

// Public, RLS-respecting client. Safe to use in Server or Client Components —
// the anon key only ever sees what RLS policies allow anon/authenticated to see
// (published properties/orgs, insert-only on leads, etc).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
