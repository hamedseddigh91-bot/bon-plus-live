import { getDiscountCenter } from "@/app/admin/discounts/actions";
import { getLoyaltyCounterState } from "@/app/admin/crm/loyalty/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { CrmShell } from "@/features/admin/crm/crm-shell";
import { LoyaltyWorkspace } from "@/features/admin/crm/loyalty-workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const [discounts, counter] = await Promise.all([
    getDiscountCenter(),
    getLoyaltyCounterState(),
  ]);

  return (
    <AdminShellServer>
      <CrmShell active="loyalty">
        <LoyaltyWorkspace discountState={discounts} counterState={counter} />
      </CrmShell>
    </AdminShellServer>
  );
}
