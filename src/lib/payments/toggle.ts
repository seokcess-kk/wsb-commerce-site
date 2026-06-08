// 결제 레이어 ON/OFF (스펙 §0 컨틴전시 — PG 승인 지연 시 소프트오픈).
// 기본은 ON. 환경변수를 명시적으로 "false"로 둘 때만 OFF.
export function isPaymentsEnabled(flag: string | null | undefined): boolean {
  return flag?.trim().toLowerCase() !== "false";
}
