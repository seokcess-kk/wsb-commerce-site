"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveProduct, type ProductInput } from "@/app/admin/products/actions";

type Category = { id: string; name: string };

type VariantRow = { name: string; priceDelta: number; stock: number };

const DEFAULT_VARIANTS: VariantRow[] = [{ name: "1박스", priceDelta: 0, stock: 0 }];

interface Props {
  categories: Category[];
  initial?: ProductInput;
}

export function ProductForm({ categories, initial }: Props) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "WSB");
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? "");
  const [basePrice, setBasePrice] = useState<number>(initial?.basePrice ?? 0);
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [reviewPhraseNo, setReviewPhraseNo] = useState(initial?.reviewPhraseNo ?? "");
  const [reportNo, setReportNo] = useState(initial?.reportNo ?? "");
  const [functionality, setFunctionality] = useState(initial?.functionality ?? "");
  const [intakeNotice, setIntakeNotice] = useState(initial?.intakeNotice ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [noticeText, setNoticeText] = useState(initial?.noticeText ?? "");
  const [imagesText, setImagesText] = useState(
    (initial?.images ?? []).join("\n"),
  );
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants && initial.variants.length > 0
      ? initial.variants.map((v) => ({ name: v.name, priceDelta: v.priceDelta, stock: v.stock }))
      : DEFAULT_VARIANTS,
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateVariant(index: number, field: keyof VariantRow, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, { name: "", priceDelta: 0, stock: 0 }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: ProductInput = {
      ...(initial?.id ? { id: initial.id } : {}),
      slug: slug.trim(),
      name: name.trim(),
      brand: brand.trim() || "WSB",
      categoryId: categoryId.trim() || null,
      basePrice: Number(basePrice),
      summary: summary.trim() || null,
      description: description.trim() || null,
      reviewPhraseNo: reviewPhraseNo.trim() || null,
      noticeText: noticeText.trim() || null,
      reportNo: reportNo.trim() || null,
      functionality: functionality.trim() || null,
      intakeNotice: intakeNotice.trim() || null,
      ingredients: ingredients.trim() || null,
      images: imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      isPublished,
      variants: variants.map((v) => ({
        name: v.name,
        priceDelta: Number(v.priceDelta),
        stock: Number(v.stock),
      })),
    };

    startTransition(async () => {
      try {
        await saveProduct(input);
      } catch (err: unknown) {
        // redirect() throws a NEXT_REDIRECT error — that is not an actual error
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof (err as { digest: unknown }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
      }
    });
  }

  const inputCls =
    "w-full rounded-md border border-[var(--ad-line)] px-3 py-2 text-sm text-[var(--ad-ink)] placeholder-[var(--ad-mut-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] focus-visible:ring-offset-1";
  const labelCls = "mb-1 block text-xs font-semibold text-[var(--ad-mut)]";
  const fieldCls = "flex flex-col";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md border border-[var(--ad-neg)] bg-[var(--ad-neg)]/5 px-4 py-3 text-sm text-[var(--ad-neg)]">
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--ad-mut-2)]">기본 정보</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldCls}>
            <label className={labelCls}>슬러그 *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="product-slug-en"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>상품명 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력하세요"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>브랜드</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="WSB"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>카테고리</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
            >
              <option value="">(없음)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>기본 판매가 (원)</label>
            <input
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>한 줄 요약</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="상품 목록에 표시되는 짧은 설명"
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>상품 상세 설명</label>
          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 설명 (HTML 또는 마크다운)"
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>이미지 URL (한 줄에 하나씩)</label>
          <textarea
            rows={4}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            placeholder={"https://cdn.example.com/image1.jpg\nhttps://cdn.example.com/image2.jpg"}
            className={inputCls}
          />
        </div>
      </section>

      {/* 건강기능식품 표시정보 */}
      <section className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--ad-mut-2)]">
          건강기능식품 표시정보
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldCls}>
            <label className={labelCls}>품목보고번호 (reportNo)</label>
            <input
              type="text"
              value={reportNo}
              onChange={(e) => setReportNo(e.target.value)}
              placeholder="예) 20220123456"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>리뷰 문구 번호 (reviewPhraseNo)</label>
            <input
              type="text"
              value={reviewPhraseNo}
              onChange={(e) => setReviewPhraseNo(e.target.value)}
              placeholder="예) RPH-001"
              className={inputCls}
            />
          </div>
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>기능성 내용 (심의 문구)</label>
          <textarea
            rows={4}
            value={functionality}
            onChange={(e) => setFunctionality(e.target.value)}
            placeholder="식약처 심의필 기능성 표시 문구"
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>섭취 시 주의사항</label>
          <textarea
            rows={4}
            value={intakeNotice}
            onChange={(e) => setIntakeNotice(e.target.value)}
            placeholder="섭취 방법 및 주의사항"
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>원료명 및 함량</label>
          <textarea
            rows={4}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="원재료명 및 함량 표기"
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>유의사항 (noticeText)</label>
          <textarea
            rows={3}
            value={noticeText}
            onChange={(e) => setNoticeText(e.target.value)}
            placeholder="소비자 유의사항"
            className={inputCls}
          />
        </div>
      </section>

      {/* 옵션(Variants) 편집기 */}
      <section className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--ad-mut-2)]">옵션 (Variants)</h2>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={v.name}
                onChange={(e) => updateVariant(i, "name", e.target.value)}
                placeholder="옵션명 (예: 1박스)"
                className={`${inputCls} flex-1`}
              />
              <div className="flex flex-col">
                <span className="mb-0.5 text-xs text-[var(--ad-mut-2)]">추가금(원)</span>
                <input
                  type="number"
                  value={v.priceDelta}
                  onChange={(e) => updateVariant(i, "priceDelta", Number(e.target.value))}
                  className={`${inputCls} w-28`}
                />
              </div>
              <div className="flex flex-col">
                <span className="mb-0.5 text-xs text-[var(--ad-mut-2)]">재고</span>
                <input
                  type="number"
                  min={0}
                  value={v.stock}
                  onChange={(e) => updateVariant(i, "stock", Number(e.target.value))}
                  className={`${inputCls} w-24`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="mt-4 rounded-md border border-[var(--ad-line)] px-3 py-2 text-xs text-[var(--ad-mut)] hover:border-[var(--ad-neg)] hover:text-[var(--ad-neg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] focus-visible:ring-offset-1"
              >
                행 삭제
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="rounded-md border border-[var(--ad-accent)] px-4 py-2 text-sm font-semibold text-[var(--ad-accent)] hover:bg-[var(--ad-accent)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] focus-visible:ring-offset-1"
        >
          + 옵션 추가
        </button>
      </section>

      {/* 노출 설정 */}
      <section className="flex items-center gap-3">
        <input
          id="isPublished"
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--ad-line)] text-[var(--ad-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] focus-visible:ring-offset-1"
        />
        <label htmlFor="isPublished" className="text-sm font-semibold text-[var(--ad-ink)]">
          상품 노출 (isPublished)
        </label>
      </section>

      {/* 제출 버튼 */}
      <div className="flex items-center gap-4 border-t border-[var(--ad-line)] pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[var(--ad-accent)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--ad-accent)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "저장 중..." : initial?.id ? "수정 저장" : "상품 등록"}
        </button>
        <Link
          href="/admin/products"
          className="text-sm font-semibold text-[var(--ad-mut-2)] hover:text-[var(--ad-ink)]"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
