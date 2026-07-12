import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { NoAccessPage } from "@/features/admin/no-access/no-access-page";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AdminShellServer>
      <NoAccessPage />
    </AdminShellServer>
  );
}
