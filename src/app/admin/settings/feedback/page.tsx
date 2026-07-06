import Link from "next/link";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { SettingsShell } from "@/features/admin/settings/settings-shell";
import { FeedbackSettingsManager } from "@/features/admin/settings/feedback-settings-manager";
import { getFeedbackSettings } from "./actions";
export const dynamic="force-dynamic";
export default async function Page(){const state=await getFeedbackSettings();return <AdminShellServer requiredModule="settings_feedback"><SettingsShell><div className="mb-4 flex justify-end"><Link href="/admin/settings/feedback/questions" className="rounded-xl bg-amber-200 px-4 py-2 text-sm font-bold text-black">Feedback Questions</Link></div><FeedbackSettingsManager initialState={state}/></SettingsShell></AdminShellServer>}
