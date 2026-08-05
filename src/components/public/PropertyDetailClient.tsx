"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontAgency } from "./AgencyStorefrontClient";
import { submitPropertyInquiry } from "@/lib/actions/leads";

export type DetailProperty = {
  id: string;
  organizationId?: string;
  slug: string;
  title: string;
  priceFormatted: string;
  location: string;
  description: string | null;
  type: string;
  status: string;
  specs: { icon: string; label: string; value: string }[];
  images: { url: string; caption: string | null }[];
};

interface PropertyDetailClientProps {
  property: DetailProperty;
  agency: StorefrontAgency | null;
}

export default function PropertyDetailClient({
  property,
  agency,
}: PropertyDetailClientProps) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I am inquiring about ${property.title} (${property.priceFormatted}).`,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Please enter your name and phone number to send an inquiry.");
      return;
    }

    const targetOrgId = property.organizationId;
    if (!targetOrgId) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitPropertyInquiry({
        organizationId: targetOrgId,
        propertyId: property.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
      });

      if ("error" in result) {
        setErrorMessage(result.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeImage = property.images[selectedImgIdx]?.url || property.images[0]?.url;

  return (
    <main className="max-w-max-width-public mx-auto px-lg py-xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[75vh]">
      {/* Left Column: Property Main Info & Gallery (8 columns) */}
      <div className="lg:col-span-8 flex flex-col gap-8">
        {/* Title and Price Header */}
        <div className="border-b border-border-gray pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-primary-navy tracking-tight">
              {property.title}
            </h1>
            <div className="font-display text-3xl font-extrabold text-[#b87500] whitespace-nowrap bg-amber-50 px-4 py-1 rounded-xl border border-amber-200/60">
              {property.priceFormatted}
            </div>
          </div>
          <div className="flex items-center text-text-secondary text-sm font-medium gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#EA580C]">
              location_on
            </span>
            <span>{property.location}</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="capitalize bg-slate-100 font-semibold px-2.5 py-0.5 rounded text-xs text-primary-navy">
              {property.type}
            </span>
            <span className="capitalize bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-0.5 rounded text-xs">
              {property.status}
            </span>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-border-gray shadow-sm relative h-[380px] md:h-[480px] bg-slate-950 flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage}
                alt={property.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-6xl">image_not_supported</span>
                <span>No photos available</span>
              </div>
            )}
            {property.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                {selectedImgIdx + 1} / {property.images.length} Photos
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {property.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-x-auto pb-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIdx(idx)}
                  className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all cursor-pointer ${
                    selectedImgIdx === idx
                      ? "border-[#EA580C] ring-2 ring-[#EA580C]/30 scale-95 shadow-sm"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Key Specifications Bento */}
        <section className="bg-surface-container-lowest rounded-2xl border border-border-gray p-6 shadow-xs">
          <h2 className="text-lg font-bold text-primary-navy mb-4 tracking-tight">
            Property Features & Specs
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
            {property.specs.map((spec, index) => (
              <div
                key={index}
                className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1"
              >
                <span className="material-symbols-outlined text-2xl text-[#10B981]">
                  {spec.icon}
                </span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  {spec.label}
                </span>
                <span className="text-base md:text-lg font-extrabold text-primary-navy">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Property Description */}
        <section className="bg-surface-container-lowest rounded-2xl border border-border-gray p-6 shadow-xs leading-relaxed space-y-4">
          <h2 className="text-lg font-bold text-primary-navy tracking-tight">
            About This Property
          </h2>
          <div className="text-text-secondary text-sm space-y-3 whitespace-pre-line font-body">
            {property.description ||
              `Experience unparalleled architectural elegance and refined craftsmanship in this exquisite ${property.type} located in ${property.location}. Featuring spacious interiors, premium fittings, and optimal access to vital civic amenities, this property represents an exceptional real estate opportunity.`}
          </div>
        </section>
      </div>

      {/* Right Column: Brokerage Profile & Inquiry Form (4 columns) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Agency Profile Card */}
        {agency && (
          <div className="bg-surface-container-lowest rounded-2xl border border-border-gray p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 to-primary-navy z-0" />
            <div className="z-10 mt-4">
              {agency.logoUrl ? (
                <img
                  src={agency.logoUrl}
                  alt={agency.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-white mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#0F172A] border-4 border-white shadow-md flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl text-[#10B981]">
                    business
                  </span>
                </div>
              )}
            </div>
            <div>
              <Link
                href={`/agency/${agency.id || "skyline-properties"}`}
                className="text-lg font-extrabold text-primary-navy hover:text-[#EA580C] transition-colors block"
              >
                {agency.name}
              </Link>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">
                Verified Listing Brokerage
              </p>
            </div>
            <hr className="w-full border-border-gray my-2" />
            <div className="w-full text-left text-xs space-y-2 text-text-secondary">
              {agency.address && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    location_on
                  </span>
                  <span className="truncate">{agency.address}</span>
                </div>
              )}
              {agency.phone && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    phone
                  </span>
                  <span className="font-semibold text-primary-navy">{agency.phone}</span>
                </div>
              )}
            </div>
            <Link
              href={`/agency/${agency.id}`}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-primary-navy font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              View All Agency Properties ➔
            </Link>
          </div>
        )}

        {/* Lead Inquiry Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-border-gray p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-primary-navy flex items-center gap-2">
            <span className="material-symbols-outlined text-[#EA580C]">send</span>
            <span>Inquire About This Property</span>
          </h3>
          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-emerald-600">
                check_circle
              </span>
              <h4 className="font-bold text-emerald-900">Inquiry Sent!</h4>
              <p className="text-xs text-emerald-700">
                Your message has been dispatched to the listing agents at{" "}
                <strong>{agency?.name || "the brokerage"}</strong>. They will contact you shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-emerald-800 underline pt-2 cursor-pointer block mx-auto"
              >
                Send another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border-gray bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#EA580C]/20 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  disabled={submitting}
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-border-gray bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#EA580C]/20 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled={submitting}
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border-gray bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#EA580C]/20 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  disabled={submitting}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-border-gray bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#EA580C]/20 resize-none disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-65 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                )}
                <span>{submitting ? "Sending Inquiry..." : "Send Message"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
