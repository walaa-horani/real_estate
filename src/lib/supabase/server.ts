import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Session-aware client for Server Components / Server Actions / Route Handlers.
// Reads the user's auth cookies, so every query respects RLS as that specific
// signed-in user — this is the client dashboard pages should use once they're
// wired to real auth (see adminClient.ts for why some pages still bypass this).
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render (not an Action/Route
            // Handler) — cookies can't be written here. Session refresh is
            // still handled by middleware, so this is safe to ignore.
          }
        },
      },
    }
  );
}
