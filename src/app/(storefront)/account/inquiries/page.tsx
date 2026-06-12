import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listInquiriesByUser } from "@/db/queries/inquiries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "나의 문의",
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  open: "접수",
  answered: "답변완료",
};

function statusBadgeClass(status: string) {
  return status === "answered"
    ? "bg-ng-cobalt/10 text-ng-cobalt"
    : "bg-stone-100 text-stone-500";
}

export default async function InquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/inquiries");

  const inquiries = await listInquiriesByUser(user.id);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/account" className="text-sm text-ng-cobalt">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ng-charcoal">나의 문의</h1>

      {inquiries.length === 0 ? (
        <div className="mt-8 rounded-lg border border-stone-200 py-12 text-center">
          <p className="text-sm text-stone-400">접수된 문의가 없습니다.</p>
          <Link
            href="/support/inquiry"
            className="mt-4 inline-block text-sm font-semibold text-ng-cobalt hover:underline"
          >
            1:1 문의하기
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stone-100 rounded-lg border border-stone-200">
          {inquiries.map((inq) => (
            <li key={inq.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-xs text-stone-500">
                      {inq.category}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${statusBadgeClass(inq.status)}`}
                    >
                      {STATUS_LABEL[inq.status] ?? inq.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ng-charcoal truncate">{inq.subject}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{inq.body}</p>
                  {inq.answer && (
                    <div className="mt-2 rounded-md border border-ng-cobalt/20 bg-ng-cobalt/5 px-3 py-2">
                      <p className="text-xs font-semibold text-ng-cobalt">답변</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-stone-700 whitespace-pre-line">
                        {inq.answer}
                      </p>
                    </div>
                  )}
                </div>
                <time
                  className="shrink-0 text-xs text-stone-400"
                  dateTime={new Date(inq.createdAt).toISOString()}
                >
                  {formatDate(inq.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
