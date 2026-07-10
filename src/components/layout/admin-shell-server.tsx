import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { canAccessModule, requireUserContext } from "@/lib/auth-session";
import { getCurrentUserPermissionState } from "@/lib/user-permissions";

type AdminShellServerProps = {
  children: ReactNode;
  requiredModule?: string;
};

export async function AdminShellServer({ children, requiredModule }: AdminShellServerProps) {
  const context = await requireUserContext();

  const permissionState =
    context.role === "owner" || context.isPlatformAdmin
      ? { permissions: {}, membershipFound: true, hasExplicitPermissions: false }
      : await getCurrentUserPermissionState(context);

  const modulePermissions = permissionState.permissions;

  if (requiredModule && context.role !== "owner" && !context.isPlatformAdmin) {
    if (!permissionState.membershipFound) redirect("/admin");

    const explicit = modulePermissions[requiredModule];
    const allowed = explicit
      ? explicit.view
      : permissionState.hasExplicitPermissions
        ? false
        : canAccessModule(context.role, requiredModule);

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
