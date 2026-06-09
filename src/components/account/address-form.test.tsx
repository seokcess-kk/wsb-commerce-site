import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("기본 배송지 체크박스를 선택하면 onSubmit이 isDefault: true로 호출된다", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <AddressForm
        onSubmit={onSubmit}
        onCancel={noop}
        initial={{
          recipient: "김철수",
          phone: "010-1234-5678",
          zipcode: "54321",
          address1: "서울시 중구 을지로 1",
          isDefault: false,
        }}
      />,
    );

    // Check the isDefault checkbox
    const checkbox = screen.getByRole("checkbox", { name: /기본 배송지/ });
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /저장/ });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      );
    });
  });
});
