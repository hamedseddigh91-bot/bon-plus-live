import { getAdminFeedbackInbox } from "@/app/admin/feedback/actions";
import { getCustomerDirectory } from "@/app/admin/customers/actions";
import { getRecoveryBoard } from "@/app/admin/recovery/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { RetentionCommandCenter } from "@/features/admin/retention/retention-command-center";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RecoveryPage() {
  const [recoveryState, customerState, feedbackState] = await Promise.all([
    getRecoveryBoard({ status: "all", priority: "all", limit: 40, offset: 0 }),
    getCustomerDirectory({ riskFilter: "all", limit: 80, offset: 0 }),
    getAdminFeedbackInbox({ segment: "all", rewardFilter: "all", limit: 40, offset: 0 }),
  ]);

  return (
    <AdminShellServer>
      <RetentionCommandCenter
        recoveryState={recoveryState}
        customerState={customerState}
        feedbackState={feedbackState}
      />
    </AdminShellServer>
  );
}
