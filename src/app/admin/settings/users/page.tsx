import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getBusinessUsers } from "@/app/admin/users/actions";
import { UserManager } from "@/features/admin/users/user-manager";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
export const dynamic="force-dynamic";
export default async function Page(){const initialState=await getBusinessUsers();return <AdminShellServer requiredModule="settings_users"><SettingsShell><UserManager initialState={initialState}/></SettingsShell></AdminShellServer>}
