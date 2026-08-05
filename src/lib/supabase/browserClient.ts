import { createBrowserClient } from "@supabase/ssr";

// Session-aware client for Client Components (login form, etc).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
