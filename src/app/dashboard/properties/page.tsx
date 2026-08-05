import PropertiesTable from "@/components/dashboard/PropertiesTable";
import { getOrgProperties } from "@/lib/supabase/dashboardQueries";
import { requireOrgContext } from "@/lib/supabase/orgContext";

export default async function DashboardPropertiesPage() {
  const { organization, isAdmin } = await requireOrgContext();
  const properties = await getOrgProperties(organization.id);

  return (
    <PropertiesTable
      organizationId={organization.id}
      properties={properties}
      isAdmin={isAdmin}
    />
  );
}
