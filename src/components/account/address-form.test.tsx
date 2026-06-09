import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressForm } from "./address-form";

// PostcodeSearch uses Daum popup — stub it at module level
vi.mock("@/components/checkout/postcode-search", () => ({
  PostcodeSearch: ({ onComplete }: { onComplete: (r: { zipcode: string; address1: string }) => void }) => (
    <button
      type="button"
      onClick={() => onComplete({ zipcode: "12345", address1: "서울시 강남구 테헤란로 1" })}
    >
      주소 검색
    </button>
  ),
}));

const noop = vi.fn();

describe("AddressForm", () => {
  it("필수 필드가 렌더링된다", () => {
    render(<AddressForm onSubmit={noop} onCancel={noop} />);
    expect(screen.getByLabelText(/수령인/)).toBeInTheDocument();
    expect(screen.getByLabelText(/연락처/)).toBeInTheDocument();
    expect(screen.getByLabelText(/우편번호/)).toBeInTheDocument();
    expect(screen.getByLabelText(/기본 주소/)).toBeInTheDocument();
    expect(screen.getByLabelText(/상세 주소/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "주소 검색" })).toBeInTheDocument();
  });

  it("PostcodeSearch 완료 시 우편번호·기본주소가 채워진다", async () => {
    render(<AddressForm onSubmit={noop} onCancel={noop} />);
    await userEvent.click(screen.getByRole("button", { name: "주소 검색" }));
    expect(screen.getByLabelText(/우편번호/)).toHaveValue("12345");
    expect(screen.getByLabelText(/기본 주소/)).toHaveValue("서울시 강남구 테헤란로 1");
  });

  it("초기값이 있으면 필드가 pre-filled된다", () => {
    render(
      <AddressForm
        onSubmit={noop}
        onCancel={noop}
        initial={{
          label: "집",
          recipient: "홍길동",
          phone: "010-0000-0000",
          zipcode: "99999",
          address1: "부산시 해운대구",
          address2: "101호",
          isDefault: true,
        }}
      />,
    );
    expect(screen.getByLabelText(/수령인/)).toHaveValue("홍길동");
    expect(screen.getByLabelText(/우편번호/)).toHaveValue("99999");
  });
});
