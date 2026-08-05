import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Lead, OrganizationMember, Profile, Property } from "@/lib/supabase/types";

export async function getOrgProperties(organizationId: string): Promise<Property[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data as Property[]) ?? [];
}

export async function getOrgLeads(organizationId: string): Promise<Lead[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data as Lead[]) ?? [];
}

export type MemberWithProfile = OrganizationMember & { profile: Profile | null };

export async function getOrgMembers(organizationId: string): Promise<MemberWithProfile[]> {
  const supabase = await createServerSupabaseClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  return (members as OrganizationMember[]).map((m) => ({
    ...m,
    profile: profileById.get(m.user_id) ?? null,
  }));
}
