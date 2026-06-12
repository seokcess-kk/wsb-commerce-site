import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname_ = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname_,
  },
  images: {
    // 시드 상품 일부가 Unsplash 원격 이미지를 사용 — next/image 최적화 허용.
    // NUTROGIN 3종은 실사 없이 브랜드 타일(ProductVisual)로 렌더하므로 별도 호스트 불필요.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
