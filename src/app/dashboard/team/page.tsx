import TeamTable from "@/components/dashboard/TeamTable";
import { getOrgMembers } from "@/lib/supabase/dashboardQueries";
import { requireOrgContext } from "@/lib/supabase/orgContext";

export default async function DashboardTeamPage() {
  const { organization, userId, isAdmin } = await requireOrgContext();
  const members = await getOrgMembers(organization.id);

  return (
    <TeamTable
      organizationId={organization.id}
      members={members}
      currentUserId={userId}
      isAdmin={isAdmin}
    />
  );
}
