import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { getPayTabsConfig } from "@/lib/paytabs/config";
import { chargeWithToken, queryTransaction, type PayTabsTransaction } from "@/lib/paytabs/client";
import { verifyTransaction } from "@/lib/paytabs/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Fully automatic subscription renewal. Called by pg_cron (via pg_net) every
// 30 minutes — see trigger_subscription_renewal() /
// claim_due_subscriptions_for_renewal() in the payments migrations. No human
// ever revisits billing after the first checkout: a subscription past its
// current_period_end gets charged against its saved PayTabs token here, and
// the same verification chain as the original payment applies:
//
//   1. shared-secret header check (this endpoint is reachable from the
//      public internet — only our own cron job should ever call it)
//   2. charge the saved token (tran_class 'recurring', no browser involved)
//   3. independently re-query PayTabs for that transaction
//   4. compare status/ref/cart/amount/currency/profile against what we
//      expected before extending anything
//   5. apply_renewal_transaction() (row lock + status guard) — exactly once
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const provided = request.headers.get("x-cron-secret");
  const expected = process.env.PAYTABS_RENEWAL_SECRET;

  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response("unauthorized", { status: 401 });
  }

  const config = getPayTabsConfig();
  const admin = createAdminClient();

  const { data: due, error: claimError } = await admin.rpc(
    "claim_due_subscriptions_for_renewal",
    { p_limit: 25 }
  );

  if (claimError) {
    console.error("[paytabs-renew] claim failed", claimError);
    return new Response("claim failed", { status: 500 });
  }

  const results: Array<{ organizationId: string; outcome: string }> = [];

  for (const subscription of due ?? []) {
    const organizationId: string = subscription.organization_id;
    const planId: string = subscription.plan_id;
    const token: string | null = subscription.paytabs_token;

    if (!token) {
      await admin.rpc("mark_renewal_failed", {
        p_cart_id: `no-token-${organizationId}-${Date.now()}`,
        p_reason: "no saved payment method on file",
      });
      results.push({ organizationId, outcome: "no_token" });
      continue;
    }

    const { data: org } = await admin
      .from("organizations")
      .select("id, name, slug, created_by")
      .eq("id", organizationId)
      .maybeSingle();

    const { data: plan } = await admin
      .from("plans")
      .select("id, name, price_monthly_cents")
      .eq("id", planId)
      .maybeSingle();

    if (!org || !plan) {
      results.push({ organizationId, outcome: "org_or_plan_missing" });
      continue;
    }

    const cartId = randomUUID();

    const { data: transaction, error: insertError } = await admin
      .from("payment_transactions")
      .insert({
        cart_id: cartId,
        user_id: org.created_by,
        intent: "renewal",
        organization_id: organizationId,
        organization_name: org.name,
        organization_slug: org.slug,
        plan_id: plan.id,
        amount_cents: plan.price_monthly_cents,
        currency: config.currency,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !transaction) {
      console.error("[paytabs-renew] failed to record transaction", insertError);
      results.push({ organizationId, outcome: "record_failed" });
      continue;
    }

    let charged: { tranRef: string | null; raw: PayTabsTransaction };
    try {
      charged = await chargeWithToken({
        cartId,
        cartDescription: `${plan.name} plan renewal — ${org.name}`,
        amount: plan.price_monthly_cents / 100,
        currency: config.currency,
        token,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "charge request failed";
      console.error("[paytabs-renew] charge failed", organizationId, reason);
      await admin.rpc("mark_renewal_failed", { p_cart_id: cartId, p_reason: reason });
      results.push({ organizationId, outcome: "charge_failed" });
      continue;
    }

    await admin
      .from("payment_transactions")
      .update({ tran_ref: charged.tranRef, paytabs_request: charged.raw })
      .eq("id", transaction.id);

    if (!charged.tranRef) {
      await admin.rpc("mark_renewal_failed", {
        p_cart_id: cartId,
        p_reason: "PayTabs did not return a tran_ref",
      });
      results.push({ organizationId, outcome: "no_tran_ref" });
      continue;
    }

    // Never trust the synchronous charge response for fulfilment — re-query,
    // same as the original checkout callback.
    let queried: PayTabsTransaction;
    try {
      queried = await queryTransaction(charged.tranRef);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "verification query failed";
      console.error("[paytabs-renew] query failed", organizationId, reason);
      await admin.rpc("mark_renewal_failed", { p_cart_id: cartId, p_reason: reason });
      results.push({ organizationId, outcome: "query_failed" });
      continue;
    }

    const verification = verifyTransaction(queried, {
      cartId,
      tranRef: charged.tranRef,
      amountCents: plan.price_monthly_cents,
      currency: config.currency,
      profileId: config.profileId,
    });

    if (!verification.ok) {
      console.warn("[paytabs-renew] refused renewal", organizationId, verification.reason);
      await admin.rpc("mark_renewal_failed", {
        p_cart_id: cartId,
        p_reason: verification.reason,
      });
      results.push({ organizationId, outcome: "declined" });
      continue;
    }

    const { data: outcome, error: applyError } = await admin.rpc("apply_renewal_transaction", {
      p_cart_id: cartId,
      p_tran_ref: charged.tranRef,
      p_query_payload: queried,
    });

    if (applyError) {
      console.error("[paytabs-renew] apply failed", organizationId, applyError);
      results.push({ organizationId, outcome: "apply_failed" });
      continue;
    }

    console.info("[paytabs-renew] renewed", organizationId, outcome);
    results.push({ organizationId, outcome: "renewed" });
  }

  return Response.json({ processed: results.length, results });
}
