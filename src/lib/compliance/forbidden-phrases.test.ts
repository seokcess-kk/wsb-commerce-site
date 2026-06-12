import { describe, it, expect } from "vitest";
import { findForbiddenPhrases, isCompliantCopy, forbiddenPhraseMessage } from "./forbidden-phrases";

describe("forbidden-phrases", () => {
  it("의약품·질병명·치료 단정 표현을 잡아낸다", () => {
    expect(findForbiddenPhrases("수면제 대신 먹어요")).toContain("수면제");
    expect(findForbiddenPhrases("구내염에 직방이에요")).toEqual(expect.arrayContaining(["구내염", "직방"]));
    expect(isCompliantCopy("불면증이 완치됐어요")).toBe(false);
  });

  it("일반적인 사용 경험 표현은 통과한다", () => {
    expect(findForbiddenPhrases("맛이 깔끔하고 스틱이라 휴대가 편해요")).toEqual([]);
    expect(isCompliantCopy("아침 루틴으로 매일 챙기고 있어요")).toBe(true);
    expect(forbiddenPhraseMessage("자몽 맛이 좋아요")).toBeNull();
  });

  it("금칙어가 있으면 안내 메시지를 반환한다", () => {
    expect(forbiddenPhraseMessage("처방받은 약 대신 먹어요")).toMatch(/사용할 수 없는 표현/);
  });
});
