import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { getPayTabsConfig } from "@/lib/paytabs/config";
import { verifyCallbackSignature } from "@/lib/paytabs/signature";
import { queryTransaction, type PayTabsTransaction } from "@/lib/paytabs/client";
import { verifyTransaction } from "@/lib/paytabs/verify";

// node:crypto for the HMAC, and never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// PayTabs server-to-server callback (IPN). This is the ONLY place in the app
// that can turn a payment into a subscription.
//
// Order matters and each step gates the next:
//   1. HMAC-SHA256 over the RAW body vs the `signature` header  -> is it PayTabs?
//   2. Look up our own cart row                                 -> do we know this cart?
//   3. POST /payment/query back to PayTabs                      -> what does PayTabs say?
//   4. Compare status/ref/cart/amount/currency/profile          -> does it match what we quoted?
//   5. apply_paid_transaction() (row lock + status guard)       -> fulfil exactly once
//
// Status codes are chosen for PayTabs' retry behaviour: 200 means "handled,
// stop retrying" (including for transactions we deliberately refuse), 401 means
// the request was not authentic, 500 means we failed and want a retry.
// ---------------------------------------------------------------------------

function parseBody(rawBody: string, contentType: string | null): PayTabsTransaction | null {
  try {
    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      return Object.fromEntries(params.entries()) as PayTabsTransaction;
    }
    return JSON.parse(rawBody) as PayTabsTransaction;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const config = getPayTabsConfig();

  // Read the body exactly as sent. Parsing first and re-serializing would change
  // whitespace and key order, and the HMAC would never match.
  const rawBody = await request.text();
  const signature = request.headers.get("signature");

  if (!verifyCallbackSignature(rawBody, signature, config.serverKey)) {
    console.warn("[paytabs] rejected callback with invalid signature");
    return new Response("invalid signature", { status: 401 });
  }

  const body = parseBody(rawBody, request.headers.get("content-type"));
  const cartId = typeof body?.cart_id === "string" ? body.cart_id : null;
  const tranRef = typeof body?.tran_ref === "string" ? body.tran_ref : null;

  if (!body || !cartId || !tranRef) {
    console.warn("[paytabs] signed callback missing cart_id/tran_ref");
    return new Response("ok", { status: 200 });
  }

  const admin = createAdminClient();

  const { data: transaction, error: lookupError } = await admin
    .from("payment_transactions")
    .select("id, cart_id, tran_ref, amount_cents, currency, status")
    .eq("cart_id", cartId)
    .maybeSingle();

  if (lookupError) {
    console.error("[paytabs] transaction lookup failed", lookupError);
    return new Response("lookup failed", { status: 500 });
  }

  if (!transaction) {
    // Authentic PayTabs callback for a cart we never created. Nothing to do,
    // and nothing to tell the caller about.
    console.warn("[paytabs] callback for unknown cart", cartId);
    return new Response("ok", { status: 200 });
  }

  // Audit trail first, so even a refused callback is recorded.
  await admin
    .from("payment_transactions")
    .update({ paytabs_callback: body as unknown as Record<string, unknown> })
    .eq("id", transaction.id);

  if (transaction.status === "paid") {
    // Duplicate notification. apply_paid_transaction would also short-circuit,
    // but skipping the extra PayTabs round trip keeps retries cheap.
    return new Response("ok", { status: 200 });
  }

  // Step 3 — ask PayTabs directly rather than believing the body we were sent.
  let queried: PayTabsTransaction;
  try {
    queried = await queryTransaction(tranRef);
  } catch (error) {
    console.error("[paytabs] re-verification query failed", error);
    // Transient: let PayTabs retry rather than recording a false failure.
    return new Response("query failed", { status: 500 });
  }

  const verification = verifyTransaction(queried, {
    cartId: transaction.cart_id,
    tranRef,
    amountCents: transaction.amount_cents,
    currency: transaction.currency,
    profileId: config.profileId,
  });

  if (!verification.ok) {
    const declined = queried.payment_result?.response_status;
    // A declined card is an ordinary failure; anything else means the numbers
    // did not line up and deserves the louder 'mismatch' status.
    const status = declined && declined !== "A" ? "failed" : "mismatch";

    console.warn("[paytabs] refused transaction", cartId, verification.reason);

    await admin
      .from("payment_transactions")
      .update({
        status,
        failure_reason: verification.reason,
        paytabs_query: queried as unknown as Record<string, unknown>,
      })
      .eq("id", transaction.id)
      .eq("status", "pending");

    return new Response("ok", { status: 200 });
  }

  // Step 5 — single fulfilment path. Idempotency lives in the function (row
  // lock + status guard), so concurrent duplicate callbacks cannot double-apply.
  const { data: outcome, error: applyError } = await admin.rpc("apply_paid_transaction", {
    p_cart_id: transaction.cart_id,
    p_tran_ref: tranRef,
    p_query_payload: queried,
  });

  if (applyError) {
    console.error("[paytabs] apply_paid_transaction failed", applyError);
    return new Response("apply failed", { status: 500 });
  }

  console.info("[paytabs] fulfilment outcome", cartId, outcome);
  return new Response("ok", { status: 200 });
}
