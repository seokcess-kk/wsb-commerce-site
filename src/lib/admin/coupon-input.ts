export type CouponInputForValidation = {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type ValidationResult = { ok: true } | { ok: false; error: string };

const CODE_PATTERN = /^[A-Z0-9-]+$/;

// 쿠폰 코드 정규화: 트림 + 대문자(저장·조회 모두 대문자 기준 — findCouponByCode 와 일치).
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

// 운영자 쿠폰 입력 검증(순수). 저장 전 createCoupon/updateCoupon 에서 호출.
export function validateCouponInput(input: CouponInputForValidation): ValidationResult {
  const code = normalizeCouponCode(input.code);
  if (!code) return { ok: false, error: "쿠폰 코드를 입력하세요." };
  if (!CODE_PATTERN.test(code)) {
    return { ok: false, error: "쿠폰 코드는 영문 대문자·숫자·하이픈만 사용할 수 있습니다." };
  }
  if (!input.name.trim()) return { ok: false, error: "쿠폰 이름을 입력하세요." };

  if (input.discountType !== "amount" && input.discountType !== "rate") {
    return { ok: false, error: "할인 유형이 올바르지 않습니다." };
  }
  if (input.discountType === "rate") {
    if (!Number.isFinite(input.discountValue) || input.discountValue < 1 || input.discountValue > 100) {
      return { ok: false, error: "정률 할인은 1~100% 사이여야 합니다." };
    }
  } else {
    if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
      return { ok: false, error: "정액 할인은 0원보다 커야 합니다." };
    }
  }

  if (!Number.isFinite(input.minSubtotal) || input.minSubtotal < 0) {
    return { ok: false, error: "최소 주문금액은 0 이상이어야 합니다." };
  }
  if (input.maxDiscount != null && (!Number.isFinite(input.maxDiscount) || input.maxDiscount <= 0)) {
    return { ok: false, error: "최대 할인금액은 0원보다 커야 합니다." };
  }

  if (input.startsAt && input.endsAt && input.startsAt.getTime() > input.endsAt.getTime()) {
    return { ok: false, error: "시작일은 종료일보다 앞서야 합니다." };
  }

  return { ok: true };
}
