import { getAdminQuestions } from "@/app/admin/questions/actions";
import { AdminShellServer } from "@/components/layout/admin-shell-server";
import { QuestionsManager } from "@/features/admin/questions/questions-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initialState = await getAdminQuestions();

  return (
    <AdminShellServer>
      <QuestionsManager initialState={initialState} />
    </AdminShellServer>
  );
}
