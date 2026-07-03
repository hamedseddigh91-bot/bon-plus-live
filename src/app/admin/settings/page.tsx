import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getCoreControlState } from "@/app/admin/settings/actions";
import { AppControlCenter } from "@/features/admin/settings/app-control-center";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const initialState = await getCoreControlState();

  return (
    <AdminShellServer requiredModule="settings">
      <AppControlCenter initialState={initialState} />
    </AdminShellServer>
  );
}
