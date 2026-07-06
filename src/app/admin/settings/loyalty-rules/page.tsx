import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { LoyaltyRulesManager } from "@/features/admin/settings/loyalty-rules-manager";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
import { getLoyaltyRulesSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const state = await getLoyaltyRulesSettings();
  return <AdminShellServer requiredModule="settings_general"><SettingsShell><LoyaltyRulesManager initialState={state} /></SettingsShell></AdminShellServer>;
}
