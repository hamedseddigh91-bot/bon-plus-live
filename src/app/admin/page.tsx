import { redirect } from "next/navigation";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getDashboardOperationsState } from "@/app/admin/operations/actions";
import { getAdminFeedbackInbox } from "@/app/admin/feedback/actions";
import { getRecoveryBoard } from "@/app/admin/recovery/actions";
import { DashboardCommandCenter } from "@/features/admin/dashboard-command-center";
import { requireUserContext } from "@/lib/auth-session";
import { getFirstAllowedAdminRoute } from "@/lib/user-permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const context = await requireUserContext();
  const landingRoute = await getFirstAllowedAdminRoute(context);

  if (landingRoute !== "/admin") {
    redirect(landingRoute);
  }

  const [operations, feedback, recovery] = await Promise.all([
    getDashboardOperationsState(),
    getAdminFeedbackInbox({ limit: 30, offset: 0 }),
    getRecoveryBoard({ status: "all", priority: "all", limit: 30, offset: 0 }),
  ]);

  return (
    <AdminShellServer requiredModule="dashboard">
      <DashboardCommandCenter operations={operations} feedback={feedback} recovery={recovery} />
    </AdminShellServer>
  );
}
