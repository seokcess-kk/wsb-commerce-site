import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// NUTROGIN 단일 CTA 컴포넌트 — 코발트/네온 비율과 포커스 스타일을 한 곳에서 강제한다.
// href 가 있으면 next/link, 없으면 button 으로 렌더(서버/클라이언트 양쪽에서 사용 가능).
type Variant = "primary" | "neon" | "onCobalt" | "onCobaltGhost" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  // 밝은 배경 위 1차 CTA
  primary: "bg-ng-cobalt text-white hover:bg-[#0038cc] focus-visible:ring-ng-cobalt focus-visible:ring-offset-white",
  // 최고 강조(가격 혜택·핵심 전환) — 절제해서 사용
  neon: "bg-ng-neon text-ng-charcoal hover:brightness-95 focus-visible:ring-ng-charcoal focus-visible:ring-offset-white",
  // 코발트 블록 위 1차 CTA
  onCobalt: "bg-white text-ng-cobalt hover:bg-white/90 focus-visible:ring-ng-neon focus-visible:ring-offset-ng-cobalt",
  // 코발트 블록 위 보조 CTA
  onCobaltGhost: "border border-white/30 text-white hover:bg-white/10 focus-visible:ring-ng-neon focus-visible:ring-offset-ng-cobalt",
  // 밝은 배경 위 보조 CTA
  outline: "border border-ng-charcoal/15 text-ng-charcoal hover:border-ng-charcoal/40 hover:bg-ng-charcoal/[0.03] focus-visible:ring-ng-cobalt focus-visible:ring-offset-white",
  // 텍스트 버튼
  ghost: "text-ng-cobalt hover:bg-ng-cobalt/5 focus-visible:ring-ng-cobalt focus-visible:ring-offset-white",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps & Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type LinkProps = BaseProps & Omit<ComponentProps<typeof Link>, "className" | "children"> & { href: string };

export function CTAButton(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", fullWidth, className = "", children, ...rest } = props;
  const cls = [BASE, VARIANTS[variant], SIZES[size], fullWidth ? "w-full" : "", className].filter(Boolean).join(" ");

  if ("href" in props && props.href != null) {
    return (
      <Link className={cls} {...(rest as ComponentProps<typeof Link>)}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}
