import Link from "next/link";
import { listInquiries } from "@/db/queries/admin-inquiries";
import { formatDate } from "@/lib/format";
import { answerInquiry } from "./actions";
import { AdminCard } from "@/components/admin/ui/card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminTextarea, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const FILTERS = [{ value: "", label: "전체" }, { value: "open", label: "미답변" }, { value: "answered", label: "답변완료" }];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const inquiries = await listInquiries(status || undefined);
  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">문의관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">답변 저장 시 상태가 답변완료로 바뀝니다(이메일 발송은 별도).</p>
      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => {
          const on = (status ?? "") === f.value;
          return (
            <Link key={f.value} href={f.value ? `/admin/inquiries?status=${f.value}` : "/admin/inquiries"}
              className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>{f.label}</Link>
          );
        })}
      </div>
      <div className="space-y-3">
        {inquiries.map((q) => (
          <AdminCard key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--ad-line-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--ad-mut)]">{q.category}</span>
                  <span className="font-semibold text-[var(--ad-ink)]">{q.subject}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--ad-mut)]">{q.email} · {formatDate(q.createdAt)}</p>
              </div>
              <StatusBadge value={q.status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--ad-panel-2)] p-3 text-sm text-[var(--ad-ink)]">{q.body}</p>
            <form action={answerInquiry} className="mt-3">
              <input type="hidden" name="id" value={q.id} />
              <AdminTextarea name="answer" required defaultValue={q.answer ?? ""} rows={3} placeholder="답변을 입력하세요" className="w-full" />
              <AdminButton className="mt-2">{q.status === "answered" ? "답변 수정" : "답변 등록"}</AdminButton>
            </form>
          </AdminCard>
        ))}
        {inquiries.length === 0 && <p className="py-10 text-center text-sm text-[var(--ad-mut-2)]">문의가 없습니다.</p>}
      </div>
    </div>
  );
}
