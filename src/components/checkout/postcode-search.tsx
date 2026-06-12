"use client";

export type PostcodeResult = {
  zipcode: string;
  address1: string;
};

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  autoRoadAddress?: string;
  autoJibunAddress?: string;
  userSelectedType?: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => { open: () => void };
    };
  }
}

const DAUM_POSTCODE_URL =
  "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadDaumPostcodeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("서버 환경에서는 주소 검색을 사용할 수 없습니다."));
      return;
    }
    if (window.daum?.Postcode) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      `script[src="${DAUM_POSTCODE_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("우편번호 서비스를 불러오는 데 실패했습니다.")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = DAUM_POSTCODE_URL;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("우편번호 서비스를 불러오는 데 실패했습니다."));
    document.head.appendChild(script);
  });
}

export function PostcodeSearch({
  onComplete,
}: {
  onComplete: (result: PostcodeResult) => void;
}) {
  async function handleClick() {
    try {
      await loadDaumPostcodeScript();
      if (!window.daum?.Postcode) {
        alert("우편번호 서비스를 불러오지 못했습니다.");
        return;
      }
      new window.daum.Postcode({
        oncomplete(data: DaumPostcodeData) {
          const address1 =
            data.userSelectedType === "J"
              ? data.jibunAddress
              : data.roadAddress;
          onComplete({ zipcode: data.zonecode, address1 });
        },
      }).open();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-ng-cobalt px-3 py-2 text-sm font-semibold text-ng-cobalt hover:bg-ng-cobalt hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
    >
      주소 검색
    </button>
  );
}
