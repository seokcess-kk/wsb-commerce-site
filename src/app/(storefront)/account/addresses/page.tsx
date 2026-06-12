import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listAddresses } from "@/db/queries/addresses";
import { AddressesClient } from "./addresses-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "배송지 관리",
  robots: { index: false },
};

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/addresses");

  const addresses = await listAddresses(user.id);

  return (
    <section className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/account" className="text-sm text-ng-cobalt">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ng-charcoal">배송지 관리</h1>
      <AddressesClient initialAddresses={addresses} />
    </section>
  );
}
