import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getFinanceClosingPageState } from "@/app/admin/operations/actions";
import { FinanceClosingPage } from "@/features/admin/finance/finance-closing-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClosingPage() {
  const initialState = await getFinanceClosingPageState();

  return (
    <AdminShellServer requiredModule="operations">
      <FinanceClosingPage initialState={initialState} />
    </AdminShellServer>
  );
}
