import { NAMING } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";

// 컨셉 + 네이밍 — 약이 아니라 매일의 루틴. Nootropic + Ginsenoside = NUTROGIN.
export function ConceptSection() {
  return (
    <section className="bg-ng-offwhite px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="WHY NUTROGIN"
          title={
            <>
              약이 아니라, <span className="text-ng-cobalt">매일의 브레인케어 루틴</span>
            </>
          }
          description="기능과 원료를 이름으로 증명하는 브랜드. 누트로진은 두 단어에서 시작합니다."
        />

        {/* 네이밍 방정식 */}
        <div className="mt-10 flex flex-wrap items-center gap-3 font-mono text-sm">
          {NAMING.parts.map((part, i) => (
            <span key={part.en} className="flex items-center gap-3">
              {i > 0 && <span className="text-stone-400">+</span>}
              <span className="inline-flex flex-col rounded-xl border border-stone-200 bg-white px-4 py-2.5">
                <span className="font-bold tracking-wide text-ng-cobalt">{part.en}</span>
                <span className="text-[11px] text-stone-400">{part.ko}</span>
              </span>
            </span>
          ))}
          <span className="text-stone-400">=</span>
          <span className="rounded-xl bg-ng-cobalt px-4 py-2.5 font-bold tracking-wide text-ng-neon">NUTROGIN</span>
        </div>

        <p className="mt-8 max-w-3xl text-base leading-relaxed text-stone-600">{NAMING.story}</p>
      </div>
    </section>
  );
}
