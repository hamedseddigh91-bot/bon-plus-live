"use client";

import { useState, useTransition } from "react";
import { Save, UserCog, UserPlus } from "lucide-react";
import {
  type BusinessUser,
  type UsersState,
  createBusinessUserDirect,
  saveBusinessUser,
} from "@/app/admin/users/actions";
import type { BusinessRole } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UserManagerProps = {
  initialState: UsersState;
};

const roles: { value: BusinessRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
  { value: "read_only", label: "Read only" },
];

export function UserManager({ initialState }: UserManagerProps) {
  const [users, setUsers] = useState<BusinessUser[]>(initialState.users ?? []);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<BusinessRole>("accountant");
  const [active, setActive] = useState(true);
  const [createdLogin, setCreatedLogin] = useState<{ email: string; password: string } | null>(null);
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();

  const createDirect = () => {
    setCreatedLogin(null);

    startTransition(async () => {
      const result = await createBusinessUserDirect({
        email,
        displayName,
        password,
        role,
        active,
      });

      if (!result.success) {
        setMessage(result.message ?? "Create failed.");
        return;
      }

      setMessage("User created. Share the email and password with the user.");
      setCreatedLogin({ email, password });

      const now = new Date().toISOString();

      setUsers((current) => {
        const existing = current.find((item) => item.email.toLowerCase() === email.toLowerCase());

        if (existing) {
          return current.map((item) =>
            item.id === existing.id
              ? { ...item, displayName, role, active, authUserId: item.authUserId ?? "linked", updatedAt: now }
              : item
          );
        }

        return [
          {
            id: `local-${email}`,
            businessId: "",
            authUserId: "linked",
            email: email.toLowerCase(),
            displayName,
            role,
            active,
            createdAt: now,
            updatedAt: now,
          },
          ...current,
        ];
      });

      setEmail("");
      setDisplayName("");
      setPassword("");
      setRole("accountant");
      setActive(true);
    });
  };

  const saveOnly = () => {
    startTransition(async () => {
      const result = await saveBusinessUser({
        email,
        displayName,
        role,
        active,
      });

      if (!result.success) {
        setMessage(result.message ?? "Save failed.");
        return;
      }

      setMessage(result.message ?? "Saved.");
    });
  };

  const edit = (user: BusinessUser) => {
    setEmail(user.email);
    setDisplayName(user.displayName ?? "");
    setPassword("");
    setRole(user.role);
    setActive(user.active);
    setCreatedLogin(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-3 flex items-center gap-2 text-amber-200/80">
          <UserCog className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-[0.25em]">
            Access
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          Users & roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          Create users directly for this business. No Supabase dashboard or email confirmation is needed.
        </p>
      </section>

      {message && (
        <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
          {message}
        </div>
      )}

      {createdLogin && (
        <Card className="border-amber-200/20 bg-amber-200/[0.05] p-5">
          <h2 className="text-lg font-semibold text-amber-100">Login created</h2>
          <div className="mt-4 grid gap-3 rounded-2xl border border-amber-200/20 bg-black/20 p-4 text-sm text-white md:grid-cols-2">
            <p><span className="text-white/40">Email:</span> {createdLogin.email}</p>
            <p><span className="text-white/40">Password:</span> {createdLogin.password}</p>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-white">Create or update user</h2>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_220px_130px_auto_auto]">
          <label className="block">
            <span className="text-sm text-white/45">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
              placeholder="accountant@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm text-white/45">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
              placeholder="Accountant"
            />
          </label>

          <label className="block">
            <span className="text-sm text-white/45">Password</span>
            <input
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
              placeholder="minimum 6 characters"
            />
          </label>

          <label className="block">
            <span className="text-sm text-white/45">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as BusinessRole)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
            >
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-white/45">Status</span>
            <select
              value={active ? "active" : "inactive"}
              onChange={(event) => setActive(event.target.value === "active")}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="flex items-end">
            <Button onClick={createDirect} disabled={isPending || !email.trim() || password.length < 6}>
              <UserPlus className="h-4 w-4" />
              {isPending ? "Working..." : "Create user"}
            </Button>
          </div>

          <div className="flex items-end">
            <Button variant="secondary" onClick={saveOnly} disabled={isPending || !email.trim()}>
              <Save className="h-4 w-4" />
              Save role
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-white">Current users</h2>

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-white/40">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Auth</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/35">
                    No users yet.
                  </td>
                </tr>
              )}

              {users.map((user) => (
                <tr key={user.id} className="text-white/75">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{user.displayName || "Unnamed"}</p>
                    <p className="text-xs text-white/35">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">{user.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4">{user.authUserId ? "Linked" : "Not linked"}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => edit(user)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
