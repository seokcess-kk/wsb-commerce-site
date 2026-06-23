import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // 세션 쿠키 갱신 + 인증 검증. getClaims() 는 비대칭 JWT 서명키 사용 시 JWT 를 로컬(WebCrypto)로
  // 검증해 요청당 Auth 서버 왕복을 없앤다(JWKS 는 캐시). 대칭키(HS256)면 getUser 처럼 서버 검증으로
  // 폴백하므로 어떤 경우에도 안전하다. 만료 임박 시 내부적으로 세션을 갱신하며 쿠키를 재설정한다.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|api/webhooks|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
