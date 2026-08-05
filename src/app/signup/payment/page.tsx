"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { startCheckout } from "@/lib/actions/checkout";

// Step 3 of signup: hand the buyer off to PayTabs' hosted payment page.
//
// This page creates nothing. It asks the server to open a PayTabs session and
// then leaves. The organization and its plan only come into existence after
// PayTabs confirms the payment to our callback endpoint, server to server.
function PaymentContent() {
  const searchParams = useSearchParams();
  const planSlug = (searchParams.get("plan") ?? "").toLowerCase();
  const agency = searchParams.get("agency") ?? "";

  // Derived, not stored: whether the URL carries what checkout needs is a fact
  // about this render, so it must not go through an effect.
  const missingInput = !planSlug || !agency;

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const started = useRef(false);

  const error = missingInput
    ? "Missing plan or agency name. Please pick a plan again."
    : checkoutError;

  // The `started` ref is the only guard here, deliberately. It has to be a ref
  // rather than a cleanup flag because it must survive React's development
  // double-mount: a second checkout session would leave an orphan pending row
  // and a second PayTabs transaction.
  //
  // There is no cleanup, and that is the point. An earlier version cancelled on
  // unmount, which meant the double-mount cancelled the very call the ref guard
  // then refused to retry — the request reached PayTabs, came back with a
  // redirect URL, and got dropped on the floor while the spinner ran forever.
  // The outcome of this effect is a full-page navigation away, so there is
  // nothing left to clean up.
  useEffect(() => {
    if (missingInput || started.current) return;
    started.current = true;

    startCheckout(planSlug, agency).then(
      (result) => {
        if ("error" in result) {
          setCheckoutError(result.error);
          return;
        }

        // Full navigation — PayTabs' page is on their domain.
        window.location.href = result.redirectUrl;
      },
      (cause) => {
        // A thrown server action used to surface as the same infinite spinner.
        console.error("[checkout] startCheckout threw", cause);
        setCheckoutError("Something went wrong starting checkout. Please try again.");
      }
    );
  }, [planSlug, agency, missingInput]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 py-14 px-4">
      <div className="max-w-[448px] w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 space-y-6 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm ring-8 ring-slate-50 ${
            error ? "bg-red-600" : "bg-[#0F172A]"
          }`}
        >
          {error ? (
            <span className="material-symbols-outlined text-[28px]">error_outline</span>
          ) : (
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          )}
        </div>

        {error ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                Couldn&apos;t start checkout
              </h1>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
            <Link
              href="/signup/plan"
              className="inline-block w-full rounded-lg bg-[#0F172A] py-3 px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#1e293b]"
            >
              Back to plans
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                Redirecting to secure payment
              </h1>
              <p className="text-sm text-slate-500">
                Connecting you to PayTabs to complete your subscription. Please
                don&apos;t close this window.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-slate-500">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                verified_user
              </span>
              <span className="text-xs">
                Card details are entered on <strong>PayTabs</strong> and never touch
                our servers.
              </span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function SignupPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500">Preparing checkout…</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
