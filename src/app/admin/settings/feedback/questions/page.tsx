import { getAdminQuestions } from "@/app/admin/questions/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { QuestionsManager } from "@/features/admin/questions/questions-manager";
import { FeedbackSettingsShell } from "@/features/admin/settings/feedback-settings-shell";
import { SettingsShell } from "@/features/admin/settings/settings-shell";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialState = await getAdminQuestions();
  return (
    <AdminShellServer requiredModule="settings_feedback">
      <SettingsShell>
        <FeedbackSettingsShell>
          <QuestionsManager initialState={initialState} />
        </FeedbackSettingsShell>
      </SettingsShell>
    </AdminShellServer>
  );
}
