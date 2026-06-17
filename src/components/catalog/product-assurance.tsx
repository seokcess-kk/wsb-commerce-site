import { Truck, Clock, RotateCcw, ShieldCheck } from "lucide-react";
import { formatKRW } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/pricing";

// 배송·교환·정품/심의 안심 정보 — PDP 하단 좌측(심의필과 좌우 분할). 반폭에서 2×2 배치.
const ROWS = [
  { icon: Truck, label: "무료배송", value: `${formatKRW(FREE_SHIPPING_THRESHOLD)} 이상 구매 시` },
  { icon: Clock, label: "출고·배송", value: "평일 1~3일 내 도착" },
  { icon: RotateCcw, label: "교환·반품", value: "수령 후 7일 이내" },
  { icon: ShieldCheck, label: "정품·심의", value: "자율심의 통과 정품" },
] as const;

export function ProductAssurance({ className = "" }: { className?: string }) {
  return (
    <div className={`flex rounded-2xl border border-stone-200 bg-white ${className}`}>
      <ul className="grid w-full grid-cols-2 content-center gap-x-4 gap-y-5 p-5">
        {ROWS.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ng-cobalt/10">
              <Icon size={17} strokeWidth={1.75} className="text-ng-cobalt" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold tracking-wide text-stone-400">{label}</p>
              <p className="text-sm font-medium text-ng-charcoal">{value}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
