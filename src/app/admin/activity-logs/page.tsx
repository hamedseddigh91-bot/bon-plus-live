import { getActivityLogs } from "@/app/admin/activity-logs/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { ActivityLogViewer } from "@/features/admin/activity-logs/activity-log-viewer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getActivityLogs();

  return (
    <AdminShellServer>
      <ActivityLogViewer initialState={initialState} />
    </AdminShellServer>
  );
}
