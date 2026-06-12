import { Sprout, FlaskConical, Package } from "lucide-react";
import { TRUST_PILLARS } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";

// 신뢰 3축 — 스마트팜(포레스트 보조 5%)·진세노사이드·스틱형.
const ICONS: Record<string, { Icon: typeof Sprout; color: string; bg: string }> = {
  smartfarm: { Icon: Sprout, color: "text-wsb-green", bg: "bg-wsb-green/8" },
  ginsenoside: { Icon: FlaskConical, color: "text-ng-cobalt", bg: "bg-ng-cobalt/8" },
  stick: { Icon: Package, color: "text-ng-cobalt", bg: "bg-ng-cobalt/8" },
};

export function BrandTrust() {
  return (
    <section className="bg-ng-offwhite px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="ENGINEERED"
          title={
            <>
              기술과 원료로 <span className="text-ng-cobalt">증명하는 신뢰</span>
            </>
          }
          description="스마트팜에서 표준화한 원료부터 휴대 간편한 스틱까지 — 매일 챙기기 좋은 브레인케어."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TRUST_PILLARS.map((p) => {
            const m = ICONS[p.key];
            const Icon = m.Icon;
            return (
              <div key={p.key} className="rounded-2xl border border-stone-200 bg-white p-6">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
                  <Icon size={22} strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-ng-charcoal">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
