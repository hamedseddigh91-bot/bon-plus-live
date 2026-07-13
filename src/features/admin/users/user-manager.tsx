"use client";

import { useState, useTransition } from "react";
import { KeyRound, Save, ShieldCheck, UserPlus, X } from "lucide-react";
import {
  type BusinessUser,
  type UsersState,
  createBusinessUserDirect,
  resetBusinessUserPassword,
  saveBusinessUser,
} from "@/app/admin/users/actions";
import {
  getUserPermissions,
  saveUserPermissions,
  type UserPermission,
} from "@/app/admin/users/permissions-actions";
import type { BusinessRole } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UserManagerProps = { initialState: UsersState };

const roles: { value: BusinessRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
  { value: "read_only", label: "Read only" },
];

const permissionLabels: Record<string, string> = {
  dashboard: "Dashboard",
  action_center: "Action Center",
  finance_closing: "Finance · Cash Closing",
  finance_invoices: "Finance · Invoices",
  finance_cash: "Finance · Petty Cash",
  costing: "Finance · Recipe & Costing",
  feedback: "CRM · Feedback",
  followups: "CRM · Follow-ups",
  customers: "CRM · Customers",
  discounts: "CRM · Discounts",
  loyalty: "CRM · Loyalty",
  reports: "Reports",
  activity_logs: "Activity Logs",
  settings_general: "Settings · General",
  settings_feedback: "Settings · Feedback",
  settings_users: "Settings · Users",
  settings_whatsapp: "Settings · WhatsApp Messages",
};

export function UserManager({ initialState }: UserManagerProps) {
  const [users, setUsers] = useState(initialState.users ?? []);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<BusinessRole>("accountant");
  const [active, setActive] = useState(true);
  const [createdLogin, setCreatedLogin] = useState<{ email: string; password: string } | null>(null);
  const [message, setMessage] = useState(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [passwordUser, setPasswordUser] = useState<BusinessUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const createDirect = () => {
    setCreatedLogin(null);
    startTransition(async () => {
      const result = await createBusinessUserDirect({ email, displayName, password, role, active });
      if (!result.success) {
        setMessage(result.message ?? "Create failed.");
        return;
      }
      setMessage("User created. Share the email and password with the user.");
      setCreatedLogin({ email, password });
      window.location.reload();
    });
  };

  const saveOnly = () => {
    startTransition(async () => {
      const result = await saveBusinessUser({ email, displayName, role, active });
      setMessage(result.success ? result.message ?? "Saved." : result.message ?? "Save failed.");
      if (result.success) window.location.reload();
    });
  };

  const edit = (user: BusinessUser) => {
    setEmail(user.email);
    setDisplayName(user.displayName ?? "");
    setPassword("");
    setRole(user.role);
    setActive(user.active);
    setCreatedLogin(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePermissions = async (user: BusinessUser) => {
    if (expandedUserId === user.id) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(user.id);
    setPermissionsLoading(true);
    const result = await getUserPermissions(user.id);
    setPermissionsLoading(false);
    if (!result.success) {
      setMessage(result.message ?? "Could not load permissions.");
      setPermissions([]);
      return;
    }
    setPermissions(result.permissions);
  };

  const updatePermission = (moduleKey: string, field: "view" | "edit", checked: boolean) => {
    setPermissions((current) =>
      current.map((item) => {
        if (item.moduleKey !== moduleKey) return item;
        if (field === "edit") {
          return { ...item, canEdit: checked, canView: checked ? true : item.canView };
        }
        if (item.canEdit) return item;
        return { ...item, canView: checked };
      }),
    );
  };

  const savePermissions = async () => {
    if (!expandedUserId) return;
    setPermissionsSaving(true);
    const result = await saveUserPermissions({ businessUserId: expandedUserId, permissions });
    setPermissionsSaving(false);
    setMessage(result.success ? "Permissions saved." : result.message ?? "Could not save permissions.");
  };

  const changePassword = async () => {
    if (!passwordUser) return;
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ ok: false, text: "Password confirmation does not match." });
      return;
    }
    setPasswordPending(true);
    try {
      const result = await resetBusinessUserPassword({
        businessUserId: passwordUser.id,
        newPassword,
      });
      const text = result.message ?? (result.success ? "Password updated successfully." : "Password update failed.");
      setPasswordMessage({ ok: result.success, text });
      setMessage(text);
      if (result.success) {
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Password update failed.";
      setPasswordMessage({ ok: false, text });
      setMessage(text);
    } finally {
      setPasswordPending(false);
    }
  };

  const inputClass = "mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-500">Access</p>
        <h1 className="mt-2 text-3xl font-black text-[color:var(--admin-text)]">Users</h1>
        <p className="mt-2 text-sm text-[color:var(--admin-muted)]">Create users, manage View/Edit permissions, and reset passwords from the business owner account.</p>
      </div>

      {message && <div className="rounded-2xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm text-[color:var(--admin-text)]">{message}</div>}

      {createdLogin && (
        <Card className="p-5">
          <h2 className="text-lg font-black text-[color:var(--admin-text)]">Login created</h2>
          <p className="mt-2 text-sm text-[color:var(--admin-muted)]">Email: {createdLogin.email}</p>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">Password: {createdLogin.password}</p>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-xl font-black text-[color:var(--admin-text)]">Create or update user</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm text-[color:var(--admin-muted)]">Email<input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="accountant@example.com" /></label>
          <label className="text-sm text-[color:var(--admin-muted)]">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Accountant" /></label>
          <label className="text-sm text-[color:var(--admin-muted)]">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="minimum 6 characters" /></label>
          <label className="text-sm text-[color:var(--admin-muted)]">Role<select value={role} onChange={(e) => setRole(e.target.value as BusinessRole)} className={inputClass}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="text-sm text-[color:var(--admin-muted)]">Status<select value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={createDirect} disabled={isPending || !email || password.length < 6}><UserPlus className="h-4 w-4" />{isPending ? "Working..." : "Create user"}</Button>
          <Button variant="secondary" onClick={saveOnly} disabled={isPending || !email}><Save className="h-4 w-4" />Save user</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black text-[color:var(--admin-text)]">Current users</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[color:var(--admin-border)]">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-black/10 text-[color:var(--admin-muted)]"><tr><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Auth</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[color:var(--admin-border)]">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4"><p className="font-bold text-[color:var(--admin-text)]">{user.displayName || "Unnamed"}</p><p className="text-xs text-[color:var(--admin-muted)]">{user.email}</p></td>
                  <td className="px-4 py-4 text-[color:var(--admin-text)]">{user.role.replace("_", " ")}</td>
                  <td className="px-4 py-4 text-[color:var(--admin-text)]">{user.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4 text-[color:var(--admin-muted)]">{user.authUserId ? "Linked" : "Not linked"}</td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => edit(user)} className="rounded-xl border border-[color:var(--admin-border)] px-3 py-2 text-xs font-semibold text-[color:var(--admin-text)]">Edit</button><button type="button" onClick={() => togglePermissions(user)} className="rounded-xl bg-amber-200 px-3 py-2 text-xs font-bold text-black"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Access</button><button type="button" onClick={() => { setPasswordUser(user); setNewPassword(""); setConfirmPassword(""); setPasswordMessage(null); }} className="rounded-xl border border-[color:var(--admin-border)] px-3 py-2 text-xs font-semibold text-[color:var(--admin-text)]"><KeyRound className="mr-1 inline h-3.5 w-3.5" />Password</button></div></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[color:var(--admin-muted)]">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {expandedUserId && (
          <div className="mt-5 rounded-3xl border border-[color:var(--admin-border)] p-5">
            {permissionsLoading ? <p className="text-sm text-[color:var(--admin-muted)]">Loading permissions...</p> : (
              <>
                <div className="overflow-x-auto"><table className="min-w-[620px] w-full text-sm"><thead><tr className="text-[color:var(--admin-muted)]"><th className="px-3 py-2 text-left">Section</th><th className="px-3 py-2">View</th><th className="px-3 py-2">Edit</th></tr></thead><tbody className="divide-y divide-[color:var(--admin-border)]">{permissions.map((permission) => <tr key={permission.moduleKey}><td className="px-3 py-3 text-[color:var(--admin-text)]">{permissionLabels[permission.moduleKey] ?? permission.moduleKey}</td><td className="px-3 py-3 text-center"><input type="checkbox" checked={permission.canView} disabled={permission.canEdit} onChange={(e) => updatePermission(permission.moduleKey, "view", e.target.checked)} /></td><td className="px-3 py-3 text-center"><input type="checkbox" checked={permission.canEdit} onChange={(e) => updatePermission(permission.moduleKey, "edit", e.target.checked)} /></td></tr>)}</tbody></table></div>
                <div className="mt-4"><Button onClick={savePermissions} disabled={permissionsSaving}>{permissionsSaving ? "Saving..." : "Save permissions"}</Button></div>
              </>
            )}
          </div>
        )}
      </Card>

      {passwordUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setPasswordUser(null)}>
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPasswordUser(null)} className="absolute right-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-black text-slate-900">Change Password</h2>
            <p className="mt-2 text-sm text-slate-500">{passwordUser.displayName || passwordUser.email}</p>
            {passwordMessage && (
              <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${passwordMessage.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {passwordMessage.text}
              </div>
            )}
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">New password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none" /></label>
              <label className="block text-sm font-semibold text-slate-700">Confirm password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setPasswordUser(null)}>Cancel</Button><Button onClick={changePassword} disabled={passwordPending}>{passwordPending ? "Updating..." : "Update Password"}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
