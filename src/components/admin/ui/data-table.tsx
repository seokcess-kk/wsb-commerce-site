export function DataTable({
  toolbar,
  head,
  children,
  empty,
  pagination,
}: {
  toolbar?: React.ReactNode;
  head: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
  pagination?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-panel)]">
      {toolbar && <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ad-line)] p-4">{toolbar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ad-line)] text-left text-[var(--ad-mut)]">{head}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {empty && <p className="py-12 text-center text-sm text-[var(--ad-mut-2)]">데이터가 없습니다.</p>}
      {pagination && <div className="flex justify-center gap-2 border-t border-[var(--ad-line)] p-4">{pagination}</div>}
    </div>
  );
}

// 공통 셀 클래스 — 페이지에서 <td className={TD}> 형태로 사용.
export const TH = "px-4 py-2.5 font-semibold";
export const TD = "px-4 py-3 align-middle";
export const ROW = "border-b border-[var(--ad-line-2)] last:border-0";
