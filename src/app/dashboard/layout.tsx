import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireOrgContext } from "@/lib/supabase/orgContext";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { organization, plan, isAdmin } = await requireOrgContext();

  return (
    <DashboardShell orgName={organization.name} planName={plan.name} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  );
}
