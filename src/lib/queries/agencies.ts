import "server-only";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Organization } from "@/lib/supabase/types";

export type AgencyCardItem = {
  id: string;
  slug: string;
  name: string;
  location: string;
  listingsCount: number;
  logoUrl?: string;
  link: string;
  isMyAgency: boolean;
};

export async function getAgenciesList(): Promise<AgencyCardItem[]> {
  const adminClient = createAdminClient();
  const serverClient = await createServerSupabaseClient();

  // Get currently signed in user
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  // Find organization IDs where the user is a member or creator
  const myOrgIds = new Set<string>();
  if (user) {
    const { data: memberships } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (memberships) {
      memberships.forEach((m) => myOrgIds.add(m.organization_id));
    }
  }

  // Fetch all organizations from database
  const { data: dbOrgs } = await adminClient
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all properties to count per organization
  const { data: properties } = await adminClient
    .from("properties")
    .select("organization_id");

  const countsMap = new Map<string, number>();
  if (properties) {
    properties.forEach((p) => {
      countsMap.set(p.organization_id, (countsMap.get(p.organization_id) || 0) + 1);
    });
  }

  const result: AgencyCardItem[] = [];

  // Add real DB organizations
  if (dbOrgs) {
    (dbOrgs as Organization[]).forEach((org) => {
      const isMine = myOrgIds.has(org.id) || org.created_by === user?.id;
      if (isMine) {
        myOrgIds.add(org.id);
      }

      // Determine appropriate navigation link
      let link = `/agency/${org.slug || "skyline-properties"}`;
      if (isMine) {
        link = "/dashboard/properties";
      } else if (org.slug === "skyline-properties" || org.name.toLowerCase().includes("skyline")) {
        link = "/agency/skyline-properties";
      }

      result.push({
        id: org.id,
        slug: org.slug || org.id,
        name: org.name,
        location: org.address || "United States",
        listingsCount: countsMap.get(org.id) || 0,
        logoUrl: org.logo_url || undefined,
        link,
        isMyAgency: isMine,
      });
    });
  }

  // Demo fallback agencies to always maintain rich visual density if not already in DB
  const demoAgencies: {
    slug: string;
    name: string;
    location: string;
    listingsCount: number;
    logoUrl: string;
    link: string;
  }[] = [
    {
      slug: "skyline-properties",
      name: "Skyline Properties",
      location: "New York, NY",
      listingsCount: 124,
      logoUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDvOr3I1bs0d9TrdzBXMfeDsv-i0PHttnQPrmyH77YKPmpdCZh11NIo5CW7vXVv-YJ5gtxOfAA9F1FqqrIhMkqY3bgo7okWr6bWQGKGDhQxe6e_GUAH8Vyva4GUhofZRqRH9CgOZlxYcAw1kP63QrpAFcAk1ScztkPaEOajbBmr8NmXIAj1SMsnFHq_VAj6wfR21gPrkS4IIF577oTBmtRkYBAXh4i9W53DGsOR_cVF15ntxatrxvUt",
      link: "/agency/skyline-properties",
    },
    {
      slug: "apex-estates",
      name: "Apex Estates",
      location: "Los Angeles, CA",
      listingsCount: 89,
      logoUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD2HSYRNGxuivzfQcSoZVybVn7axfMq3g4uksuFapUlE1BaQRgzgcoTQZt_z5va7Bne3Axa-cXaFAZBGcBz8-YZdmyJXNrcSdJw74c4tNeERTvctUu42MBPceer-tz6hfejBZDwW9KaP-7ItTyy3-uqC0amCMai0U_z2OldnPWfhGh9tN0-zpBkTR6jQDFdyxjG2mhL4ibZAiWltUoxFZHAvI5Dtr0HnPd9d-KJCZqy-T7itpQVGFQE",
      link: "/agency/skyline-properties",
    },
    {
      slug: "harbor-oak",
      name: "Harbor & Oak",
      location: "Seattle, WA",
      listingsCount: 215,
      logoUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDAybfTqIQZZ0NJGNtGpWJVp9FOVvZpMKXCOYgirCCbirsxnDcwENjenujwTw-bBDE0U5Ry8WOw8USDBdUG-fYP3oIf8yin2nXdmubFtH-jG-nvsq0Ig0ZKTyeAvkUICpKiZZj7d_Oj_WTWLTkAXbvYkcIEqCQYmqpUaf0TjmWtpejP2yBg_UNuBWBzTtNUKDBvx6kW0mMiSV_GIWLYKbGbf-WeqYBHWRB7iXLC-fwEOKsGaloJPOEA",
      link: "/agency/skyline-properties",
    },
  ];

  demoAgencies.forEach((demo) => {
    const exists = result.some(
      (existing) =>
        existing.slug.toLowerCase() === demo.slug.toLowerCase() ||
        existing.name.toLowerCase() === demo.name.toLowerCase()
    );
    if (!exists) {
      result.push({
        id: `demo-${demo.slug}`,
        slug: demo.slug,
        name: demo.name,
        location: demo.location,
        listingsCount: demo.listingsCount,
        logoUrl: demo.logoUrl,
        link: demo.link,
        isMyAgency: false,
      });
    } else {
      // Enrich existing demo items with image and count if empty in DB
      const match = result.find(
        (existing) =>
          existing.slug.toLowerCase() === demo.slug.toLowerCase() ||
          existing.name.toLowerCase() === demo.name.toLowerCase()
      );
      if (match) {
        if (!match.logoUrl) match.logoUrl = demo.logoUrl;
        if (match.listingsCount === 0) match.listingsCount = demo.listingsCount;
        if (match.location === "United States" || !match.location) match.location = demo.location;
        if (!match.isMyAgency && match.link === `/agency/${match.slug}`) match.link = demo.link;
      }
    }
  });

  // Sort so that the user's agency ALWAYS appears first at the top
  result.sort((a, b) => {
    if (a.isMyAgency && !b.isMyAgency) return -1;
    if (!a.isMyAgency && b.isMyAgency) return 1;
    return 0;
  });

  return result;
}
