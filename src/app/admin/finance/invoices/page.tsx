import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getFinanceInvoicesPageState } from "@/app/admin/operations/actions";
import { FinanceInvoicesPage } from "@/features/admin/finance/finance-invoices-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvoicesPage() {
  const initialState = await getFinanceInvoicesPageState();

  return (
    <AdminShellServer requiredModule="operations">
      <FinanceInvoicesPage initialState={initialState} />
    </AdminShellServer>
  );
}
