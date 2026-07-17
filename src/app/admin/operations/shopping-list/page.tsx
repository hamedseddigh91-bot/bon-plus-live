import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getShoppingListState } from "@/app/admin/operations/shopping-list/actions";
import { ShoppingListManager } from "@/features/admin/operations/shopping-list-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShoppingListPage() {
  const initialState = await getShoppingListState();

  return (
    <AdminShellServer requiredModule="shopping_list">
      <ShoppingListManager initialState={initialState} />
    </AdminShellServer>
  );
}
