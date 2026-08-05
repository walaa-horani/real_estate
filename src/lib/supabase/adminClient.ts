import "server-only";
import { createClient } from "@supabase/supabase-js";

// SERVICE ROLE client — bypasses RLS entirely. Server-only (the `server-only`
// import throws a build error if this ever lands in a client bundle).
//
// Temporary: the dashboard has no login/session yet, so there is no
// authenticated org member to scope queries to via RLS. Dashboard pages use
// this client to read/write the seeded demo org directly. Once real
// Supabase Auth + sessions are wired up, dashboard reads should switch to a
// per-request client built from the signed-in user's session so RLS (not
// this client) enforces tenant isolation.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
