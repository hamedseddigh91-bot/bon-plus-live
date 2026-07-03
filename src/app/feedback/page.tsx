import { redirect } from "next/navigation";
import { getDefaultBusinessSlug } from "@/lib/business-context";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ business?: string }>;
}) {
  const params = await searchParams;
  const businessSlug = params?.business || getDefaultBusinessSlug();

  redirect(`/feedback/${businessSlug}`);
}
