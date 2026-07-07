import { cookies } from "next/headers";

export const BUSINESS_COOKIE_NAME = "current_business_slug";

export function getDefaultBusinessSlug() {
  return process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG ?? "bon-plus-cafe";
}

export async function getCurrentBusinessSlug() {
  const cookieStore = await cookies();
  return cookieStore.get(BUSINESS_COOKIE_NAME)?.value || getDefaultBusinessSlug();
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
