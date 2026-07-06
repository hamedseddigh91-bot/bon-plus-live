import { getActionCenterState } from "@/app/admin/action-center/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { ActionCenterPage } from "@/features/admin/action-center/action-center-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const state = await getActionCenterState();
  return <AdminShellServer requiredModule="action_center"><ActionCenterPage state={state} /></AdminShellServer>;
}
