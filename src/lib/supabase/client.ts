import { createBrowserClient } from "@supabase/ssr";

// 브라우저 번들에서는 process.env 객체가 비어 있고, Next.js는 `process.env.NEXT_PUBLIC_*`
// 형태의 정적 접근만 빌드 타임에 인라인한다. 따라서 여기서는 @/lib/env 의 동적 Proxy를
// 쓰지 않고 NEXT_PUBLIC 변수를 직접 참조해야 한다. (서버용 server.ts/middleware.ts 는 Proxy 사용 OK)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
