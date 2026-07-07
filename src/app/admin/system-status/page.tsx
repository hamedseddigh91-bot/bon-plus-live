import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { requireModulePermission } from "@/lib/user-permissions";

type CheckItem = {
  label: string;
  status: "ok" | "error";
  value: string;
};

async function getSystemChecks(): Promise<CheckItem[]> {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const checks: CheckItem[] = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      status: hasUrl ? "ok" : "error",
      value: hasUrl ? "Configured" : "Missing",
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: hasAnonKey ? "ok" : "error",
      value: hasAnonKey ? "Configured" : "Missing",
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY",
      status: hasServiceKey ? "ok" : "error",
      value: hasServiceKey ? "Configured server-side" : "Missing",
    },
  ];

  if (!hasUrl || !hasServiceKey) {
    checks.push({
      label: "Database connection",
      status: "error",
      value: "Skipped because server env is missing",
    });

    return checks;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true });

    checks.push({
      label: "Database connection",
      status: error ? "error" : "ok",
      value: error ? error.message : `Connected / ${count ?? 0} businesses`,
    });
  } catch (error) {
    checks.push({
      label: "Database connection",
      status: "error",
      value: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return checks;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SystemStatusPage() {
  await requireModulePermission("system", "view");
  const checks = await getSystemChecks();

  return (
    <AdminShellServer requiredModule="system">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-200/80">
            System
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
            System Status
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Environment and database checks.
          </p>
        </section>

        <Card className="p-5">
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">{check.label}</p>
                  <p className="text-sm text-white/40">{check.value}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                    check.status === "ok"
                      ? "bg-emerald-300/10 text-emerald-200"
                      : "bg-red-300/10 text-red-200"
                  }`}
                >
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShellServer>
  );
}
