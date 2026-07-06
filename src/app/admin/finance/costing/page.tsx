import { getRecipeCostingState } from "@/app/admin/recipes/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { RecipeCostingPage } from "@/features/admin/recipes/recipe-costing-page";
export const dynamic = "force-dynamic"; export const revalidate = 0;
export default async function Page() { const initialState = await getRecipeCostingState(); return <AdminShellServer requiredModule="costing"><RecipeCostingPage initialState={initialState} /></AdminShellServer>; }
