// 회원가입 필수 동의 상태 검증 (순수).
export type ConsentState = {
  terms: boolean;
  privacy: boolean;
};

/** 필수 약관이 모두 동의됐으면 true */
export function signupAgreed(state: ConsentState): boolean {
  return state.terms && state.privacy;
}
