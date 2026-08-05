"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvite } from "@/lib/actions/invite";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const result = await acceptInvite(password);
    setPending(false);

    if (result && "error" in result) {
      setError(result.error);
      return;
    }

    router.push("/dashboard/properties");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 py-14 px-4">
      <div className="max-w-[448px] w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm ring-8 ring-slate-50">
            <span className="material-symbols-outlined text-[28px]">key</span>
          </div>
          <div className="space-y-1 pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Activate Your Account
            </h1>
            <p className="text-sm text-slate-500 font-normal">
              You&apos;ve been invited to join an agency on EstateSync Pro. Choose a password below to activate your account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              New Password
            </label>
            <div className="relative rounded-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Confirm Password
            </label>
            <div className="relative rounded-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition duration-150 hover:border-slate-400 hover:bg-slate-50/50 focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium" role="alert">
              <span className="material-symbols-outlined text-[20px] text-red-500 shrink-0 mt-0.5">error_outline</span>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#0F172A] py-3 px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#1e293b] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {pending ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                <span>Activating Account…</span>
              </>
            ) : (
              <>
                <span>Activate & Access Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

