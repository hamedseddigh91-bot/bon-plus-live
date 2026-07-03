import type { Metadata } from "next"
import { LoginExperience } from "@/features/auth/login-experience"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Sign In · Cafe Retention",
  description:
    "Sign in to the Cafe Retention coffee operations platform to manage feedback, recovery, finance, and daily operations.",
}

export default function LoginPage() {
  return <LoginExperience />
}
