"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agency, setAgency] = useState(searchParams.get("agency") ?? "");
  const [agencyError, setAgencyError] = useState<string | null>(null);

  const handleSelectPlan = (planName: string) => {
    if (!agency.trim()) {
      setAgencyError("Enter your agency name first.");
      return;
    }
    router.push(`/signup/payment?plan=${planName}&agency=${encodeURIComponent(agency.trim())}`);
  };

  const plans = [
    {
      name: "Basic",
      price: "₺49",
      desc: "Perfect for small teams getting started.",
      features: [
        "Up to 50 active listings",
        "2 Agent seats",
        "Standard email support",
        "Basic reporting dashboard",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "₺99",
      desc: "Everything you need to grow your agency.",
      features: [
        "Up to 250 active listings",
        "10 Agent seats",
        "Priority 24/7 support",
        "Advanced lead generation tools",
        "Automated property marketing",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "₺199",
      desc: "Custom solutions for large brokerages.",
      features: [
        "Unlimited active listings",
        "Unlimited Agent seats",
        "Dedicated account manager",
        "Custom branding & API access",
      ],
      popular: false,
    },
  ];

  return (
    <main className="flex-grow max-w-max-width-public mx-auto w-full px-lg py-xl">
      {/* Progress Indicator */}
      <div className="max-w-2xl mx-auto mb-xl">
        <div className="flex items-center justify-between relative">
          {/* Line background */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-border-gray -z-10"></div>
          {/* Line active */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/2 h-[2px] bg-primary -z-10"></div>

          {/* Step 1 (Completed) */}
          <div className="flex flex-col items-center">
            <Link
              href="/signup"
              className="w-8 h-8 rounded-full bg-primary-navy text-on-primary flex items-center justify-center font-sm text-sm mb-sm border-2 border-primary-navy"
            >
              <span className="material-symbols-outlined text-[16px] text-white">
                check
              </span>
            </Link>
            <span className="font-xs text-xs text-text-secondary">
              Agency Details
            </span>
          </div>

          {/* Step 2 (Active) */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary-navy flex items-center justify-center font-sm text-sm mb-sm border-2 border-primary-navy font-bold">
              2
            </div>
            <span className="font-xs text-xs text-primary-navy font-bold">
              Plan Selection
            </span>
          </div>

          {/* Step 3 (Pending) */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-text-secondary flex items-center justify-center font-sm text-sm mb-sm border-2 border-border-gray">
              3
            </div>
            <span className="font-xs text-xs text-text-secondary">Payment</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-xl">
        <h1 className="font-display-mobile md:font-display text-display-mobile md:text-display text-primary-navy mb-sm font-bold tracking-tight">
          Select the right plan for your agency
        </h1>
        <p className="font-body text-body text-text-secondary max-w-2xl mx-auto">
          Scale your operations with plans designed for teams of all sizes.
          Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Agency name (prefilled from step 1; editable fallback if resuming
          a session that never finished creating an org) */}
      <div className="max-w-[500px] mx-auto mb-12 bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center gap-3.5 mb-5 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">business</span>
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
              Agency Identity & Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Confirm your brokerage name before choosing a plan
            </p>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]" htmlFor="agency-name-input">
            Agency Name <span className="text-emerald-600">*</span>
          </label>
          <div className="relative rounded-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <input
              id="agency-name-input"
              type="text"
              value={agency}
              onChange={(e) => {
                setAgency(e.target.value);
                setAgencyError(null);
              }}
              placeholder="e.g. Skyline Properties & Real Estate"
              className={`w-full rounded-lg border pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white transition duration-150 ease-in-out hover:bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                agencyError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 focus:border-[#10B981] focus:ring-[#10B981]/20 hover:border-slate-400"
              }`}
            />
          </div>
          {agencyError && (
            <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs font-medium" role="alert">
              <span className="material-symbols-outlined text-[16px] shrink-0">error_outline</span>
              <span>{agencyError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg max-w-6xl mx-auto mt-lg">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-surface-container-lowest border rounded-xl p-lg flex flex-col hover:shadow-md transition-all duration-300 relative ${
              plan.popular
                ? "border-2 border-primary-navy shadow-md transform md:-translate-y-2"
                : "border-border-gray"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-tertiary-fixed-dim text-on-tertiary-fixed font-xs text-xs font-bold py-base px-sm rounded-full shadow-sm">
                Most Popular
              </div>
            )}
            <div className={`mb-lg ${plan.popular ? "mt-sm" : ""}`}>
              <h3 className="font-h3 text-h3 text-primary-navy font-bold mb-base">
                {plan.name}
              </h3>
              <p className="font-sm text-sm text-text-secondary">{plan.desc}</p>
            </div>
            <div className="mb-lg flex items-end">
              <span className="font-display text-display text-primary-navy font-bold">
                {plan.price}
              </span>
              <span className="font-body text-body text-text-secondary ml-base pb-1">
                /mo
              </span>
            </div>
            <button
              onClick={() => handleSelectPlan(plan.name)}
              className={`w-full py-md rounded-lg font-body text-body font-bold transition-all mb-lg ${
                plan.popular
                  ? "bg-primary-navy text-white hover:bg-primary-navy/90"
                  : "text-primary-navy border border-primary-navy bg-surface-container-lowest hover:bg-surface-container"
              }`}
            >
              Select {plan.name}
            </button>
            <div className="flex-grow">
              <p className="font-xs text-xs text-text-secondary font-bold mb-md uppercase tracking-wide">
                {plan.popular ? "Includes Basic, plus:" : "Includes:"}
              </p>
              <ul className="space-y-md">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span
                      className="material-symbols-outlined text-secondary mr-sm shrink-0"
                      style={{
                        fontVariationSettings: "'FILL' 1",
                        fontSize: "18px",
                      }}
                    >
                      check_circle
                    </span>
                    <span className="font-sm text-sm text-on-surface-variant">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function SignupPlanPage() {
  return (
    <Suspense fallback={null}>
      <SignupPlanContent />
    </Suspense>
  );
}
