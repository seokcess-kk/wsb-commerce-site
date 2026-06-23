import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname_ = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname_,
  },
  experimental: {
    // 상품 이미지 업로드 서버액션의 요청 본문 한도(기본 1MB). 파일당 5MB 까지 받으므로 여유를 둔다.
    // ImageUploader 는 파일을 하나씩 보내 단일 요청이 이 한도를 넘지 않게 한다.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // 리뷰 등 일부 데이터가 Unsplash 원격 이미지를 사용 — next/image 최적화 허용.
    // NUTROGIN 3종 제품 실사는 로컬(public/product/*)이라 별도 호스트 설정이 필요 없다.
    // 상품 이미지 업로드(Supabase Storage)의 공개 URL 호스트를 SUPABASE_URL 에서 파생해 허용.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
