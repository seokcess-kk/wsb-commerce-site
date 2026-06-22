"use client";

import { useEffect } from "react";

// 루트 레이아웃까지 실패하는 최후의 에러 바운더리. 자체 <html>/<body> 를 렌더하므로
// globals.css(레이아웃에서 import)에 의존하지 않도록 인라인 스타일을 사용한다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] fatal error:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          fontFamily: "system-ui, sans-serif",
          color: "#1c1917",
          background: "#fff",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>일시적인 오류가 발생했습니다</h1>
        <p style={{ fontSize: "0.875rem", color: "#78716c", margin: 0 }}>
          잠시 후 다시 시도해 주세요. 문제가 지속되면 고객센터로 문의해 주세요.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: "9999px",
              background: "#0047FF",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              padding: "0.625rem 1.25rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          <a
            href="/"
            style={{
              borderRadius: "9999px",
              border: "1px solid #d6d3d1",
              color: "#1c1917",
              fontWeight: 600,
              fontSize: "0.875rem",
              padding: "0.625rem 1.25rem",
              textDecoration: "none",
            }}
          >
            홈으로
          </a>
        </div>
      </body>
    </html>
  );
}
