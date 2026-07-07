import { getBusinessSettings } from "@/app/admin/settings/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { PublicQrManager } from "@/features/admin/qr/public-qr-manager";
import { FeedbackSettingsShell } from "@/features/admin/settings/feedback-settings-shell";
import { SettingsShell } from "@/features/admin/settings/settings-shell";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialState = await getBusinessSettings();

  return (
    <AdminShellServer requiredModule="settings_feedback">
      <SettingsShell>
        <FeedbackSettingsShell>
          <PublicQrManager initialState={initialState} embedded />
        </FeedbackSettingsShell>
      </SettingsShell>
    </AdminShellServer>
  );
}
