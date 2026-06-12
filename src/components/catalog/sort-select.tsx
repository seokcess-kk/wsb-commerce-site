"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SORT_OPTIONS, type SortKey } from "@/lib/catalog/sort";

export function SortSelect({ currentSort }: { currentSort: SortKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      aria-label="정렬 기준"
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
