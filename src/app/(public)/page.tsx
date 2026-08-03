import Link from "next/link";
import Image from "next/image";

export default function PublicLandingPage() {
  const featuredAgencies = [
    {
      id: "skyline-properties",
      name: "Skyline Properties",
      location: "New York, NY",
      listingsCount: 124,
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvOr3I1bs0d9TrdzBXMfeDsv-i0PHttnQPrmyH77YKPmpdCZh11NIo5CW7vXVv-YJ5gtxOfAA9F1FqqrIhMkqY3bgo7okWr6bWQGKGDhQxe6e_GUAH8Vyva4GUhofZRqRH9CgOZlxYcAw1kP63QrpAFcAk1ScztkPaEOajbBmr8NmXIAj1SMsnFHq_VAj6wfR21gPrkS4IIF577oTBmtRkYBAXh4i9W53DGsOR_cVF15ntxatrxvUt",
      link: "/agency/skyline-properties",
    },
    {
      id: "apex-estates",
      name: "Apex Estates",
      location: "Los Angeles, CA",
      listingsCount: 89,
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2HSYRNGxuivzfQcSoZVybVn7axfMq3g4uksuFapUlE1BaQRgzgcoTQZt_z5va7Bne3Axa-cXaFAZBGcBz8-YZdmyJXNrcSdJw74c4tNeERTvctUu42MBPceer-tz6hfejBZDwW9KaP-7ItTyy3-uqC0amCMai0U_z2OldnPWfhGh9tN0-zpBkTR6jQDFdyxjG2mhL4ibZAiWltUoxFZHAvI5Dtr0HnPd9d-KJCZqy-T7itpQVGFQE",
      link: "#",
    },
    {
      id: "harbor-oak",
      name: "Harbor & Oak",
      location: "Seattle, WA",
      listingsCount: 215,
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAybfTqIQZZ0NJGNtGpWJVp9FOVvZpMKXCOYgirCCbirsxnDcwENjenujwTw-bBDE0U5Ry8WOw8USDBdUG-fYP3oIf8yin2nXdmubFtH-jG-nvsq0Ig0ZKTyeAvkUICpKiZZj7d_Oj_WTWLTkAXbvYkcIEqCQYmqpUaf0TjmWtpejP2yBg_UNuBWBzTtNUKDBvx6kW0mMiSV_GIWLYKbGbf-WeqYBHWRB7iXLC-fwEOKsGaloJPOEA",
      link: "#",
    },
  ];

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
        <div className="flex flex-wrap justify-center gap-md">
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
              Discover top-performing real estate teams on our platform.
            </p>
          </div>
          <a
            className="font-sm text-sm text-[#EA580C] font-semibold hover:underline flex items-center gap-base"
            href="#"
          >
            View All Agencies{" "}
            <span className="material-symbols-outlined text-[16px] inline">
              arrow_forward
            </span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {featuredAgencies.map((agency) => (
            <Link
              key={agency.id}
              href={agency.link}
              className="bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm hover:shadow-md transition-all p-lg flex flex-col gap-md cursor-pointer group"
            >
              <div className="w-full h-32 rounded bg-surface-gray border border-border-gray flex items-center justify-center overflow-hidden p-md relative">
                <img
                  src={agency.logoUrl}
                  alt={`${agency.name} Logo`}
                  className="h-16 w-auto max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div>
                <h3 className="font-h3 text-h3 font-semibold text-primary-navy group-hover:text-[#EA580C] transition-colors">
                  {agency.name}
                </h3>
                <div className="flex items-center gap-sm text-text-secondary mt-base">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>
                  <span className="font-sm text-sm">{agency.location}</span>
                </div>
              </div>
              <div className="mt-auto pt-md border-t border-border-gray flex justify-between items-center">
                <span className="font-xs text-xs text-text-secondary">
                  Active Listings
                </span>
                <span className="font-sm text-sm font-bold text-primary-navy bg-surface-gray px-sm py-base rounded">
                  {agency.listingsCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
