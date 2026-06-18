import { nutroginMeta } from "@/lib/brand/copy";

/**
 * NUTROGIN 상세 이미지 섹션 — 디자인 시안(상세페이지 이미지)을 그대로 적용.
 * 제품 정보 섹션과 동일한 본문 폭(max-w-6xl) 중앙 정렬로 노출하고,
 * 모바일에서는 단일 컬럼으로 제작한 모바일 전용 이미지로 교체한다(art-direction).
 * 이미지: public/product/detail/nutrogin-<tone>-detail(.png | -mobile.png),
 *   제작·재생성은 public/mockups/nutrogin-detail.html + _render.mjs 참조.
 */
export function NutroginDetailImage({ slug, productName }: { slug: string; productName: string }) {
  const meta = nutroginMeta(slug);
  if (!meta) return null;

  const base = `/product/detail/${slug}-detail`;

  return (
    <section className="border-t border-stone-100 bg-white py-8" aria-label={`${productName} 상세 정보`}>
      <div className="mx-auto w-full max-w-6xl px-6">
        <picture>
          <source media="(max-width: 767px)" srcSet={`${base}-mobile.png`} />
          {/* 가변 높이의 단일 상세 이미지라 next/image 대신 art-direction <picture>를 사용 */}
          <img
            src={`${base}.png`}
            alt={`${productName} 상세 정보`}
            className="block h-auto w-full"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
    </section>
  );
}
