"use client";

import { useState } from "react";
import Link from "next/link";

export default function PropertyDetailPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "I am interested in this property...",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Please fill in your name and phone number.");
      return;
    }
    // Simulate API call
    setSubmitted(true);
  };

  const images = [
    {
      role: "Main View",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0JFFpdpzwn2w-k6EwCYbtIMP7B_kbF-0YQqv_i354_uNzKLwH3iXpHCYMVjyUoWuBCM57FXKoZuwh99VoN-WscOf90EKk0Iv6_jjUYWzR09CvFoobtZ7pbRg3sFiDrB4GR541sYDRweeQtd0_LCR69lgytE0XXoL7rddewCHXA_kqKdHsAvWHkgiG42m-GN4DjL2kE85zrVA3jl-sN8kSVpqAE_VukaQz3qs6xbS_7-Q_pyq2eRUn",
    },
    {
      role: "Kitchen",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOkeXAtjnlxo6CLnG6ZFlDQBNJ6XlpPUR7rC4rw8FBu4wahtD169PfzWDghlPf0a5Nar6cFCsbPUubirV1CZOsNsp-uyfbAE52r3yybUpYqHeNP78Slq1J8MRboORFvk-_8J8ACirb61eL6W9LqMgsH3bJI_IYTcJf3cnbXBvyzneSJlgbArShP-nqXIsWBSpSIUT2f2AsJAjZb_jp71BHX5yVVMbeZw9cbWXIUUGPDGzhxAc-Sfw7",
    },
    {
      role: "Bedroom",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBc9Ym5wsmPtb1hvQ3uQjIDiWJeF_fZFtjSCJRgVq9a088esXBGULj9SsbRxFfuWwhr0QDj1OyXjLSVswr20l98XeavUZX-hILfjqZzb1tmC7WRLJbg-dlyJADzM7kPYSY9Io39-HYsS0a27ckEYwDrHKgVNp7hkvjySNz7SQFCKRIMAbOAQionE1xZB4k94BgJKVTvYSTjZEH-CY1-volyQS5RldIr7UQuOjIVymU8J_punnoHoNfT",
    },
    {
      role: "Bathroom",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBK_4A3mKlE0Hohm2rbrfjiq20pMro4pFRi5haHoG-K4su6kL__PitsW1vrN6RxigbBqbWUoOMuWGN-0YPX43YRblxL2cLm2TqlH8VRs-BuFlwpBfAyA4TOzh7lQS3DB5HgN0WUnl6olFgc3ijAFbii-o7NnE2Qf0Fn1c4SWwGufVRqcjKfdsZ-cb7f22fGRxX7JZiynQ0ALE13Y51RcKjMAXYrhvqXw0dzRhyB5sgB5_A9ypaJzssm",
    },
    {
      role: "Terrace",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqQ-ZLSNVJCA-8v9g03SlqCc4X0Vj6kzg0sUg_cuC3v74CuihfI5LCSG2KSCEUSVOw0XJx_0Nt6vaqOBetEvwKg_M92pCnD_tfM6BkAjpELuM44PQbgDPlYXpE0m6E8ZO2ZEr-4BLj6-H0G2gtMgcYBo-_9YdG3-q7iR-5VOTngCx9g62B9yol8y0u5nEhcxjioMd5xB-0bQ8EWAW-wJdsvGiaNtF-QAZrIAZ9hZ3azUuTgZbK24BG",
    },
  ];

  return (
    <main className="max-w-max-width-public mx-auto px-lg py-xl w-full grid grid-cols-1 lg:grid-cols-12 gap-xl">
      {/* Left Column: Property Details (8 columns) */}
      <div className="lg:col-span-8 flex flex-col gap-lg">
        {/* Title and Price */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-sm">
            <h1 className="font-display text-display font-bold text-primary-navy tracking-tight">
              Modern Penthouse in Manhattan
            </h1>
            <div className="font-display text-display font-bold text-[#b87500] whitespace-nowrap">
              $4,250,000
            </div>
          </div>
          <div className="flex items-center text-text-secondary font-body text-body gap-base">
            <span className="material-symbols-outlined text-[18px]">
              location_on
            </span>
            <span>150 W 56th St, New York, NY 10019</span>
          </div>
        </div>

        {/* Image Bento Gallery */}
        <div className="grid grid-cols-4 gap-sm">
          <div className="col-span-4 rounded-xl overflow-hidden border border-border-gray shadow-sm relative group">
            <img
              src={images[0].url}
              alt={images[0].role}
              className="w-full h-[300px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-500 ease-in-out cursor-pointer"
            />
          </div>
          {images.slice(1).map((img, idx) => (
            <div
              key={img.role}
              className="col-span-1 rounded-lg overflow-hidden border border-border-gray relative group cursor-pointer h-[80px] md:h-[100px]"
            >
              <img
                src={img.url}
                alt={img.role}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
              {/* Overlap for last image */}
              {idx === 3 && (
                <div className="absolute inset-0 bg-primary/50 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/60">
                  <span className="text-white font-sm text-sm font-semibold whitespace-nowrap px-1">
                    +8 Photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md mt-sm">
          <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-md flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-text-secondary text-[32px] mb-sm">
              bed
            </span>
            <div className="font-h3 text-h3 font-semibold text-primary-navy">
              3
            </div>
            <div className="font-xs text-xs text-text-secondary uppercase tracking-wider">
              Beds
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-md flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-text-secondary text-[32px] mb-sm">
              bathtub
            </span>
            <div className="font-h3 text-h3 font-semibold text-primary-navy">
              2.5
            </div>
            <div className="font-xs text-xs text-text-secondary uppercase tracking-wider">
              Baths
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-md flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-text-secondary text-[32px] mb-sm">
              square_foot
            </span>
            <div className="font-h3 text-h3 font-semibold text-primary-navy">
              2,500
            </div>
            <div className="font-xs text-xs text-text-secondary uppercase tracking-wider">
              Sq Ft
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-border-gray rounded-lg p-md flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-text-secondary text-[32px] mb-sm">
              apartment
            </span>
            <div className="font-h3 text-h3 font-semibold text-primary-navy">
              Condo
            </div>
            <div className="font-xs text-xs text-text-secondary uppercase tracking-wider">
              Type
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface-container-lowest border border-border-gray rounded-xl p-lg shadow-sm">
          <h2 className="font-h2 text-h2 font-semibold text-primary-navy mb-md">
            About this property
          </h2>
          <div className="font-body text-body text-on-surface-variant leading-relaxed space-y-md">
            <p>
              Luxurious living in the heart of the city. This stunning modern
              penthouse offers unparalleled panoramic views of the Manhattan
              skyline. Meticulously designed with high-end finishes, the
              expansive open-concept living area features floor-to-ceiling
              windows that flood the space with natural light.
            </p>
            <p>
              The chef's kitchen is equipped with top-of-the-line appliances,
              custom cabinetry, and a massive island perfect for entertaining.
              The primary suite is a true sanctuary, complete with a spa-like
              en-suite bathroom and a generous walk-in closet.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Sidebar (4 columns) */}
      <div className="lg:col-span-4 flex flex-col gap-lg">
        {/* Inquiry Card */}
        <div className="bg-surface-container-lowest border border-border-gray rounded-xl p-lg shadow-sm sticky top-24">
          <h3 className="font-h2 text-h2 font-semibold text-primary-navy mb-lg">
            Interested?
          </h3>
          {submitted ? (
            <div className="text-center py-lg bg-secondary-container/10 border border-secondary/20 rounded-lg p-md">
              <span className="material-symbols-outlined text-[48px] text-secondary mb-sm">
                check_circle
              </span>
              <h4 className="font-h3 text-h3 font-bold text-primary-navy mb-sm">
                Inquiry Sent!
              </h4>
              <p className="font-sm text-sm text-text-secondary">
                Thank you for contacting Skyline Properties. An agent will get
                back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-md">
              <div>
                <label className="block font-sm text-sm text-text-secondary mb-base">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none font-sm text-sm transition-colors duration-200 hover:bg-surface-gray text-on-surface"
                />
              </div>
              <div>
                <label className="block font-sm text-sm text-text-secondary mb-base">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none font-sm text-sm transition-colors duration-200 hover:bg-surface-gray text-on-surface"
                />
              </div>
              <div>
                <label className="block font-sm text-sm text-text-secondary mb-base">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none font-sm text-sm transition-colors duration-200 hover:bg-surface-gray text-on-surface resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#EA580C] text-white py-md rounded-lg font-body text-body font-bold hover:bg-[#C2410C] transition-colors mt-sm shadow-sm flex items-center justify-center gap-sm"
              >
                <span className="material-symbols-outlined text-[20px]">
                  send
                </span>
                Send Inquiry
              </button>
            </form>
          )}

          {/* Agency Link Block */}
          <div className="mt-lg pt-lg border-t border-border-gray">
            <div className="flex items-center gap-md mb-md">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white shrink-0 border border-border-gray">
                <span className="material-symbols-outlined text-white">
                  real_estate_agent
                </span>
              </div>
              <div>
                <div className="font-sm text-sm text-text-secondary">
                  Listed by
                </div>
                <div className="font-h3 text-h3 font-semibold text-primary-navy">
                  Skyline Properties
                </div>
              </div>
            </div>
            <Link
              href="/agency/skyline-properties"
              className="block w-full text-center border border-primary-navy text-primary-navy py-sm rounded-lg font-sm text-sm font-medium hover:bg-surface-gray transition-colors"
            >
              View Storefront
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
