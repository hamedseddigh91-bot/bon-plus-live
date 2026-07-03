import { getAdminFeedbackInbox } from "@/app/admin/feedback/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { FeedbackInbox } from "@/features/admin/feedback/feedback-inbox";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getAdminFeedbackInbox();

  return (
    <AdminShellServer>
      <FeedbackInbox initialState={initialState} />
    </AdminShellServer>
  );
}
