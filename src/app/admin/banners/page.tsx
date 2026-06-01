import { listAllBanners } from "@/db/queries/banners";
import { createBanner, toggleBanner, deleteBanner } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await listAllBanners();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">배너관리</h1>

      {/* 새 배너 추가 폼 */}
      <form
        action={createBanner}
        className="mt-5 rounded-lg border border-stone-200 p-4"
      >
        <h2 className="mb-3 font-semibold text-wsb-carbon">새 배너 추가</h2>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm text-stone-600">
            제목 <span className="text-wsb-green text-xs">필수</span>
            <input
              name="title"
              required
              placeholder="배너 제목"
              className="mt-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-stone-600">
            이미지 URL
            <input
              name="imageUrl"
              placeholder="https://..."
              className="mt-1 w-56 rounded-md border border-stone-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-stone-600">
            링크 URL
            <input
              name="linkUrl"
              placeholder="https://..."
              className="mt-1 w-56 rounded-md border border-stone-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-stone-600">
            순서
            <input
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="mt-1 w-20 rounded-md border border-stone-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-3 rounded-md bg-wsb-green px-4 py-2 text-sm font-bold text-white hover:bg-wsb-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
        >
          추가
        </button>
      </form>

      {/* 배너 목록 */}
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">제목</th>
            <th>이미지 URL</th>
            <th>링크 URL</th>
            <th>순서</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b) => {
            async function handleToggle() {
              "use server";
              await toggleBanner(b.id, !b.isActive);
            }
            async function handleDelete() {
              "use server";
              await deleteBanner(b.id);
            }
            return (
              <tr key={b.id} className="border-b border-stone-100">
                <td className="py-2 font-semibold text-wsb-carbon">{b.title}</td>
                <td className="max-w-[160px] truncate font-mono text-xs text-stone-500">
                  {b.imageUrl ?? "-"}
                </td>
                <td className="max-w-[160px] truncate font-mono text-xs text-stone-500">
                  {b.linkUrl ?? "-"}
                </td>
                <td className="font-mono text-xs">{b.sortOrder}</td>
                <td>
                  {b.isActive ? (
                    <span className="text-wsb-green">노출</span>
                  ) : (
                    <span className="text-stone-400">숨김</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={handleToggle}>
                      <button
                        type="submit"
                        className="rounded-md border border-wsb-green px-2 py-1 text-xs font-semibold text-wsb-green hover:bg-wsb-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
                      >
                        {b.isActive ? "숨기기" : "노출"}
                      </button>
                    </form>
                    <form action={handleDelete}>
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {banners.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">
          등록된 배너가 없습니다.
        </p>
      )}
    </div>
  );
}
