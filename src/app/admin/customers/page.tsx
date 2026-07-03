import { getCustomerDirectory } from "@/app/admin/customers/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { CustomerDirectory } from "@/features/admin/customers/customer-directory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getCustomerDirectory();

  return (
    <AdminShellServer>
      <CustomerDirectory initialState={initialState} />
    </AdminShellServer>
  );
}
