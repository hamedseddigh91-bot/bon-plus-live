"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Save, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import {
  type BusinessUser,
  type UsersState,
  createBusinessUserDirect,
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
  system: "System Status",
  settings_general: "Settings · General",
  settings_feedback: "Settings · Feedback",
  settings_users: "Settings · Users",
  settings_whatsapp: "Settings · WhatsApp Messages",
};

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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  const createDirect = () => {
    setCreatedLogin(null);
    startTransition(async () => {
      const result = await createBusinessUserDirect({ email, displayName, password, role, active });
      if (!result.success) { setMessage(result.message ?? "Create failed."); return; }
      setMessage("User created. Share the email and password with the user.");
      setCreatedLogin({ email, password });
      const now = new Date().toISOString();
      setUsers((current) => {
        const existing = current.find((item) => item.email.toLowerCase() === email.toLowerCase());
        if (existing) return current.map((item) => item.id === existing.id ? { ...item, displayName, role, active, authUserId: item.authUserId ?? "linked", updatedAt: now } : item);
        return [{ id: `local-${email}`, businessId: "", authUserId: "linked", email: email.toLowerCase(), displayName, role, active, createdAt: now, updatedAt: now }, ...current];
      });
      setEmail(""); setDisplayName(""); setPassword(""); setRole("accountant"); setActive(true);
    });
  };

  const saveOnly = () => {
    startTransition(async () => {
      const result = await saveBusinessUser({ email, displayName, role, active });
      setMessage(result.success ? (result.message ?? "Saved.") : (result.message ?? "Save failed."));
    });
  };

  const edit = (user: BusinessUser) => {
    setEmail(user.email); setDisplayName(user.displayName ?? ""); setPassword(""); setRole(user.role); setActive(user.active); setCreatedLogin(null);
  };

  const togglePermissions = async (user: BusinessUser) => {
    if (expandedUserId === user.id) { setExpandedUserId(null); return; }
    setExpandedUserId(user.id);
    setPermissionsLoading(true);
    const result = await getUserPermissions(user.id);
    setPermissionsLoading(false);
    if (!result.success) { setMessage(result.message ?? "Could not load permissions."); setPermissions([]); return; }
    setPermissions(result.permissions);
  };

  const updatePermission = (moduleKey: string, field: "view" | "edit", checked: boolean) => {
    setPermissions((current) => current.map((item) => {
      if (item.moduleKey !== moduleKey) return item;
      if (field === "edit") {
        return { ...item, canEdit: checked, canView: checked ? true : item.canView };
      }
      if (item.canEdit) return item;
      return { ...item, canView: checked };
    }));
  };

  const savePermissions = async () => {
    if (!expandedUserId) return;
    setPermissionsSaving(true);
    const result = await saveUserPermissions({ businessUserId: expandedUserId, permissions });
    setPermissionsSaving(false);
    setMessage(result.success ? "Permissions saved." : (result.message ?? "Could not save permissions."));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] p-6">
        <div className="mb-3 flex items-center gap-2 text-amber-500"><UserCog className="h-5 w-5" /><span className="text-sm font-medium uppercase tracking-[0.25em]">Access</span></div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[color:var(--admin-text)]">Users</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--admin-muted)]">Create users and manage each user&apos;s View and Edit permissions directly.</p>
      </section>

      {message && <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-[color:var(--admin-text)]">{message}</div>}
      {createdLogin && <Card className="p-5"><h2 className="text-lg font-semibold text-[color:var(--admin-text)]">Login created</h2><div className="mt-4 grid gap-3 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] p-4 text-sm text-[color:var(--admin-text)] md:grid-cols-2"><p><span className="text-[color:var(--admin-muted)]">Email:</span> {createdLogin.email}</p><p><span className="text-[color:var(--admin-muted)]">Password:</span> {createdLogin.password}</p></div></Card>}

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-[color:var(--admin-text)]">Create or update user</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_220px_130px_auto_auto]">
          <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">Email</span><input value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none" placeholder="accountant@example.com" /></label>
          <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">Display name</span><input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className="mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none" placeholder="Accountant" /></label>
          <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">Password</span><input type="text" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none" placeholder="minimum 6 characters" /></label>
          <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">Role</span><select value={role} onChange={(e)=>setRole(e.target.value as BusinessRole)} className="mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none">{roles.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">Status</span><select value={active?"active":"inactive"} onChange={(e)=>setActive(e.target.value==="active")} className="mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <div className="flex items-end"><Button onClick={createDirect} disabled={isPending || !email.trim() || password.length<6}><UserPlus className="h-4 w-4" />{isPending?"Working...":"Create user"}</Button></div>
          <div className="flex items-end"><Button variant="secondary" onClick={saveOnly} disabled={isPending || !email.trim()}><Save className="h-4 w-4" />Save user</Button></div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-[color:var(--admin-text)]">Current users</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-[color:var(--admin-border)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[color:var(--admin-soft)] text-[color:var(--admin-muted)]"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Auth</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[color:var(--admin-border)]">
              {users.length===0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[color:var(--admin-muted)]">No users yet.</td></tr>}
              {users.map((user)=><>
                <tr key={user.id} className="text-[color:var(--admin-text)]">
                  <td className="px-4 py-4"><p className="font-semibold">{user.displayName||"Unnamed"}</p><p className="text-xs text-[color:var(--admin-muted)]">{user.email}</p></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]">{user.role.replace("_"," ")}</span></td>
                  <td className="px-4 py-4">{user.active?"Active":"Inactive"}</td><td className="px-4 py-4">{user.authUserId?"Linked":"Not linked"}</td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={()=>edit(user)} className="rounded-xl border border-[color:var(--admin-border)] px-3 py-2 text-xs font-semibold hover:bg-[color:var(--admin-soft)]">Edit</button><button type="button" onClick={()=>togglePermissions(user)} className="flex items-center gap-2 rounded-xl bg-amber-200 px-3 py-2 text-xs font-bold text-black"><ShieldCheck className="h-4 w-4" />Access {expandedUserId===user.id?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}</button></div></td>
                </tr>
                {expandedUserId===user.id && <tr key={`${user.id}-permissions`}><td colSpan={5} className="bg-[color:var(--admin-soft)] p-4 sm:p-6">
                  {permissionsLoading ? <p className="text-sm text-[color:var(--admin-muted)]">Loading permissions...</p> : <div className="space-y-4">
                    <div className="overflow-x-auto rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)]"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-[color:var(--admin-border)] text-[color:var(--admin-muted)]"><th className="px-4 py-3 text-left">Section</th><th className="w-28 px-4 py-3 text-center">View</th><th className="w-28 px-4 py-3 text-center">Edit</th></tr></thead><tbody className="divide-y divide-[color:var(--admin-border)]">{permissions.map((permission)=><tr key={permission.moduleKey}><td className="px-4 py-3 font-semibold text-[color:var(--admin-text)]">{permissionLabels[permission.moduleKey]??permission.moduleKey}</td><td className="px-4 py-3 text-center"><input type="checkbox" className="h-5 w-5 accent-amber-400 disabled:cursor-not-allowed disabled:opacity-60" checked={permission.canView} disabled={permission.canEdit} onChange={(e)=>updatePermission(permission.moduleKey,"view",e.target.checked)} /></td><td className="px-4 py-3 text-center"><input type="checkbox" className="h-5 w-5 accent-amber-400" checked={permission.canEdit} onChange={(e)=>updatePermission(permission.moduleKey,"edit",e.target.checked)} /></td></tr>)}</tbody></table></div>
                    <div className="flex justify-end"><Button onClick={savePermissions} disabled={permissionsSaving}><Save className="h-4 w-4" />{permissionsSaving?"Saving...":"Save permissions"}</Button></div>
                  </div>}
                </td></tr>}
              </>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
