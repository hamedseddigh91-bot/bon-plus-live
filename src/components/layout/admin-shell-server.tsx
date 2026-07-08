import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireUserContext } from "@/lib/auth-session";
import { getCurrentUserPermissionMap } from "@/lib/user-permissions";

type AdminShellServerProps = {
  children: ReactNode;
  requiredModule?: string;
};

export async function AdminShellServer({ children, requiredModule }: AdminShellServerProps) {
  const context = await requireUserContext();
  const modulePermissions =
    context.role === "owner" || context.isPlatformAdmin
      ? {}
      : await getCurrentUserPermissionMap(context);

  if (requiredModule && context.role !== "owner" && !context.isPlatformAdmin) {
    const { canAccessModule } = await import("@/lib/auth-session");
    const explicit = modulePermissions[requiredModule];
    const allowed = explicit ? explicit.view : canAccessModule(context.role, requiredModule);
    if (!allowed) redirect("/admin");
  }

  return (
    <AdminShell
      businesses={context.businesses}
      currentBusinessSlug={context.currentBusiness.slug}
      businessLogoUrl={context.currentBusiness.logoUrl}
      role={context.role}
      userEmail={context.user.email}
      isPlatformAdmin={context.isPlatformAdmin}
      modulePermissions={modulePermissions}
    >
      {children}
    </AdminShell>
  );
}
