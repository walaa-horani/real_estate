import "server-only";
import type { PayTabsTransaction } from "@/lib/paytabs/client";

export type ExpectedTransaction = {
  cartId: string;
  tranRef: string;
  amountCents: number;
  currency: string;
  profileId: string;
};

export type VerificationResult =
  | { ok: true }
  | { ok: false; reason: string };

// PayTabs money fields come back as strings ("99", "99.00", "99.0"). Compare in
// integer minor units so 99 and 99.00 match but 99.01 does not — never compare
// floats directly, and never accept "close enough".
function toCents(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

/**
 * Decide whether a PayTabs transaction may be fulfilled.
 *
 * Called with the response from /payment/query — i.e. PayTabs' own record,
 * fetched over our outbound connection — checked against the snapshot we wrote
 * to payment_transactions before sending the buyer to the payment page.
 *
 * Every one of these is a real attack it blocks:
 *   status   — "the buyer reached the callback but never actually paid"
 *   tran_ref — a valid transaction from somewhere else replayed onto this cart
 *   cart_id  — a real payment for cart A credited to cart B
 *   amount   — paying 49 and receiving Enterprise
 *   currency — paying 199 of a currency worth far less
 *   profile  — a transaction from a different (possibly attacker-owned) profile
 */
export function verifyTransaction(
  transaction: PayTabsTransaction,
  expected: ExpectedTransaction
): VerificationResult {
  const status = transaction.payment_result?.response_status;
  if (status !== "A") {
    return {
      ok: false,
      reason: `payment not authorised (response_status=${status ?? "none"}: ${
        transaction.payment_result?.response_message ?? "no message"
      })`,
    };
  }

  if (transaction.tran_ref !== expected.tranRef) {
    return {
      ok: false,
      reason: `tran_ref mismatch (expected ${expected.tranRef}, got ${transaction.tran_ref ?? "none"})`,
    };
  }

  if (transaction.cart_id !== expected.cartId) {
    return {
      ok: false,
      reason: `cart_id mismatch (expected ${expected.cartId}, got ${transaction.cart_id ?? "none"})`,
    };
  }

  const currency = String(transaction.cart_currency ?? "").toUpperCase();
  if (currency !== expected.currency.toUpperCase()) {
    return {
      ok: false,
      reason: `currency mismatch (expected ${expected.currency}, got ${currency || "none"})`,
    };
  }

  const paidCents = toCents(transaction.cart_amount);
  if (paidCents === null) {
    return { ok: false, reason: "missing or unreadable cart_amount" };
  }
  if (paidCents !== expected.amountCents) {
    return {
      ok: false,
      reason: `amount mismatch (expected ${expected.amountCents} minor units, got ${paidCents})`,
    };
  }

  const profileId = String(transaction.profile_id ?? transaction.profileId ?? "");
  if (profileId !== String(expected.profileId)) {
    return {
      ok: false,
      reason: `profile_id mismatch (expected ${expected.profileId}, got ${profileId || "none"})`,
    };
  }

  return { ok: true };
}
