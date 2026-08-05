"use server";

import { randomUUID } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { getPayTabsConfig } from "@/lib/paytabs/config";
import { createPaymentRequest } from "@/lib/paytabs/client";

export type StartCheckoutResult =
  | { error: string }
  | { redirectUrl: string; cartId: string };

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Begin a PayTabs Hosted Payment Page session for a plan.
 *
 * Deliberately does NOT grant anything. It only records what *should* happen if
 * a payment for this cart is later confirmed by PayTabs. The price comes from
 * the plans table — the browser sends a plan slug, never an amount, so there is
 * nothing on the client worth tampering with.
 */
export async function startCheckout(
  planSlug: string,
  agencyName: string
): Promise<StartCheckoutResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const normalizedPlan = planSlug.trim().toLowerCase();
  const trimmedAgency = agencyName.trim();

  if (!trimmedAgency) {
    return { error: "Agency name is required." };
  }

  // Price and currency are read server-side, from the database. Never accept
  // either from the request.
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, slug, name, price_monthly_cents")
    .eq("slug", normalizedPlan)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    return { error: "That plan is not available." };
  }

  // Existing org (if any) decides whether this is a first subscription or a
  // plan change. Admin-only for changes — a read-only member cannot move the
  // tenant onto a different plan.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membership && membership.role !== "admin") {
    return { error: "Only an organization admin can change the subscription plan." };
  }

  const intent = membership ? "upgrade" : "signup";
  const organizationId = membership?.organization_id ?? null;
  const organizationSlug = `${slugify(trimmedAgency) || "agency"}-${user.id.slice(0, 6)}`;

  const config = getPayTabsConfig();

  // Our idempotency key. It goes to PayTabs as cart_id and comes back on every
  // callback, so a replayed or duplicated notification resolves to this one row.
  const cartId = randomUUID();

  const admin = createAdminClient();
  const { data: transaction, error: insertError } = await admin
    .from("payment_transactions")
    .insert({
      cart_id: cartId,
      user_id: user.id,
      intent,
      organization_id: organizationId,
      organization_name: trimmedAgency,
      organization_slug: organizationSlug,
      plan_id: plan.id,
      amount_cents: plan.price_monthly_cents,
      currency: config.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !transaction) {
    return { error: "Could not start checkout. Please try again." };
  }

  try {
    const { redirectUrl, tranRef, raw } = await createPaymentRequest({
      cartId,
      cartDescription: `${plan.name} plan — ${trimmedAgency}`,
      amount: plan.price_monthly_cents / 100,
      currency: config.currency,
      returnUrl: `${config.siteUrl}/api/paytabs/return`,
      callbackUrl: `${config.siteUrl}/api/paytabs/callback`,
      customerEmail: user.email ?? "",
      customerName: (user.user_metadata?.full_name as string | undefined) ?? trimmedAgency,
    });

    // Pinning tran_ref now means a callback carrying some *other* PayTabs
    // transaction is rejected before it ever reaches fulfilment.
    await admin
      .from("payment_transactions")
      .update({ tran_ref: tranRef, paytabs_request: raw })
      .eq("id", transaction.id);

    return { redirectUrl, cartId };
  } catch (error) {
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        failure_reason:
          error instanceof Error ? error.message : "PayTabs request failed",
      })
      .eq("id", transaction.id);

    console.error("[paytabs] payment request failed", error);
    return { error: "Could not reach the payment provider. Please try again." };
  }
}

export type CheckoutStatus = {
  // "signed_out" is not a payment state — it means we cannot answer the
  // question, because the caller has no session to check the cart against.
  // Without it, a buyer whose cookies didn't survive the trip through PayTabs
  // (different browser, cleared cookies, a return URL on a different origin
  // from the one they signed up on) is told "still confirming" about a payment
  // that in fact completed and provisioned their organization.
  status: "pending" | "paid" | "failed" | "canceled" | "mismatch" | "unknown" | "signed_out";
  planName: string | null;
  failureReason: string | null;
};

/**
 * Read-only status lookup for the post-payment screen.
 *
 * payment_transactions has no RLS policies at all, so this goes through the
 * service-role client — and therefore re-filters on the session's own user_id.
 * Both conditions must match: someone else's cart id returns "unknown".
 */
export async function getCheckoutStatus(cartId: string): Promise<CheckoutStatus> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: CheckoutStatus = {
    status: "unknown",
    planName: null,
    failureReason: null,
  };

  if (!user) return { ...empty, status: "signed_out" };
  if (!cartId) return empty;

  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_transactions")
    .select("status, failure_reason, plan:plans(name)")
    .eq("cart_id", cartId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return empty;

  const plan = data.plan as unknown as { name: string } | null;

  return {
    status: data.status as CheckoutStatus["status"],
    planName: plan?.name ?? null,
    failureReason: data.failure_reason ?? null,
  };
}
