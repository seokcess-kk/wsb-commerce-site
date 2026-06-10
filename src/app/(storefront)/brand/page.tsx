import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, ShieldCheck, Brain, Sparkles, Moon } from "lucide-react";

export const metadata: Metadata = {
  title: "브랜드 스토리",
  description: "데이터로 키운 건강기능식품. WSB(우리스마트바이오)와 대표 브랜드 NUTROGIN의 이야기.",
};

const NUTROGIN_LINE = [
  { code: "FOCUS", desc: "또렷한 집중이 필요한 하루를 위한 브레인케어", icon: Brain, slug: "nutrogin-focus" },
  { code: "CLEAR", desc: "맑고 가벼운 컨디션을 위한 데일리 케어", icon: Sparkles, slug: "nutrogin-clear" },
  { code: "REST", desc: "깊은 휴식과 회복을 위한 나이트 케어", icon: Moon, slug: "nutrogin-rest" },
];

export default function BrandPage() {
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

      {/* NUTROGIN 존 — 코발트·네온 전환 */}
      <section className="border-t-2 border-ng-neon bg-ng-cobalt px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ng-neon">Featured Brand · NUTROGIN</p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Sharper mind,<br />brighter day.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80">
            NUTROGIN은 &lsquo;두뇌·집중&rsquo;을 간판으로 하는 WSB의 대표 입점 브랜드입니다.
            바쁜 일상 속 또렷한 컨디션을 위해, 하루 한 스틱의 간편한 루틴을 제안합니다.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {NUTROGIN_LINE.map(({ code, desc, icon: Icon, slug }) => (
              <Link
                key={code}
                href={`/products/${slug}`}
                className="group rounded-xl border border-white/15 bg-white/5 p-6 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-neon"
              >
                <Icon size={24} strokeWidth={1.75} className="text-ng-neon" aria-hidden />
                <p className="mt-4 font-mono text-lg font-bold tracking-wide">NUTROGIN {code}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{desc}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-ng-neon">제품 보기 →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <p className="text-sm text-stone-600">효능별로 더 많은 제품을 만나보세요.</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
        >
          전체 상품 보기
        </Link>
      </section>
    </div>
  );
}
