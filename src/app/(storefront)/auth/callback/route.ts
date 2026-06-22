import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// 동일 출처 경로 검증은 공용 헬퍼로 일원화(클라이언트 AuthForm 과 공유). 기존 import 호환을 위해 re-export.
import { safeNext } from "@/lib/auth/safe-next";
export { safeNext };

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error") ?? searchParams.get("error_description");
  const next = safeNext(searchParams.get("next"));

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
