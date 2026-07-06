import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
import { WhatsAppTemplatesManager } from "@/features/admin/settings/whatsapp-templates-manager";
import { getWhatsAppTemplates } from "./actions";
export const dynamic="force-dynamic";
export default async function Page(){const state=await getWhatsAppTemplates();return <AdminShellServer requiredModule="settings_whatsapp"><SettingsShell><WhatsAppTemplatesManager initialState={state}/></SettingsShell></AdminShellServer>}
