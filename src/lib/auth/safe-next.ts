// 로그인 후 복귀 경로(`next`) 검증. 동일 출처 경로만 허용해 오픈 리다이렉트를 막는다.
// "/foo"는 허용, "//evil.com"·"https://.."는 거부하고 기본값(/account)으로 폴백한다.
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}
