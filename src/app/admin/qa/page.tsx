import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { OnlineTestingCenter } from "@/features/admin/qa/online-testing-center";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function QaPage() {
  return (
    <AdminShellServer requiredModule="dashboard">
      <OnlineTestingCenter />
    </AdminShellServer>
  );
}
