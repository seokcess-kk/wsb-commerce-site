// 도메인 상태 → 색. order/cancellation/inquiry/visibility 통합.
const MAP: Record<string, { label: string; fg: string; bg: string }> = {
  // order
  pending: { label: "결제 대기", fg: "#6B756E", bg: "#EFF1EB" },
  paid: { label: "결제 완료", fg: "#177A4B", bg: "#E7F6EE" },
  preparing: { label: "배송 준비", fg: "#0E7490", bg: "#E0F2F5" },
  shipped: { label: "발송 완료", fg: "#1D4ED8", bg: "#E5EDFF" },
  delivered: { label: "배송 완료", fg: "#0F5132", bg: "#E3F0E8" },
  cancelled: { label: "취소", fg: "#B45309", bg: "#FBEEDD" },
  // cancellation
  requested: { label: "접수", fg: "#B45309", bg: "#FBEEDD" },
  refunded: { label: "환불완료", fg: "#177A4B", bg: "#E7F6EE" },
  resolved: { label: "처리완료", fg: "#1D4ED8", bg: "#E5EDFF" },
  rejected: { label: "반려", fg: "#6B756E", bg: "#EFF1EB" },
  // inquiry
  open: { label: "미답변", fg: "#B45309", bg: "#FBEEDD" },
  answered: { label: "답변완료", fg: "#177A4B", bg: "#E7F6EE" },
  // visibility
  visible: { label: "노출", fg: "#177A4B", bg: "#E7F6EE" },
  hidden: { label: "숨김", fg: "#6B756E", bg: "#EFF1EB" },
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const s = MAP[value] ?? { label: label ?? value, fg: "var(--ad-mut)", bg: "var(--ad-line-2)" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ color: s.fg, background: s.bg }}
    >
      {label ?? s.label}
    </span>
  );
}
