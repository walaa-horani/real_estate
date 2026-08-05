import Link from "next/link";
import { getAgenciesList } from "@/lib/queries/agencies";

export const metadata = {
  title: "All Real Estate Agencies | EstateSync Pro",
  description: "Browse verified brokerages and top-performing property management teams on EstateSync Pro.",
};

export default async function AgenciesDirectoryPage() {
  const agencies = await getAgenciesList();

  return (
    <main className="w-full py-xl bg-surface-gray min-h-[75vh]">
      <div className="max-w-max-width-public mx-auto px-lg">
        {/* Page Header */}
        <div className="mb-xl border-b border-border-gray pb-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
            <div>
              <h1 className="font-display text-3xl font-bold text-primary-navy tracking-tight">
                Real Estate Agencies & Brokerages
              </h1>
              <p className="font-body text-body text-text-secondary mt-1">
                Explore all verified real estate agencies across the multi-tenant platform.
              </p>
            </div>
            <div className="bg-surface-container-lowest border border-border-gray px-4 py-2 rounded-lg text-sm font-bold text-primary-navy shadow-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#EA580C]">store</span>
              <span>{agencies.length} Registered Agencies</span>
            </div>
          </div>
        </div>

        {/* Agencies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={agency.link}
              className={`rounded-xl border shadow-sm hover:shadow-md transition-all p-lg flex flex-col gap-md cursor-pointer group ${
                agency.isMyAgency
                  ? "bg-emerald-50/20 border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : "bg-surface-container-lowest border-border-gray"
              }`}
            >
              {/* Logo / Banner Area */}
              {agency.logoUrl ? (
                <div className="w-full h-36 rounded-lg bg-surface-gray border border-border-gray flex items-center justify-center overflow-hidden p-md relative">
                  {agency.isMyAgency && (
                    <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-[#10B981] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>Your Agency</span>
                    </span>
                  )}
                  <img
                    src={agency.logoUrl}
                    alt={`${agency.name} Logo`}
                    className="h-20 w-auto max-w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-full h-36 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-4 relative group-hover:bg-[#1E293B] transition-colors duration-200 shadow-inner">
                  {agency.isMyAgency && (
                    <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-[#10B981] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>Your Agency</span>
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[38px] text-[#10B981] mb-1">
                    business
                  </span>
                  <span className="text-white font-bold text-lg tracking-tight truncate max-w-full px-4 text-center">
                    {agency.name}
                  </span>
                </div>
              )}

              {/* Agency Details */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-h3 text-h3 font-bold text-primary-navy group-hover:text-[#EA580C] transition-colors truncate">
                    {agency.name}
                  </h3>
                </div>
                <div className="flex items-center gap-sm text-text-secondary mt-1">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    location_on
                  </span>
                  <span className="font-sm text-sm truncate">{agency.location}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto pt-md border-t border-border-gray flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <span className="material-symbols-outlined text-[16px]">home_work</span>
                  <span className="font-xs text-xs font-semibold">
                    {agency.listingsCount} Active Listings
                  </span>
                </div>

                {agency.isMyAgency ? (
                  <span className="font-sm text-sm font-bold text-[#EA580C] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Go to Dashboard</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </span>
                ) : (
                  <span className="font-sm text-sm font-semibold text-primary-navy group-hover:text-[#EA580C] transition-colors flex items-center gap-0.5">
                    <span>View Storefront</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
