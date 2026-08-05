import { createAdminClient } from "@/lib/supabase/adminClient";
import PropertyDetailClient, { DetailProperty } from "@/components/public/PropertyDetailClient";
import { StorefrontAgency } from "@/components/public/AgencyStorefrontClient";
import Link from "next/link";
import PropertyDetailPage from "../modern-penthouse/page";

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

export default async function DynamicPropertyRoute({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = decodeURIComponent(resolvedParams.slug);

  if (slug === "modern-penthouse") {
    return <PropertyDetailPage />;
  }

  const adminClient = createAdminClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let p = null;
  if (isUUID) {
    const { data } = await adminClient
      .from("properties")
      .select("*")
      .or(`id.eq.${slug},slug.eq.${slug}`);
    p = data?.[0] || null;
  } else {
    const { data: bySlug } = await adminClient
      .from("properties")
      .select("*")
      .ilike("slug", slug);
    p = bySlug?.[0] || null;

    if (!p) {
      const { data: byTitle } = await adminClient
        .from("properties")
        .select("*")
        .ilike("title", `%${slug.replace(/-/g, " ")}%`);
      p = byTitle?.[0] || null;
    }
  }

  if (p) {
    // Fetch photos
    const { data: dbImages } = await adminClient
      .from("property_images")
      .select("url, caption")
      .eq("property_id", p.id)
      .order("sort_order", { ascending: true });

    const images =
      dbImages && dbImages.length > 0
        ? dbImages.filter((img) => img.url).map((img) => ({ url: img.url, caption: img.caption }))
        : [
            {
              url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
              caption: "Main architectural elevation",
            },
          ];

    const detailProp: DetailProperty = {
      id: p.id,
      organizationId: p.organization_id,
      slug: p.slug || p.id,
      title: p.title,
      priceFormatted: formatPrice(p.price, p.price_period),
      location: p.address_line || p.city ? `${p.address_line || ""}, ${p.city || ""}`.replace(/^, /, "") : "United States",
      description: p.description || null,
      type: p.property_type || "house",
      status: p.status || "published",
      specs: [
        { icon: "bed", label: "Bedrooms", value: `${p.beds ?? 4} Beds` },
        { icon: "shower", label: "Bathrooms", value: `${p.baths ?? 3.5} Baths` },
        { icon: "square_foot", label: "Floor Area", value: `${p.sqft ?? 2800} sqft` },
      ],
      images,
    };

    // Fetch parent organization
    const { data: orgs } = await adminClient
      .from("organizations")
      .select("*")
      .eq("id", p.organization_id);

    const org = orgs?.[0] || null;
    let agency: StorefrontAgency | null = null;
    if (org) {
      agency = {
        id: org.slug || org.id,
        name: org.name,
        logoUrl: org.logo_url || null,
        description: org.description || null,
        address: org.address || "United States",
        phone: org.phone || "+1 (800) 555-SYNC",
        publicEmail: org.public_email || null,
        websiteUrl: org.website_url || null,
      };
    }

    return <PropertyDetailClient property={detailProp} agency={agency} />;
  }

  // Not found state
  return (
    <main className="min-h-[60vh] max-w-4xl mx-auto px-lg py-xl flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-[72px] text-slate-400 mb-4">
        real_estate_agent
      </span>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-navy mb-2">
        Property Listing Not Found
      </h1>
      <p className="text-text-secondary max-w-md mb-6">
        This real estate property listing could not be found or may have been archived by the representing brokerage.
      </p>
      <Link
        href="/agencies"
        className="px-6 py-3 bg-[#EA580C] text-white font-bold rounded-xl hover:bg-[#C2410C] transition-colors shadow-sm inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span>Browse Agencies & Listings</span>
      </Link>
    </main>
  );
}
