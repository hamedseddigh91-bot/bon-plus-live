"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

type PermissionRow = { view: boolean; edit: boolean };
type PermissionMap = Record<string, PermissionRow>;

type AdminPermissionsValue = {
  canView: (moduleKey: string) => boolean;
  canEdit: (moduleKey: string) => boolean;
  hasCustomPermissions: boolean;
};

const AdminPermissionsContext = createContext<AdminPermissionsValue | null>(null);

export function AdminPermissionsProvider({
  children,
  permissions,
  role,
  isPlatformAdmin,
}: {
  children: ReactNode;
  permissions: PermissionMap;
  role: string;
  isPlatformAdmin: boolean;
}) {
  const value = useMemo<AdminPermissionsValue>(() => {
    const hasCustomPermissions = Object.keys(permissions).length > 0;

    const fallbackView = (moduleKey: string) => {
      if (role === "owner" || isPlatformAdmin) return true;
      if (role === "manager") return moduleKey !== "settings_users";
      return false;
    };

    const fallbackEdit = (moduleKey: string) => {
      if (role === "owner" || isPlatformAdmin) return true;
      if (role === "manager") return moduleKey !== "settings_users";
      return false;
    };

    const canView = (moduleKey: string) => {
      if (role === "owner" || isPlatformAdmin) return true;
      const explicit = permissions[moduleKey];
      if (explicit) return explicit.view;
      if (hasCustomPermissions) return false;
      return fallbackView(moduleKey);
    };

    const canEdit = (moduleKey: string) => {
      if (role === "owner" || isPlatformAdmin) return true;
      const explicit = permissions[moduleKey];
      if (explicit) return explicit.edit;
      if (hasCustomPermissions) return false;
      return fallbackEdit(moduleKey);
    };

    return { canView, canEdit, hasCustomPermissions };
  }, [permissions, role, isPlatformAdmin]);

  return <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>;
}

export function useAdminPermissions() {
  const context = useContext(AdminPermissionsContext);
  if (!context) {
    return {
      canView: () => true,
      canEdit: () => true,
      hasCustomPermissions: false,
    };
  }
  return context;
}
