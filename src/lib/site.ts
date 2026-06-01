import { getEnv } from "@/lib/env";
export function getSiteUrl(): string {
  return (getEnv().NEXT_PUBLIC_SITE_URL ?? "https://wsb-commerce-site.vercel.app").replace(/\/$/, "");
}
