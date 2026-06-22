"use client";

import Link from "next/link";
import { useEffect } from "react";

// 스토어프론트 세그먼트 에러 바운더리 — 서버 컴포넌트(DB 조회 등) 예외 시 전체 트리 크래시 대신 복구 UI.
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] render error:", error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-xl font-extrabold text-ng-charcoal">문제가 발생했습니다</h1>
      <p className="mt-2 text-sm text-stone-500">
        일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-ng-cobalt px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0038cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-ng-charcoal transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
        >
          홈으로
        </Link>
      </div>
    </section>
  );
}
