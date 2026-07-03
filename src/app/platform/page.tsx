import { getPlatformState } from "@/app/platform/actions";
import { PlatformDashboard } from "@/features/platform/platform-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlatformPage() {
  const initialState = await getPlatformState();

  return <PlatformDashboard initialState={initialState} />;
}
