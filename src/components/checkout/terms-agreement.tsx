"use client";
import { useState, useCallback, useEffect } from "react";

export type TermsState = {
  purchase: boolean;   // 필수: 구매조건 확인 및 결제진행 동의
  privacy: boolean;    // 필수: 개인정보 수집·이용 동의
  marketing: boolean;  // 선택: 마케팅 정보 수신
};

export function allRequiredAgreed(state: TermsState): boolean {
  return state.purchase && state.privacy;
}

const REQUIRED_TERMS: { key: keyof TermsState; label: string }[] = [
  { key: "purchase", label: "[필수] 구매조건 확인 및 결제진행 동의" },
  { key: "privacy", label: "[필수] 개인정보 수집·이용 동의" },
];

const OPTIONAL_TERMS: { key: keyof TermsState; label: string }[] = [
  { key: "marketing", label: "[선택] 마케팅 정보 수신 동의" },
];

const ALL_KEYS: (keyof TermsState)[] = ["purchase", "privacy", "marketing"];

export function TermsAgreement({
  onRequiredChange,
}: {
  onRequiredChange?: (agreed: boolean) => void;
}) {
  const [state, setState] = useState<TermsState>({
    purchase: false,
    privacy: false,
    marketing: false,
  });

  const isAll = ALL_KEYS.every((k) => state[k]);

  const toggle = useCallback((key: keyof TermsState) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleAll = useCallback(() => {
    const next = !isAll;
    setState({ purchase: next, privacy: next, marketing: next });
  }, [isAll]);

  useEffect(() => {
    onRequiredChange?.(allRequiredAgreed(state));
  }, [state, onRequiredChange]);

  return (
    <div className="space-y-2 rounded-lg border border-stone-200 p-4">
      {/* 전체 동의 */}
      <label className="flex items-center gap-2 font-semibold text-sm text-ng-charcoal">
        <input
          type="checkbox"
          checked={isAll}
          onChange={toggleAll}
          className="accent-ng-cobalt"
          aria-label="전체 동의"
        />
        전체 동의
      </label>

      <hr className="border-stone-200" />

      {/* 필수 항목 */}
      {REQUIRED_TERMS.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={state[key]}
            onChange={() => toggle(key)}
            className="accent-ng-cobalt"
          />
          {label}
        </label>
      ))}

      {/* 선택 항목 */}
      {OPTIONAL_TERMS.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 text-sm text-stone-500">
          <input
            type="checkbox"
            checked={state[key]}
            onChange={() => toggle(key)}
            className="accent-ng-cobalt"
          />
          {label}
        </label>
      ))}
    </div>
  );
}
