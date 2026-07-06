import { getAdminFeedbackInbox } from "@/app/admin/feedback/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { CrmShell } from "@/features/admin/crm/crm-shell";
import { FeedbackInbox } from "@/features/admin/feedback/feedback-inbox";
import { requireUserContext } from "@/lib/auth-session";
import { syncGoogleReviewsIfDue } from "@/lib/external-reviews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const context = await requireUserContext();
  await syncGoogleReviewsIfDue(context.currentBusiness.id).catch(() => null);
  const initialState = await getAdminFeedbackInbox();
  return <AdminShellServer requiredModule="feedback"><CrmShell active="feedback"><FeedbackInbox initialState={initialState} /></CrmShell></AdminShellServer>;
}
