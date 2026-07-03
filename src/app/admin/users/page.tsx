import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getBusinessUsers } from "@/app/admin/users/actions";
import { UserManager } from "@/features/admin/users/user-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const initialState = await getBusinessUsers();

  return (
    <AdminShellServer requiredModule="users">
      <UserManager initialState={initialState} />
    </AdminShellServer>
  );
}
