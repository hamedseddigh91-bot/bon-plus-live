import { getCustomerDirectory } from "@/app/admin/customers/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { CrmShell } from "@/features/admin/crm/crm-shell";
import { CustomerDirectory } from "@/features/admin/customers/customer-directory";
export const dynamic = "force-dynamic"; export const revalidate = 0;
export default async function Page() { const initialState = await getCustomerDirectory(); return <AdminShellServer requiredModule="customers"><CrmShell active="customers"><CustomerDirectory initialState={initialState} /></CrmShell></AdminShellServer>; }
