import LeadsTable from "@/components/dashboard/LeadsTable";
import { getOrgLeads } from "@/lib/supabase/dashboardQueries";
import { requireOrgContext } from "@/lib/supabase/orgContext";

export default async function DashboardLeadsPage() {
  const { organization, isAdmin } = await requireOrgContext();
  const leads = await getOrgLeads(organization.id);

  return <LeadsTable leads={leads} isAdmin={isAdmin} />;
}
