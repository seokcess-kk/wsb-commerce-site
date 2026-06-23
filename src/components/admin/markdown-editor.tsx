"use client";

import { useRef, useState, useTransition } from "react";
import { uploadProductImages } from "@/app/admin/products/image-actions";
import { MarkdownContent } from "@/components/catalog/markdown-content";

// 상품 상세설명 마크다운 에디터. 작성/미리보기 탭 + 기본 서식 + 이미지 업로드 본문 삽입.
// 이미지는 검증된 uploadProductImages 인프라를 재사용해 Storage 에 올리고 ![](url) 로 삽입한다.
export function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(text: string) {
    const ta = ref.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.selectionStart = ta.selectionEnd = pos;
    });
  }

  // 선택 영역을 마크다운 서식으로 감싼다.
  function wrap(before: string, after = "") {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || "텍스트";
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }

  function onImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError(null);
    startTransition(async () => {
      try {
        const urls: string[] = [];
        for (const f of files) {
          const fd = new FormData();
          fd.append("files", f);
          const res = await uploadProductImages(fd);
          if (res.error) {
            setError(res.error);
            return;
          }
          if (res.urls) urls.push(...res.urls);
        }
        if (urls.length) insertAtCursor(urls.map((u) => `\n![](${u})\n`).join(""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "이미지 업로드 중 오류가 발생했습니다.");
      }
    });
    e.target.value = "";
  }

  const tabCls = (active: boolean) =>
    `rounded px-2.5 py-1 text-xs font-semibold ${active ? "bg-[var(--ad-accent)] text-white" : "text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}`;
  const toolBtn =
    "rounded px-2 py-1 text-xs font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]";

  return (
    <div className="rounded-md border border-[var(--ad-line)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--ad-line)] px-2 py-1.5">
        <button type="button" onClick={() => setTab("write")} className={tabCls(tab === "write")}>
          작성
        </button>
        <button type="button" onClick={() => setTab("preview")} className={tabCls(tab === "preview")}>
          미리보기
        </button>
        {tab === "write" && (
          <>
            <span className="mx-1 h-4 w-px bg-[var(--ad-line)]" />
            <button type="button" onClick={() => wrap("**", "**")} className={`${toolBtn} font-bold`} title="굵게">
              B
            </button>
            <button type="button" onClick={() => wrap("## ")} className={toolBtn} title="제목">
              제목
            </button>
            <button type="button" onClick={() => wrap("- ")} className={toolBtn} title="목록">
              목록
            </button>
            <label className={`${toolBtn} cursor-pointer text-[var(--ad-accent)]`} title="이미지 업로드">
              {pending ? "업로드 중…" : "🖼 이미지"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onImageUpload}
                disabled={pending}
              />
            </label>
          </>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          placeholder="마크다운으로 작성하세요. 인라인 HTML 도 사용할 수 있고, '🖼 이미지' 버튼으로 사진을 본문에 삽입합니다."
          className="w-full resize-y rounded-b-md px-3 py-2 text-sm text-[var(--ad-ink)] focus-visible:outline-none"
        />
      ) : (
        <div className="min-h-[16rem] px-4 py-3">
          {value.trim() ? (
            <MarkdownContent source={value} />
          ) : (
            <p className="text-sm text-[var(--ad-mut-2)]">미리볼 내용이 없습니다.</p>
          )}
        </div>
      )}

      {error && <p className="border-t border-[var(--ad-line)] px-3 py-1.5 text-xs text-[var(--ad-neg)]">{error}</p>}
    </div>
  );
}
