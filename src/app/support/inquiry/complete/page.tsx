import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "문의 접수 완료",
  robots: { index: false },
};

export default function InquiryCompletePage() {
  return (
    <section className="mx-auto max-w-sm px-6 py-16 text-center">
      <div className="mb-4 text-4xl">✅</div>
      <h1 className="text-xl font-extrabold text-wsb-carbon">문의가 접수되었습니다</h1>
      <p className="mt-3 text-sm text-stone-500">
        입력하신 이메일로 답변을 보내드립니다.
        <br />
        평일 10:00~17:00 내에 순차적으로 답변드립니다.
      </p>
      <Link
        href="/support"
        className="mt-6 inline-block rounded-md bg-wsb-green px-6 py-2.5 text-sm font-bold text-white"
      >
        고객지원으로 돌아가기
      </Link>
    </section>
  );
}
