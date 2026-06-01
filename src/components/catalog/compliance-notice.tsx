export function ComplianceNotice(props: {
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
}) {
  const notice = props.noticeText ?? "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
      <p className="font-bold">⚠ 건강기능식품 표시·광고 심의필{props.reviewPhraseNo ? ` (${props.reviewPhraseNo})` : ""}</p>
      <p className="mt-1 font-semibold">{notice}</p>
      {props.functionality && <p className="mt-2">· 기능성: {props.functionality}</p>}
      {props.intakeNotice && <p className="mt-1">· 섭취 시 주의사항: {props.intakeNotice}</p>}
      {props.reportNo && <p className="mt-1 font-mono text-[11px]">품목보고번호: {props.reportNo}</p>}
    </div>
  );
}
