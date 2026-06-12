import { Plus } from "lucide-react";

// 재사용 FAQ 아코디언 — 네이티브 details(무JS·접근성). 홈·PDP 공유.
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-stone-200 border-y border-stone-200">
      {items.map((f) => (
        <details key={f.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ng-charcoal [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus
              size={18}
              className="shrink-0 text-ng-cobalt transition-transform duration-200 group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
