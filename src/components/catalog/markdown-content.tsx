import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";

// 인라인 HTML 을 허용하되(rehype-raw) XSS 를 막기 위해 sanitize 한다. 이미지/링크는 허용,
// 위험 태그/속성(script, on* 핸들러 등)은 제거된다. 이미지 width/height 속성을 추가 허용.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height", "loading"],
  },
};

// PDP 상세설명 본문 스타일. 마크다운 요소를 브랜드 타이포로 렌더.
const components: Components = {
  h1: (p) => <h2 className="mb-3 mt-6 text-xl font-bold text-stone-900" {...p} />,
  h2: (p) => <h3 className="mb-2 mt-5 text-lg font-bold text-stone-900" {...p} />,
  h3: (p) => <h4 className="mb-2 mt-4 font-bold text-stone-800" {...p} />,
  p: (p) => <p className="mb-3 leading-relaxed text-stone-700" {...p} />,
  ul: (p) => <ul className="mb-3 list-disc space-y-1 pl-5 text-stone-700" {...p} />,
  ol: (p) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-stone-700" {...p} />,
  a: ({ node, ...p }) => <a className="text-ng-cobalt underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...p} />,
  strong: (p) => <strong className="font-bold text-stone-900" {...p} />,
  blockquote: (p) => <blockquote className="my-4 border-l-4 border-stone-200 pl-4 italic text-stone-600" {...p} />,
  table: (p) => <table className="my-4 w-full border-collapse text-sm" {...p} />,
  th: (p) => <th className="border border-stone-200 bg-stone-50 px-3 py-2 text-left font-semibold" {...p} />,
  td: (p) => <td className="border border-stone-200 px-3 py-2" {...p} />,
  // 마크다운 본문 이미지는 동적 URL 이라 next/image 가 아닌 일반 img 로 렌더한다.
  img: ({ node, ...p }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img className="my-4 max-w-full rounded-lg" loading="lazy" {...p} />
  ),
};

export function MarkdownContent({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
