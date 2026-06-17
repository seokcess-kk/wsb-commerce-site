import Image from "next/image";
import type { ProductTone } from "@/lib/brand/copy";

// 상품 비주얼 — 실사(로컬 /product/* 또는 원격 URL)는 next/image로, 이미지가 없으면 톤별 브랜드 타일로 폴백.
// NUTROGIN 3종은 외박스 실사를 대표 이미지로 쓰고, 실사가 없는 상품(WSB 등)만 그라디언트 타일을 유지한다.
type Tone = ProductTone | "wsb";

const TILE: Record<Tone, { bg: string; accent: string; sub: string }> = {
  focus: { bg: "bg-gradient-to-br from-ng-cobalt to-[#0030b0] text-white", accent: "text-ng-neon", sub: "text-white/70" },
  clear: { bg: "bg-gradient-to-br from-[#e9f0ff] to-[#bcd2ff] text-ng-cobalt", accent: "text-ng-cobalt", sub: "text-ng-cobalt/60" },
  rest: { bg: "bg-gradient-to-br from-ng-charcoal to-[#0b1b4d] text-white", accent: "text-ng-neon", sub: "text-white/60" },
  wsb: { bg: "bg-gradient-to-br from-stone-100 to-stone-200 text-stone-500", accent: "text-wsb-green", sub: "text-stone-400" },
};

function BrandTile({ tone, code }: { tone: Tone; code?: string }) {
  const t = TILE[tone];
  const label = tone === "wsb" ? "WSB" : "NUTROGIN";
  return (
    <div aria-hidden className={`absolute inset-0 flex flex-col items-center justify-center ${t.bg}`}>
      {/* 스틱 젤리 모티프 */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-1.5 opacity-20" aria-hidden>
        {[10, 14, 11, 13, 9].map((h, i) => (
          <span key={i} className="w-2 rounded-full rounded-b-none bg-current" style={{ height: `${h * 6}px` }} />
        ))}
      </div>
      <span className={`font-mono text-[10px] tracking-[0.3em] ${t.sub}`}>{label}</span>
      {code && <span className={`mt-1.5 font-mono text-2xl font-bold tracking-wider ${t.accent}`}>{code}</span>}
    </div>
  );
}

export function ProductVisual({
  src,
  alt,
  tone = "focus",
  code,
  className = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  tone?: Tone;
  code?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const hasImage = !!src;
  const remote = hasImage && /^https?:\/\//.test(src as string);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {hasImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
          unoptimized={remote}
        />
      ) : (
        <BrandTile tone={tone} code={code} />
      )}
    </div>
  );
}
