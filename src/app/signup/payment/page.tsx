"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Enterprise";

  const [counter, setCounter] = useState(3);

  // Mapped details
  const planPriceMap: Record<string, string> = {
    Basic: "$49.00",
    Pro: "$99.00",
    Enterprise: "$199.00",
  };
  const price = planPriceMap[plan] || "$199.00";

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to properties dashboard
          router.push("/dashboard/properties");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="flex-grow flex items-center justify-center p-md">
      <div className="max-w-[448px] w-full bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm p-lg flex flex-col items-center text-center space-y-lg">
        {/* Progress Indicator */}
        <div className="w-full flex flex-col items-center space-y-sm mb-md">
          <div className="flex justify-between w-full max-w-[200px] items-center">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-sm text-sm">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: "16px" }}
              >
                check
              </span>
            </div>
            <div className="h-[2px] flex-grow bg-secondary mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-sm text-sm">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: "16px" }}
              >
                check
              </span>
            </div>
            <div className="h-[2px] flex-grow bg-primary-navy mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-sm text-sm border-2 border-primary-navy font-bold">
              3
            </div>
          </div>
          <span className="font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
            Step 3 of 3
          </span>
        </div>

        {/* Loading Spinner */}
        <div className="relative flex justify-center items-center w-24 h-24">
          <svg
            className="animate-spin w-16 h-16 text-primary-navy"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            ></path>
          </svg>
          <span
            className="material-symbols-outlined absolute text-primary-navy"
            style={{ fontSize: "24px", fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
        </div>

        {/* Titles */}
        <div className="space-y-sm">
          <h1 className="font-h2 text-h2 text-primary-navy font-bold">
            Redirecting to Secure Payment
          </h1>
          <p className="font-body text-body text-text-secondary">
            Please wait while we connect you to PayTabs to complete your subscription securely.
          </p>
          <p className="text-xs text-[#EA580C] font-semibold">
            Redirecting in {counter}s...
          </p>
        </div>

        {/* Order Summary */}
        <div className="w-full bg-surface-gray rounded border border-border-gray p-md text-left mt-md">
          <h3 className="font-sm text-sm font-bold text-text-secondary mb-sm uppercase tracking-wide">
            Order Summary
          </h3>
          <div className="flex justify-between items-center border-b border-border-gray pb-sm mb-sm">
            <span className="font-body text-body font-semibold text-primary-navy">
              {plan} Plan
            </span>
            <span className="font-body text-body font-bold text-primary-navy">
              {price}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-sm text-sm text-text-secondary">
              Billed Annually
            </span>
            <span className="font-sm text-sm text-text-secondary">USD</span>
          </div>
        </div>

        {/* Security Info */}
        <div className="flex items-center space-x-sm text-text-secondary pt-md border-t border-border-gray w-full justify-center">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            verified_user
          </span>
          <span className="font-xs text-xs">
            Payments processed securely by <strong>PayTabs</strong>
          </span>
        </div>
      </div>
    </main>
  );
}

export default function SignupPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-md">
        <p className="text-text-secondary">Loading payment details...</p>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
