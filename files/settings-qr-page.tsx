import { getBusinessSettings } from "@/app/admin/settings/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { PublicQrManager } from "@/features/admin/qr/public-qr-manager";
import { SettingsShell } from "@/features/admin/settings/settings-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getBusinessSettings();

  return (
    <AdminShellServer>
      <SettingsShell>
        <PublicQrManager initialState={initialState} />
      </SettingsShell>
    </AdminShellServer>
  );
}
