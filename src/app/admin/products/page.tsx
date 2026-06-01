import Link from "next/link";
import { listAllProductsAdmin } from "@/db/queries/admin-products";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAllProductsAdmin();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-wsb-carbon">상품관리</h1>
        <Link href="/admin/products/new" className="rounded-md bg-wsb-green px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2">+ 상품 등록</Link>
      </div>
      <table className="mt-5 w-full text-sm">
        <thead><tr className="border-b border-stone-200 text-left text-stone-500"><th className="py-2">상품명</th><th>브랜드</th><th>가격</th><th>노출</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-stone-100">
              <td className="py-2 font-semibold text-wsb-carbon">{p.name}</td>
              <td className="font-mono text-xs">{p.brand}</td>
              <td className="font-mono">{formatKRW(p.basePrice)}</td>
              <td>{p.isPublished ? <span className="text-wsb-green">노출</span> : <span className="text-stone-400">숨김</span>}</td>
              <td className="text-right"><Link href={`/admin/products/${p.id}`} className="text-wsb-green hover:underline">수정</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <p className="py-10 text-center text-sm text-stone-400">등록된 상품이 없습니다.</p>}
    </div>
  );
}
