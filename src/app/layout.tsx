import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { getSiteUrl } from "@/lib/site";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "NUTROGIN BRAINCARE", template: "%s | NUTROGIN" },
  description: "또렷한 머리, 맑은 하루. 집중·맑은 각성·숙면 회복을 위한 브레인케어 젤리 NUTROGIN — 하루 한 스틱의 데일리 루틴.",
  openGraph: { type: "website", siteName: "NUTROGIN BRAINCARE", locale: "ko_KR" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="min-h-screen bg-white font-sans text-ng-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
