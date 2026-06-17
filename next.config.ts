import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname_ = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname_,
  },
  images: {
    // 리뷰 등 일부 데이터가 Unsplash 원격 이미지를 사용 — next/image 최적화 허용.
    // NUTROGIN 3종 제품 실사는 로컬(public/product/*)이라 별도 호스트 설정이 필요 없다.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
