import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getFinanceCashPageState } from "@/app/admin/operations/actions";
import { FinanceCashPage } from "@/features/admin/finance/finance-cash-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CashPage() {
  const initialState = await getFinanceCashPageState();

  return (
    <AdminShellServer requiredModule="operations">
      <FinanceCashPage initialState={initialState} />
    </AdminShellServer>
  );
}
