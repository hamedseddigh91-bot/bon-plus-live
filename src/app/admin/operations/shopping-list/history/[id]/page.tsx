import { notFound } from "next/navigation";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getShoppingListDetail } from "@/app/admin/operations/shopping-list/actions";
import { ShoppingListDetailView } from "@/features/admin/operations/shopping-list-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await getShoppingListDetail(id);
  if (!state.success || !state.list) notFound();

  return (
    <AdminShellServer requiredModule="shopping_list">
      <ShoppingListDetailView list={state.list} />
    </AdminShellServer>
  );
}
