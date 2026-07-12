"use client";

import { useState, useTransition } from "react";
import { Building2, Copy, Crown, Plus } from "lucide-react";
import {
  type PlatformBusiness,
  type PlatformState,
  createBusinessWithOwner,
} from "@/app/platform/actions";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PlatformDashboardProps = {
  initialState: PlatformState;
};

export function PlatformDashboard({ initialState }: PlatformDashboardProps) {
  const [businesses, setBusinesses] = useState<PlatformBusiness[]>(initialState.businesses ?? []);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [createdLogin, setCreatedLogin] = useState<{
    email: string;
    password: string;
    slug: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const create = () => {
    setMessage(null);
    setCreatedLogin(null);

    startTransition(async () => {
      const result = await createBusinessWithOwner({
        businessName,
        slug,
        ownerEmail,
        ownerName,
        ownerPassword,
      });

      if (!result.success) {
        setMessage(result.message ?? "Create failed.");
        return;
      }

      const now = new Date().toISOString();

      setBusinesses((current) => [
        {
          id: `local-${result.slug}`,
          name: businessName,
          slug: result.slug ?? slug,
          logoUrl: null,
          accentColor: "#ffd42a",
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);

      setCreatedLogin({
        email: ownerEmail,
        password: ownerPassword,
        slug: result.slug ?? slug,
      });

      setMessage("Business and owner created.");

      setBusinessName("");
      setSlug("");
      setOwnerEmail("");
      setOwnerName("");
      setOwnerPassword("");
    });
  };

  const copyOwnerLogin = async () => {
    if (!createdLogin) return;

    await navigator.clipboard.writeText(
      `Login: ${window.location.origin}/login\nBusiness: ${createdLogin.slug}\nEmail: ${createdLogin.email}\nPassword: ${createdLogin.password}`
    );

    setMessage("Owner login copied.");
  };

  return (
    <main className="min-h-screen bg-[#050403] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-amber-200/80">
              <Crown className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-[0.25em]">
                Platform Admin
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
              Businesses & owners
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Create a business and its owner account directly. No email confirmation or Supabase dashboard is needed.
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/admin"
              className="inline-flex h-11 items-center rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white/65 hover:bg-white/10"
            >
              Admin
            </a>
            <form action={signOut}>
              <button className="h-11 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white/65 hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        {createdLogin && (
          <Card className="border-amber-200/20 bg-amber-200/[0.05] p-5">
            <div className="flex items-center gap-2 text-amber-100">
              <Copy className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Owner login created</h2>
            </div>
            <div className="mt-4 grid gap-3 rounded-2xl border border-amber-200/20 bg-black/20 p-4 text-sm text-white md:grid-cols-3">
              <p><span className="text-white/40">Email:</span> {createdLogin.email}</p>
              <p><span className="text-white/40">Password:</span> {createdLogin.password}</p>
              <p><span className="text-white/40">Business:</span> {createdLogin.slug}</p>
            </div>
            <div className="mt-4">
              <Button onClick={copyOwnerLogin}>
                <Copy className="h-4 w-4" />
                Copy login info
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-2 text-white">
            <Plus className="h-5 w-5 text-amber-200" />
            <h2 className="text-xl font-semibold">Create business + owner</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="text-sm text-white/45">Business name</span>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="Cafe Name"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="cafe-name"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Owner name</span>
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="Owner"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Owner email</span>
              <input
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="owner@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Owner password</span>
              <input
                type="text"
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="minimum 6 characters"
              />
            </label>

            <div className="flex items-end">
              <Button
                onClick={create}
                disabled={isPending || !businessName.trim() || !ownerEmail.trim() || ownerPassword.length < 6}
              >
                <Building2 className="h-4 w-4" />
                {isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-white">Businesses</h2>

          <div className="bp-table-scroll mt-5 rounded-3xl border border-white/10">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-white/40">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {businesses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-white/35">
                      No businesses yet.
                    </td>
                  </tr>
                )}

                {businesses.map((business) => (
                  <tr key={business.id} className="text-white/75">
                    <td className="px-4 py-4 font-semibold text-white">{business.name}</td>
                    <td className="px-4 py-4">{business.slug}</td>
                    <td className="px-4 py-4">{business.active ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-4">
                      <a
                        href={`/feedback/${business.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-200 hover:underline"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
