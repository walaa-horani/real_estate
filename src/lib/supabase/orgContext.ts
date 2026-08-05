import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Organization, OrganizationMember, Plan } from "@/lib/supabase/types";

export type OrgContext = {
  userId: string;
  organization: Organization;
  plan: Plan;
  membership: OrganizationMember;
  isAdmin: boolean;
};

// Resolves the signed-in user's organization + role for dashboard pages.
// proxy.ts already guarantees a session exists on every /dashboard/** route;
// this additionally guarantees that session belongs to an active org member —
// the actual tenant-isolation boundary (RLS on organization_members) is what
// decides which single org this ever resolves to, so there is no way to view
// another tenant's data by manipulating the request.
export async function requireOrgContext(): Promise<OrgContext> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    // Authenticated but no org yet (e.g. signup was interrupted before an
    // organization got created). This account already exists in Supabase
    // Auth, so /signup (which calls auth.signUp again) would just error with
    // "already registered" — send them to plan selection instead, which only
    // needs the existing session to finish org creation.
    redirect("/signup/plan");
  }

  // Single round trip via the organizations.plan_id FK instead of two
  // separate queries (org, then plan) — PostgREST embeds the related row
  // directly off the foreign key.
  const { data: organization } = await supabase
    .from("organizations")
    .select("*, plan:plans(*)")
    .eq("id", membership.organization_id)
    .single();

  if (!organization) {
    redirect("/signup/plan");
  }

  const { plan, ...organizationFields } = organization as Organization & { plan: Plan };

  return {
    userId: user.id,
    organization: organizationFields as Organization,
    plan,
    membership: membership as OrganizationMember,
    isAdmin: membership.role === "admin",
  };
}
