import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/queries/products";
import { ComplianceNotice } from "@/components/catalog/compliance-notice";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const zone = product.isNutrogin ? "bg-ng-cobalt text-white" : "bg-stone-100 text-stone-400";
  return (
    <article className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-2">
      <div className={`flex min-h-80 items-center justify-center rounded-lg ${zone}`}>
        <span className="font-mono text-sm">{product.name}</span>
      </div>
      <div>
        {product.isNutrogin && (
          <span className="font-mono text-xs font-bold tracking-wide text-ng-cobalt">NUTROGIN</span>
        )}
        <h1 className="mt-1 text-2xl font-extrabold text-wsb-carbon">{product.name}</h1>
        {product.summary && <p className="mt-2 text-stone-600">{product.summary}</p>}
        <p className="mt-4 text-2xl font-extrabold text-wsb-carbon">{product.priceLabel}</p>

        <div className="mt-4 rounded-md border border-stone-200 p-3 text-sm">
          <p className="mb-2 font-semibold text-stone-700">옵션</p>
          <ul className="space-y-1 text-stone-600">
            {product.variants.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span>{v.name}{v.stock === 0 ? " (품절)" : ""}</span>
                <span className="font-mono">{v.priceDelta > 0 ? `+₩${v.priceDelta.toLocaleString("ko-KR")}` : "기본가"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-stone-400">장바구니·결제는 다음 계획서(Plan 3)에서 연결됩니다.</p>
        </div>

        {product.ingredients && (
          <p className="mt-4 text-xs text-stone-500">원료/함량: <span className="font-mono text-stone-700">{product.ingredients}</span></p>
        )}

        <div className="mt-5">
          <ComplianceNotice
            reviewPhraseNo={product.reviewPhraseNo}
            noticeText={product.noticeText}
            reportNo={product.reportNo}
            functionality={product.functionality}
            intakeNotice={product.intakeNotice}
          />
        </div>
      </div>
    </article>
  );
}
