import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireUserContext } from "@/lib/auth-session";

type AdminShellServerProps = {
  children: ReactNode;
  requiredModule?: string;
};

export async function AdminShellServer({
  children,
  requiredModule,
}: AdminShellServerProps) {
  const context = await requireUserContext();

  if (requiredModule) {
    const { canAccessModule } = await import("@/lib/auth-session");

    if (!canAccessModule(context.role, requiredModule)) {
      redirect("/admin");
    }
  }

  return (
    <AdminShell
      businesses={context.businesses}
      currentBusinessSlug={context.currentBusiness.slug}
      role={context.role}
      userEmail={context.user.email}
      isPlatformAdmin={context.isPlatformAdmin}
    >
      {children}
    </AdminShell>
  );
}
