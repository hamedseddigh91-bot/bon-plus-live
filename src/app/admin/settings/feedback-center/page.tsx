import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { FeedbackCenter } from "@/features/admin/settings/feedback-center";
import { FeedbackSettingsShell } from "@/features/admin/settings/feedback-settings-shell";
import { SettingsShell } from "@/features/admin/settings/settings-shell";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AdminShellServer requiredModule="settings_feedback">
      <SettingsShell>
        <FeedbackSettingsShell>
          <FeedbackCenter />
        </FeedbackSettingsShell>
      </SettingsShell>
    </AdminShellServer>
  );
}
