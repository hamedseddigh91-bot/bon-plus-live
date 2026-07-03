import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getRecipeCostingState } from "@/app/admin/recipes/actions";
import RecipeCostingPage from "../../../features/admin/recipes/recipe-costing-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RecipesPage() {
  const initialState = await getRecipeCostingState();

  return (
    <AdminShellServer requiredModule="operations">
      <RecipeCostingPage initialState={initialState} />
    </AdminShellServer>
  );
}
