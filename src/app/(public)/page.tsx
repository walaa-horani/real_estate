import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAgenciesList } from "@/lib/queries/agencies";
import { signOut } from "@/lib/actions/auth";
import FaqSection from "@/components/public/FaqSection";

export default async function PublicLandingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allAgencies = await getAgenciesList();
  const featuredAgencies = allAgencies.slice(0, 3);

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="max-w-max-width-public mx-auto px-lg py-xl text-center flex flex-col items-center justify-center min-h-[40vh] md:min-h-[50vh] mt-md">
        <h1 className="font-display text-display text-primary-navy mb-md tracking-tight leading-tight max-w-4xl">
          Empowering Agencies, Connecting Properties.
        </h1>
        <p className="font-h3 text-h3 text-text-secondary max-w-2xl mx-auto mb-lg">
          The ultimate multi-tenant platform for modern real estate management.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <div className="flex flex-wrap justify-center items-center gap-4">
              <Link
                href="/dashboard/properties"
                className="font-body text-body font-bold bg-[#EA580C] text-white px-lg py-md rounded-lg hover:bg-[#C2410C] transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="font-body text-body font-semibold text-primary-navy border border-primary-navy/40 px-lg py-md rounded-lg hover:bg-surface-gray hover:text-red-600 hover:border-red-500 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link
                href="/signup"
                className="font-body text-body font-bold bg-[#EA580C] text-white px-lg py-md rounded-lg hover:bg-[#C2410C] transition-colors shadow-sm"
              >
                Start Your Free Trial
              </Link>
              <a
                href="#"
                className="font-body text-body font-semibold text-primary-navy border border-primary-navy px-lg py-md rounded-lg hover:bg-surface-gray transition-colors"
              >
                Request Demo
              </a>
            </>
          )}
        </div>
      </section>

      {/* Featured Agencies Section */}
      <section className="max-w-max-width-public mx-auto px-lg py-xl mb-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-lg gap-md">
          <div>
            <h2 className="font-h2 text-h2 text-primary-navy font-bold tracking-tight">
              Featured Agencies
            </h2>
            <p className="font-sm text-sm text-text-secondary mt-sm">
              Discover top-performing real estate teams and verified brokerages on our platform.
            </p>
          </div>
          <Link
            className="font-sm text-sm text-[#EA580C] font-bold hover:underline flex items-center gap-1 transition-all"
            href="/agencies"
          >
            <span>View All Agencies</span>
            <span className="material-symbols-outlined text-[16px] inline">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {featuredAgencies.map((agency) => (
            <Link
              key={agency.id}
              href={agency.link}
              className={`rounded-xl border shadow-sm hover:shadow-md transition-all p-lg flex flex-col gap-md cursor-pointer group ${
                agency.isMyAgency
                  ? "bg-emerald-50/20 border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : "bg-surface-container-lowest border-border-gray"
              }`}
            >
              {agency.logoUrl ? (
                <div className="w-full h-32 rounded-lg bg-surface-gray border border-border-gray flex items-center justify-center overflow-hidden p-md relative">
                  {agency.isMyAgency && (
                    <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-[#10B981] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>Your Agency</span>
                    </span>
                  )}
                  <img
                    src={agency.logoUrl}
                    alt={`${agency.name} Logo`}
                    className="h-16 w-auto max-w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200"
                  />
                </div>
              ) : (
                <div className="w-full h-32 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-4 relative group-hover:bg-[#1E293B] transition-colors duration-200 shadow-inner">
                  {agency.isMyAgency && (
                    <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-[#10B981] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>Your Agency</span>
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[36px] text-[#10B981] mb-1">
                    business
                  </span>
                  <span className="text-white font-bold text-base tracking-tight truncate max-w-full px-4 text-center">
                    {agency.name}
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-h3 text-h3 font-bold text-primary-navy group-hover:text-[#EA580C] transition-colors truncate">
                  {agency.name}
                </h3>
                <div className="flex items-center gap-sm text-text-secondary mt-1">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>
                  <span className="font-sm text-sm truncate">{agency.location}</span>
                </div>
              </div>

              <div className="mt-auto pt-md border-t border-border-gray flex justify-between items-center">
                <span className="font-xs text-xs text-text-secondary font-semibold">
                  Active Listings: <strong className="text-primary-navy">{agency.listingsCount}</strong>
                </span>
                {agency.isMyAgency ? (
                  <span className="font-sm text-sm font-bold text-[#EA580C] flex items-center gap-0.5">
                    <span>Go to Dashboard</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                ) : (
                  <span className="font-sm text-sm font-semibold text-primary-navy group-hover:text-[#EA580C] transition-colors flex items-center gap-0.5">
                    <span>Storefront</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FaqSection />
    </main>
  );
}

