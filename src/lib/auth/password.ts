// 비밀번호 재설정 입력 검증 (순수). ok=true면 통과, ok=false면 reason에 사용자 메시지.
export type ValidateNewPasswordResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateNewPassword(
  pw: string,
  confirm: string,
): ValidateNewPasswordResult {
  if (pw.length < 8) return { ok: false, reason: "비밀번호는 8자 이상이어야 합니다." };
  if (pw !== confirm) return { ok: false, reason: "비밀번호가 일치하지 않습니다." };
  return { ok: true };
}
