import type { ReactNode } from "react";

// 공통 빈 상태 — 비어 있을 때 브랜드 톤으로 다음 행동을 유도.
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-ng-offwhite px-6 py-16 text-center">
      <p className="font-bold text-ng-charcoal">{title}</p>
      {description && <p className="mt-1.5 text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// 공통 로딩 상태 — 코발트 스피너.
export function LoadingState({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-400" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-ng-cobalt" aria-hidden />
      {label}
    </div>
  );
}

// 공통 오류 상태.
export function ErrorState({
  title = "문제가 발생했습니다",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      <p className="font-bold text-ng-charcoal">{title}</p>
      {description && <p className="mt-1.5 text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
