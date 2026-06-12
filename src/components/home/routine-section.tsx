import { ROUTINE } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";

// 루틴 제안 — 아침(코발트)부터 밤(차콜)까지 하루의 리듬을 그라디언트로.
export function RoutineSection() {
  return (
    <section className="bg-gradient-to-br from-ng-cobalt to-ng-charcoal px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          tone="cobalt"
          eyebrow="DAILY ROUTINE"
          title={
            <>
              아침부터 밤까지, <span className="text-ng-neon">하루의 리듬</span>
            </>
          }
          description="작지만 일관된 한 스틱이 더 나은 하루의 리듬을 만듭니다."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ROUTINE.map((r) => (
            <div key={r.code} className="rounded-2xl border border-white/12 bg-white/[0.06] p-6">
              <span className="font-mono text-3xl font-bold text-ng-neon">{r.time}</span>
              <p className="mt-3 font-mono text-xs font-bold tracking-wider text-white/50">NUTROGIN {r.code}</p>
              <h3 className="mt-1 text-lg font-extrabold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
