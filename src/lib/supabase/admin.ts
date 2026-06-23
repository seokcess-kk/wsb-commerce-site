import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

// 서버 전용 Supabase 클라이언트(service_role — RLS 우회). Storage 업로드 등 어드민 작업에만 사용한다.
// ⚠ service_role 키는 전체 권한을 가지므로 절대 클라이언트 번들에 노출되면 안 된다(서버 코드에서만 호출).
export function getStorageClient() {
  const env = getEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. 이미지 업로드를 사용하려면 .env.local 에 추가하세요.",
    );
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
