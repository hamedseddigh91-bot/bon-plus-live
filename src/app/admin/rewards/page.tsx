import { getAdminRewards } from "@/app/admin/rewards/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { RewardsManager } from "@/features/admin/rewards/rewards-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getAdminRewards();

  return (
    <AdminShellServer>
      <RewardsManager initialState={initialState} />
    </AdminShellServer>
  );
}
