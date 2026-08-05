"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/siteUrl";

export type SignupActionState =
  | { error: string }
  | { success: true; needsConfirmation: boolean }
  | null;

// GoTrue answers a failed confirmation-email send with HTTP 500 and a body
// supabase-js does not unwrap: it raises AuthRetryableFetchError whose message
// is the literal string "{}". Left alone that renders as "{}" in the form, which
// tells the operator nothing. Translate the 5xx case into something actionable —
// on a hosted project it is almost always SMTP: either "Confirm email" is on
// with no custom SMTP configured, or the built-in sender refused the address.
function describeAuthError(error: { message: string; status?: number }): string {
  const message = error.message?.trim();
  const unusable = !message || message === "{}";

  if (error.status && error.status >= 500) {
    return unusable
      ? "The authentication service could not complete the sign-up — it failed to send the confirmation email. Check the Supabase project's SMTP settings."
      : `Sign-up failed on the authentication service: ${message}`;
  }

  return unusable ? "Sign-up failed. Please try again." : message;
}

// Step 1: creates the real auth.users row for the agency's first admin.
// No organization exists yet — that only happens after a PayTabs payment is
// verified server-side (see the note at the bottom of this file).
//
// If the Supabase project has "Confirm email" enabled, signUp() returns no
// session — the user must click the emailed link (which lands on
// /auth/confirm, then continues straight to /signup/plan) before they have
// one. If confirmation is disabled, a session exists immediately and the
// caller can go straight to /signup/plan itself.
export async function signUpAgency(
  _prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const agencyName = String(formData.get("agencyName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!agencyName || !contactName || !email || !password) {
    return { error: "Agency name, full name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const next = `/signup/plan?agency=${encodeURIComponent(agencyName)}`;
  const emailRedirectTo = `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: contactName }, emailRedirectTo },
  });

  if (error) {
    return { error: describeAuthError(error) };
  }

  return { success: true, needsConfirmation: !data.session };
}

// NOTE: there is deliberately no finalizeSignup() here any more.
//
// It used to create the organization and set its plan straight from the browser
// once the payment *page* loaded — no payment involved. Any signed-in user could
// hit /signup/payment?plan=Enterprise and be provisioned for free, and the
// underlying create_organization_with_admin RPC was granted to `authenticated`
// so it could even be called directly.
//
// Organizations are now created only by apply_paid_transaction() (service-role
// only), reached from the PayTabs server-to-server callback after signature
// verification and an independent re-query. See src/lib/actions/checkout.ts.
