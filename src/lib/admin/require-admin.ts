import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getEnv } from "@/lib/env";
import { isAdminEmail } from "./is-admin-email";

export async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email, getEnv().ADMIN_EMAILS)) redirect("/");
  return user;
}
