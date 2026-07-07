import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { FeedbackSettingsManager } from "@/features/admin/settings/feedback-settings-manager";
import { FeedbackSettingsShell } from "@/features/admin/settings/feedback-settings-shell";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
import { getFeedbackSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const state = await getFeedbackSettings();

  return (
    <AdminShellServer requiredModule="settings_feedback">
      <SettingsShell>
        <FeedbackSettingsShell>
          <FeedbackSettingsManager initialState={state} />
        </FeedbackSettingsShell>
      </SettingsShell>
    </AdminShellServer>
  );
}
