import { getLoyaltyCounterState } from "@/app/admin/crm/loyalty/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { CrmShell } from "@/features/admin/crm/crm-shell";
import { LoyaltyCounter } from "@/features/admin/crm/loyalty-counter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const counter = await getLoyaltyCounterState();
  return (
    <AdminShellServer requiredModule="loyalty">
      <CrmShell active="loyalty">
        <LoyaltyCounter initialState={counter} />
      </CrmShell>
    </AdminShellServer>
  );
}
