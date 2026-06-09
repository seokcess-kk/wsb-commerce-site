import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetConfirmPage from "./page";

const mockUpdateUser = vi.fn();
const mockPush = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockUpdateUser.mockClear();
  mockPush.mockClear();
});

describe("ResetConfirmPage", () => {
  it("새 비밀번호와 확인 입력 필드를 렌더한다", () => {
    render(<ResetConfirmPage />);
    expect(screen.getByLabelText(/새 비밀번호$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/새 비밀번호 확인/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /비밀번호 변경/ })).toBeInTheDocument();
  });

  it("8자 미만이면 클라이언트 에러를 표시한다", async () => {
    render(<ResetConfirmPage />);
    await userEvent.type(screen.getByLabelText(/새 비밀번호$/), "short");
    await userEvent.type(screen.getByLabelText(/새 비밀번호 확인/), "short");
    await userEvent.click(screen.getByRole("button", { name: /비밀번호 변경/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/8자/);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("비밀번호 불일치면 에러를 표시한다", async () => {
    render(<ResetConfirmPage />);
    await userEvent.type(screen.getByLabelText(/새 비밀번호$/), "password123");
    await userEvent.type(screen.getByLabelText(/새 비밀번호 확인/), "different1");
    await userEvent.click(screen.getByRole("button", { name: /비밀번호 변경/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/일치/);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("유효한 비밀번호 제출 시 updateUser가 호출된다", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    render(<ResetConfirmPage />);
    await userEvent.type(screen.getByLabelText(/새 비밀번호$/), "newpassword1");
    await userEvent.type(screen.getByLabelText(/새 비밀번호 확인/), "newpassword1");
    await userEvent.click(screen.getByRole("button", { name: /비밀번호 변경/ }));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword1" });
    });
  });

  it("성공 시 /login 으로 리다이렉트한다", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    render(<ResetConfirmPage />);
    await userEvent.type(screen.getByLabelText(/새 비밀번호$/), "newpassword1");
    await userEvent.type(screen.getByLabelText(/새 비밀번호 확인/), "newpassword1");
    await userEvent.click(screen.getByRole("button", { name: /비밀번호 변경/ }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/login"));
    });
  });

  it("서버 에러 시 에러 메시지를 표시한다", async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: "Invalid session" } });
    render(<ResetConfirmPage />);
    await userEvent.type(screen.getByLabelText(/새 비밀번호$/), "newpassword1");
    await userEvent.type(screen.getByLabelText(/새 비밀번호 확인/), "newpassword1");
    await userEvent.click(screen.getByRole("button", { name: /비밀번호 변경/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid session");
  });
});
