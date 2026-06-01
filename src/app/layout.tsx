import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/lib/cart/cart-context";
import { getSiteUrl } from "@/lib/site";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "WSB 스토어", template: "%s | WSB 스토어" },
  description: "Engineered by Data, Grown by Design. 데이터로 키운 건강기능식품 — NUTROGIN 브레인케어와 WSB 건강기능식품.",
  openGraph: { type: "website", siteName: "WSB 스토어", locale: "ko_KR" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ng-charcoal antialiased">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
