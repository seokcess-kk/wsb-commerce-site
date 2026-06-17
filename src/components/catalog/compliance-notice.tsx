import { ShieldCheck } from "lucide-react";

// 건강기능식품 심의·고지 — 경고(amber)가 아니라 중립 신뢰 톤.
// PDP 하단 우측(안심 정보와 좌우 분할). 심의필 표기+질병 고지 아래로 기능성·주의사항·품목보고번호를 배치.
export function ComplianceNotice(props: {
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
}) {
  const notice = props.noticeText ?? "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";
  return (
    <div className="rounded-2xl border border-stone-200 bg-ng-offwhite p-4 text-xs leading-relaxed text-stone-600 md:p-5">
      <p className="flex items-center gap-1.5 font-bold text-ng-charcoal">
        <ShieldCheck size={14} className="text-ng-cobalt" aria-hidden />
        건강기능식품 표시·광고 심의필{props.reviewPhraseNo ? ` (${props.reviewPhraseNo})` : ""}
      </p>
      <p className="mt-1.5 font-semibold text-ng-charcoal">{notice}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {props.functionality && (
          <div className="flex flex-col gap-0.5">
            <dt className="font-semibold text-stone-500">기능성</dt>
            <dd>{props.functionality}</dd>
          </div>
        )}
        {props.intakeNotice && (
          <div className="flex flex-col gap-0.5">
            <dt className="font-semibold text-stone-500">섭취 시 주의사항</dt>
            <dd>{props.intakeNotice}</dd>
          </div>
        )}
        {props.reportNo && (
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <dt className="font-semibold text-stone-500">품목보고번호</dt>
            <dd className="font-mono text-[11px] text-stone-400">{props.reportNo}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
