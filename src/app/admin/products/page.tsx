import Link from "next/link";
import { listAllProductsAdmin } from "@/db/queries/admin-products";
import { formatKRW } from "@/lib/format";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAllProductsAdmin();
  const toolbar = (
    <Link href="/admin/products/new" className="ml-auto"><AdminButton>+ 상품 등록</AdminButton></Link>
  );
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">상품관리</h1>
      <DataTable
        toolbar={toolbar}
        empty={products.length === 0}
        head={<><th className={TH}>상품명</th><th className={TH}>브랜드</th><th className={TH}>가격</th><th className={TH}>노출</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {products.map((p) => (
          <tr key={p.id} className={ROW}>
            <td className={`${TD} font-semibold`}>{p.name}</td>
            <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{p.brand}</td>
            <td className={`${TD} font-mono`}>{formatKRW(p.basePrice)}</td>
            <td className={TD}><StatusBadge value={p.isPublished ? "visible" : "hidden"} /></td>
            <td className={`${TD} text-right`}><Link href={`/admin/products/${p.id}`} className="font-semibold text-[var(--ad-accent)] hover:underline">수정</Link></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
