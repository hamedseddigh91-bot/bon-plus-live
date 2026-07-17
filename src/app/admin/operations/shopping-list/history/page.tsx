import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getShoppingListHistory } from "@/app/admin/operations/shopping-list/actions";
import { ShoppingListHistory } from "@/features/admin/operations/shopping-list-history";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShoppingListHistoryPage() {
  const state = await getShoppingListHistory();

  return (
    <AdminShellServer requiredModule="shopping_list">
      <ShoppingListHistory lists={state.lists} />
    </AdminShellServer>
  );
}
