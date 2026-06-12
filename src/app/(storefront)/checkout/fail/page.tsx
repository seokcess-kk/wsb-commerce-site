import { CTAButton } from "@/components/ui/cta-button";

export const dynamic = "force-dynamic";

export default async function FailPage({ searchParams }: { searchParams: Promise<{ message?: string; code?: string }> }) {
  const { message, code } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-ng-charcoal">결제가 취소되었습니다</h1>
      <p className="mt-4 text-sm text-stone-600">
        {message ?? "결제가 완료되지 않았습니다."}
        {code ? ` (${code})` : ""}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <CTAButton href="/cart" variant="primary" size="md">
          장바구니로 돌아가기
        </CTAButton>
        <CTAButton href="/products" variant="outline" size="md">
          계속 쇼핑하기
        </CTAButton>
      </div>
    </section>
  );
}
