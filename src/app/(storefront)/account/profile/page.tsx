import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ProfileForm } from "@/components/account/profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "회원정보 수정",
  robots: { index: false },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/profile");

  return (
    <section className="mx-auto max-w-md px-6 py-10">
      <Link href="/account" className="text-sm text-ng-cobalt">← 마이페이지</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ng-charcoal">회원정보 수정</h1>
      <ProfileForm email={user.email} />
    </section>
  );
}
