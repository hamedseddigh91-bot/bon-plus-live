import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChefHat,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUserContext } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modules = [
  {
    title: "Finance control",
    description: "Invoices, cash closing, petty cash, period lock and financial reports.",
    href: "/admin/finance",
    icon: WalletCards,
    tag: "Core",
  },
  {
    title: "Recipe costing",
    description: "Menu cost, margin, food-cost percentage and low-profit alerts.",
    href: "/admin/recipes",
    icon: ChefHat,
    tag: "Cost",
  },
  {
    title: "Customer feedback",
    description: "Feedback inbox, recovery workflow and customer history.",
    href: "/admin/feedback",
    icon: MessageSquareHeart,
    tag: "CX",
  },
  {
    title: "Customers",
    description: "Customer directory, score history and visit signals.",
    href: "/admin/customers",
    icon: Users,
    tag: "CRM",
  },
];

export default async function AdminDashboardPage() {
  const context = await requireUserContext();
  const roleLabel = context.role.replace("_", " ");

  return (
    <AdminShellServer requiredModule="dashboard">
      <div className="space-y-6">
        <section className="bp-dashboard-hero relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-300/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                Bon Plus Control Center
              </div>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl">
                {context.currentBusiness.name}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">
                A premium operations cockpit for finance, customer experience, cost control and business decisions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              {[
                { label: "Business", value: context.currentBusiness.slug, icon: Building2 },
                { label: "Role", value: roleLabel, icon: ShieldCheck },
                { label: "Access", value: `${context.businesses.length} business`, icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">{item.label}</p>
                      <Icon className="h-4 w-4 text-amber-200" />
                    </div>
                    <p className="mt-3 truncate text-lg font-black capitalize text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((item) => {
            const Icon = item.icon;

            return (
              <a key={item.href} href={item.href} className="block">
                <Card className="h-full p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200/10 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="amber">{item.tag}</Badge>
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">{item.description}</p>
                </Card>
              </a>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100/80">Operating rhythm</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Today’s command list</h3>
              </div>
              <Badge variant="success">Ready</Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["Close cash", "Check cash, card, Talabat and tip card."],
                ["Invoices", "Record unpaid invoices first and upload documents."],
                ["Costing", "Review low-margin items before price changes."],
              ].map(([title, description], index) => (
                <div key={title} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-3xl font-black text-amber-100">0{index + 1}</p>
                  <p className="mt-3 font-black text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/42">{description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-amber-100" />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">Product status</h3>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["Admin design", "Premium shell + light/dark theme"],
                ["Finance", "Period lock + reports + invoices"],
                ["Recipe cost", "Lean one-table costing model"],
                ["Production", "Build/start ready"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <span className="text-sm font-semibold text-white/55">{label}</span>
                  <span className="text-right text-sm font-black text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AdminShellServer>
  );
}
