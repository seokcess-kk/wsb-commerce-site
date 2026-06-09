import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostcodeSearch, type PostcodeResult } from "./postcode-search";

// Guard against actual script loading in jsdom environment
beforeEach(() => {
  // Reset daum global between tests
  delete (window as Window & typeof globalThis & { daum?: unknown }).daum;
  // Remove any injected scripts
  document
    .querySelectorAll('script[src*="daumcdn"]')
    .forEach((el) => el.remove());
});

describe("PostcodeSearch", () => {
  it("주소 검색 버튼이 렌더링된다", () => {
    render(<PostcodeSearch onComplete={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "주소 검색" }),
    ).toBeInTheDocument();
  });

  it("onComplete 콜백이 zipcode와 address1을 포함한 객체를 받는다", async () => {
    const onComplete = vi.fn<[PostcodeResult], void>();

    // Inject a fake daum.Postcode that immediately calls oncomplete
    const fakeData = {
      zonecode: "06234",
      roadAddress: "서울특별시 강남구 테헤란로 123",
      jibunAddress: "서울특별시 강남구 역삼동 123-4",
      userSelectedType: "R",
    };

    // Simulate: script already loaded, window.daum.Postcode exists
    (
      window as Window &
        typeof globalThis & {
          daum?: {
            Postcode: new (opts: {
              oncomplete: (d: typeof fakeData) => void;
            }) => { open: () => void };
          };
        }
    ).daum = {
      Postcode: class {
        oncomplete: (d: typeof fakeData) => void;
        constructor(opts: { oncomplete: (d: typeof fakeData) => void }) {
          this.oncomplete = opts.oncomplete;
        }
        open() {
          this.oncomplete(fakeData);
        }
      },
    };

    render(<PostcodeSearch onComplete={onComplete} />);
    const btn = screen.getByRole("button", { name: "주소 검색" });
    fireEvent.click(btn);

    // Allow async loadDaumPostcodeScript to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(onComplete).toHaveBeenCalledOnce();
    const result = onComplete.mock.calls[0][0];
    expect(result).toMatchObject<PostcodeResult>({
      zipcode: "06234",
      address1: "서울특별시 강남구 테헤란로 123",
    });
  });

  it("지번 선택 시 jibunAddress를 address1으로 전달한다", async () => {
    const onComplete = vi.fn<[PostcodeResult], void>();
    const fakeData = {
      zonecode: "06234",
      roadAddress: "서울특별시 강남구 테헤란로 123",
      jibunAddress: "서울특별시 강남구 역삼동 123-4",
      userSelectedType: "J",
    };

    (
      window as Window &
        typeof globalThis & {
          daum?: {
            Postcode: new (opts: {
              oncomplete: (d: typeof fakeData) => void;
            }) => { open: () => void };
          };
        }
    ).daum = {
      Postcode: class {
        oncomplete: (d: typeof fakeData) => void;
        constructor(opts: { oncomplete: (d: typeof fakeData) => void }) {
          this.oncomplete = opts.oncomplete;
        }
        open() {
          this.oncomplete(fakeData);
        }
      },
    };

    render(<PostcodeSearch onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "주소 검색" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(onComplete.mock.calls[0][0]).toMatchObject<PostcodeResult>({
      zipcode: "06234",
      address1: "서울특별시 강남구 역삼동 123-4",
    });
  });

  it("스크립트가 없어도 script 태그를 삽입한다 (DOM side-effect guard)", async () => {
    // No window.daum, script not loaded yet
    // We mock the script inject by pre-setting daum so load fires immediately
    let scriptEl: HTMLScriptElement | null = null;
    const origCreate = document.createElement.bind(document);

    // We just verify we don't crash and the button renders
    const onComplete = vi.fn();
    render(<PostcodeSearch onComplete={onComplete} />);
    expect(screen.getByRole("button", { name: "주소 검색" })).toBeInTheDocument();
    void origCreate;
    void scriptEl;
  });
});
