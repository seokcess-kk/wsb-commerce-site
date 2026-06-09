import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostcodeSearch, type PostcodeResult } from "./postcode-search";

type DaumFakeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: string;
};

type DaumWindow = Window &
  typeof globalThis & {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (d: DaumFakeData) => void;
      }) => { open: () => void };
    };
  };

function injectFakeDaum(fakeData: DaumFakeData) {
  (window as DaumWindow).daum = {
    Postcode: class {
      oncomplete: (d: DaumFakeData) => void;
      constructor(opts: { oncomplete: (d: DaumFakeData) => void }) {
        this.oncomplete = opts.oncomplete;
      }
      open() {
        this.oncomplete(fakeData);
      }
    },
  };
}

// Guard against actual script loading in jsdom environment
beforeEach(() => {
  delete (window as DaumWindow).daum;
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
    const onComplete = vi.fn<(result: PostcodeResult) => void>();

    injectFakeDaum({
      zonecode: "06234",
      roadAddress: "서울특별시 강남구 테헤란로 123",
      jibunAddress: "서울특별시 강남구 역삼동 123-4",
      userSelectedType: "R",
    });

    render(<PostcodeSearch onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "주소 검색" }));

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
    const onComplete = vi.fn<(result: PostcodeResult) => void>();

    injectFakeDaum({
      zonecode: "06234",
      roadAddress: "서울특별시 강남구 테헤란로 123",
      jibunAddress: "서울특별시 강남구 역삼동 123-4",
      userSelectedType: "J",
    });

    render(<PostcodeSearch onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "주소 검색" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(onComplete.mock.calls[0][0]).toMatchObject<PostcodeResult>({
      zipcode: "06234",
      address1: "서울특별시 강남구 역삼동 123-4",
    });
  });

  it("스크립트가 없어도 버튼은 렌더링된다 (DOM side-effect guard)", () => {
    render(<PostcodeSearch onComplete={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "주소 검색" }),
    ).toBeInTheDocument();
  });
});
