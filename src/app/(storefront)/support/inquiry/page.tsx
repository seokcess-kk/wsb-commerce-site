import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = {
  title: "1:1 문의",
  description: "WSB 스토어 1:1 문의",
};

export default async function InquiryPage() {
  const user = await getCurrentUser();

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/support" className="text-sm text-ng-cobalt">
        ← 고객지원
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ng-charcoal">1:1 문의</h1>
      <p className="mt-1 mb-8 text-sm text-stone-500">
        평일 10:00~17:00 내에 순차적으로 답변드립니다.
      </p>
      <InquiryForm
        initialEmail={user?.email ?? ""}
        isLoggedIn={!!user}
      />
    </section>
  );
}
