"use client";

import { useState } from "react";
import Link from "next/link";

export type StorefrontAgency = {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  publicEmail: string | null;
  websiteUrl: string | null;
};

export type StorefrontListing = {
  id: string;
  slug: string;
  title: string;
  price: number;
  priceFormatted: string;
  location: string;
  badge: string;
  badgeStyle: string;
  type: string;
  specs: { icon: string; text: string }[];
  imageUrl: string;
  link: string;
};

interface AgencyStorefrontClientProps {
  agency: StorefrontAgency;
  listings: StorefrontListing[];
}

export default function AgencyStorefrontClient({
  agency,
  listings,
}: AgencyStorefrontClientProps) {
  const [priceFilter, setPriceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtering Logic
  const filteredListings = listings.filter((item) => {
    if (priceFilter) {
      if (priceFilter === "1" && item.price > 500000) return false;
      if (priceFilter === "2" && (item.price < 500000 || item.price > 1000000)) return false;
      if (priceFilter === "3" && (item.price < 1000000 || item.price > 5000000)) return false;
      if (priceFilter === "4" && item.price < 5000000) return false;
    }
    if (typeFilter && item.type !== typeFilter) return false;
    if (
      searchFilter &&
      !item.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !item.location.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleContact = () => {
    const targetEmail = agency.publicEmail || "support@estatesyncpro.com";
    alert(`Contact agency at: ${targetEmail}\nPhone: ${agency.phone || "Not provided"}`);
  };

  return (
    <main className="flex-grow max-w-max-width-public mx-auto w-full px-lg py-xl flex flex-col gap-xl">
      {/* Agency Header Section */}
      <section className="bg-surface-container-lowest rounded-xl border border-border-gray p-lg md:p-xl shadow-sm flex flex-col md:flex-row gap-lg items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-lg text-center md:text-left w-full md:w-auto">
          {agency.logoUrl ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border border-border-gray bg-surface-gray flex-shrink-0 relative shadow-sm">
              <img
                src={agency.logoUrl}
                alt={`${agency.name} Logo`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#0F172A] border-2 border-slate-700 flex flex-col items-center justify-center flex-shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[42px] text-[#10B981]">
                business_center
              </span>
              <span className="text-white text-xs font-bold px-2 text-center truncate w-full tracking-tight">
                {agency.name}
              </span>
            </div>
          )}
          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-primary-navy tracking-tight">
              {agency.name}
            </h1>
            {agency.description && (
              <p className="text-text-secondary text-sm max-w-xl font-body leading-relaxed">
                {agency.description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-text-secondary font-sm text-sm pt-1">
              {agency.address && (
                <span className="flex items-center justify-center md:justify-start gap-1.5 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-[#EA580C]">
                    location_on
                  </span>
                  {agency.address}
                </span>
              )}
              {agency.phone && (
                <span className="flex items-center justify-center md:justify-start gap-1.5 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-[#10B981]">
                    phone
                  </span>
                  {agency.phone}
                </span>
              )}
              {agency.websiteUrl && (
                <a
                  href={agency.websiteUrl.startsWith("http") ? agency.websiteUrl : `https://${agency.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-1.5 text-blue-600 hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    language
                  </span>
                  {agency.websiteUrl}
                </a>
              )}
              {agency.publicEmail && (
                <span className="flex items-center justify-center md:justify-start gap-1.5 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    mail
                  </span>
                  {agency.publicEmail}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleContact}
          className="w-full md:w-auto font-body text-body bg-primary-navy text-white px-xl py-3 rounded-xl font-bold hover:bg-primary-navy/95 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            mail
          </span>
          Contact Agency
        </button>
      </section>

      {/* Filters Bar */}
      <section className="bg-surface-container-lowest p-md rounded-xl border border-border-gray shadow-xs flex flex-col md:flex-row gap-md items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-md w-full md:w-auto">
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="form-select font-sm text-sm border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-navy/20 w-full sm:w-48 text-text-primary bg-white px-md py-sm outline-none"
          >
            <option value="">Any Price Range</option>
            <option value="1">$0 - $500k</option>
            <option value="2">$500k - $1M</option>
            <option value="3">$1M - $5M</option>
            <option value="4">$5M+</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select font-sm text-sm border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-navy/20 w-full sm:w-48 text-text-primary bg-white px-md py-sm outline-none capitalize"
          >
            <option value="">Any Property Type</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="condo">Condo</option>
            <option value="villa">Villa</option>
            <option value="office">Office</option>
            <option value="land">Land</option>
            <option value="other">Other</option>
          </select>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
              location_on
            </span>
            <input
              type="text"
              placeholder="Search by title or address..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="form-input font-sm text-sm border border-border-gray rounded-lg pl-10 pr-sm py-sm focus:ring-2 focus:ring-primary-navy/20 w-full text-text-primary bg-white outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-sm w-full md:w-auto justify-end">
          <span className="text-xs font-semibold text-text-secondary mr-2">
            Showing {filteredListings.length} {filteredListings.length === 1 ? "Property" : "Properties"}
          </span>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 border rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-slate-100 border-primary-navy text-primary-navy font-bold shadow-xs"
                : "border-border-gray hover:bg-surface-gray text-text-secondary"
            }`}
            title="Grid View"
          >
            <span className="material-symbols-outlined block">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 border rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-slate-100 border-primary-navy text-primary-navy font-bold shadow-xs"
                : "border-border-gray hover:bg-surface-gray text-text-secondary"
            }`}
            title="List View"
          >
            <span className="material-symbols-outlined block">view_list</span>
          </button>
        </div>
      </section>

      {/* Property Listings Container */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-border-gray rounded-xl p-lg my-6 shadow-sm">
          <span className="material-symbols-outlined text-[64px] text-slate-400 mb-4 inline-block">
            maps_home_work
          </span>
          <h3 className="text-xl font-bold text-primary-navy mb-2">
            No active properties found
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            {listings.length === 0
              ? "This real estate brokerage does not have any active published listings at the moment."
              : "No listings matched your active filter selections. Try resetting your price range or property type."}
          </p>
        </div>
      ) : (
        <section
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg"
              : "flex flex-col gap-lg"
          }
        >
          {filteredListings.map((item) => (
            <article
              key={item.id}
              className={`bg-surface-container-lowest rounded-xl border border-border-gray overflow-hidden shadow-sm hover:shadow-md transition-all group flex ${
                viewMode === "list" ? "flex-col md:flex-row h-auto md:h-52" : "flex-col"
              }`}
            >
              <div
                className={`relative overflow-hidden ${
                  viewMode === "list" ? "h-52 md:h-full w-full md:w-80 shrink-0" : "h-64 w-full"
                }`}
              >
                <Link href={item.link}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-slate-100"
                  />
                </Link>
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className={`${item.badgeStyle} px-3 py-1 rounded-full font-xs text-xs font-extrabold shadow-sm uppercase tracking-wider backdrop-blur-sm`}>
                    {item.badge}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3 justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold text-primary-navy group-hover:text-[#EA580C] transition-colors line-clamp-1">
                      <Link href={item.link}>{item.title}</Link>
                    </h3>
                    <span className="text-lg font-extrabold text-[#b87500] whitespace-nowrap">
                      {item.priceFormatted}
                    </span>
                  </div>
                  <p className="font-sm text-sm text-text-secondary flex items-center gap-1 mt-1 truncate">
                    <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
                      location_on
                    </span>
                    <span className="truncate">{item.location}</span>
                  </p>
                </div>
                <div>
                  <hr className="border-border-gray my-2.5" />
                  <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                    {item.specs.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-slate-600">
                        <span className="material-symbols-outlined text-slate-500 text-[18px]">
                          {spec.icon}
                        </span>{" "}
                        <span>{spec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
