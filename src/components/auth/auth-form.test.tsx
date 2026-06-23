import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";

const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// next/link mock
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

beforeEach(() => {
  mockSignUp.mockClear();
  mockSignIn.mockClear();
  mockPush.mockClear();
  mockRefresh.mockClear();
});

describe("AuthForm — LOGIN mode", () => {
  it("이메일·비밀번호 입력 필드와 로그인 버튼을 렌더한다", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByPlaceholderText("이메일")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("로그인 모드에서는 약관 체크박스가 없다", () => {
    render(<AuthForm mode="login" />);
    expect(screen.queryByLabelText(/이용약관/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/개인정보/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/마케팅/)).not.toBeInTheDocument();
  });

  it("로그인 버튼이 기본 활성화 상태다", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByRole("button", { name: "로그인" })).not.toBeDisabled();
  });
});

describe("AuthForm — SIGNUP mode", () => {
  it("약관 동의 체크박스 3개를 렌더한다", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByLabelText(/이용약관 동의/)).toBeInTheDocument();
    expect(screen.getByLabelText(/개인정보 수집·이용 동의/)).toBeInTheDocument();
    expect(screen.getByLabelText(/마케팅 정보 수신 동의/)).toBeInTheDocument();
  });

  it("필수 약관 미동의 시 회원가입 버튼이 비활성화된다", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByRole("button", { name: "회원가입" })).toBeDisabled();
  });

  it("이용약관만 동의해도 버튼이 비활성화 상태다", async () => {
    render(<AuthForm mode="signup" />);
    await userEvent.click(screen.getByLabelText(/이용약관 동의/));
    expect(screen.getByRole("button", { name: "회원가입" })).toBeDisabled();
  });

  it("두 필수 약관 동의 시 버튼이 활성화된다", async () => {
    render(<AuthForm mode="signup" />);
    await userEvent.click(screen.getByLabelText(/이용약관 동의/));
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
    expect(screen.getByRole("button", { name: "회원가입" })).not.toBeDisabled();
  });

  it("필수 동의 후 제출 시 signUp이 marketing_consent=false, 필수 동의 booleans와 함께 호출된다", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" }, user: { id: "u1" } }, error: null });
    render(<AuthForm mode="signup" />);
    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.click(screen.getByLabelText(/이용약관 동의/));
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          password: "password123",
          options: expect.objectContaining({
            data: { marketing_consent: false, terms_agreed: true, privacy_agreed: true },
          }),
        }),
      );
    });
  });

  it("마케팅 동의 체크 시 signUp이 marketing_consent=true로 호출된다", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" }, user: { id: "u1" } }, error: null });
    render(<AuthForm mode="signup" />);
    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.click(screen.getByLabelText(/이용약관 동의/));
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
    await userEvent.click(screen.getByLabelText(/마케팅 정보 수신 동의/));
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { marketing_consent: true, terms_agreed: true, privacy_agreed: true },
          }),
        }),
      );
    });
  });

  it("이메일 확인 필요(세션 없음) 시 안내 메시지를 표시하고 리다이렉트하지 않는다", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: { id: "u1" } }, error: null });
    render(<AuthForm mode="signup" />);
    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "password123");
    await userEvent.click(screen.getByLabelText(/이용약관 동의/));
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));
    expect(await screen.findByText(/확인 메일을 보냈습니다/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("회원가입 비밀번호가 8자 미만이면 에러를 표시하고 signUp을 호출하지 않는다", async () => {
    render(<AuthForm mode="signup" />);
    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "short7!");
    await userEvent.click(screen.getByLabelText(/이용약관 동의/));
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/8자 이상/);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("에러 시 role=alert인 에러 메시지를 표시한다", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByPlaceholderText("이메일"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("비밀번호"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
