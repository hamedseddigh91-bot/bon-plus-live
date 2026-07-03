import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getOperationsPageState } from "@/app/admin/operations/actions";
import { FinanceDashboardPage } from "@/features/admin/finance/finance-dashboard-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FinancePage() {
  const initialState = await getOperationsPageState();

  return (
    <AdminShellServer requiredModule="operations">
      <FinanceDashboardPage initialState={initialState} />
    </AdminShellServer>
  );
}
