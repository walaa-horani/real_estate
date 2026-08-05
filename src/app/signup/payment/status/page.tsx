"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCheckoutStatus, type CheckoutStatus } from "@/lib/actions/checkout";

// Post-payment screen. Purely a mirror of what the server already decided —
// it polls our own database, never the PayTabs redirect parameters. If the
// callback hasn't landed yet the honest answer is "still confirming", not
// "you're in".
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

function StatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartId = searchParams.get("cart") ?? "";

  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!cartId) return;

    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const next = await getCheckoutStatus(cartId);
      if (cancelled) return;

      setStatus(next);

      if (next.status === "paid") {
        setTimeout(() => router.push("/dashboard/properties"), 1500);
        return;
      }

      // Polling cannot resolve a missing session — only signing in can.
      if (next.status === "signed_out") {
        return;
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }

      if (next.status === "pending" || next.status === "unknown") {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    let timer: ReturnType<typeof setTimeout>;
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cartId, router]);

  const paid = status?.status === "paid";
  const failed = status?.status === "failed" || status?.status === "mismatch";
  const signedOut = status?.status === "signed_out";
  const confirming = !paid && !failed && !signedOut && !timedOut;

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 py-14 px-4">
      <div className="max-w-[448px] w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 space-y-6 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm ring-8 ring-slate-50 ${
            paid ? "bg-emerald-600" : failed ? "bg-red-600" : "bg-[#0F172A]"
          }`}
        >
          {confirming ? (
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          ) : (
            <span className="material-symbols-outlined text-[28px]">
              {paid ? "verified" : failed ? "error_outline" : signedOut ? "lock" : "schedule"}
            </span>
          )}
        </div>

        {paid && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Subscription active
            </h1>
            <p className="text-sm text-slate-500">
              Your {status?.planName ?? "subscription"} plan is confirmed. Taking you
              to your dashboard…
            </p>
          </div>
        )}

        {failed && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Payment not completed
            </h1>
            <p className="text-sm text-slate-500">
              {status?.status === "mismatch"
                ? "We could not verify this payment against the plan you selected, so nothing was activated."
                : "The payment did not go through, so no subscription was activated."}
            </p>
            {status?.failureReason && (
              <p className="text-xs text-slate-400 break-words">{status.failureReason}</p>
            )}
          </div>
        )}

        {signedOut && (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                Sign in to see this payment
              </h1>
              <p className="text-sm text-slate-500">
                You&apos;re not signed in on this browser, so we can&apos;t show the
                status of this transaction. If the payment went through, your
                subscription is already active — signing in will take you straight
                to your dashboard.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full rounded-lg bg-[#0F172A] py-3 px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#1e293b]"
            >
              Sign in
            </Link>
          </>
        )}

        {timedOut && !paid && !failed && !signedOut && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Still confirming
            </h1>
            <p className="text-sm text-slate-500">
              Your payment provider hasn&apos;t confirmed this transaction yet. It can
              take a few minutes — you can safely close this page, and your plan will
              activate as soon as the confirmation arrives.
            </p>
          </div>
        )}

        {confirming && !timedOut && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Confirming your payment
            </h1>
            <p className="text-sm text-slate-500">
              We&apos;re waiting for the payment provider to confirm this transaction
              directly with our servers. Please don&apos;t close this window.
            </p>
          </div>
        )}

        {!cartId && !signedOut && (
          <p className="text-sm text-slate-500">
            No transaction reference was provided.
          </p>
        )}

        {(failed || timedOut) && (
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/signup/plan"
              className="w-full rounded-lg bg-[#0F172A] py-3 px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#1e293b]"
            >
              Choose a plan again
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500">Loading payment status…</p>
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
