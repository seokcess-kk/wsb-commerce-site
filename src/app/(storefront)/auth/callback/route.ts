import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// `next`는 동일 출처 경로만 허용 (오픈 리다이렉트 방지): "/foo"는 허용, "//evil.com"·"https://.."는 거부
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

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
