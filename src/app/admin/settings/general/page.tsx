import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { getCoreControlState } from "@/app/admin/settings/actions";
import { GeneralSettingsManager } from "@/features/admin/settings/general-settings-manager";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
export const dynamic = "force-dynamic";
export default async function Page(){ const initialState=await getCoreControlState(); return <AdminShellServer requiredModule="settings_general"><SettingsShell><GeneralSettingsManager initialState={initialState}/></SettingsShell></AdminShellServer>; }
