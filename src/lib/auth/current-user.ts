import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  // getClaims(): 비대칭 JWT 서명키면 로컬 검증(네트워크 0), 대칭키면 서버 검증으로 폴백 — 모두 안전.
  // 미들웨어가 이미 세션을 갱신했으므로 여기서는 검증만 한다(요청당 두 번째 Auth 왕복 제거).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  return { id: claims.sub, email: claims.email ?? null };
}
