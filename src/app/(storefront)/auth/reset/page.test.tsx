import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "./page";

const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

beforeEach(() => {
  mockResetPasswordForEmail.mockClear();
});

describe("ResetPasswordPage", () => {
  it("이메일 필드와 제출 버튼을 렌더한다", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("textbox", { name: /이메일/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /재설정 링크/ })).toBeInTheDocument();
  });

  it("제출 시 resetPasswordForEmail을 올바른 인자로 호출한다", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByRole("textbox", { name: /이메일/ }), "test@example.com");
    await userEvent.click(screen.getByRole("button", { name: /재설정 링크/ }));
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("/auth/callback?next=/auth/reset/confirm") }),
      );
    });
  });

  it("성공 시 '메일을 확인해 주세요' 안내 메시지를 표시한다", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByRole("textbox", { name: /이메일/ }), "test@example.com");
    await userEvent.click(screen.getByRole("button", { name: /재설정 링크/ }));
    expect(await screen.findByText(/메일을 확인해 주세요/)).toBeInTheDocument();
  });

  it("에러 시 에러 메시지를 표시한다", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: "User not found" } });
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByRole("textbox", { name: /이메일/ }), "bad@example.com");
    await userEvent.click(screen.getByRole("button", { name: /재설정 링크/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("User not found");
  });
});
