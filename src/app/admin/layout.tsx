import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { countOpenInquiries } from "@/db/queries/admin-inquiries";
import { countRequestedCancellations } from "@/db/queries/admin-cancellations";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const cookieStore = await cookies();
  const theme = cookieStore.get("admin-theme")?.value === "dark" ? "dark" : "light";
  const [inquiries, cancellations] = await Promise.all([
    countOpenInquiries(),
    countRequestedCancellations(),
  ]);
  return (
    <AdminShell theme={theme} badges={{ inquiries, cancellations }} crumb="대시보드">
      {children}
    </AdminShell>
  );
}
