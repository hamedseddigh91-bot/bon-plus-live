import { getActivityLogs } from "@/app/admin/activity-logs/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { ActivityLogViewer } from "@/features/admin/activity-logs/activity-log-viewer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMuscatDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Muscat",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function Page() {
  const today = getMuscatDate();
  const initialState = await getActivityLogs({
    dateFrom: today,
    dateTo: today,
    limit: 25,
    offset: 0,
  });

  return (
    <AdminShellServer requiredModule="activity_logs">
      <ActivityLogViewer initialState={initialState} initialDate={today} />
    </AdminShellServer>
  );
}
