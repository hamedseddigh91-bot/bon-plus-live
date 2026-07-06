import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth-session";
import { getCurrentUserPermissionMap } from "@/lib/user-permissions";

const settingsRoutes = [
  ["settings_general", "/admin/settings/general"],
  ["settings_feedback", "/admin/settings/feedback"],
  ["settings_users", "/admin/settings/users"],
  ["settings_whatsapp", "/admin/settings/whatsapp-messages"],
] as const;

export default async function SettingsPage() {
  const context = await requireUserContext();

  if (context.role === "owner" || context.isPlatformAdmin) {
    redirect("/admin/settings/general");
  }

  const permissions = await getCurrentUserPermissionMap(context);
  const firstAllowed = settingsRoutes.find(([key]) => permissions[key]?.view);

  if (firstAllowed) {
    redirect(firstAllowed[1]);
  }

  redirect("/admin");
}
