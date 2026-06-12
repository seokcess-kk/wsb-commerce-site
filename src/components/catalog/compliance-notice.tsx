import { ShieldCheck } from "lucide-react";

// 건강기능식품 심의·고지 — 경고(amber)가 아니라 중립 신뢰 톤으로.
export function ComplianceNotice(props: {
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
}) {
  const notice = props.noticeText ?? "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";
  return (
    <div className="rounded-2xl border border-stone-200 bg-ng-offwhite p-4 text-xs leading-relaxed text-stone-600">
      <p className="flex items-center gap-1.5 font-bold text-ng-charcoal">
        <ShieldCheck size={14} className="text-ng-cobalt" aria-hidden />
        건강기능식품 표시·광고 심의필{props.reviewPhraseNo ? ` (${props.reviewPhraseNo})` : ""}
      </p>
      <p className="mt-1.5 font-semibold text-ng-charcoal">{notice}</p>
      {props.functionality && <p className="mt-2">· 기능성: {props.functionality}</p>}
      {props.intakeNotice && <p className="mt-1">· 섭취 시 주의사항: {props.intakeNotice}</p>}
      {props.reportNo && <p className="mt-1 font-mono text-[11px] text-stone-400">품목보고번호: {props.reportNo}</p>}
    </div>
  );
}
