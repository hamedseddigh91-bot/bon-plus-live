import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireUserContext } from "@/lib/auth-session";
import {
  firstAllowedAdminRouteFromState,
  getCurrentUserPermissionState,
  permissionStateAllows,
} from "@/lib/user-permissions";

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

  if (requiredModule && !permissionStateAllows(context, permissionState, requiredModule, "view")) {
    redirect(firstAllowedAdminRouteFromState(context, permissionState));
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
