import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, ShieldCheck, Brain } from "lucide-react";
import { NutroginLineup } from "@/components/nutrogin/nutrogin-lineup";
import { listPublishedProducts } from "@/db/queries/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "브랜드 스토리",
  description: "데이터로 키운 건강기능식품. WSB(우리스마트바이오)와 대표 브랜드 NUTROGIN의 이야기.",
};

export default async function BrandPage() {
  const products = await listPublishedProducts();
  const priceBySlug: Record<string, string> = {};
  const imageBySlug: Record<string, string | null> = {};
  for (const p of products) {
    priceBySlug[p.slug] = p.priceLabel;
    imageBySlug[p.slug] = p.thumbnail;
  }

  return (
    <div className="bg-wsb-lab">
      {/* WSB 쉘 — 데이터·연구소·신뢰 */}
      <section className="border-b border-stone-200 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-wsb-green">Woori Smart Bio</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-wsb-carbon md:text-5xl">
            데이터로 키운 건강,<br />WSB가 책임지는 일상의 과학
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-600">
            WSB(우리스마트바이오)는 원료의 표준화부터 기능성 데이터 검증까지, 근거에 기반한 건강기능식품을 만듭니다.
            오픈마켓이 아닌 자사몰에서 고객과 직접 만나며, 브랜드 경험과 신뢰를 한자리에 담았습니다.
          </p>
        </div>
      </section>

      {/* WSB 가치 3축 */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { icon: FlaskConical, title: "표준화된 원료", body: "진세노사이드·rTG 오메가3 등 핵심 지표성분을 정량 관리합니다." },
            { icon: ShieldCheck, title: "심의·표기 준수", body: "기능성 표시·광고 자율심의를 통과한 문구만 사용합니다." },
            { icon: Brain, title: "효능 중심 설계", body: "두뇌·집중, 면역, 수면, 활력 — 필요에 맞춘 효능별 라인업." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-stone-200 bg-white p-6">
              <Icon size={24} strokeWidth={1.75} className="text-wsb-green" aria-hidden />
              <h3 className="mt-4 text-base font-bold text-wsb-carbon">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NUTROGIN 존 — 코발트·네온 (홈과 공유하는 단일 컴포넌트) */}
      <NutroginLineup eyebrow="Featured Brand · NUTROGIN" priceBySlug={priceBySlug} imageBySlug={imageBySlug} />

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <p className="text-sm text-stone-600">효능별로 더 많은 제품을 만나보세요.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex rounded-full bg-ng-cobalt px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0038cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
        >
          전체 상품 보기
        </Link>
      </section>
    </div>
  );
}
