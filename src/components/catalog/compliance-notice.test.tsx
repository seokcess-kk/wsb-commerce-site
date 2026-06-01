import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceNotice } from "./compliance-notice";

describe("ComplianceNotice", () => {
  it("심의필 번호와 질병 고지 문구를 렌더한다", () => {
    render(
      <ComplianceNotice
        reviewPhraseNo="제2026-FOCUS-001"
        noticeText="본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다."
        reportNo="제2026-0000000001호"
        functionality="인지능력 개선에 도움"
        intakeNotice="임산부 주의"
      />,
    );
    expect(screen.getByText(/제2026-FOCUS-001/)).toBeInTheDocument();
    expect(screen.getByText(/질병의 예방 및 치료를 위한 것이 아닙니다/)).toBeInTheDocument();
    expect(screen.getByText(/제2026-0000000001호/)).toBeInTheDocument();
  });
});
