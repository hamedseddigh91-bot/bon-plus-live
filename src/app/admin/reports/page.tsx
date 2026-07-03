import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getOperationsPageState } from "@/app/admin/operations/actions";
import { getRecipeCostingState } from "@/app/admin/recipes/actions";
import { ReportsCenterPage } from "@/features/admin/reports/reports-center-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  const [financeState, recipeState] = await Promise.all([
    getOperationsPageState(),
    getRecipeCostingState(),
  ]);

  return (
    <AdminShellServer requiredModule="reports">
      <ReportsCenterPage financeState={financeState} recipeState={recipeState} />
    </AdminShellServer>
  );
}
