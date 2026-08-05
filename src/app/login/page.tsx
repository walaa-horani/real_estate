"use client";

import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthActionState } from "@/lib/actions/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard/properties";
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signIn,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen w-full flex items-center justify-center py-14 px-4 bg-slate-50/50">
      <div className="max-w-[448px] w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 space-y-8">
        {/* Header & Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm ring-8 ring-slate-50">
            <span className="material-symbols-outlined text-[28px]">real_estate_agent</span>
          </div>
          <div className="space-y-1 pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Sign in to EstateSync Pro
            </h1>
            <p className="text-sm text-slate-500 font-normal">
              Enter your credentials to access your agency dashboard
            </p>
          </div>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="next" value={next} />

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]"
              htmlFor="email"
            >
              Work Email
            </label>
            <div className="relative rounded-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@agency.com"
                className="w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition duration-150 hover:border-slate-400 hover:bg-slate-50/50 focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative rounded-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white pl-11 pr-11 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition duration-150 hover:border-slate-400 hover:bg-slate-50/50 focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {state?.error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium" role="alert">
              <span className="material-symbols-outlined text-[20px] text-red-500 shrink-0 mt-0.5">error_outline</span>
              <span className="leading-tight">{state.error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#0F172A] py-3 px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#1e293b] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {pending ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Setting up a new agency?{" "}
            <Link href="/signup" className="font-bold text-[#10B981] hover:text-[#059669] hover:underline transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
        <p className="text-slate-500 font-medium text-sm">Loading sign-in portal...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

