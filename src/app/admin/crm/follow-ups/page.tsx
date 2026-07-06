import { getRecoveryBoard } from "@/app/admin/recovery/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { CrmShell } from "@/features/admin/crm/crm-shell";
import { RecoveryBoard } from "@/features/admin/recovery/recovery-board";
export const dynamic = "force-dynamic"; export const revalidate = 0;
export default async function Page() { const initialState = await getRecoveryBoard({ status: "all", priority: "all", limit: 50, offset: 0 }); return <AdminShellServer requiredModule="followups"><CrmShell active="follow-ups"><RecoveryBoard initialState={initialState} /></CrmShell></AdminShellServer>; }
