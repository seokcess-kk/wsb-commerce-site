import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FailPage({ searchParams }: { searchParams: Promise<{ message?: string; code?: string }> }) {
  const { message, code } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">결제가 취소되었습니다</h1>
      <p className="mt-4 text-sm text-stone-600">{message ?? "결제가 완료되지 않았습니다."}{code ? ` (${code})` : ""}</p>
      <Link href="/cart" className="mt-6 inline-block rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white">장바구니로 돌아가기</Link>
    </section>
  );
}
