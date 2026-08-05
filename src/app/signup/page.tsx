"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import { signUpAgency, type SignupActionState } from "@/lib/actions/signup";

export default function SignupDetailsPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [password, setPassword] = useState("");

  const [actionState, formAction, pending] = useActionState<SignupActionState, FormData>(
    signUpAgency,
    null
  );

  useEffect(() => {
    if (actionState && "success" in actionState && !actionState.needsConfirmation) {
      router.push(`/signup/plan?agency=${encodeURIComponent(agencyName)}`);
    }
  }, [actionState, agencyName, router]);

  if (actionState && "success" in actionState && actionState.needsConfirmation) {
    return (
      <main className="w-full flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[448px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] text-white shadow-sm ring-8 ring-slate-50">
            <span className="material-symbols-outlined text-[28px]">
              mail
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm leading-relaxed text-slate-500">
            We sent a confirmation link to{" "}
            <strong className="text-slate-700">{email}</strong>. Click it to
            verify your account and continue setting up{" "}
            {agencyName || "your agency"}.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center py-xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm overflow-hidden">
        {/* Progress Header */}
        <div className="bg-surface-gray border-b border-border-gray px-lg py-md">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-h3 text-h3 text-text-primary font-bold">
              Agency Details
            </h1>
            <span className="font-sm text-sm text-text-secondary">
              Step 1 of 3
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2">
            <div className="bg-secondary h-2 rounded-full w-1/3 transition-all duration-300"></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-lg md:p-xl space-y-xl">
          <p className="font-sm text-sm text-text-secondary">
            Please provide your primary agency information to set up your enterprise account.
          </p>
          <form action={formAction} className="space-y-lg">
            {/* Agency Name & Logo Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-sm">
                <label
                  className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                  htmlFor="agency-name"
                >
                  Agency Name *
                </label>
                <input
                  type="text"
                  id="agency-name"
                  name="agencyName"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                  placeholder="e.g. Skyline Properties"
                  className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                />
              </div>

              {/* Logo upload */}
              <div className="space-y-sm row-span-2 hidden md:block">
                <label className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold">
                  Agency Logo
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-gray border-dashed rounded-lg bg-surface-gray hover:bg-surface-container-low transition-colors cursor-pointer group">
                  <div className="space-y-1 text-center">
                    <span className="material-symbols-outlined text-4xl text-text-secondary group-hover:text-primary-navy transition-colors">
                      upload_file
                    </span>
                    <div className="flex text-sm text-text-secondary justify-center">
                      <span className="relative cursor-pointer rounded-md font-semibold text-secondary hover:text-on-secondary-container">
                        <span>Upload a file</span>
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-text-secondary">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="border-t border-border-gray pt-md space-y-lg">
              <h2 className="font-sm text-sm text-text-primary font-bold">
                Primary Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="space-y-sm">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="contact-name"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    placeholder="Sarah Jenkins"
                    className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
                <div className="space-y-sm">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="contact-email"
                  >
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="sarah@skyline.com"
                    className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
                <div className="space-y-sm">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="contact-password"
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    id="contact-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
                <div className="space-y-sm md:col-span-2">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="contact-phone"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (212) 555-0198"
                    className="w-full md:w-1/2 rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
              </div>
              {actionState && "error" in actionState && (
                <p className="font-sm text-sm text-error" role="alert">
                  {actionState.error}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="border-t border-border-gray pt-md space-y-lg">
              <h2 className="font-sm text-sm text-text-primary font-bold">
                Headquarters Address
              </h2>
              <div className="space-y-sm">
                <label
                  className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                  htmlFor="address-line1"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  id="address-line1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Madison Avenue"
                  className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="space-y-sm">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="address-city"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="address-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
                <div className="space-y-sm">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="address-state"
                  >
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="address-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                    className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
                <div className="space-y-sm">
                  <label
                    className="block font-xs text-xs text-text-primary uppercase tracking-wider font-bold"
                    htmlFor="address-zip"
                  >
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    id="address-zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="10016"
                    className="w-full rounded bg-surface-container-lowest border border-border-gray px-md py-sm font-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors hover:bg-surface-gray"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-lg flex justify-end gap-md">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-surface-container-lowest text-text-primary border border-border-gray px-lg py-sm rounded font-sm text-sm font-semibold hover:bg-surface-gray transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="bg-secondary text-on-secondary px-lg py-sm rounded font-sm text-sm font-semibold hover:bg-on-secondary-container transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {pending ? "Creating account…" : "Continue to Step 2"}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
