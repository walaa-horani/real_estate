import { createAdminClient } from "@/lib/supabase/adminClient";
import AgencyStorefrontClient, {
  StorefrontAgency,
  StorefrontListing,
} from "@/components/public/AgencyStorefrontClient";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

function formatPrice(price: number, period: string | null | undefined): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price || 0);
  if (period === "month") return `${formatted} / mo`;
  if (period === "year") return `${formatted} / yr`;
  return formatted;
}

export default async function DynamicAgencyPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = decodeURIComponent(resolvedParams.slug);

  const adminClient = createAdminClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let org = null;
  if (isUUID) {
    const { data: orgs } = await adminClient
      .from("organizations")
      .select("*")
      .or(`id.eq.${slug},slug.eq.${slug}`);
    org = orgs?.[0] || null;
  } else {
    const { data: bySlug } = await adminClient
      .from("organizations")
      .select("*")
      .ilike("slug", slug);
    org = bySlug?.[0] || null;

    if (!org) {
      const { data: byName } = await adminClient
        .from("organizations")
        .select("*")
        .ilike("name", `%${slug.replace(/-/g, " ")}%`);
      org = byName?.[0] || null;
    }
  }

  if (org) {
    // Real DB Organization Found
    const agency: StorefrontAgency = {
      id: org.id,
      name: org.name,
      logoUrl: org.logo_url || null,
      description:
        org.description ||
        "Leading B2B real estate brokerage delivering trusted property management services, verified listings, and tailored real estate excellence.",
      address: org.address || "United States",
      phone: org.phone || "+1 (800) 555-SYNC",
      publicEmail: org.public_email || `contact@${org.slug || "estatesync"}.com`,
      websiteUrl: org.website_url || null,
    };

    // Fetch active listings for this organization
    const { data: dbProperties } = await adminClient
      .from("properties")
      .select("*")
      .eq("organization_id", org.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    const propertyIds = (dbProperties || []).map((p) => p.id);
    const imagesMap = new Map<string, string>();

    if (propertyIds.length > 0) {
      const { data: dbImages } = await adminClient
        .from("property_images")
        .select("property_id, url, sort_order")
        .in("property_id", propertyIds)
        .order("sort_order", { ascending: true });

      if (dbImages) {
        dbImages.forEach((img) => {
          if (!imagesMap.has(img.property_id) && img.url) {
            imagesMap.set(img.property_id, img.url);
          }
        });
      }
    }

    const listings: StorefrontListing[] = (dbProperties || []).map((p) => {
      const isDraft = p.status === "draft";
      const isLease = p.price_period === "month" || p.price_period === "year";

      let badge = "For Sale";
      let badgeStyle = "bg-white text-primary-navy border border-slate-300";
      if (isDraft) {
        badge = "Draft";
        badgeStyle = "bg-amber-100 text-amber-900 border border-amber-300";
      } else if (isLease) {
        badge = "For Lease";
        badgeStyle = "bg-blue-100 text-blue-900 border border-blue-300";
      }

      const imageUrl =
        imagesMap.get(p.id) ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

      return {
        id: p.id,
        slug: p.slug || p.id,
        title: p.title,
        price: p.price,
        priceFormatted: formatPrice(p.price, p.price_period),
        location: p.address_line || p.city ? `${p.address_line || ""}, ${p.city || ""}`.replace(/^, /, "") : "United States",
        badge,
        badgeStyle,
        type: p.property_type || "house",
        specs: [
          { icon: "bed", text: `${p.beds ?? 4} Beds` },
          { icon: "shower", text: `${p.baths ?? 3} Baths` },
          { icon: "square_foot", text: `${p.sqft ?? 2500} sqft` },
        ],
        imageUrl,
        link: `/property/${p.slug || p.id}`,
      };
    });

    return <AgencyStorefrontClient agency={agency} listings={listings} />;
  }

  // Demo fallback handling for unassigned demo slugs
  if (slug === "apex-estates" || slug === "harbor-oak" || slug === "skyline-properties") {
    const isApex = slug === "apex-estates";
    const agency: StorefrontAgency = {
      id: slug,
      name: isApex ? "Apex Estates" : slug === "harbor-oak" ? "Harbor & Oak" : "Skyline Properties",
      logoUrl: isApex
        ? "https://lh3.googleusercontent.com/aida-public/AB6AXuD2HSYRNGxuivzfQcSoZVybVn7axfMq3g4uksuFapUlE1BaQRgzgcoTQZt_z5va7Bne3Axa-cXaFAZBGcBz8-YZdmyJXNrcSdJw74c4tNeERTvctUu42MBPceer-tz6hfejBZDwW9KaP-7ItTyy3-uqC0amCMai0U_z2OldnPWfhGh9tN0-zpBkTR6jQDFdyxjG2mhL4ibZAiWltUoxFZHAvI5Dtr0HnPd9d-KJCZqy-T7itpQVGFQE"
        : slug === "harbor-oak"
        ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDAybfTqIQZZ0NJGNtGpWJVp9FOVvZpMKXCOYgirCCbirsxnDcwENjenujwTw-bBDE0U5Ry8WOw8USDBdUG-fYP3oIf8yin2nXdmubFtH-jG-nvsq0Ig0ZKTyeAvkUICpKiZZj7d_Oj_WTWLTkAXbvYkcIEqCQYmqpUaf0TjmWtpejP2yBg_UNuBWBzTtNUKDBvx6kW0mMiSV_GIWLYKbGbf-WeqYBHWRB7iXLC-fwEOKsGaloJPOEA"
        : null,
      description: "Premier real estate advisory specializing in luxury residences, prime architectural estates, and corporate property asset investments.",
      address: isApex ? "Los Angeles, CA" : "Seattle, WA",
      phone: isApex ? "+1 (310) 555-8822" : "+1 (206) 555-0911",
      publicEmail: `contact@${slug}.com`,
      websiteUrl: `https://www.${slug}.com`,
    };

    const demoListings: StorefrontListing[] = [
      {
        id: "demo-villa",
        slug: "modern-penthouse",
        title: isApex ? "Sunset Strip Contemporary Villa" : "Waterfront Penthouse Estate",
        price: isApex ? 6500000 : 3800000,
        priceFormatted: isApex ? "$6,500,000" : "$3,800,000",
        location: isApex ? "Los Angeles, CA" : "Seattle, WA",
        badge: "Featured",
        badgeStyle: "bg-emerald-100 text-emerald-900 border border-emerald-300",
        type: isApex ? "villa" : "apartment",
        specs: [
          { icon: "bed", text: "5 Beds" },
          { icon: "shower", text: "6 Baths" },
          { icon: "square_foot", text: "6,200 sqft" },
        ],
        imageUrl: isApex
          ? "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80"
          : "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        link: "/property/modern-penthouse",
      },
    ];

    return <AgencyStorefrontClient agency={agency} listings={demoListings} />;
  }

  // Not found state
  return (
    <main className="min-h-[60vh] max-w-4xl mx-auto px-lg py-xl flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-[72px] text-slate-400 mb-4">
        store_off
      </span>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-navy mb-2">
        Agency Storefront Not Found
      </h1>
      <p className="text-text-secondary max-w-md mb-6">
        The requested real estate brokerage or agency profile could not be found or has been deactivated.
      </p>
      <Link
        href="/agencies"
        className="px-6 py-3 bg-[#EA580C] text-white font-bold rounded-xl hover:bg-[#C2410C] transition-colors shadow-sm inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span>Browse All Agencies</span>
      </Link>
    </main>
  );
}
