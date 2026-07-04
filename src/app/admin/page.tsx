import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { requireUserContext } from "@/lib/auth-session";
import { getOperationsPageState } from "@/app/admin/operations/actions";
import { getAdminFeedbackInbox } from "@/app/admin/feedback/actions";
import { getRecoveryBoard } from "@/app/admin/recovery/actions";
import { DashboardCommandCenter } from "@/features/admin/dashboard-command-center";
export const dynamic = "force-dynamic"; export const revalidate = 0;
export default async function AdminDashboardPage() {
  await requireUserContext();
  const [operations, feedback, recovery] = await Promise.all([
    getOperationsPageState(),
    getAdminFeedbackInbox({ limit: 30, offset: 0 }),
    getRecoveryBoard({ status: "all", priority: "all", limit: 30, offset: 0 }),
  ]);
  return <AdminShellServer requiredModule="dashboard"><DashboardCommandCenter operations={operations} feedback={feedback} recovery={recovery} /></AdminShellServer>;
}
