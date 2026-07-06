"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

type PermissionRow = { view: boolean; edit: boolean };
type PermissionMap = Record<string, PermissionRow>;

type AdminPermissionsValue = {
  canView: (moduleKey: string) => boolean;
  canEdit: (moduleKey: string) => boolean;
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

    return {
      canView: (moduleKey) => permissions[moduleKey]?.view ?? fallbackView(moduleKey),
      canEdit: (moduleKey) => permissions[moduleKey]?.edit ?? fallbackEdit(moduleKey),
    };
  }, [permissions, role, isPlatformAdmin]);

  return <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>;
}

export function useAdminPermissions() {
  const context = useContext(AdminPermissionsContext);
  if (!context) {
    return { canView: () => true, canEdit: () => true };
  }
  return context;
}
