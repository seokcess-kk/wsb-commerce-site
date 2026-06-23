import Image from "next/image";
import { MarkdownContent } from "./markdown-content";

function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

interface ProductDetailSectionProps {
  description: string | null;
  images: string[];
  functionality: string | null;
  intakeNotice: string | null;
  ingredients: string | null;
  isNutrogin?: boolean;
  productName: string;
}

/**
 * PDP 상세 정보 섹션 — article 하단, ReviewList 전에 배치.
 * description / detail images / 제품 정보 테이블을 렌더링한다.
 * ComplianceNotice와 중복되는 규제 문구는 표시하지 않고,
 * 보완적인 제품 정보(원료·기능성·주의사항)만 요약 테이블로 노출.
 */
export function ProductDetailSection({
  description,
  images,
  functionality,
  intakeNotice,
  ingredients,
  isNutrogin = false,
  productName,
}: ProductDetailSectionProps) {
  const accentBorder = isNutrogin
    ? "border-ng-cobalt"
    : "border-wsb-green";
  const accentText = isNutrogin ? "text-ng-cobalt" : "text-wsb-green";
  const headingBg = isNutrogin
    ? "bg-ng-charcoal text-ng-neon"
    : "bg-wsb-green text-white";

  // 상세 이미지: 첫 번째(메인 갤러리용)를 제외한 나머지 이미지
  const detailImages = images.length > 1 ? images.slice(1) : [];

  const hasProductInfo = !!(functionality || intakeNotice || ingredients);

  return (
    <section className={`mx-auto max-w-6xl px-6 py-10 border-t border-stone-100`}>
      {/* ── 상세 설명 ── */}
      <div className="mb-10">
        <h2 className={`mb-4 inline-block rounded px-3 py-1 text-sm font-bold tracking-wide ${headingBg}`}>
          상세 설명
        </h2>
        {description ? (
          <MarkdownContent source={description} className="leading-relaxed text-stone-700" />
        ) : (
          <div
            className={`rounded-lg border-2 border-dashed ${accentBorder} px-6 py-10 text-center`}
          >
            <p className={`text-sm font-medium ${accentText}`}>
              상세 설명이 곧 제공됩니다.
            </p>
          </div>
        )}
      </div>

      {/* ── 상세 이미지 ── */}
      <div className="mb-10">
        <h2 className={`mb-4 inline-block rounded px-3 py-1 text-sm font-bold tracking-wide ${headingBg}`}>
          상세 이미지
        </h2>
        {detailImages.length > 0 ? (
          <div className="flex flex-col gap-2">
            {detailImages.map((src, idx) => {
              const external = isExternalUrl(src);
              return (
                <div
                  key={idx}
                  className="relative w-full overflow-hidden rounded-lg bg-stone-50"
                  style={{ minHeight: "320px" }}
                >
                  <Image
                    src={src}
                    alt={`${productName} 상세 이미지 ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 1152px"
                    className="object-contain"
                    unoptimized={external}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`rounded-lg border-2 border-dashed ${accentBorder} px-6 py-10 text-center`}
          >
            <p className={`text-sm font-medium ${accentText}`}>
              상세 이미지 준비중
            </p>
          </div>
        )}
      </div>

      {/* ── 제품 정보 테이블 ── */}
      {hasProductInfo && (
        <div className="mb-4">
          <h2 className={`mb-4 inline-block rounded px-3 py-1 text-sm font-bold tracking-wide ${headingBg}`}>
            제품 정보
          </h2>
          <p className="mb-3 text-xs text-stone-400">
            * 규제 고지사항은 하단 건강기능식품 심의필 섹션을 참조하십시오.
          </p>
          <dl className="divide-y divide-stone-100 rounded-lg border border-stone-200 text-sm">
            {functionality && (
              <div className="flex gap-4 px-4 py-3">
                <dt className="w-32 shrink-0 font-semibold text-stone-600">기능성</dt>
                <dd className="text-stone-700">{functionality}</dd>
              </div>
            )}
            {intakeNotice && (
              <div className="flex gap-4 px-4 py-3">
                <dt className="w-32 shrink-0 font-semibold text-stone-600">섭취 시 주의사항</dt>
                <dd className="text-stone-700">{intakeNotice}</dd>
              </div>
            )}
            {ingredients && (
              <div className="flex gap-4 px-4 py-3">
                <dt className="w-32 shrink-0 font-semibold text-stone-600">원료 및 함량</dt>
                <dd className="font-mono text-xs text-stone-700">{ingredients}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  );
}
