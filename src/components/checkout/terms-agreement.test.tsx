import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TermsAgreement, allRequiredAgreed, type TermsState } from "./terms-agreement";

// ── Pure helper tests ─────────────────────────────────────────────────────────

describe("allRequiredAgreed", () => {
  it("구매조건·개인정보 모두 동의 시 true", () => {
    expect(allRequiredAgreed({ purchase: true, privacy: true, marketing: false })).toBe(true);
  });

  it("마케팅만 동의해도 필수 미동의면 false", () => {
    expect(allRequiredAgreed({ purchase: false, privacy: false, marketing: true })).toBe(false);
  });

  it("구매조건만 동의하면 false", () => {
    expect(allRequiredAgreed({ purchase: true, privacy: false, marketing: false })).toBe(false);
  });

  it("개인정보만 동의하면 false", () => {
    expect(allRequiredAgreed({ purchase: false, privacy: true, marketing: true })).toBe(false);
  });

  it("모두 동의해도 true", () => {
    const state: TermsState = { purchase: true, privacy: true, marketing: true };
    expect(allRequiredAgreed(state)).toBe(true);
  });
});

// ── Component (RTL) tests ─────────────────────────────────────────────────────

describe("TermsAgreement component", () => {
  it("전체 동의, 개별 항목 체크박스 모두 렌더링된다", () => {
    render(<TermsAgreement />);
    expect(screen.getByLabelText("전체 동의")).toBeInTheDocument();
    expect(screen.getByText(/구매조건 확인 및 결제진행 동의/)).toBeInTheDocument();
    expect(screen.getByText(/개인정보 수집·이용 동의/)).toBeInTheDocument();
    expect(screen.getByText(/마케팅 정보 수신 동의/)).toBeInTheDocument();
  });

  it("초기 상태: 전체 동의 미체크, 필수 미체크", () => {
    render(<TermsAgreement />);
    const allCheckbox = screen.getByLabelText("전체 동의") as HTMLInputElement;
    expect(allCheckbox.checked).toBe(false);
  });

  it("전체 동의 클릭 시 모든 항목이 체크된다", () => {
    render(<TermsAgreement />);
    const allCheckbox = screen.getByLabelText("전체 동의");
    fireEvent.click(allCheckbox);

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    checkboxes.forEach((cb) => expect(cb.checked).toBe(true));
  });

  it("모두 체크 후 전체 동의 클릭 시 모두 해제된다", () => {
    render(<TermsAgreement />);
    const allCheckbox = screen.getByLabelText("전체 동의");
    fireEvent.click(allCheckbox); // 전체 체크
    fireEvent.click(allCheckbox); // 전체 해제

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    checkboxes.forEach((cb) => expect(cb.checked).toBe(false));
  });

  it("onRequiredChange: 필수 항목 모두 체크 시 true 호출", () => {
    const cb = vi.fn();
    render(<TermsAgreement onRequiredChange={cb} />);

    // 구매조건 체크
    fireEvent.click(screen.getByText(/구매조건 확인 및 결제진행 동의/).closest("label")!);
    expect(cb).toHaveBeenLastCalledWith(false); // privacy 아직 미체크

    // 개인정보 체크
    fireEvent.click(screen.getByText(/개인정보 수집·이용 동의/).closest("label")!);
    expect(cb).toHaveBeenLastCalledWith(true);
  });

  it("선택 항목(마케팅)만 체크해도 onRequiredChange는 false", () => {
    const cb = vi.fn();
    render(<TermsAgreement onRequiredChange={cb} />);
    fireEvent.click(screen.getByText(/마케팅 정보 수신 동의/).closest("label")!);
    expect(cb).toHaveBeenLastCalledWith(false);
  });

  it("전체 동의 상태: 개별 항목 하나 해제 시 전체 동의 해제됨", () => {
    render(<TermsAgreement />);
    const allCheckbox = screen.getByLabelText("전체 동의") as HTMLInputElement;
    fireEvent.click(allCheckbox); // 전체 체크
    expect(allCheckbox.checked).toBe(true);

    // 구매조건 개별 해제
    fireEvent.click(screen.getByText(/구매조건 확인 및 결제진행 동의/).closest("label")!);
    expect(allCheckbox.checked).toBe(false);
  });
});
