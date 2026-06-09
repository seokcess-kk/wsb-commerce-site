import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressSelector } from "./address-selector";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const mockOnSelect = vi.fn();

const fakeAddresses = [
  {
    id: "addr-1",
    userId: "user-1",
    label: "집",
    recipient: "홍길동",
    phone: "010-1234-5678",
    zipcode: "12345",
    address1: "서울시 강남구 테헤란로 1",
    address2: "101호",
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "addr-2",
    userId: "user-1",
    label: null,
    recipient: "김영희",
    phone: "010-9876-5432",
    zipcode: "54321",
    address1: "부산시 해운대구 해운대로 2",
    address2: null,
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  mockOnSelect.mockClear();
  vi.restoreAllMocks();
});

describe("AddressSelector", () => {
  it("fetch 성공 시 주소 목록을 렌더링한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeAddresses,
    }));

    render(<AddressSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("홍길동")).toBeInTheDocument();
    });
    expect(screen.getByText("김영희")).toBeInTheDocument();
  });

  it("주소를 클릭하면 onSelect가 올바른 CheckoutAddress로 호출된다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeAddresses,
    }));

    render(<AddressSelector onSelect={mockOnSelect} />);

    await waitFor(() => screen.getByText("홍길동"));
    await userEvent.click(screen.getByText("홍길동").closest("button")!);

    expect(mockOnSelect).toHaveBeenCalledWith({
      recipient: "홍길동",
      phone: "010-1234-5678",
      zipcode: "12345",
      address1: "서울시 강남구 테헤란로 1",
      address2: "101호",
    });
  });

  it("fetch 실패 시 저장된 배송지 없음 메시지를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    render(<AddressSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/저장된 배송지 없음/)).toBeInTheDocument();
    });
  });

  it("빈 배열 응답 시 저장된 배송지 없음 메시지를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    render(<AddressSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/저장된 배송지 없음/)).toBeInTheDocument();
    });
  });

  it("401 응답 시 로그인 안내 문구를 표시하고 저장된 배송지 없음 메시지는 없다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    }));

    render(<AddressSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/저장된 배송지를 사용할 수 있어요/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/저장된 배송지 없음/)).not.toBeInTheDocument();
  });
});
