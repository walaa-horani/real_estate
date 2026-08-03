"use client";

import { useState } from "react";
import Link from "next/link";

export default function AgencyStorefrontPage() {
  const [priceFilter, setPriceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const listings = [
    {
      id: "modern-penthouse",
      title: "Modern Penthouse in Manhattan",
      price: 4250000,
      priceFormatted: "$4,250,000",
      location: "Tribeca, New York",
      badge: "For Sale",
      badgeStyle: "bg-surface-container-lowest text-primary-navy border border-border-gray",
      type: "apartment",
      specs: [
        { icon: "bed", text: "4 Beds" },
        { icon: "shower", text: "3.5 Baths" },
        { icon: "square_foot", text: "3,200 sqft" },
      ],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCknDVDI1aR6nJJnLxn_7ZPdmbJ2SDROJguwPxLBS9idY-zV0naWTtmfxBZtlFE1o13FTsLxnc7uLUJsXpAoTOpVt4WKcq8jbORMNavhl8mTXfYg4xKJ_ue4IYcDAOUDEVLWKp7zZ8x1BSRc9wDTy7dmBEgknc86_WKE1iWHKPbuZYBb1xLRNopYHbXVoxqu8PGi7lwOqcOAUGPE4PvO3_IwEi3o4eKVJ8JqiZQTxE0cCLfWRBgbSsQ",
      link: "/property/modern-penthouse",
    },
    {
      id: "luxury-villa",
      title: "Luxury Villa with Pool",
      price: 8100000,
      priceFormatted: "$8,100,000",
      location: "Beverly Hills, CA",
      badge: "New Listing",
      badgeStyle: "bg-secondary-container text-on-secondary-container",
      type: "villa",
      specs: [
        { icon: "bed", text: "6 Beds" },
        { icon: "shower", text: "7 Baths" },
        { icon: "square_foot", text: "8,500 sqft" },
      ],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhew2Y4aH7DSbi2sL-MXp1uXRzw806cFMJkjd29AHsNc5Zn6F2XA8j9EgorYfnm1HxWy2kOjds67lXwUvfSw17KuSZAX8fA1LwrDdXKMQgXmvAdJY7mcnwyu6RRMmoLVeB-V0f2vLV2jO_m-CHcW8GVIibQvDBCVqApmtk1-Q71T-8b6-T318O4N_G6ZkeWB1O7rW3VLE6F5ZWskROjfopufC_Vm5depfQBLzB4xZfwLuObe7wB_Ii",
      link: "#",
    },
    {
      id: "loft-office",
      title: "Premium Loft Office Space",
      price: 15000, // per month
      priceFormatted: "$15,000 / mo",
      location: "SoHo, New York",
      badge: "For Lease",
      badgeStyle: "bg-primary-container text-on-primary",
      type: "office",
      specs: [
        { icon: "meeting_room", text: "4 Rooms" },
        { icon: "wc", text: "2 Baths" },
        { icon: "square_foot", text: "4,000 sqft" },
      ],
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwztEgoirE0CNVlDdINMdtt5HMEgxDNJ_obyyj-z4_ipZJmamCs-CSWfXHnHAmhwxAv6LJBfw6QUT854behEn1E3FAT1qFYxOvYPqxDQluVHTnuDzjzkODqdlRdr0VgwAMunSX78G5DaX3881wsm-D2eCK8sHn7iYJkLnZvGQvGb_96ggmY0PFzY1APAV8rX-nJ27u59I-rHgL8QjcEu3s_Ye8RwCpeU4oiO7aRvpUxlGfap1MPbHL",
      link: "#",
    },
  ];

  // Filtering Logic
  const filteredListings = listings.filter((item) => {
    // Price match
    if (priceFilter) {
      if (priceFilter === "1" && item.price > 500000) return false;
      if (priceFilter === "2" && (item.price < 500000 || item.price > 1000000)) return false;
      if (priceFilter === "3" && (item.price < 1000000 || item.price > 5000000)) return false;
      if (priceFilter === "4" && item.price < 5000000) return false;
    }
    // Type match
    if (typeFilter && item.type !== typeFilter) return false;
    // Search query match
    if (
      searchFilter &&
      !item.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !item.location.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <main className="flex-grow max-w-max-width-public mx-auto w-full px-lg py-xl flex flex-col gap-xl">
      {/* Agency Header Section */}
      <section className="bg-surface-container-lowest rounded-xl border border-border-gray p-lg md:p-xl shadow-sm flex flex-col md:flex-row gap-lg items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-lg text-center md:text-left">
          <div className="w-32 h-32 rounded-full overflow-hidden border border-border-gray bg-surface-gray flex-shrink-0 relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbWFknCh2aK-9kR34BPpyNQ9EV0KrgUoljyVpnLgspSSfkSGrPV1DEVyGrMzBQqfyxUqnc3axxl40V5Lto5afZ_yhPqXJQI9J1QEyMnss66-jQUBCXGSw36Srs4MlYLoEaonaLLfQSs3r68YZZ_67NfS8HlTUbgMXcYACMPwmrKk8aXOufk5p3L0dHjIjEF-4-luXpe7Gqr5rzxLmjW_fynj3gPBwWS-vFMU-vqWnYWDt79UAWD9ix"
              alt="Skyline Properties Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-display text-display text-primary-navy mb-sm font-bold">
              Skyline Properties
            </h1>
            <div className="flex flex-col gap-base text-text-secondary font-sm text-sm">
              <span className="flex items-center justify-center md:justify-start gap-sm">
                <span className="material-symbols-outlined text-[18px]">
                  location_on
                </span>
                123 Madison Avenue, New York, NY 10016
              </span>
              <span className="flex items-center justify-center md:justify-start gap-sm">
                <span className="material-symbols-outlined text-[18px]">
                  phone
                </span>
                +1 (212) 555-0198
              </span>
              <span className="flex items-center justify-center md:justify-start gap-sm">
                <span className="material-symbols-outlined text-[18px]">
                  language
                </span>
                www.skylineproperties.com
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => alert("Contact form triggered. Email skyline@sync.com")}
          className="w-full md:w-auto font-body text-body bg-primary-navy text-white px-xl py-3 rounded-lg font-bold hover:bg-primary-navy/95 transition-colors flex items-center justify-center gap-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            mail
          </span>
          Contact Agency
        </button>
      </section>

      {/* Filters Bar */}
      <section className="bg-surface-container-lowest p-md rounded-lg border border-border-gray shadow-sm flex flex-col md:flex-row gap-md items-center justify-between">
        <div className="flex flex-col md:flex-row gap-md w-full md:w-auto">
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="form-select font-sm text-sm border-border-gray rounded-lg focus:ring-secondary focus:border-secondary w-full md:w-48 text-text-primary bg-white px-md py-sm outline-none"
          >
            <option value="">Price Range</option>
            <option value="1">$0 - $500k</option>
            <option value="2">$500k - $1M</option>
            <option value="3">$1M - $5M</option>
            <option value="4">$5M+</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select font-sm text-sm border-border-gray rounded-lg focus:ring-secondary focus:border-secondary w-full md:w-48 text-text-primary bg-white px-md py-sm outline-none"
          >
            <option value="">Property Type</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="office">Office</option>
          </select>
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
              location_on
            </span>
            <input
              type="text"
              placeholder="Location..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="form-input font-sm text-sm border-border-gray rounded-lg pl-10 pr-sm py-sm focus:ring-secondary focus:border-secondary w-full text-text-primary bg-white outline-none"
            />
          </div>
        </div>
        <div className="flex gap-sm w-full md:w-auto justify-end">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 border rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-surface-gray border-primary-navy text-primary-navy"
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
                ? "bg-surface-gray border-primary-navy text-primary-navy"
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
        <div className="text-center py-xl bg-surface-container-lowest border border-border-gray rounded-xl p-lg">
          <span className="material-symbols-outlined text-[64px] text-text-secondary mb-md">
            error_outline
          </span>
          <h3 className="font-h2 text-h2 font-semibold text-primary-navy mb-sm">
            No properties found
          </h3>
          <p className="font-body text-body text-text-secondary">
            Try adjusting your search filters to find available properties.
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
              className={`bg-surface-container-lowest rounded-xl border border-border-gray overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex ${
                viewMode === "list" ? "flex-col md:flex-row h-auto md:h-48" : "flex-col"
              }`}
            >
              <div
                className={`relative overflow-hidden ${
                  viewMode === "list" ? "h-48 md:h-full w-full md:w-72 shrink-0" : "h-64 w-full"
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className={`${item.badgeStyle} px-3 py-1 rounded-full font-xs text-xs font-bold shadow-sm uppercase tracking-wider`}>
                    {item.badge}
                  </span>
                </div>
              </div>
              <div className="p-md flex flex-col gap-sm justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start gap-md">
                    <h3 className="font-h3 text-h3 text-primary-navy font-semibold group-hover:text-[#EA580C] transition-colors truncate">
                      {item.link !== "#" ? (
                        <Link href={item.link}>{item.title}</Link>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <span className="font-h3 text-h3 font-bold text-[#b87500] whitespace-nowrap">
                      {item.priceFormatted}
                    </span>
                  </div>
                  <p className="font-sm text-sm text-text-secondary flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">
                      location_on
                    </span>
                    {item.location}
                  </p>
                </div>
                <div>
                  <hr className="border-border-gray my-2" />
                  <div className="flex items-center justify-between font-sm text-sm text-text-primary">
                    {item.specs.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-text-secondary text-[18px]">
                          {spec.icon}
                        </span>{" "}
                        {spec.text}
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
