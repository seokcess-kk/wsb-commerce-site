"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { uploadProductImages } from "@/app/admin/products/image-actions";

// 상품 이미지 다중 업로드 + 대표 지정 + 순서 변경 + 삭제.
// images[0] 이 대표(썸네일)다 — toProductSummary.thumbnail = images[0].
export function ImageUploader({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError(null);
    startTransition(async () => {
      try {
        // 파일을 하나씩 업로드해 단일 요청이 서버액션 body 한도를 넘지 않게 한다.
        const collected: string[] = [];
        for (const f of files) {
          const fd = new FormData();
          fd.append("files", f);
          const res = await uploadProductImages(fd);
          if (res.error) {
            setError(res.error);
            return;
          }
          if (res.urls) collected.push(...res.urls);
        }
        if (collected.length) onChange([...images, ...collected]);
        else setError("업로드된 이미지가 없습니다. 다시 시도해 주세요.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
      }
    });
    e.target.value = ""; // 같은 파일 재선택 허용
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }
  function makePrimary(i: number) {
    if (i === 0) return;
    const next = [...images];
    const [img] = next.splice(i, 1);
    next.unshift(img);
    onChange(next);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const btnCls =
    "rounded border border-[var(--ad-line)] px-1.5 py-0.5 text-[10px] text-[var(--ad-mut)] hover:border-[var(--ad-accent)] disabled:opacity-30";

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="w-28">
            <div className="relative aspect-square overflow-hidden rounded-md border border-[var(--ad-line)] bg-[var(--ad-line-2)]">
              <Image src={url} alt="" fill unoptimized className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-[var(--ad-accent)] px-1 py-0.5 text-[9px] font-bold text-white">
                  대표
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between gap-0.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btnCls} aria-label="앞으로">
                ◀
              </button>
              {i !== 0 ? (
                <button type="button" onClick={() => makePrimary(i)} className={`${btnCls} text-[var(--ad-accent)]`}>
                  대표
                </button>
              ) : (
                <span className="text-[10px] text-[var(--ad-mut-2)]">—</span>
              )}
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className={btnCls} aria-label="뒤로">
                ▶
              </button>
              <button type="button" onClick={() => remove(i)} className={`${btnCls} !text-[var(--ad-neg)]`} aria-label="삭제">
                ✕
              </button>
            </div>
          </div>
        ))}

        <label className="flex aspect-square w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[var(--ad-line)] text-xs text-[var(--ad-mut)] hover:border-[var(--ad-accent)]">
          <span className="text-lg leading-none">＋</span>
          {pending ? "업로드 중…" : "이미지 추가"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={pending} />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--ad-neg)]">{error}</p>}
      <p className="mt-2 text-xs text-[var(--ad-mut-2)]">JPG·PNG·WebP·AVIF, 최대 5MB. 첫 번째 이미지가 대표(썸네일)로 쓰입니다.</p>
    </div>
  );
}
