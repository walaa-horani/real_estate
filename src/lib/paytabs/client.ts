import "server-only";
import { getPayTabsConfig } from "@/lib/paytabs/config";

// Shape of the bits of PayTabs' payloads we actually act on. PayTabs returns a
// lot more; we keep the raw object around for auditing and only read what we
// verify against.
export type PayTabsPaymentResult = {
  response_status?: string;
  response_code?: string;
  response_message?: string;
  transaction_time?: string;
};

export type PayTabsTransaction = {
  tran_ref?: string;
  tran_type?: string;
  cart_id?: string;
  cart_amount?: string | number;
  cart_currency?: string;
  // Query responses use profileId/merchantId; callbacks use profile_id.
  profile_id?: string | number;
  profileId?: string | number;
  payment_result?: PayTabsPaymentResult;
  // Present on a failed /payment/request or /payment/query call.
  code?: number;
  message?: string;
  [key: string]: unknown;
};

export type CreatePaymentRequestInput = {
  cartId: string;
  cartDescription: string;
  amount: number; // major units, e.g. 99.00
  currency: string;
  returnUrl: string;
  callbackUrl: string;
  customerEmail: string;
  customerName: string;
};

export type ChargeWithTokenInput = {
  cartId: string;
  cartDescription: string;
  amount: number;
  currency: string;
  token: string;
};

async function postJson(path: string, body: unknown): Promise<PayTabsTransaction> {
  const { baseUrl, serverKey } = getPayTabsConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: serverKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    // Payment calls must never be served from a cache.
    cache: "no-store",
  });

  const text = await response.text();

  let parsed: PayTabsTransaction;
  try {
    parsed = JSON.parse(text) as PayTabsTransaction;
  } catch {
    throw new Error(
      `PayTabs ${path} returned a non-JSON response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      `PayTabs ${path} failed (HTTP ${response.status}): ${parsed.message ?? text}`
    );
  }

  return parsed;
}

/**
 * Create a Hosted Payment Page session. Returns PayTabs' redirect_url plus the
 * transaction reference, when PayTabs issues one up front.
 *
 * The amount and currency passed here come from the plans table, never from the
 * browser — and they are also written to our payment_transactions row so the
 * callback can compare PayTabs' authoritative figures against them.
 */
export async function createPaymentRequest(
  input: CreatePaymentRequestInput
): Promise<{ redirectUrl: string; tranRef: string | null; raw: PayTabsTransaction }> {
  const { profileId } = getPayTabsConfig();

  const payload = {
    profile_id: profileId,
    tran_type: "sale",
    tran_class: "ecom",
    cart_id: input.cartId,
    cart_description: input.cartDescription,
    cart_currency: input.currency,
    cart_amount: Number(input.amount.toFixed(2)),
    hide_shipping: true,
    customer_details: {
      name: input.customerName,
      email: input.customerEmail,
    },
    return: input.returnUrl,
    callback: input.callbackUrl,
    // 2 = Hex32 token format. Every checkout enrolls the card for future
    // automatic renewal — this app never asks the buyer to pay twice.
    tokenise: 2,
  };

  const raw = await postJson("/payment/request", payload);
  const redirectUrl = typeof raw.redirect_url === "string" ? raw.redirect_url : null;

  if (!redirectUrl) {
    throw new Error(
      `PayTabs did not return a redirect_url: ${raw.message ?? JSON.stringify(raw)}`
    );
  }

  return {
    redirectUrl,
    tranRef: typeof raw.tran_ref === "string" ? raw.tran_ref : null,
    raw,
  };
}

/**
 * Charge a previously saved card via its PayTabs token — no browser, no
 * hosted page. Used only by the automatic renewal cron; the buyer is never
 * involved.
 *
 * No `return`/`callback` URLs: PayTabs answers this request directly rather
 * than notifying async, which is exactly why the caller still queries
 * /payment/query with the returned tran_ref afterward — this response alone
 * is not treated as sufficient to grant a renewal (verifyTransaction always
 * runs against the /payment/query result, never this one).
 */
export async function chargeWithToken(
  input: ChargeWithTokenInput
): Promise<{ tranRef: string | null; raw: PayTabsTransaction }> {
  const { profileId } = getPayTabsConfig();

  const payload = {
    profile_id: profileId,
    tran_type: "sale",
    tran_class: "recurring",
    cart_id: input.cartId,
    cart_description: input.cartDescription,
    cart_currency: input.currency,
    cart_amount: Number(input.amount.toFixed(2)),
    token: input.token,
  };

  const raw = await postJson("/payment/request", payload);

  return {
    tranRef: typeof raw.tran_ref === "string" ? raw.tran_ref : null,
    raw,
  };
}

/**
 * Re-verify a transaction directly with PayTabs.
 *
 * This is the authoritative check. The callback body is attacker-reachable
 * input even after its signature verifies (a leaked server key, a replayed
 * body); this response comes back over our own outbound TLS connection
 * authenticated with the server key, so it is what we actually trust for
 * status, amount, currency and cart reference.
 */
export async function queryTransaction(tranRef: string): Promise<PayTabsTransaction> {
  const { profileId } = getPayTabsConfig();
  return postJson("/payment/query", {
    profile_id: profileId,
    tran_ref: tranRef,
  });
}
