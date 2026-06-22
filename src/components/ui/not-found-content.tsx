import Link from "next/link";

// 브랜드 404 본문 — 루트/스토어프론트 not-found 에서 공유.
export function NotFoundContent() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-5xl font-extrabold text-ng-cobalt">404</p>
      <h1 className="mt-4 text-xl font-extrabold text-ng-charcoal">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-stone-500">요청하신 페이지가 존재하지 않거나 이동되었어요.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="rounded-full bg-ng-cobalt px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0038cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
        >
          홈으로
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-ng-charcoal transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
        >
          라인업 보기
        </Link>
      </div>
    </section>
  );
}
