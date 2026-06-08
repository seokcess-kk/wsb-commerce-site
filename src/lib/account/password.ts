// 비밀번호 변경 입력 검증(순수). 통과하면 null, 실패하면 사용자용 메시지 반환.
export function validatePasswordChange(password: string, confirm: string): string | null {
  if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (password !== confirm) return "비밀번호가 일치하지 않습니다.";
  return null;
}
