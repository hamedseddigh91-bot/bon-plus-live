import { getDiscountCenter } from "@/app/admin/discounts/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { DiscountsManager } from "@/features/admin/discounts/discounts-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getDiscountCenter();

  return (
    <AdminShellServer>
      <DiscountsManager initialState={initialState} />
    </AdminShellServer>
  );
}
