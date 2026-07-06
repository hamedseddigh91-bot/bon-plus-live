import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { ExternalReviewsManager } from "@/features/admin/settings/external-reviews-manager";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
import { getExternalReviewIntegrations } from "./actions";

export const dynamic = "force-dynamic";
export default async function Page() {
  const state = await getExternalReviewIntegrations();
  return <AdminShellServer requiredModule="settings_feedback"><SettingsShell><ExternalReviewsManager initialState={state} /></SettingsShell></AdminShellServer>;
}
