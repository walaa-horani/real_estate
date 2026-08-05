"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/siteUrl";

export type InviteActionState =
  | { error: string }
  | { success: true; inviteUrl: string }
  | null;

// This project deliberately sends no email. auth.admin.generateLink() creates
// the auth.users row and returns the one-time hash *without* handing it to a
// mail provider (unlike inviteUserByEmail, which always tries to send and fails
// outright on a project with no SMTP configured). The admin copies the URL out
// of the team page and delivers it themselves.
//
// The link points at our own /auth/confirm rather than Supabase's
// /auth/v1/verify, so the session is established by verifyOtp() in a route
// handler we control — no dependence on how the hosted project is configured to
// shape its redirects.
function buildInviteUrl(hashedToken: string) {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "invite",
    next: "/accept-invite",
  });
  return `${getSiteUrl()}/auth/confirm?${params}`;
}

// Admin invites a member by email: creates the auth.users row immediately and
// attaches an organization_members row right away with status 'invited' —
// flips to 'active' once they set a password via acceptInvite() below. Returns
// the invite link for the admin to pass on; nothing is emailed.
export async function inviteMember(
  organizationId: string,
  email: string
): Promise<InviteActionState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: "Not signed in." };
  }

  const admin = createAdminClient();

  const { data: isAdmin } = await supabase.rpc("is_org_admin", {
    org_id: organizationId,
  });
  if (!isAdmin) {
    return { error: "Only admins can invite members." };
  }

  // Pre-check the plan's seat limit before minting a link — the DB trigger
  // (enforce_team_member_limit) is still the real enforcement and would
  // reject the insert below regardless, but without this an admin who's at
  // their limit would be handed an invite link that fails the moment it's
  // used, which is a confusing way to learn about a cap.
  const { data: organization } = await supabase
    .from("organizations")
    .select("plan:plans(max_team_members)")
    .eq("id", organizationId)
    .single();
  const maxTeamMembers = (organization?.plan as unknown as { max_team_members: number | null } | null)
    ?.max_team_members;

  if (maxTeamMembers !== null && maxTeamMembers !== undefined) {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["active", "invited"]);

    if ((count ?? 0) >= maxTeamMembers) {
      return {
        error: `Your plan allows up to ${maxTeamMembers} team member${maxTeamMembers === 1 ? "" : "s"}. Upgrade your plan to invite more.`,
      };
    }
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
  });

  if (inviteError || !invited.user || !invited.properties?.hashed_token) {
    return { error: inviteError?.message ?? "Failed to create the invite link." };
  }

  const { error: memberError } = await admin.from("organization_members").insert({
    organization_id: organizationId,
    user_id: invited.user.id,
    role: "member",
    status: "invited",
    invited_email: email,
  });

  if (memberError) {
    // Race: two invites landed between the pre-check above and here. The
    // trigger is the real gate; this just gives the same friendly message
    // instead of a raw Postgres error.
    if (memberError.message.includes("plan_limit_exceeded")) {
      return { error: "Your plan's team member limit was just reached. Upgrade your plan to invite more." };
    }
    return { error: memberError.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true, inviteUrl: buildInviteUrl(invited.properties.hashed_token) };
}

// Mints a fresh link for an invite that was lost or expired. generateLink
// refuses an email that already has an auth.users row — even an unconfirmed
// 'invited' one — so the only supported way to reissue is delete-and-recreate:
// remove the stale unconfirmed auth user (which cascades away their
// organization_members row via ON DELETE CASCADE) and run the normal invite
// flow again from scratch. Safe because an 'invited' user has no password and
// never had a session, so there's nothing of theirs to lose.
export async function resendInvite(memberId: string): Promise<InviteActionState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: "Not signed in." };
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, status, invited_email")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { error: "Invite not found." };
  }
  if (member.status !== "invited") {
    return { error: "This member has already activated their account." };
  }
  if (!member.invited_email) {
    return { error: "No email on file for this invite." };
  }

  const { data: isAdmin } = await supabase.rpc("is_org_admin", {
    org_id: member.organization_id,
  });
  if (!isAdmin) {
    return { error: "Only admins can resend invites." };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(member.user_id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  return inviteMember(member.organization_id, member.invited_email);
}

// Called by the invited member on the accept-invite page after they set a
// password. Uses their now-authenticated session to prove identity, then the
// admin client to flip their own 'invited' membership to 'active' (a plain
// self-service policy would let members self-promote, which we don't want).
export type AcceptInviteState = { error: string } | { success: true } | null;

export async function acceptInvite(password: string): Promise<AcceptInviteState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Invite link expired or invalid. Ask your admin to resend it." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return { error: passwordError.message };
  }

  const admin = createAdminClient();
  const { error: memberError } = await admin
    .from("organization_members")
    .update({ status: "active" })
    .eq("user_id", user.id)
    .eq("status", "invited");

  if (memberError) {
    return { error: memberError.message };
  }

  return { success: true };
}
